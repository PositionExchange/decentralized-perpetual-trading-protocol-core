// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../../adapter/interfaces/IPositionManager.sol";
import "../../adapter/interfaces/IInsuranceFund.sol";
import "../../adapter/interfaces/IAccessController.sol";
import "../../library/helpers/Quantity.sol";
import "../../library/positions/Position.sol";
import "../../library/positions/PositionLimitOrder.sol";
import "../../library/positions/PositionMath.sol";
import "../../library/types/PositionHouseStorage.sol";
import {PositionManagerAdapter} from "../../adapter/PositionManagerAdapter.sol";
import {AccessControllerAdapter} from "../../adapter/AccessControllerAdapter.sol";
import {Errors} from "../../library/helpers/Errors.sol";
import {Int256Math} from "../../library/helpers/Int256Math.sol";
import {CumulativePremiumFractions} from "../modules/CumulativePremiumFractions.sol";
import {LimitOrderManager} from "../modules/LimitOrder.sol";
import {MarketOrder} from "../modules/MarketOrder.sol";
import {Base} from "../modules/Base.sol";
import "../../library/positions/HouseBaseParam.sol";


abstract contract PositionHouseBase is
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable,
    CumulativePremiumFractions,
    LimitOrderManager,
    MarketOrder
{
    using PositionLimitOrder for mapping(address => mapping(address => PositionLimitOrder.Data[]));
    using Quantity for int256;
    using Int256Math for int256;
    using Quantity for int128;

    using Position for Position.Data;
    using Position for Position.LiquidatedData;
    using PositionManagerAdapter for PositionHouseBase;

//    event MarginAdded(
//        address trader,
//        uint256 marginAdded,
//        IPositionManager positionManager
//    );

//    event MarginRemoved(
//        address trader,
//        uint256 marginRemoved,
//        IPositionManager positionManager
//    );

    //    event FundClaimed(address pmAddress, address trader, uint256 claimedAmount);

    //    event InstantlyClosed(address pmAddress, address trader);

    function initialize(
        address _insuranceFund,
        IPositionHouseConfigurationProxy _positionHouseConfigurationProxy,
        IPositionNotionalConfigProxy _positionNotionalConfigProxy,
        IAccessController _accessControllerInterface
    ) public initializer {
//        __ReentrancyGuard_init();
//        __Ownable_init();
//        insuranceFundInterface = IInsuranceFund(_insuranceFund);
//        positionHouseConfigurationProxy = _positionHouseConfigurationProxy;
//        positionNotionalConfigProxy = _positionNotionalConfigProxy;
//        accessControllerInterface = _accessControllerInterface;
    }

    /**
     * @notice open position with price market
     */
    function openMarketPosition(
        HouseBaseParam.OpenMarketOrderParams memory _param
    )
        external
        virtual
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        onlyCounterParty();
        address _pmAddress = address(_param.positionManager);
        insuranceFundInterface.validateOrderBusdBonusAmount(
            _pmAddress,
            _param.trader,
            _param.initialMargin,
            _param.leverage,
            _param.busdBonusAmount
        );
        Position.Data
            memory _positionDataWithManualMargin = getPositionWithManualMargin(
                _pmAddress,
                _param.trader
            );
        (bool needClaim, int256 claimableAmount) = _needToClaimFund(
            _pmAddress,
            _param.trader,
            _positionDataWithManualMargin
        );
        if (needClaim) {
            claimableAmount = _internalClaimFund(
                _pmAddress,
                _param.trader,
                _positionDataWithManualMargin,
                claimableAmount
            );
        }
        InternalOpenMarketPositionParam memory internalOpenMarketPositionParam;
        {
            internalOpenMarketPositionParam = InternalOpenMarketPositionParam({
                positionManager: _param.positionManager,
                side: _param.side,
                quantity: _param.quantity,
                leverage: _param.leverage,
                positionData: _positionDataWithManualMargin,
                trader: _param.trader,
                initialMargin: PositionMath.getInitialMarginBasedOnSide(
                    _param.side == Position.Side.LONG,
                    int256(_param.initialMargin)
                )
            });
        }
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount,
            uint256 entryPrice
        ) = _internalOpenMarketPosition(internalOpenMarketPositionParam, false);
        _validateInitialMargin(_param.initialMargin, depositAmount);
        // return depositAmount, fee and withdrawAmount
        if (needClaim) {
            return (depositAmount, fee, claimableAmount.abs() + withdrawAmount, entryPrice);
        }
        return (depositAmount, fee, withdrawAmount, entryPrice);
    }

    function executeStorePosition(
      address pmAddress,
      address trader
    ) external {
        onlyCounterParty();
        _executeUpdatePositionMap(pmAddress, trader);
    }

    function clearStorePendingPosition(
      address pmAddress,
      address trader
    ) external {
        onlyCounterParty();
        pendingPositionMap[pmAddress][trader].clear();
        _affectOpenMarketEvent(pmAddress, trader, false);
    }

    function openLimitOrder(HouseBaseParam.OpenLimitOrderParams memory _param)
        external
        virtual
        returns (
            uint256,
            uint256,
            uint256,
            LimitOverPricedFilled memory
        )
    {
        onlyCounterParty();
        address _pmAddress = address(_param.positionManager);
        insuranceFundInterface.validateOrderBusdBonusAmount(
            _pmAddress,
            _param.trader,
            _param.initialMargin,
            _param.leverage,
            _param.busdBonusAmount
        );
        Position.Data
            memory _positionDataWithManualMargin = getPositionWithManualMargin(
                _pmAddress,
                _param.trader
            );
        (bool needClaim, int256 claimableAmount) = _needToClaimFund(
            _pmAddress,
            _param.trader,
            _positionDataWithManualMargin
        );
        if (needClaim) {
            claimableAmount = _internalClaimFund(
                _pmAddress,
                _param.trader,
                _positionDataWithManualMargin,
                claimableAmount
            );
        }
        InternalOpenLimitOrderParam memory internalOpenLimitOrderParam;
        {
            internalOpenLimitOrderParam = InternalOpenLimitOrderParam({
                positionManager: _param.positionManager,
                side: _param.side,
                uQuantity: _param.quantity,
                pip: _param.pip,
                leverage: _param.leverage,
                positionData: _positionDataWithManualMargin,
                trader: _param.trader,
                initialMargin: PositionMath.getInitialMarginBasedOnSide(
                    _param.side == Position.Side.LONG,
                    int256(_param.initialMargin)
                ),
                isReduceOrder: false,
                sourceChainRequestKey: _param.sourceChainRequestKey
            });
        }
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount,
            LimitOverPricedFilled memory limitOverPricedFilled
        ) = _internalOpenLimitOrder(internalOpenLimitOrderParam);
        _validateInitialMargin(_param.initialMargin, depositAmount);
        // return depositAmount, fee and withdrawAmount
        if (needClaim) {
            return (depositAmount, fee, claimableAmount.abs() + withdrawAmount, limitOverPricedFilled);
        }
        return (depositAmount, fee, withdrawAmount, limitOverPricedFilled);
    }

    /**
     * @dev cancel a limit order
     * @param _positionManager position manager
     * @param _orderIdx order index in the limit orders (increase or reduce) list
     * @param _isReduce is that a reduce limit order?
     * The external service must determine that by a variable in getListOrderPending
     */
    function cancelLimitOrder(
        IPositionManager _positionManager,
        uint64 _orderIdx,
        uint8 _isReduce,
        address _trader
    )
        external
        virtual
        nonReentrant
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint128,
            uint8
        )
    {
        onlyCounterParty();
        (
            uint256 withdrawAmount,
            uint256 partialFilledQuantity,
            uint128 pip,
            uint8 isBuy
        ) = _internalCancelLimitOrder(
            _positionManager,
            _orderIdx,
            _isReduce,
            _trader
        );
        // return depositAmount, fee and withdrawAmount
        return (0, 0, withdrawAmount, partialFilledQuantity, pip, isBuy);
    }

    function cancelAllReduceOrder(
        IPositionManager _positionManager,
        address _trader
    )
        external
        nonReentrant
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        onlyCounterParty();
        _internalCancelMultiPendingOrder(
            _positionManager,
            _trader,
            CancelAllOption.ONLY_REDUCE
        );
        // return depositAmount, fee and withdrawAmount
        return (0, 0, 0);
    }

    /**
     * @notice close position with close market
     * @param _positionManager IPositionManager address
     * @param _quantity want to close
     */
    function closePosition(
        IPositionManager _positionManager,
        uint256 _quantity,
        address _trader
    )
        external
        virtual
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        onlyCounterParty();
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount
        ) = _internalCloseMarketPosition(address(_positionManager), _trader, _quantity);
        // return depositAmount, fee and withdrawAmount
        return (depositAmount, fee, withdrawAmount);
    }

    // @deprecated
    //    function instantlyClosePosition(
    //        IPositionManager _positionManager,
    //        uint256 _quantity,
    //        address _trader
    //    )
    //        public
    //        virtual
    //        returns (
    //            uint256,
    //            uint256,
    //            uint256
    //        )
    //    {
    //        onlyCounterParty();
    //        address _pmAddress = address(_positionManager);
    //        _internalCancelMultiPendingOrder(
    //            _positionManager,
    //            _trader,
    //            CancelAllOption.ONLY_REDUCE
    //        );
    //        (
    //            uint256 depositAmount,
    //            uint256 fee,
    //            uint256 withdrawAmount
    //        ) = _internalCloseMarketPosition(_pmAddress, _trader, _quantity);
    //        emit InstantlyClosed(_pmAddress, _trader);
    //        // return depositAmount, fee and withdrawAmount
    //        return (depositAmount, fee, withdrawAmount);
    //    }

    function triggerClosePosition(
        IPositionManager _positionManager,
        address _trader
    )
        external
        virtual
        nonReentrant
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        onlyCounterParty();
        Position.Data
            memory _positionDataWithManualMargin = getPositionWithManualMargin(
                address(_positionManager),
                _trader
            );
        uint256 withdrawAmountWhenCancelOrder = _internalCancelMultiPendingOrder(
                _positionManager,
                _trader,
                CancelAllOption.BOTH
            );
        InternalOpenMarketPositionParam memory param;
        {
            param = InternalOpenMarketPositionParam({
                positionManager: _positionManager,
                side: _positionDataWithManualMargin.quantity > 0
                    ? Position.Side.SHORT
                    : Position.Side.LONG,
                quantity: _positionDataWithManualMargin.quantity.abs(),
                leverage: _positionDataWithManualMargin.leverage,
                positionData: _positionDataWithManualMargin,
                trader: _trader,
                initialMargin: 0
            });
        }
        // must reuse this code instead of using function _internalCloseMarketPosition
        (
            uint256 depositAmount,
            ,
            uint256 withdrawAmount
            ,
        ) = _internalOpenMarketPosition(param, true);
        // return depositAmount, fee and withdrawAmount
        return (
            depositAmount,
            0,
            withdrawAmount + withdrawAmountWhenCancelOrder
        );
    }

    /**
     * @notice close position with close market
     * @param _positionManager IPositionManager address
     * @param _pip limit price want to close
     * @param _quantity want to close
     */
    function closeLimitPosition(
        IPositionManager _positionManager,
        uint128 _pip,
        uint256 _quantity,
        address _trader,
        bytes32 sourceChainRequestKey
    )
        public
        virtual
        returns (
            uint256,
            uint256,
            uint256,
            LimitOverPricedFilled memory
        )
    {
        onlyCounterParty();
        Position.Data
            memory _positionDataWithManualMargin = getPositionWithManualMargin(
                address(_positionManager),
                _trader
            );
        {
            require(
                _positionDataWithManualMargin.quantity.abs() != 0,
                Errors.VL_INVALID_CLOSE_QUANTITY
            );
        }
        InternalOpenLimitOrderParam memory internalOpenLimitOrderParam;
        {
            internalOpenLimitOrderParam = InternalOpenLimitOrderParam({
                positionManager: _positionManager,
                side: _positionDataWithManualMargin.quantity > 0
                    ? Position.Side.SHORT
                    : Position.Side.LONG,
                uQuantity: _quantity,
                pip: _pip,
                leverage: _positionDataWithManualMargin.leverage,
                positionData: _positionDataWithManualMargin,
                trader: _trader,
                initialMargin: 0,
                isReduceOrder: true,
                sourceChainRequestKey: sourceChainRequestKey
            });
        }
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount,
            LimitOverPricedFilled memory limitOverPricedFilled
        ) = _internalOpenLimitOrder(internalOpenLimitOrderParam);
        // return depositAmount, fee and withdrawAmount
        return (depositAmount, fee, withdrawAmount, limitOverPricedFilled);
    }

    function clearTraderData(address _pmAddress, address _trader)
        external
        nonReentrant
    {
        onlyCounterParty();
        clearPosition(_pmAddress, _trader);
    }

    function claimFund(IPositionManager _positionManager, address _trader)
        external
        virtual
        nonReentrant
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        onlyCounterParty();
        address _pmAddress = address(_positionManager);
        Position.Data
            memory _positionDataWithManualMargin = getPositionWithManualMargin(
                _pmAddress,
                _trader
            );
        if (_positionDataWithManualMargin.quantity != 0) {
            return (0, 0, 0);
        }
        int256 withdrawAmount = _internalClaimFund(
            _pmAddress,
            _trader,
            _positionDataWithManualMargin,
            0
        );
        // return depositAmount, fee and withdrawAmount
        return (0, 0, withdrawAmount.abs());
    }

    function onlyCounterParty() internal {
        require(
            AccessControllerAdapter.isGatewayOrCoreContract(
                accessControllerInterface,
                _msgSender()
            ),
            Errors.VL_NOT_COUNTERPARTY
        );
    }

    function _internalClaimFund(
        address _pmAddress,
        address _trader,
        Position.Data memory _positionData,
        int256 _claimableAmount
    ) private returns (int256) {
        if (_claimableAmount == 0) {
            _claimableAmount = _getClaimAmount(_pmAddress, _trader);
        }
        clearPosition(_pmAddress, _trader);
        if (_claimableAmount > 0) {
            //            emit FundClaimed(_pmAddress, _trader, _claimableAmount.abs());
            return _claimableAmount;
        }
        return 0;
    }

    /**
     * @notice add margin to decrease margin ratio
     * @param _positionManager IPositionManager address
     * @param _amount amount of margin to add
     */
    function addMargin(
        IPositionManager _positionManager,
        uint256 _amount,
        uint256 _busdBonusAmount,
        address _trader
    )
        external
        virtual
        nonReentrant
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        onlyCounterParty();
        address _pmAddress = address(_positionManager);
        insuranceFundInterface.validateAddMarginBusdBonusAmount(
            _pmAddress,
            _trader,
            _busdBonusAmount
        );
        require(
            getPosition(_pmAddress, _trader).quantity != 0,
            Errors.VL_NO_POSITION_TO_ADD
        );
        // increase manual margin by amount
        _updateManualMargin(_pmAddress, _trader, int256(_amount));

        // emit MarginAdded(_trader, _amount, _positionManager);
        // return depositAmount, fee and withdrawAmount
        return (_amount, 0, 0);
    }

    /**
     * @notice add margin to increase margin ratio
     * @param _positionManager IPositionManager address
     * @param _amount amount of margin to remove
     */
    function removeMargin(
        IPositionManager _positionManager,
        uint256 _amount,
        address _trader
    )
        external
        virtual
        nonReentrant
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        onlyCounterParty();
        address _pmAddress = address(_positionManager);

        uint256 removableMargin = getRemovableMargin(_positionManager, _trader);
        require(_amount <= removableMargin, Errors.VL_INVALID_REMOVE_MARGIN);

        // reduce manual margin by amount
        _updateManualMargin(_pmAddress, _trader, -int256(_amount));

        // emit MarginRemoved(_trader, _amount, _positionManager);
        // return depositAmount, fee and withdrawAmount
        return (0, 0, _amount);
    }

    function updatePartialLiquidatedPosition(
        address _pmAddress,
        address _trader,
        int256 _liquidatedQuantity,
        int256 _liquidatedMargin,
        uint256 _liquidatedAbsoluteMargin,
        uint256 _liquidatedNotional,
        int256 _liquidatedManualMargin
    ) external nonReentrant {
        onlyCounterParty();
        debtPosition[_pmAddress][_trader].updateDebt(
            _liquidatedQuantity,
            _liquidatedMargin,
            _liquidatedAbsoluteMargin,
            _liquidatedNotional
        );

        // reduce manual margin by liquidatedManualMargin
        _updateManualMargin(_pmAddress, _trader, -_liquidatedManualMargin);
    }

    // OWNER UPDATE VARIABLE STORAGE

