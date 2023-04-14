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
import "../library/positions/Position.sol";

contract DptpCrossChainGateway is
    PausableUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using Quantity for int256;

    struct DecodedEventData {
        bytes32 txId;
        uint256 timestamp;
        address caller;
        uint256 destBcId;
        address destContract;
        uint8 functionMethodID;
    }

    uint256 public myBlockchainId;
    uint256 public timeHorizon;

    mapping(uint256 => mapping(address => bool)) public whitelistRelayers;
    mapping(uint256 => address) public destChainFuturesGateways;

    address public dptpValidator;
    address public positionHouse;
    address public positionStrategyOrder;

    uint256 txIndex;
    mapping(bytes32 => uint256) public replayPrevention;

    bytes4 private constant EXECUTE_INCREASE_POSITION_METHOD =
        bytes4(keccak256("executeIncreasePosition(bytes32,uint256,bool)"));

    bytes4 private constant EXECUTE_DECREASE_POSITION_METHOD =
        bytes4(
            keccak256(
                "executeDecreasePosition(bytes32,uint256,uint256,uint256,bool)"
            )
        );

    bytes4 private constant EXECUTE_ADD_COLLATERAL_METHOD =
        bytes4(
            keccak256(
                "executeAddCollateral(address,address,address,bool,uint256)"
            )
        );

    bytes4 private constant EXECUTE_REMOVE_COLLATERAL_METHOD =
        bytes4(
            keccak256(
                "executeRemoveCollateral(address,address,address,bool,uint256)"
            )
        );

    bytes4 private constant EXECUTE_CANCEL_INCREASE_ORDER_METHOD =
        bytes4(keccak256("executeCancelIncreaseOrder(bytes32,bool)"));

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
        OPEN_MARKET_BY_QUOTE
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
        uint256 _amount
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
        uint256 _myBlockchainId,
        uint256 _timeHorizon,
        address _dptpValidatorAddress,
        address _positionHouseAddress,
        address _positionStrategyOrderAddress
    ) public initializer {
        __ReentrancyGuard_init();
        __Ownable_init();
        __Pausable_init();

        myBlockchainId = _myBlockchainId;
        timeHorizon = _timeHorizon;

        dptpValidator = _dptpValidatorAddress;
        positionHouse = _positionHouseAddress;
        positionStrategyOrder = _positionStrategyOrderAddress;
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
        //        require(whitelistRelayers[_sourceBcId][relayer], "invalid relayer");

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

        if (Method(decodedEventData.functionMethodID) == Method.OPEN_MARKET) {
            openMarketPosition(_sourceBcId, functionCall);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) == Method.OPEN_LIMIT
        ) {
            openLimitOrder(_sourceBcId, functionCall);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) == Method.CANCEL_LIMIT
        ) {
            cancelLimitOrder(_sourceBcId, functionCall);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) == Method.ADD_MARGIN
        ) {
            updateMargin(_sourceBcId, functionCall, false);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) == Method.REMOVE_MARGIN
        ) {
            updateMargin(_sourceBcId, functionCall, true);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) == Method.CLOSE_POSITION
        ) {
            closePosition(_sourceBcId, functionCall);
            return;
        }

        revert("CGW-01");
    }

    function openMarketPosition(uint256 _sourceBcId, bytes memory _functionCall)
        internal
    {
        bytes32 requestKey;
        address pmAddress;
        bool isLong;
        HouseBaseParam.OpenMarketOrderParams memory param;

        (
            requestKey,
            pmAddress,
            isLong,
            param.quantity,
            param.leverage,
            param.trader,
            param.initialMargin
        ) = abi.decode(
            _functionCall,
            (bytes32, address, bool, uint256, uint16, address, uint256)
        );
        param.positionManager = IPositionManager(pmAddress);
        param.side = isLong ? Position.Side.LONG : Position.Side.SHORT;

        validateChainIDAndManualMargin(_sourceBcId, pmAddress, param.trader, 0);

        IPositionHouse(positionHouse).openMarketPosition(param);

        _crossBlockchainCall(
            _sourceBcId,
            destChainFuturesGateways[_sourceBcId],
            abi.encodeWithSelector(
                EXECUTE_INCREASE_POSITION_METHOD,
                requestKey,
                param.quantity,
                isLong
            )
        );
    }

    function openLimitOrder(uint256 _sourceBcId, bytes memory _functionCall)
        internal
    {
        bytes32 requestKey;
        address pmAddress;
        bool isLong;
        HouseBaseParam.OpenLimitOrderParams memory param;

        (
            requestKey,
            pmAddress,
            isLong,
            param.quantity,
            param.pip,
            param.leverage,
            param.trader,
            param.initialMargin
        ) = abi.decode(
            _functionCall,
            (bytes32, address, bool, uint256, uint128, uint16, address, uint256)
        );
        param.positionManager = IPositionManager(pmAddress);
        param.side = isLong ? Position.Side.LONG : Position.Side.SHORT;

        validateChainIDAndManualMargin(_sourceBcId, pmAddress, param.trader, 0);

        IPositionHouse(positionHouse).openLimitOrder(param);

        _crossBlockchainCall(
            _sourceBcId,
            destChainFuturesGateways[_sourceBcId],
            abi.encodeWithSelector(
                EXECUTE_INCREASE_POSITION_METHOD,
                requestKey,
                param.quantity,
                isLong
            )
        );
    }

    function cancelLimitOrder(uint256 _sourceBcId, bytes memory _functionCall)
        internal
    {
        (
            bytes32 requestKey,
            address pmAddress,
            uint64 orderIdx,
            uint8 isReduce,
            address account
        ) = abi.decode(
                _functionCall,
                (bytes32, address, uint64, uint8, address)
            );

        IDPTPValidator(dptpValidator).validateChainIDAndManualMargin(
            account,
            pmAddress,
            _sourceBcId,
            0
        );

        IPositionHouse(positionHouse).cancelLimitOrder(
            IPositionManager(pmAddress),
            orderIdx,
            isReduce,
            account
        );

        IDPTPValidator(dptpValidator).updateTraderData(account, pmAddress);

        _crossBlockchainCall(
            _sourceBcId,
            destChainFuturesGateways[_sourceBcId],
            abi.encodeWithSelector(
                EXECUTE_CANCEL_INCREASE_ORDER_METHOD,
                requestKey,
                isReduce
            )
        );
    }

    function updateMargin(
        uint256 _sourceBcId,
        bytes memory _functionCall,
        bool _isRemove
    ) internal {
        (
            address collateralToken,
            address indexToken,
            address pmAddress,
            uint256 amountInUsd,
            uint256 amountInToken,
            address trader
        ) = abi.decode(
                _functionCall,
                (address, address, address, uint256, uint256, address)
            );

        IDPTPValidator(dptpValidator).validateChainIDAndManualMargin(
            trader,
            pmAddress,
            _sourceBcId,
            amountInUsd
        );

        Position.Data memory positionData = IPositionHouse(positionHouse)
            .getPosition(pmAddress, trader);
        bool isLong = positionData.quantity > 0 ? true : false;

        bytes memory destFunctionCall;

        if (_isRemove) {
            (, , uint256 withdrawAmountUsd) = IPositionHouse(positionHouse)
                .removeMargin(IPositionManager(pmAddress), amountInUsd, trader);
            destFunctionCall = abi.encodeWithSelector(
                EXECUTE_REMOVE_COLLATERAL_METHOD,
                trader,
                collateralToken,
                indexToken,
                isLong,
                withdrawAmountUsd
            );
        } else {
            IPositionHouse(positionHouse).addMargin(
                IPositionManager(pmAddress),
                amountInUsd,
                0,
                trader
            );
            destFunctionCall = abi.encodeWithSelector(
                EXECUTE_ADD_COLLATERAL_METHOD,
                trader,
                collateralToken,
                indexToken,
                isLong,
                amountInToken
            );
        }

        _crossBlockchainCall(
            _sourceBcId,
            destChainFuturesGateways[_sourceBcId],
            destFunctionCall
        );
    }

    function closePosition(uint256 _sourceBcId, bytes memory _functionCall)
        internal
    {
        bytes32 requestKey;
        address pmAddress;
        uint256 quantity;
        address trader;
        (requestKey, pmAddress, quantity, trader) = abi.decode(
            _functionCall,
            (bytes32, address, uint256, address)
        );

        Position.Data memory positionData = IPositionHouse(positionHouse)
            .getPosition(pmAddress, trader);
        bool isLong = positionData.quantity > 0 ? true : false;

        (, uint256 fee, uint256 withdrawAmount) = IPositionHouse(positionHouse)
            .closePosition(IPositionManager(pmAddress), quantity, trader);

        IDPTPValidator(dptpValidator).updateTraderData(trader, pmAddress);

        _crossBlockchainCall(
            _sourceBcId,
            destChainFuturesGateways[_sourceBcId],
            abi.encodeWithSelector(
                EXECUTE_DECREASE_POSITION_METHOD,
                requestKey,
                withdrawAmount,
                fee,
                quantity,
                isLong
            )
        );
    }

    function setMyChainID(uint256 _chainID) external onlyOwner {
        myBlockchainId = _chainID;
    }

    function setTimeHorizon(uint256 _timeHorizon) external onlyOwner {
        timeHorizon = _timeHorizon;
    }

    function setDPTPValidator(address _address) external onlyOwner {
        dptpValidator = _address;
    }

    function setPositionHouse(address _positionHouseAddress) public onlyOwner {
        positionHouse = _positionHouseAddress;
    }

    function setPositionStrategyOrder(address _address) external onlyOwner {
        positionStrategyOrder = _address;
    }

    function addDestChainFuturesGateway(
        uint256 _destChainId,
        address _destFuturesGateway
    ) external onlyOwner {
        destChainFuturesGateways[_destChainId] = _destFuturesGateway;
    }

    function removeDestChainFuturesGateway(uint256 _destChainId)
        external
        onlyOwner
    {
        delete destChainFuturesGateways[_destChainId];
    }

    function setRelayer(
        uint256 _destChainId,
        address _relayer,
        bool _status
    ) external onlyOwner {
        whitelistRelayers[_destChainId][_relayer] = _status;
    }

    function _crossBlockchainCall(
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

    function validateChainIDAndManualMargin(
        uint256 _sourceBcId,
        address _pmAddress,
        address _trader,
        uint256 _amount
    ) internal {
        IDPTPValidator(dptpValidator).validateChainIDAndManualMargin(
            _trader,
            _pmAddress,
            _sourceBcId,
            0
        );
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}