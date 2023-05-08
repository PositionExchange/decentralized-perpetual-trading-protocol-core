// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../adapter/interfaces/IPositionHouse.sol";
import "../adapter/interfaces/IPositionManager.sol";
import "../adapter/interfaces/IPositionStrategyOrder.sol";
import "../adapter/interfaces/IInsuranceFund.sol";
import "../library/types/PositionStrategyOrderStorage.sol";
import "../library/positions/HouseBaseParam.sol";
import {Quantity} from "../library/helpers/Quantity.sol";
import {Errors} from "../library/helpers/Errors.sol";
import "../adapter/interfaces/IDPTPValidator.sol";

contract CrossChainGateway is
    PausableUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using Quantity for int256;

    bytes4 private constant WITHDRAW_SELECTOR =
        bytes4(
            keccak256(
                "receiveFromOtherBlockchain(address,address,uint256,uint256)"
            )
        );

    uint256 public myBlockchainId;
    uint256 public timeHorizon;
    mapping(bytes32 => uint256) public replayPrevention;
    IPositionHouse positionHouse;
    IPositionStrategyOrder positionStrategyOrderInterface;
    uint256 txIndex;
    // TODO upgrade for multi chain
    uint256 destinationChainID;
    address destinationFuturesGateway;

    enum Method {
        OPEN_MARKET,
        OPEN_LIMIT,
        CANCEL_LIMIT,
        ADD_MARGIN,
        REMOVE_MARGIN,
        CLOSE_POSITION,
        INSTANTLY_CLOSE_POSITION,
        CLOSE_LIMIT_POSITION,
        CLAIM_FUND,
        SET_TPSL,
        UNSET_TP_AND_SL,
        UNSET_TP_OR_SL,
        OPEN_MARKET_BY_QUOTE,
        EXECUTE_STORE_POSITION
    }

    event Deposit(
        address indexed _token,
        address indexed _trader,
        uint256 _amount
    );

    event TransactionRelayed(uint256 sourceChainId, bytes32 sourceTxHash);

    event Withdraw(
        address indexed _token,
        address indexed _trader,
        uint256 _destBcId,
        uint256 _amount,
        uint256 _busdBonusAmount
    );

    event CrossCall(
        bytes32 _txId,
        uint256 _timestamp,
        address _caller,
        uint256 _destBcId,
        address _destContract,
        bytes _destFunctionCall
    );

    function initialize(
        address _positionHouseAddress,
        address _positionStrategyOrderAddress,
        uint256 _myBlockchainId,
        uint256 _destBlockchainId,
        uint256 _timeHorizon
    ) public initializer {
        require(_positionHouseAddress != address(0), Errors.VL_INVALID_INPUT);
        __ReentrancyGuard_init();
        __Ownable_init();
        __Pausable_init();

        myBlockchainId = _myBlockchainId;
        destinationChainID = _destBlockchainId;
        timeHorizon = _timeHorizon;
        positionHouse = IPositionHouse(_positionHouseAddress);
        positionStrategyOrderInterface = IPositionStrategyOrder(
            _positionStrategyOrderAddress
        );
    }

    function setPositionHouse(address _positionHouseAddress) public onlyOwner {
        positionHouse = IPositionHouse(_positionHouseAddress);
    }

    // TODO update function param
    function triggerTPSL(
        address _pmAddress,
        address _trader,
        uint256 _sourceBcId
    ) external {
        uint256 _busdBonusBalanceBeforeFunction = insuranceFundInterface
            .getBusdBonusBalances(_pmAddress, _trader);

        (
            uint256 _depositAmount,
            uint256 _fee,
            uint256 _withdrawAmount,
        ) = positionStrategyOrderInterface.triggerTPSL(_pmAddress, _trader);
        dptpValidator.updateTraderData(_trader,_pmAddress);
        _handleBalanceChangedEvent(
            _pmAddress,
            _trader,
            _depositAmount,
            _fee,
            _withdrawAmount,
            _busdBonusBalanceBeforeFunction,
            _sourceBcId
        );
    }

    struct DecodedEventData {
        bytes32 txId;
        uint256 timestamp;
        address caller;
        uint256 destBcId;
        address destContract;
        uint8 functionMethodID;
    }

    // For server
    function crossCallHandler(
        uint256 _sourceBcId,
        address _cbcAddress,
        bytes calldata _eventData,
        bytes calldata _signature,
        bytes32 _sourceTxHash
    ) public nonReentrant {
        address relayer = msg.sender;
        require(whitelistRelayers[relayer], "invalid relayer");

        // Decode _eventData
        // Recall that the cross call event is:
        // CrossCall(bytes32 _txId, uint256 _timestamp, address _caller,
        //           uint256 _destBcId, address _destContract, bytes _destFunctionCall)
        //        bytes32 txId;
        //        uint256 timestamp;
        //        address caller;
        //        uint256 destBcId;
        //        address destContract;
        //        uint8 functionMethodID;
        bytes memory functionCall;

        DecodedEventData memory decodedEventData;
        (
            decodedEventData.txId,
            decodedEventData.timestamp,
            decodedEventData.caller,
            decodedEventData.destBcId,
            decodedEventData.destContract,
            decodedEventData.functionMethodID,
            functionCall
        ) = abi.decode(
            _eventData,
            (bytes32, uint256, address, uint256, address, uint8, bytes)
        );

        require(
            replayPrevention[decodedEventData.txId] == 0,
            "Transaction already exists"
        );
        replayPrevention[decodedEventData.txId] = decodedEventData.timestamp;

        require(
            decodedEventData.timestamp <= block.timestamp,
            "Event timestamp is in the future"
        );

        require(
            decodedEventData.timestamp + timeHorizon > block.timestamp,
            "Event is too old"
        );

        require(
            decodedEventData.destBcId == myBlockchainId,
            "Incorrect destination blockchain id"
        );
        address destChainFuturesGatewayAddress = destChainFuturesGateways[
            _sourceBcId
        ];
        require(
            destChainFuturesGatewayAddress != address(0),
            "Not supported chain"
        );

        emit TransactionRelayed(_sourceBcId, _sourceTxHash);

        // TODO need to add param _sourceBcId to all function call
        if (Method(decodedEventData.functionMethodID) == Method.OPEN_MARKET) {
            openMarketPosition(functionCall, _sourceBcId);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) == Method.OPEN_LIMIT
        ) {
            openLimitOrder(functionCall, _sourceBcId);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) == Method.CANCEL_LIMIT
        ) {
            cancelLimitOrder(functionCall, _sourceBcId);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) == Method.ADD_MARGIN
        ) {
            addMargin(functionCall, _sourceBcId);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) == Method.REMOVE_MARGIN
        ) {
            removeMargin(functionCall, _sourceBcId);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) == Method.CLOSE_POSITION
        ) {
            closePosition(functionCall, _sourceBcId);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) ==
            Method.CLOSE_LIMIT_POSITION
        ) {
            closeLimitPosition(functionCall, _sourceBcId);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) ==
            Method.INSTANTLY_CLOSE_POSITION
        ) {
            instantlyClosePosition(functionCall, _sourceBcId);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) == Method.CLAIM_FUND
        ) {
            claimFund(functionCall, _sourceBcId);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) == Method.SET_TPSL
        ) {
            setTPSL(functionCall, _sourceBcId);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) == Method.UNSET_TP_AND_SL
        ) {
            unsetTPAndSL(functionCall, _sourceBcId);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) == Method.UNSET_TP_OR_SL
        ) {
            unsetTPOrSL(functionCall, _sourceBcId);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) ==
            Method.OPEN_MARKET_BY_QUOTE
        ) {
            openMarketPositionByQuote(functionCall, _sourceBcId);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) ==
            Method.EXECUTE_STORE_POSITION
        ) {
            (address _pmAddress, address _trader) = abi.decode(
                functionCall,
                (address, address)
            );
            positionHouse.executeStorePosition(_pmAddress, _trader);
            return;
        }

        revert("CGW-01");
    }

    function openMarketPosition(bytes memory _functionCall, uint256 _sourceBcId)
        internal
    {
        address _pmAddress;
        uint8 _side;
        HouseBaseParam.OpenMarketOrderParams memory param;
        (
            _pmAddress,
            _side,
            param.quantity,
            param.leverage,
            param.trader,
            param.initialMargin,
            param.busdBonusAmount
        ) = abi.decode(
            _functionCall,
            (address, uint8, uint256, uint16, address, uint256, uint256)
        );

        dptpValidator.validateChainIDAndManualMargin(
            param.trader,
            _pmAddress,
            _sourceBcId,
            0
        );

        param.positionManager = IPositionManager(_pmAddress);
        param.side = Position.Side(_side);
        uint256 _busdBonusBalanceBeforeFunction = insuranceFundInterface
            .getBusdBonusBalances(_pmAddress, param.trader);

        {
            (
                uint256 _depositAmount,
                uint256 _fee,
                uint256 _withdrawAmount
            ) = positionHouse.openMarketPosition(param);
            _handleBalanceChangedEvent(
                _pmAddress,
                param.trader,
                _depositAmount,
                _fee,
                _withdrawAmount,
                _busdBonusBalanceBeforeFunction,
                _sourceBcId
            );
        }
    }

    function openLimitOrder(bytes memory _functionCall, uint256 _sourceBcId)
        internal
    {
        address _pmAddress;
        uint8 _side;
        HouseBaseParam.OpenLimitOrderParams memory param;
        (
            _pmAddress,
            _side,
            param.quantity,
            param.pip,
            param.leverage,
            param.trader,
            param.initialMargin,
            param.busdBonusAmount
        ) = abi.decode(
            _functionCall,
            (
                address,
                uint8,
                uint256,
                uint128,
                uint16,
                address,
                uint256,
                uint256
            )
        );

        dptpValidator.validateChainIDAndManualMargin(
            param.trader,
            _pmAddress,
            _sourceBcId,
            0
        );

        {
            param.positionManager = IPositionManager(_pmAddress);
            param.side = Position.Side(_side);
        }
        uint256 _busdBonusBalanceBeforeFunction = insuranceFundInterface
            .getBusdBonusBalances(_pmAddress, param.trader);

        (
            uint256 _depositAmount,
            uint256 _fee,
            uint256 _withdrawAmount
        ) = positionHouse.openLimitOrder(param);
        _handleBalanceChangedEvent(
            _pmAddress,
            param.trader,
            _depositAmount,
            _fee,
            _withdrawAmount,
            _busdBonusBalanceBeforeFunction,
            _sourceBcId
        );
    }

    function cancelLimitOrder(bytes memory _functionCall, uint256 _sourceBcId)
        internal
    {
        address _pmAddress;
        uint64 _orderIdx;
        uint8 _isReduce;
        address _trader;
        (_pmAddress, _orderIdx, _isReduce, _trader) = abi.decode(
            _functionCall,
            (address, uint64, uint8, address)
        );
        uint256 _busdBonusBalanceBeforeFunction = insuranceFundInterface
            .getBusdBonusBalances(_pmAddress, _trader);

        (
            uint256 _depositAmount,
            uint256 _fee,
            uint256 _withdrawAmount
        ) = positionHouse.cancelLimitOrder(
                IPositionManager(_pmAddress),
                _orderIdx,
                _isReduce,
                _trader
            );
        dptpValidator.updateTraderData(
            _trader,
            _pmAddress
        );
        _handleBalanceChangedEvent(
            _pmAddress,
            _trader,
            _depositAmount,
            _fee,
            _withdrawAmount,
            _busdBonusBalanceBeforeFunction,
            _sourceBcId
        );
    }

    function addMargin(bytes memory _functionCall, uint256 _sourceBcId)
        internal
    {
        address _pmAddress;
        uint256 _amount;
        uint256 _busdBonusAmount;
        address _trader;
        (_pmAddress, _amount, _busdBonusAmount, _trader) = abi.decode(
            _functionCall,
            (address, uint256, uint256, address)
        );

        dptpValidator.validateChainIDAndManualMargin(
            _trader,
            _pmAddress,
            _sourceBcId,
            _amount
        );

        uint256 _busdBonusBalanceBeforeFunction = insuranceFundInterface
            .getBusdBonusBalances(_pmAddress, _trader);

        (
            uint256 _depositAmount,
            uint256 _fee,
            uint256 _withdrawAmount
        ) = positionHouse.addMargin(
                IPositionManager(_pmAddress),
                _amount,
                _busdBonusAmount,
                _trader
            );
        _handleBalanceChangedEvent(
            _pmAddress,
            _trader,
            _depositAmount,
            _fee,
            _withdrawAmount,
            _busdBonusBalanceBeforeFunction,
            _sourceBcId
        );
    }

    function removeMargin(bytes memory _functionCall, uint256 _sourceBcId)
        internal
    {
        address _pmAddress;
        uint256 _amount;
        address _trader;
        (_pmAddress, _amount, _trader) = abi.decode(
            _functionCall,
            (address, uint256, address)
        );
        uint256 _busdBonusBalanceBeforeFunction = insuranceFundInterface
            .getBusdBonusBalances(_pmAddress, _trader);

        (
            uint256 _depositAmount,
            uint256 _fee,
            uint256 _withdrawAmount
        ) = positionHouse.removeMargin(
                IPositionManager(_pmAddress),
                _amount,
                _trader
            );
        _handleBalanceChangedEvent(
            _pmAddress,
            _trader,
            _depositAmount,
            _fee,
            _withdrawAmount,
            _busdBonusBalanceBeforeFunction,
            _sourceBcId
        );
    }

    function closePosition(bytes memory _functionCall, uint256 _sourceBcId)
        internal
    {
        address _pmAddress;
        uint256 _quantity;
        address _trader;
        (_pmAddress, _quantity, _trader) = abi.decode(
            _functionCall,
            (address, uint256, address)
        );
        uint256 _busdBonusBalanceBeforeFunction = insuranceFundInterface
            .getBusdBonusBalances(_pmAddress, _trader);
        (
            uint256 _depositAmount,
            uint256 _fee,
            uint256 _withdrawAmount
        ) = positionHouse.closePosition(
                IPositionManager(_pmAddress),
                _quantity,
                _trader
            );
        dptpValidator.updateTraderData(
            _trader,
            _pmAddress
        );
        _handleBalanceChangedEvent(
            _pmAddress,
            _trader,
            _depositAmount,
            _fee,
            _withdrawAmount,
            _busdBonusBalanceBeforeFunction,
            _sourceBcId
        );
    }

    function instantlyClosePosition(
        bytes memory _functionCall,
        uint256 _sourceBcId
    ) internal {
        address _pmAddress;
        uint256 _quantity;
        address _trader;
        (_pmAddress, _quantity, _trader) = abi.decode(
            _functionCall,
            (address, uint256, address)
        );
        uint256 _busdBonusBalanceBeforeFunction = insuranceFundInterface
            .getBusdBonusBalances(_pmAddress, _trader);

        (
            uint256 _depositAmount,
            uint256 _fee,
            uint256 _withdrawAmount
        ) = positionHouse.instantlyClosePosition(
                IPositionManager(_pmAddress),
                _quantity,
                _trader
            );
        dptpValidator.updateTraderData(
            _trader,
            _pmAddress
        );
        _handleBalanceChangedEvent(
            _pmAddress,
            _trader,
            _depositAmount,
            _fee,
            _withdrawAmount,
            _busdBonusBalanceBeforeFunction,
            _sourceBcId
        );
    }

    function closeLimitPosition(bytes memory _functionCall, uint256 _sourceBcId)
        internal
    {
        address _pmAddress;
        uint128 _pip;
        uint256 _quantity;
        address _trader;
        (_pmAddress, _pip, _quantity, _trader) = abi.decode(
            _functionCall,
            (address, uint128, uint256, address)
        );
        uint256 _busdBonusBalanceBeforeFunction = insuranceFundInterface
            .getBusdBonusBalances(_pmAddress, _trader);

        (
            uint256 _depositAmount,
            uint256 _fee,
            uint256 _withdrawAmount
        ) = positionHouse.closeLimitPosition(
                IPositionManager(_pmAddress),
                _pip,
                _quantity,
                _trader,
                0
            );
        dptpValidator.updateTraderData(
            _trader,
            _pmAddress
        );
        _handleBalanceChangedEvent(
            _pmAddress,
            _trader,
            _depositAmount,
            _fee,
            _withdrawAmount,
            _busdBonusBalanceBeforeFunction,
            _sourceBcId
        );
    }

    function claimFund(bytes memory _functionCall, uint256 _sourceBcId)
        internal
    {
        address _pmAddress;
        address _trader;
        (_pmAddress, _trader) = abi.decode(_functionCall, (address, address));
        uint256 _busdBonusBalanceBeforeFunction = insuranceFundInterface
            .getBusdBonusBalances(_pmAddress, _trader);

        (
            uint256 _depositAmount,
            uint256 _fee,
            uint256 _withdrawAmount
        ) = positionHouse.claimFund(IPositionManager(_pmAddress), _trader);
        dptpValidator.updateTraderData(
            _trader,
            _pmAddress
        );
        _handleBalanceChangedEvent(
            _pmAddress,
            _trader,
            _depositAmount,
            _fee,
            _withdrawAmount,
            _busdBonusBalanceBeforeFunction,
            _sourceBcId
        );
    }

    function setTPSL(bytes memory _functionCall, uint256 _sourceBcId) internal {
        address _pmAddress;
        address _trader;
        uint128 _higherPip;
        uint128 _lowerPip;
        uint8 _option;
        (_pmAddress, _trader, _higherPip, _lowerPip, _option) = abi.decode(
            _functionCall,
            (address, address, uint128, uint128, uint8)
        );

        positionStrategyOrderInterface.setTPSL(
            _pmAddress,
            _trader,
            _higherPip,
            _lowerPip,
            PositionStrategyOrderStorage.SetTPSLOption(_option),
            _sourceBcId
        );
    }

    function unsetTPAndSL(bytes memory _functionCall, uint256 _sourceBcId)
        internal
    {
        address _pmAddress;
        address _trader;
        (_pmAddress, _trader) = abi.decode(_functionCall, (address, address));

        positionStrategyOrderInterface.unsetTPAndSL(_pmAddress, _trader);
    }

    function unsetTPOrSL(bytes memory _functionCall, uint256 _sourceBcId)
        internal
    {
        address _pmAddress;
        address _trader;
        bool _isHigherPrice;
        (_pmAddress, _trader, _isHigherPrice) = abi.decode(
            _functionCall,
            (address, address, bool)
        );

        positionStrategyOrderInterface.unsetTPOrSL(
            _pmAddress,
            _trader,
            _isHigherPrice
        );
    }

    function openMarketPositionByQuote(
        bytes memory _functionCall,
        uint256 _sourceBcId
    ) internal {
        //        address _pmAddress;
        //        uint8 _side;
        //        uint256 _quantity;
        //        uint16 _leverage;
        //        address _trader;
        //        (_pmAddress, _side, _quantity, _leverage, _trader) = abi.decode(
        //            _functionCall,
        //            (address, uint8, uint256, uint16, address)
        //        );
        //        (
        //            uint256 _depositAmount,
        //            uint256 _fee,
        //            uint256 _withdrawAmount
        //        ) = positionHouse.openMarketPosition(
        //                IPositionManager(_pmAddress),
        //                Position.Side(_side),
        //                _quantity,
        //                _leverage,
        //                _trader,
        //                false
        //            );
        //        _handleBalanceChangedEvent(
        //            _pmAddress,
        //            _trader,
        //            _depositAmount,
        //            _fee,
        //            _withdrawAmount
        //        );
    }

    function _handleBalanceChangedEvent(
        address _pmAddress,
        address _trader,
        uint256 _depositAmount,
        uint256 _fee,
        uint256 _withdrawAmount,
        // blockchain Id that handle event balance changed
        uint256 _busdBonusBalances,
        uint256 _destChainId
    ) internal {
        address _tokenAddress = address(
            IPositionManager(_pmAddress).getQuoteAsset()
        );

        if (_withdrawAmount <= 0) {
            return;
        }
        uint256 bonusAmount = insuranceFundInterface
            .calculateWithdrawBusdBonusAmount(
                _pmAddress,
                _trader,
                _withdrawAmount,
                _busdBonusBalances
            );
        address destFuturesGatewayAddress = destChainFuturesGateways[
            _destChainId
        ];
        crossBlockchainCall(
            _destChainId,
            destFuturesGatewayAddress,
            abi.encodeWithSelector(
                WITHDRAW_SELECTOR,
                _pmAddress,
                _trader,
                _withdrawAmount,
                bonusAmount
            )
        );
        emit Withdraw(
            _tokenAddress,
            _trader,
            _destChainId,
            _withdrawAmount,
            bonusAmount
        );
    }

    function crossBlockchainCall(
        uint256 _destBcId,
        address _destContract,
        bytes memory _destData
    ) internal {
        txIndex++;
        bytes32 txId = keccak256(
            abi.encodePacked(
                block.timestamp,
                myBlockchainId,
                _destBcId,
                _destContract,
                _destData,
                txIndex
            )
        );
        emit CrossCall(
            txId,
            block.timestamp,
            msg.sender,
            _destBcId,
            _destContract,
            _destData
        );
    }

    function setPositionStrategyOrder(address _address) external onlyOwner {
        positionStrategyOrderInterface = IPositionStrategyOrder(_address);
    }

    function setInsuranceFund(address _address) external onlyOwner {
        insuranceFundInterface = IInsuranceFund(_address);
    }

    function setDPTPValidator(address _address) external onlyOwner {
        dptpValidator = IDPTPValidator(_address);
    }

    function setDestinationChainID(uint256 _chainID) external onlyOwner {
        destinationChainID = _chainID;
    }

    function setDestinationFuturesGateway(address _address) external onlyOwner {
        destinationFuturesGateway = _address;
    }

    function setMyChainID(uint256 _chainID) external onlyOwner {
        myBlockchainId = _chainID;
    }

    function updateDestChainFuturesGateway(
        uint256 _destChainId,
        address _destFuturesGateway
    ) external onlyOwner {
        destChainFuturesGateways[_destChainId] = _destFuturesGateway;
    }

    function updateRelayerStatus(address _relayer) external onlyOwner {
        whitelistRelayers[_relayer] = true;
    }

    function getRelayerStatus(address _relayer) external view returns (bool) {
        return whitelistRelayers[_relayer];
    }

    function getPositionHouseAddress() public view returns (address) {
        return address(positionHouse);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
    mapping(address => bool) internal whitelistRelayers;
    mapping(uint256 => address) public destChainFuturesGateways;
    IInsuranceFund public insuranceFundInterface;
    IDPTPValidator dptpValidator;
}