//    function setPositionStrategyOrder(
//        IPositionStrategyOrder _positionStrategyOrder
//    ) external onlyOwner {
//        positionStrategyOrder = _positionStrategyOrder;
//    }

//    function updateAccessControllerInterface(address _accessControllerAddress)
//        external
//        onlyOwner
//    {
//        accessControllerInterface = IAccessController(_accessControllerAddress);
//    }

    function updateConfigNotionalKey(address _pmAddress, bytes32 _key)
        external
        onlyOwner
    {
        configNotionalKey[_pmAddress] = _key;
    }

    // PUBLIC VIEW QUERY

    //    function getConfigNotionalKey(address _pmAddress) public view returns (bytes32) {
    //        return configNotionalKey[_pmAddress];
    //    }

    function getAddedMargin(address _positionManager, address _trader)
        public
        view
        override(Base)
        returns (int256)
    {
        return manualMargin[_positionManager][_trader];
    }

    function getRemovableMargin(
        IPositionManager _positionManager,
        address _trader
    ) public view returns (uint256) {
        int256 _marginAdded = getAddedMargin(
            address(_positionManager),
            _trader
        );
        (
            uint256 maintenanceMargin,
            int256 marginBalance,

        ) = getMaintenanceDetail(_positionManager, _trader, PnlCalcOption.TWAP);
        int256 _remainingMargin = marginBalance - int256(maintenanceMargin);
        return
            uint256(
                _marginAdded <= _remainingMargin
                    ? _marginAdded
                    : _remainingMargin.kPositive()
            );
    }

    function getPosition(address _pmAddress, address _trader)
        public
        view
        override(Base)
        returns (Position.Data memory positionData)
    {
        positionData = _getPositionMap(_pmAddress, _trader);
        PositionLimitOrder.Data[] memory _limitOrders = getLimitOrders(
            _pmAddress,
            _trader
        );
        PositionLimitOrder.Data[] memory _reduceOrders = getReduceLimitOrders(
            _pmAddress,
            _trader
        );
        positionData = PositionManagerAdapter.calculateLimitOrder(
            _pmAddress,
            _limitOrders,
            _reduceOrders,
            positionData
        );
        if (positionData.lastUpdatedCumulativePremiumFraction == 0) {
            positionData
                .lastUpdatedCumulativePremiumFraction = _getLimitOrderPremiumFraction(
                _pmAddress,
                _trader
            );
        }
        Position.LiquidatedData memory _debtPosition = getDebtPosition(
            _pmAddress,
            _trader
        );
        if (_debtPosition.margin != 0) {
            positionData.quantity -= _debtPosition.quantity;
            positionData.margin -= _debtPosition.margin;
            positionData.absoluteMargin -= _debtPosition.absoluteMargin;
            positionData.openNotional -= _debtPosition.notional;
        }
        if (positionData.quantity == 0) {
            positionData.margin = 0;
            positionData.openNotional = 0;
            positionData.absoluteMargin = 0;
            positionData.leverage = 1;
        }
    }

    function getPositionWithManualMargin(address _pmAddress, address _trader)
        public
        view
        override(
            //        Position.Data memory _positionData
            Base
        )
        returns (Position.Data memory)
    {
        Position.Data memory _positionData = getPosition(_pmAddress, _trader);
        int256 manualAddedMargin = getAddedMargin(_pmAddress, _trader);
        // add manual added margin to positionData.margin
        _positionData.margin = PositionMath.calculateMarginIncludeManual(
            _positionData.quantity,
            _positionData.margin,
            manualAddedMargin
        );
        return _positionData;
    }

    function _getClaimAmount(address _pmAddress, address _trader)
        internal
        view
        override(Base)
        returns (int256)
    {
        address a = _pmAddress;
        address t = _trader;

        {
            return
                PositionManagerAdapter.getClaimAmount(
                    a,
                    getAddedMargin(a, t),
                    getDebtPosition(a, t),
                    _getPositionMap(a, t),
                    getLimitOrders(a, t),
                    getReduceLimitOrders(a, t),
                    _getLimitOrderPremiumFraction(a, t),
                    getLatestCumulativePremiumFraction(a)
                );
        }
    }

    // TODO consider to remove this function
    function getMaintenanceDetail(
        IPositionManager _positionManager,
        address _trader,
        PnlCalcOption _calcOption
    )
        internal
        view
        returns (
            uint256 maintenanceMargin,
            int256 marginBalance,
            uint256 marginRatio
        )
    {
        address _pmAddress = address(_positionManager);
        Position.Data
            memory _positionDataWithManualMargin = getPositionWithManualMargin(
                _pmAddress,
                _trader
            );

        (, int256 unrealizedPnl) = PositionManagerAdapter
            .getPositionNotionalAndUnrealizedPnl(
                _pmAddress,
                _trader,
                _calcOption,
                _positionDataWithManualMargin
            );

        (int256 remainMarginWithFundingPayment, , ) = PositionMath
            .calcRemainMarginWithFundingPayment(
                _positionDataWithManualMargin,
                _positionDataWithManualMargin.margin.absInt(),
                getLatestCumulativePremiumFraction(_pmAddress)
            );
        // only use absolute margin for calculating maintenanceMargin
        maintenanceMargin =
            (_positionDataWithManualMargin.absoluteMargin *
                positionHouseConfigurationProxy.maintenanceMarginRatio()) /
            100;
        marginBalance =
            int256(remainMarginWithFundingPayment).absInt() +
            unrealizedPnl;
        marginRatio = marginBalance <= 0
            ? 100
            : (maintenanceMargin * 100) / uint256(marginBalance);
        if (_positionDataWithManualMargin.quantity == 0) {
            marginRatio = 0;
        }
    }

    function getLimitOrderPremiumFraction(address _pmAddress, address _trader)
        public
        view
        returns (int128)
    {
        return _getLimitOrderPremiumFraction(_pmAddress, _trader);
    }

    function getLatestCumulativePremiumFraction(address _pmAddress)
        public
        view
        override(CumulativePremiumFractions, Base)
        returns (int128)
    {
        return
            CumulativePremiumFractions.getLatestCumulativePremiumFraction(
                _pmAddress
            );
    }

    //
    // INTERNAL FUNCTIONS
    //
    function _requireOrderSideAndQuantity(
        address _pmAddress,
        address _trader,
        Position.Side _side,
        uint256 _quantity,
        int256 _positionQuantity
    ) internal view override(Base) returns (bool, uint256) {
        bool isReduceOrder;
        PositionManagerAdapter.CheckSideAndQuantityParam
            memory checkSideAndQuantityParam = PositionManagerAdapter
                .CheckSideAndQuantityParam({
                    limitOrders: getLimitOrders(_pmAddress, _trader),
                    reduceLimitOrders: getReduceLimitOrders(
                        _pmAddress,
                        _trader
                    ),
                    side: _side,
                    orderQuantity: _quantity,
                    positionQuantity: _positionQuantity
                });
        (
            PositionManagerAdapter.ReturnCheckOrderSideAndQuantity checkOrder,
            uint256 remainCloseQuantity
        ) = PositionManagerAdapter.checkPendingOrderSideAndQuantity(
                IPositionManager(_pmAddress),
                checkSideAndQuantityParam
            );
        if (
            checkOrder ==
            PositionManagerAdapter
                .ReturnCheckOrderSideAndQuantity
                .MUST_SAME_SIDE
        ) {
            if (_side == Position.Side.LONG) {
                revert(Errors.VL_MUST_SAME_SIDE_LONG);
            } else {
                revert(Errors.VL_MUST_SAME_SIDE_SHORT);
            }
        } else if (
            checkOrder ==
            PositionManagerAdapter
                .ReturnCheckOrderSideAndQuantity
                .MUST_SMALLER_QUANTITY
        ) {
            isReduceOrder = true;
            return (isReduceOrder, remainCloseQuantity);
        }
        return (isReduceOrder, 0);
    }

    function _internalCancelMultiPendingOrder(
        IPositionManager _positionManager,
        address _trader,
        CancelAllOption _option
    ) internal override(Base) returns (uint256) {
        address _pmAddress = address(_positionManager);
        PositionLimitOrder.Data[] memory _increaseOrders;
        if (_option != CancelAllOption.ONLY_REDUCE) {
            _increaseOrders = getLimitOrders(_pmAddress, _trader);
        }
        PositionLimitOrder.Data[] memory _reduceOrders = getReduceLimitOrders(
            _pmAddress,
            _trader
        );
        uint256 totalRefundMargin;
        if (_increaseOrders.length != 0 || _reduceOrders.length != 0) {
            totalRefundMargin = PositionManagerAdapter
                .cancelAllPendingLimitOrder(
                    _positionManager,
                    _increaseOrders,
                    _reduceOrders
                );
            if (_option != CancelAllOption.ONLY_REDUCE) {
                for (uint256 i = 0; i < _increaseOrders.length; i++) {
                    _getLimitOrderPointer(_pmAddress, _trader, 0)[
                        i
                    ] = _increaseOrders[i];
                }
            }
        }
        if (totalRefundMargin != 0) {
            return totalRefundMargin;
        }
        return 0;
    }

    function clearPosition(address _pmAddress, address _trader)
        internal
        override(Base)
    {
        positionStrategyOrder.unsetTPAndSLWhenClosePosition(
            _pmAddress,
            _trader
        );

        positionMap[_pmAddress][_trader].clear();
        debtPosition[_pmAddress][_trader].clearDebt();
        manualMargin[_pmAddress][_trader] = 0;
        insuranceFundInterface.reduceBonus(_pmAddress, _trader, 0);

        PositionLimitOrder.Data[]
            memory subListLimitOrders = PositionManagerAdapter
                .clearAllFilledOrder(
                    IPositionManager(_pmAddress),
                    getLimitOrders(_pmAddress, _trader)
                );

        _emptyLimitOrders(_pmAddress, _trader);
        for (uint256 i = 0; i < subListLimitOrders.length; i++) {
            if (subListLimitOrders[i].pip == 0) {
                break;
            }
            _pushLimit(_pmAddress, _trader, subListLimitOrders[i]);
        }
        _emptyReduceLimitOrders(_pmAddress, _trader);
    }

    function _checkMaxNotional(
        uint256 _notional,
        address _pmAddress,
        uint16 _leverage
    ) internal override(Base) returns (bool) {
        bytes32 _key = configNotionalKey[_pmAddress];
        return
            _notional <=
            (positionNotionalConfigProxy.getMaxNotional(_key, _leverage) *
                10**18);
    }

    function _validateInitialMargin(
        uint256 _initialMargin,
        uint256 _absoluteMargin
    ) internal {
        if (_absoluteMargin != 0) {
            uint256 initialMarginSlippagePercent = positionHouseConfigurationProxy
                    .initialMarginSlippagePercent();
            bool isValidated = (_initialMargin >=
                ((100 - initialMarginSlippagePercent) * _absoluteMargin) /
                    100) &&
                (_initialMargin <=
                    ((100 + initialMarginSlippagePercent) * _absoluteMargin) /
                        100);
            require(isValidated, Errors.VL_INITIAL_MARGIN);
        }
    }

    function _updatePositionMap(
        address _pmAddress,
        address _trader,
        Position.Data memory newData,
        bool isReducePosittion
    ) internal override(Base) {
      if(isReducePosittion){
        // Update the position data directly for reducing position
        positionMap[_pmAddress][_trader].update(newData);
        return;
      }
      // Currently we only allow one pending update position for each trader
      // For safety reason, we do not allow to update to a pending update position
      // TODO need to support multiple pending update positions in the future (cover more pending cases)
      require(
        pendingPositionMap[_pmAddress][_trader].quantity == 0,
        "PendingUpdatePositionExists"
      );
      // now we update to the pending position map
      // then wait for source chain transaction success
      // then update to the position map
      pendingPositionMap[_pmAddress][_trader].update(newData);
    }

    function _executeUpdatePositionMap(
        address _pmAddress,
        address _trader
    ) internal override(Base) {
        Position.Data memory newData = pendingPositionMap[_pmAddress][_trader];
        // No pending position exists
        require(newData.quantity != 0, "!p");
        positionMap[_pmAddress][_trader].update(newData);
        // delete pending position
        pendingPositionMap[_pmAddress][_trader].clear();
        _affectOpenMarketEvent(_pmAddress, _trader, true);
    }

    function _updateManualMargin(
        address _pmAddress,
        address _trader,
        int256 _changedAmount
    ) internal override(Base) {
        manualMargin[_pmAddress][_trader] += _changedAmount;
    }

    function _getPositionMap(address _pmAddress, address _trader)
        internal
        view
        override(Base)
        returns (Position.Data memory)
    {
        return positionMap[_pmAddress][_trader];
    }

    //    function getManualMargin(address _pmAddress, address _trader)
    //        public
    //        view
    //        override(Base)
    //        returns (int256)
    //    {
    //        return manualMargin[_pmAddress][_trader];
    //    }

    function getDebtPosition(address _pmAddress, address _trader)
        public
        view
        override(Base)
        returns (Position.LiquidatedData memory)
    {
        return debtPosition[_pmAddress][_trader];
    }
}
