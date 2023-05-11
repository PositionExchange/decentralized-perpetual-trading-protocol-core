// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../adapter/interfaces/IPositionHouse.sol";
import "../adapter/interfaces/IPositionManager.sol";
import "../adapter/interfaces/IPositionStrategyOrder.sol";
import "../adapter/interfaces/IInsuranceFund.sol";
import "../adapter/interfaces/ICrossChainGateway.sol";
import "../library/types/PositionStrategyOrderStorage.sol";
import "../library/positions/HouseBaseParam.sol";
import {Quantity} from "../library/helpers/Quantity.sol";
import {Errors} from "../library/helpers/Errors.sol";
import "../adapter/interfaces/IDPTPValidator.sol";
import "../library/positions/Position.sol";

contract DptpCrossChainGateway is
    PausableUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    ICrossChainGateway
{
    using Quantity for int256;
    using SafeMathUpgradeable for uint256;

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
        bytes4(
            keccak256("executeIncreasePosition(bytes32,uint256,uint256,bool)")
        );

    bytes4 private constant EXECUTE_DECREASE_POSITION_METHOD =
        bytes4(
            keccak256(
                "executeDecreasePosition(bytes32,uint256,uint256,uint256,uint256,bool)"
            )
        );

    bytes4 private constant EXECUTE_ADD_COLLATERAL_METHOD =
        bytes4(keccak256("executeAddCollateral(bytes32)"));

    bytes4 private constant EXECUTE_REMOVE_COLLATERAL_METHOD =
        bytes4(keccak256("executeRemoveCollateral(bytes32,uint256)"));

    bytes4 private constant EXECUTE_CANCEL_INCREASE_ORDER_METHOD =
        bytes4(keccak256("executeCancelIncreaseOrder(bytes32,bool)"));

    bytes4 private constant EXECUTE_CLAIM_FUND_METHOD =
        bytes4(keccak256("executeClaimFund(address[],address,uint256)"));

    bytes4 private constant TRIGGER_TPSL_METHOD =
        bytes4(
            keccak256(
                "triggerTPSL(address,address,uint256,uint256,uint256,bool,bool)"
            )
        );

    uint256 private constant WEI_DECIMAL = 10**18;

    struct RequestKeyData {
        address pm;
        address trader;
    }

    // increase key => increase data
    mapping(bytes32 => RequestKeyData) public requestKeyData;

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
        uint256 _amount
    );

    event CrossCall(
        bytes32 _txId,
        uint256 _timestamp,
        address _caller,
        uint256 _destBcId,
        address _destContract,
        uint8 _destMethodID,
        bytes _destFunctionCall
    );

    event EntryPrice(uint256 _entryPrice);

    modifier onlyRelayer(uint256 _sourceBcId) {
        require(whitelistRelayers[_sourceBcId][msg.sender], "invalid relayer");
        _;
    }

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
    ) public nonReentrant onlyRelayer(_sourceBcId) {
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
            addMargin(_sourceBcId, functionCall);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) == Method.REMOVE_MARGIN
        ) {
            removeMargin(_sourceBcId, functionCall);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) == Method.CLOSE_POSITION
        ) {
            closePosition(_sourceBcId, functionCall);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) ==
            Method.CLOSE_LIMIT_POSITION
        ) {
            closeLimitPosition(_sourceBcId, functionCall);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) == Method.CLAIM_FUND
        ) {
            claimFund(_sourceBcId, functionCall);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) == Method.SET_TPSL
        ) {
            setTPSL(_sourceBcId, functionCall);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) == Method.UNSET_TP_AND_SL
        ) {
            unsetTPAndSL(_sourceBcId, functionCall);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) == Method.UNSET_TP_OR_SL
        ) {
            unsetTPOrSL(_sourceBcId, functionCall);
            return;
        } else if (
            Method(decodedEventData.functionMethodID) ==
            Method.EXECUTE_STORE_POSITION
        ) {
            _executeStorePosition(_sourceBcId, functionCall);
            return;
        }
        revert("CGW-01");
    }

    /// @notice This function is for manual call update execute update position
    /// For testing or backup for relayer
    /// !Note: Will deprecate once the relayer become more stable or on mainnet
    /// @param _sourceBcId The source bc id, used for determine the relayer
    /// @param _signal Signal to execute or clear the pending update position map
    /// 0: Execute - mean create position
    /// 1: Clear - clear the pending map to avoid "PendingUpdatePositionExists" revert error
    /// @param _pmAddress The position manager address
    /// @param _trader The trader address
    function manualCallExecuteUpdatePosition(
        uint256 _sourceBcId,
        uint8 _signal,
        address _pmAddress,
        address _trader
    ) external {
        // TOOD: Temp not validate relayer
        if (_signal == 0) {
            IPositionHouse(positionHouse).executeStorePosition(
                _pmAddress,
                _trader
            );
        } else {
            IPositionHouse(positionHouse).clearStorePendingPosition(
                _pmAddress,
                _trader
            );
        }
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

        uint256 entryPrice;
        {
            (, , , entryPrice) = IPositionHouse(positionHouse)
                .openMarketPosition(param);
            uint256 basisPoint = IPositionManager(pmAddress).getBasisPoint();

            entryPrice = entryPrice.mul(WEI_DECIMAL).div(basisPoint);
            emit EntryPrice(entryPrice);
        }

        // store key for callback execute
        requestKeyData[requestKey] = RequestKeyData(pmAddress, param.trader);

        _crossBlockchainCall(
            _sourceBcId,
            destChainFuturesGateways[_sourceBcId],
            abi.encodeWithSelector(
                EXECUTE_INCREASE_POSITION_METHOD,
                requestKey,
                entryPrice,
                param.quantity,
                isLong
            )
        );
    }

    function openLimitOrder(uint256 _sourceBcId, bytes memory _functionCall)
        internal
    {
        address pmAddress;
        bool isLong;
        HouseBaseParam.OpenLimitOrderParams memory param;

        (
            param.sourceChainRequestKey,
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

        // store key for callback execute
        requestKeyData[param.sourceChainRequestKey] = RequestKeyData(
            pmAddress,
            param.trader
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

        uint256 entryPrice;
        bool isLong;
        {
            Position.Data memory positionData = IPositionHouse(positionHouse)
                .getPosition(pmAddress, trader);
            uint256 quantityAbs = positionData.quantity.abs();
            if (quantity >= quantityAbs) {
                entryPrice = 0;
            } else {
                entryPrice = positionData.openNotional.mul(WEI_DECIMAL).div(
                    quantityAbs
                );
            }
            isLong = positionData.quantity > 0 ? true : false;
            emit EntryPrice(0);
        }

        (, uint256 fee, uint256 withdrawAmount) = IPositionHouse(positionHouse)
            .closePosition(IPositionManager(pmAddress), quantity, trader);

        IDPTPValidator(dptpValidator).updateTraderData(trader, pmAddress);

        uint256 sourceBcId = _sourceBcId;
        _crossBlockchainCall(
            sourceBcId,
            destChainFuturesGateways[sourceBcId],
            abi.encodeWithSelector(
                EXECUTE_DECREASE_POSITION_METHOD,
                requestKey,
                withdrawAmount,
                fee,
                entryPrice,
                quantity,
                isLong
            )
        );
    }

    function closeLimitPosition(uint256 _sourceBcId, bytes memory _functionCall)
        internal
    {
        bytes32 requestKey;
        address pmAddress;
        uint256 pip;
        uint256 quantity;
        address trader;
        (requestKey, pmAddress, pip, quantity, trader) = abi.decode(
            _functionCall,
            (bytes32, address, uint256, uint256, address)
        );

        (, uint256 fee, uint256 withdrawAmount) = IPositionHouse(positionHouse)
            .closeLimitPosition(
                IPositionManager(pmAddress),
                uint128(pip),
                quantity,
                trader,
                requestKey
            );

        IDPTPValidator(dptpValidator).updateTraderData(trader, pmAddress);
    }

    function removeMargin(uint256 _sourceBcId, bytes memory _functionCall)
        internal
    {
        (
            bytes32 requestKey,
            address pmAddress,
            uint256 amountUsd,
            address account
        ) = abi.decode(_functionCall, (bytes32, address, uint256, address));

        IDPTPValidator(dptpValidator).validateChainIDAndManualMargin(
            account,
            pmAddress,
            _sourceBcId,
            amountUsd
        );

        Position.Data memory positionData = IPositionHouse(positionHouse)
            .getPosition(pmAddress, account);
        bool isLong = positionData.quantity > 0 ? true : false;

        uint256 addedMargin = IPositionHouse(positionHouse)
            .getAddedMargin(pmAddress, account)
            .abs();

        if (amountUsd > addedMargin) {
            amountUsd = addedMargin;
        }

        (, , uint256 withdrawAmountUsd) = IPositionHouse(positionHouse)
            .removeMargin(IPositionManager(pmAddress), amountUsd, account);

        if (withdrawAmountUsd > 0) {
            uint256 sourceBcId = _sourceBcId;
            _crossBlockchainCall(
                sourceBcId,
                destChainFuturesGateways[sourceBcId],
                abi.encodeWithSelector(
                    EXECUTE_REMOVE_COLLATERAL_METHOD,
                    requestKey,
                    withdrawAmountUsd
                )
            );
        }
    }

    function addMargin(uint256 _sourceBcId, bytes memory _functionCall)
        internal
    {
        (
            bytes32 key,
            address pmAddress,
            uint256 amountInUsd,
            address trader
        ) = abi.decode(_functionCall, (bytes32, address, uint256, address));

        IDPTPValidator(dptpValidator).validateChainIDAndManualMargin(
            trader,
            pmAddress,
            _sourceBcId,
            amountInUsd
        );

        IPositionHouse(positionHouse).addMargin(
            IPositionManager(pmAddress),
            amountInUsd,
            0,
            trader
        );

        _crossBlockchainCall(
            _sourceBcId,
            destChainFuturesGateways[_sourceBcId],
            abi.encodeWithSelector(EXECUTE_ADD_COLLATERAL_METHOD, key)
        );
    }

    function setTPSL(uint256 _sourceBcId, bytes memory _functionCall) internal {
        address _pmAddress;
        address _trader;
        uint128 _higherPip;
        uint128 _lowerPip;
        uint8 _option;
        (_pmAddress, _trader, _higherPip, _lowerPip, _option) = abi.decode(
            _functionCall,
            (address, address, uint128, uint128, uint8)
        );

        IPositionStrategyOrder(positionStrategyOrder).setTPSL(
            _pmAddress,
            _trader,
            _higherPip,
            _lowerPip,
            PositionStrategyOrderStorage.SetTPSLOption(_option),
            _sourceBcId
        );
    }

    function unsetTPAndSL(uint256 _sourceBcId, bytes memory _functionCall)
        internal
    {
        address _pmAddress;
        address _trader;
        (_pmAddress, _trader) = abi.decode(_functionCall, (address, address));

        IPositionStrategyOrder(positionStrategyOrder).unsetTPAndSL(
            _pmAddress,
            _trader
        );
    }

    function unsetTPOrSL(uint256 _sourceBcId, bytes memory _functionCall)
        internal
    {
        address _pmAddress;
        address _trader;
        bool _isHigherPrice;
        (_pmAddress, _trader, _isHigherPrice) = abi.decode(
            _functionCall,
            (address, address, bool)
        );

        IPositionStrategyOrder(positionStrategyOrder).unsetTPOrSL(
            _pmAddress,
            _trader,
            _isHigherPrice
        );
    }

    function triggerTPSL(
        uint256 _sourceBcId,
        address _pmAddress,
        address _trader
    ) external {
        Position.Data memory positionData = IPositionHouse(positionHouse)
            .getPosition(_pmAddress, _trader);
        bool isLong = positionData.quantity > 0 ? true : false;

        (
            ,
            uint256 fee,
            uint256 withdrawAmount,
            bool isHigherPip
        ) = IPositionStrategyOrder(positionStrategyOrder).triggerTPSL(
                _pmAddress,
                _trader
            );

        _crossBlockchainCall(
            _sourceBcId,
            destChainFuturesGateways[_sourceBcId],
            abi.encodeWithSelector(
                TRIGGER_TPSL_METHOD,
                _trader,
                _pmAddress,
                withdrawAmount,
                fee,
                positionData.quantity,
                isHigherPip,
                isLong
            )
        );
    }

    function claimFund(uint256 _sourceBcId, bytes memory _functionCall)
        internal
    {
        address[] memory path;
        address pmAddress;
        address account;
        (path, pmAddress, account) = abi.decode(
            _functionCall,
            (address[], address, address)
        );

        (, , uint256 withdrawAmount) = IPositionHouse(positionHouse).claimFund(
            IPositionManager(pmAddress),
            account
        );

        IDPTPValidator(dptpValidator).updateTraderData(account, pmAddress);

        if (withdrawAmount == 0) {
            return;
        }

        _crossBlockchainCall(
            _sourceBcId,
            destChainFuturesGateways[_sourceBcId],
            abi.encodeWithSelector(
                EXECUTE_CLAIM_FUND_METHOD,
                path,
                account,
                withdrawAmount
            )
        );
    }

    function _executeStorePosition(
        uint256 _sourceBcId,
        bytes memory _functionCall
    ) private {
        /*
          uint8 signal
          0: Execute
          1: Remove
        */
        (bytes32 _requestKey, uint8 _signal) = abi.decode(
            _functionCall,
            (bytes32, uint8)
        );
        (address _pmAddress, address _trader) = (
            requestKeyData[_requestKey].pm,
            requestKeyData[_requestKey].trader
        );
        require(
            _pmAddress != address(0) && _trader != address(0),
            "Invalid request key."
        );
        if (_signal == 0) {
            IPositionHouse(positionHouse).executeStorePosition(
                _pmAddress,
                _trader
            );
        } else {
            IPositionHouse(positionHouse).clearStorePendingPosition(
                _pmAddress,
                _trader
            );
        }
        delete requestKeyData[_requestKey];
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

    function executeIncreaseOrder(
        uint256 _sourceBcId,
        bytes32 _requestKey,
        uint256 _entryPrice,
        uint256 _quantity,
        bool _isLong
    ) external override {
        _crossBlockchainCall(
            _sourceBcId,
            destChainFuturesGateways[_sourceBcId],
            abi.encodeWithSelector(
                EXECUTE_INCREASE_POSITION_METHOD,
                _requestKey,
                _entryPrice,
                _quantity,
                _isLong
            )
        );
    }

    function executeDecreaseOrder(
        uint256 _sourceBcId,
        bytes32 _requestKey,
        uint256 _withdrawAmount,
        uint256 _fee,
        uint256 _entryPrice,
        uint256 _quantity,
        bool _isLong
    ) external override {
        _crossBlockchainCall(
            _sourceBcId,
            destChainFuturesGateways[_sourceBcId],
            abi.encodeWithSelector(
                EXECUTE_DECREASE_POSITION_METHOD,
                _requestKey,
                _withdrawAmount,
                _fee,
                _entryPrice,
                _quantity,
                _isLong
            )
        );
    }

    function _crossBlockchainCall(
        uint256 _destBcId,
        address _destContract,
        bytes memory _destData
    ) private {
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
            // Mocking only
            0,
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
