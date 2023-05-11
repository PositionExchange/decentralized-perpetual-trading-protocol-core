// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

import "./interfaces/IPositionManager.sol";
import "../library/positions/Position.sol";
import "../library/positions/PositionLimitOrder.sol";
import "../library/positions/PipConversionMath.sol";
import "../library/positions/PositionMath.sol";
import "../library/helpers/Quantity.sol";
import "../library/helpers/Int256Math.sol";
import "../library/helpers/Uint256Math.sol";
import "../library/helpers/CommonMath.sol";
import "../library/helpers/Errors.sol";
import "../library/types/PositionHouseStorage.sol";

import "hardhat/console.sol";

library PositionManagerAdapter {
    int256 private constant PREMIUM_FRACTION_DENOMINATOR = 10**10;
    using PositionLimitOrder for mapping(address => mapping(address => PositionLimitOrder.Data[]));
    using Position for Position.Data;
    using Position for Position.LiquidatedData;
    using Quantity for int256;
    using Quantity for int128;
    using Int256Math for int256;
    using Uint256Math for uint256;
    using PipConversionMath for uint128;

    function clearAllFilledOrder(
        IPositionManager _positionManagerInterface,
        PositionLimitOrder.Data[] memory _limitOrders
    ) external returns (PositionLimitOrder.Data[] memory) {
        PositionLimitOrder.Data[]
            memory subLimitOrders = new PositionLimitOrder.Data[](
                _limitOrders.length
            );
        if (_limitOrders.length > 0) {
            uint256 index = 0;
            for (uint256 i = 0; i < _limitOrders.length; i++) {
                (bool isFilled, , , ) = _positionManagerInterface
                    .getPendingOrderDetail(
                        _limitOrders[i].pip,
                        _limitOrders[i].orderId
                    );
                if (isFilled != true) {
                    subLimitOrders[index] = _limitOrders[i];
                    _positionManagerInterface.updatePartialFilledOrder(
                        _limitOrders[i].pip,
                        _limitOrders[i].orderId
                    );
                    index++;
                }
            }
        }
        return subLimitOrders;
    }

    function calculateLimitOrder(
        address _positionManagerInterface,
        PositionLimitOrder.Data[] memory _limitOrders,
        PositionLimitOrder.Data[] memory _reduceLimitOrders,
        Position.Data memory _positionData
    ) external view returns (Position.Data memory positionData) {
        for (uint256 i = 0; i < _limitOrders.length; i++) {
            if (_limitOrders[i].pip != 0) {
                _positionData = accumulateLimitOrderToPositionData(
                    _positionManagerInterface,
                    _limitOrders[i],
                    _positionData,
                    _limitOrders[i].entryPrice
                );
            }
        }
        for (uint256 i = 0; i < _reduceLimitOrders.length; i++) {
            if (_reduceLimitOrders[i].pip != 0) {
                _positionData = accumulateLimitOrderToPositionData(
                    _positionManagerInterface,
                    _reduceLimitOrders[i],
                    _positionData,
                    _reduceLimitOrders[i].entryPrice
                );
            }
        }
        positionData = _positionData;
    }

    function cancelAllPendingLimitOrder(
        IPositionManager _positionManagerInterface,
        PositionLimitOrder.Data[] memory _limitOrder,
        PositionLimitOrder.Data[] memory _reduceOrder
    ) external returns (uint256 totalMargin) {
        // cancel limit order increase one by one
        for (uint256 i = 0; i < _limitOrder.length; i++) {
            (bool isFilled, , , ) = _positionManagerInterface
                .getPendingOrderDetail(
                    _limitOrder[i].pip,
                    _limitOrder[i].orderId
                );
            if (!isFilled) {
                (
                    uint256 refundQuantity,
                    uint256 partialFilledQuantity
                ) = _positionManagerInterface.cancelLimitOrder(
                        _limitOrder[i].pip,
                        _limitOrder[i].orderId
                    );
                // calculate refund margin based on filled and unfilled quantity
                uint256 refundMargin = PositionMath
                    .calculateRefundMarginCancelOrder(
                        _limitOrder[i].margin.abs(),
                        refundQuantity,
                        partialFilledQuantity
                    );
                totalMargin += refundMargin;
                if (_limitOrder[i].isBuy == 1) {
                    _limitOrder[i].margin -= refundMargin.fromU256ToI128();
                } else {
                    _limitOrder[i].margin += refundMargin.fromU256ToI128();
                }
            }
        }
        for (uint256 i = 0; i < _reduceOrder.length; i++) {
            (bool isFilled, , , ) = _positionManagerInterface
                .getPendingOrderDetail(
                    _reduceOrder[i].pip,
                    _reduceOrder[i].orderId
                );
            if (!isFilled) {
                _positionManagerInterface.cancelLimitOrder(
                    _reduceOrder[i].pip,
                    _reduceOrder[i].orderId
                );
            }
        }
        return totalMargin;
    }

    function getListOrderPending(
        address _pmAddress,
        address _trader,
        PositionLimitOrder.Data[] memory _limitOrders,
        PositionLimitOrder.Data[] memory _reduceLimitOrders
    ) external view returns (PositionHouseStorage.LimitOrderPending[] memory) {
        IPositionManager _positionManagerInterface = IPositionManager(
            _pmAddress
        );
        if (_limitOrders.length + _reduceLimitOrders.length > 0) {
            PositionHouseStorage.LimitOrderPending[]
                memory listPendingOrders = new PositionHouseStorage.LimitOrderPending[](
                    _limitOrders.length + _reduceLimitOrders.length + 1
                );
            uint256 index = 0;
            for (uint256 i = 0; i < _limitOrders.length; i++) {
                (
                    bool isFilled,
                    bool isBuy,
                    uint256 quantity,
                    uint256 partialFilled,
                    ,
                    ,
                    bytes32 sourceChainRequestKey
                ) = _positionManagerInterface.getPendingOrderDetailFull(
                        _limitOrders[i].pip,
                        _limitOrders[i].orderId
                    );
                if (!isFilled) {
                    listPendingOrders[index] = PositionHouseStorage
                        .LimitOrderPending({
                            isBuy: isBuy,
                            quantity: quantity,
                            partialFilled: partialFilled,
                            pip: _limitOrders[i].pip,
                            leverage: _limitOrders[i].leverage,
                            blockNumber: uint64(_limitOrders[i].blockNumber),
                            isReduce: 0,
                            orderIdx: i,
                            orderId: _limitOrders[i].orderId,
                            sourceChainRequestKey: sourceChainRequestKey
                        });
                    index++;
                }
            }
            for (uint256 i = 0; i < _reduceLimitOrders.length; i++) {
                (
                    bool isFilled,
                    bool isBuy,
                    uint256 quantity,
                    uint256 partialFilled,
                    ,
                    ,
                    bytes32 sourceChainRequestKey
                ) = _positionManagerInterface.getPendingOrderDetailFull(
                        _reduceLimitOrders[i].pip,
                        _reduceLimitOrders[i].orderId
                    );
                if (!isFilled) {
                    listPendingOrders[index] = PositionHouseStorage
                        .LimitOrderPending({
                            isBuy: isBuy,
                            quantity: quantity,
                            partialFilled: partialFilled,
                            pip: _reduceLimitOrders[i].pip,
                            leverage: _reduceLimitOrders[i].leverage,
                            blockNumber: uint64(
                                _reduceLimitOrders[i].blockNumber
                            ),
                            isReduce: 1,
                            orderIdx: i,
                            orderId: _reduceLimitOrders[i].orderId,
                            sourceChainRequestKey: sourceChainRequestKey
                        });
                    index++;
                }
            }
            for (uint256 i = 0; i < listPendingOrders.length; i++) {
                if (listPendingOrders[i].quantity != 0) {
                    return listPendingOrders;
                }
            }
        }
        PositionHouseStorage.LimitOrderPending[] memory blankListPendingOrders;
        return blankListPendingOrders;
    }

    function getPositionNotionalAndUnrealizedPnl(
        address _pmAddress,
        address _trader,
        PositionHouseStorage.PnlCalcOption _pnlCalcOption,
        Position.Data memory _position
    ) external view returns (uint256 positionNotional, int256 unrealizedPnl) {
        IPositionManager positionManager = IPositionManager(_pmAddress);
        uint256 openNotional = _position.openNotional;
        uint256 baseBasisPoint = positionManager.getBaseBasisPoint();
        if (_pnlCalcOption == PositionHouseStorage.PnlCalcOption.SPOT_PRICE) {
            positionNotional = PositionMath.calculateNotional(
                positionManager.getPrice(),
                _position.quantity.abs(),
                baseBasisPoint
            );
        } else if (_pnlCalcOption == PositionHouseStorage.PnlCalcOption.TWAP) {
            // TODO recheck this interval time
            uint256 _intervalTime = 90;
            positionNotional = PositionMath.calculateNotional(
                positionManager.getTwapPrice(_intervalTime),
                _position.quantity.abs(),
                baseBasisPoint
            );
        } else {
            positionNotional = PositionMath.calculateNotional(
                positionManager.getUnderlyingPrice(),
                _position.quantity.abs(),
                baseBasisPoint
            );
        }
        unrealizedPnl = PositionMath.calculatePnl(
            _position.quantity,
            _position.openNotional,
            positionNotional
        );
    }

    // used to benefit memory pointer
    // used only in `checkPendingOrderSideAndQuantity` memory
    // please don't move me to other places
    struct CheckSideAndQuantityParam {
        PositionLimitOrder.Data[] limitOrders;
        PositionLimitOrder.Data[] reduceLimitOrders;
        Position.Side side;
        uint256 orderQuantity;
        int256 positionQuantity;
    }

    enum ReturnCheckOrderSideAndQuantity {
        PASS,
        MUST_SAME_SIDE,
        MUST_SMALLER_QUANTITY
    }

    function checkPendingOrderSideAndQuantity(
        IPositionManager _positionManagerInterface,
        CheckSideAndQuantityParam memory _checkParam
    )
        external
        view
        returns (ReturnCheckOrderSideAndQuantity, uint256 closableQuantity)
    {
        // Get order in both increase and reduce limit order array
        bool newOrderIsBuy = _checkParam.side == Position.Side.LONG;
        bool positionIsBuy = _checkParam.positionQuantity > 0;
        uint256 totalPendingQuantity;
        bool pendingOrderIsBuy;
        // loop to check array increase limit orders
        (
            totalPendingQuantity,
            pendingOrderIsBuy
        ) = _getTotalPendingQuantityFromLimitOrders(
            _positionManagerInterface,
            _checkParam.limitOrders
        );
        // if there are pending limit increase order
        if (totalPendingQuantity != 0) {
            // if new order is same side as pending order return true
            if (newOrderIsBuy == pendingOrderIsBuy) {
                return (ReturnCheckOrderSideAndQuantity.PASS, 0);
            } else {
                return (ReturnCheckOrderSideAndQuantity.MUST_SAME_SIDE, 0);
            }
        }
        // if there are not pending limit increase order, for loop check array limit reduce
        (
            totalPendingQuantity,
            pendingOrderIsBuy
        ) = _getTotalPendingQuantityFromLimitOrders(
            _positionManagerInterface,
            _checkParam.reduceLimitOrders
        );
        // @NOTICE closableQuantity calculated by position quantity minus total quantity of pending limit close orders, means a reduce only order
        closableQuantity =
            _checkParam.positionQuantity.abs() -
            totalPendingQuantity;
        // if there are pending limit reduce order
        if (totalPendingQuantity != 0) {
            uint256 totalReverseQuantity = totalPendingQuantity +
                _checkParam.orderQuantity;
            // if total quantity of reverse order is smaller than current position
            // and new order is same side as pending order, return true
            if (
                newOrderIsBuy == pendingOrderIsBuy &&
                totalReverseQuantity <= _checkParam.positionQuantity.abs()
            ) {
                return (ReturnCheckOrderSideAndQuantity.PASS, 0);
            } else if (newOrderIsBuy != pendingOrderIsBuy) {
                return (ReturnCheckOrderSideAndQuantity.MUST_SAME_SIDE, 0);
            } else {
                // return remaining
                return (
                    ReturnCheckOrderSideAndQuantity.MUST_SMALLER_QUANTITY,
                    closableQuantity
                );
            }
        }
        // if user don't have position, return true
        if (_checkParam.positionQuantity == 0)
            return (ReturnCheckOrderSideAndQuantity.PASS, 0);
        // if user don't have pending order but new order is reverse, order quantity > position quantity, return false
        if (
            newOrderIsBuy != positionIsBuy &&
            _checkParam.orderQuantity > _checkParam.positionQuantity.abs()
        ) {
            return (
                ReturnCheckOrderSideAndQuantity.MUST_SMALLER_QUANTITY,
                closableQuantity
            );
        }
        return (ReturnCheckOrderSideAndQuantity.PASS, 0);
    }

    // used to benefit memory pointer
    // used only in `getClaimAmount` memory
    // please don't move me to other places
    struct ClaimAbleState {
        int256 amount;
        uint64 baseBasicPoint;
        uint64 basisPoint;
        uint256 totalReduceOrderFilledAmount;
        int256 accMargin;
        // fee of close limit order
        uint256 accFee;
    }

    function getClaimAmount(
        address _pmAddress,
        int256 _manualMargin,
        Position.LiquidatedData memory _positionLiquidatedData,
        Position.Data memory _positionDataWithoutLimit,
        PositionLimitOrder.Data[] memory _limitOrders,
        PositionLimitOrder.Data[] memory _reduceLimitOrders,
        int128 _positionLatestCumulativePremiumFraction,
        int128 _latestCumulativePremiumFraction
    ) external view returns (int256 totalClaimableAmount) {
//        ClaimAbleState memory state;
//        IPositionManager _positionManagerInterface = IPositionManager(
//            _pmAddress
//        );
//        // avoid multiple calls
//        (state.baseBasicPoint, state.basisPoint) = _positionManagerInterface
//            .getBasisPointFactors();
//        // position data with increase only
//        Position.Data memory _pDataIncr = _positionDataWithoutLimit;
//        for (uint256 i; i < _limitOrders.length; i++) {
//            if (_limitOrders[i].pip == 0 && _limitOrders[i].orderId == 0) {
//                // skip
//                continue;
//            }
//            _pDataIncr = accumulateLimitOrderToPositionData(
//                _pmAddress,
//                _limitOrders[i],
//                _pDataIncr,
//                _limitOrders[i].entryPrice
//            );
//        }
//        // TODO check this accMargin carefully
//        state.accMargin = _pDataIncr.margin;
//        if (_pDataIncr.quantity == 0) {
//            return 0;
//        }
//        // copy openNotional and quantity
//        Position.Data memory _cpIncrPosition;
//        _cpIncrPosition.openNotional = _pDataIncr.openNotional;
//        _cpIncrPosition.quantity = _pDataIncr.quantity;
//        for (uint256 j; j < _reduceLimitOrders.length; j++) {
//            // check is the reduce limit orders are filled
//            if (_reduceLimitOrders[j].pip != 0) {
//                int256 _filledAmount = _getPartialFilledAmount(
//                    _positionManagerInterface,
//                    _reduceLimitOrders[j].pip,
//                    _reduceLimitOrders[j].orderId
//                );
//                _accumulatePnLInReduceLimitOrder(
//                    _positionManagerInterface,
//                    state,
//                    _cpIncrPosition,
//                    _filledAmount,
//                    _reduceLimitOrders[j]
//                );
//            }
//        }
//        if (_pDataIncr.lastUpdatedCumulativePremiumFraction == 0) {
//            _pDataIncr
//                .lastUpdatedCumulativePremiumFraction = _positionLatestCumulativePremiumFraction;
//        }
//        (, , int256 fundingPayment) = PositionMath
//            .calcRemainMarginWithFundingPayment(
//                _pDataIncr,
//                state.accMargin,
//                _latestCumulativePremiumFraction
//            );
//        state.amount +=
//            state.accMargin.absInt() +
//            fundingPayment +
//            _manualMargin -
//            _positionLiquidatedData.margin.absInt() -
//            int256(state.accFee);
//        return state.amount < 0 ? int256(0) : state.amount;
        return 0;
    }

    function getClaimAmountWhenLiquidated(
        address _pmAddress,
        int256 _manualMargin,
        Position.LiquidatedData memory _positionLiquidatedData,
        Position.Data memory _positionDataWithoutLimit,
        PositionLimitOrder.Data[] memory _limitOrders,
        PositionLimitOrder.Data[] memory _reduceLimitOrders,
        int128 _positionLatestCumulativePremiumFraction,
        int128 _latestCumulativePremiumFraction
    ) external view returns (int256 totalClaimableAmount) {
        ClaimAbleState memory state;
        IPositionManager _positionManagerInterface = IPositionManager(
            _pmAddress
        );
        (state.baseBasicPoint, state.basisPoint) = _positionManagerInterface
            .getBasisPointFactors();
        Position.Data memory _pDataIncr = _positionDataWithoutLimit;
        for (uint256 i; i < _limitOrders.length; i++) {
            if (_limitOrders[i].pip == 0 && _limitOrders[i].orderId == 0) {
                // skip
                continue;
            }
            _pDataIncr = accumulateLimitOrderToPositionData(
                _pmAddress,
                _limitOrders[i],
                _pDataIncr,
                _limitOrders[i].entryPrice
            );
        }
        if (_pDataIncr.quantity == 0) {
            return 0;
        }
        int256 totalReduceQuantity;
        for (uint256 j; j < _reduceLimitOrders.length; j++) {
            if (_reduceLimitOrders[j].pip != 0) {
                int256 _filledAmount = _getPartialFilledAmount(
                    _positionManagerInterface,
                    _reduceLimitOrders[j].pip,
                    _reduceLimitOrders[j].orderId
                );
                totalReduceQuantity += _filledAmount;
                _accumulateClosedPnlAndMargin(
                    state,
                    _pDataIncr.quantity,
                    _reduceLimitOrders[j].pip,
                    _filledAmount,
                    _reduceLimitOrders[j].entryPrice,
                    _reduceLimitOrders[j].leverage
                );
            }
        }
        if (_pDataIncr.lastUpdatedCumulativePremiumFraction == 0) {
            _pDataIncr
                .lastUpdatedCumulativePremiumFraction = _positionLatestCumulativePremiumFraction;
        }
        (, , int256 fundingPayment) = PositionMath
            .calcRemainMarginWithFundingPayment(
                _pDataIncr,
                state.accMargin,
                _latestCumulativePremiumFraction
            );
        {
            int256 totalClaimableIncreaseAmount = (_pDataIncr.margin.absInt() +
                _manualMargin +
                fundingPayment -
                _positionLiquidatedData.margin.absInt());
            state.amount +=
                (totalClaimableIncreaseAmount * totalReduceQuantity.absInt()) /
                _pDataIncr.quantity.absInt();
        }
        return state.amount < 0 ? int256(0) : state.amount;
    }

    function _accumulateClosedPnlAndMargin(
        ClaimAbleState memory _state,
        int256 _positionQuantity,
        uint128 _pip,
        int256 _filledAmount,
        uint256 _entryPrice,
        uint16 _leverage
    ) internal view {
        // closedNotional can be negative to calculate pnl in both Long/Short formula
        uint256 closedNotional = PositionMath.calculateNotional(
            _pip.toNotional(_state.baseBasicPoint, _state.basisPoint),
            _filledAmount.abs(),
            _state.baseBasicPoint
        );
        // already checked if _positionData.openNotional == 0, then used _positionDataWithoutLimit before
        uint256 openNotional = PositionMath.calculateNotional(
            _entryPrice,
            _filledAmount.abs(),
            _state.baseBasicPoint
        );
        _state.amount += PositionMath.calculatePnl(
            _positionQuantity,
            openNotional,
            closedNotional
        );
    }

    function increasePosition(
        address _pmAddress,
        Position.Side _side,
        int256 _quantity,
        uint16 _leverage,
        address _trader,
        Position.Data memory _positionData,
        Position.Data memory _positionDataWithoutLimit,
        int128 _latestCumulativePremiumFraction,
        int256 _initialMargin
    ) external returns (PositionHouseStorage.PositionResp memory positionResp) {
        (
            positionResp.exchangedPositionSize,
            positionResp.exchangedQuoteAssetAmount,
            positionResp.entryPrice,
            positionResp.fee
        ) = openMarketOrder(_trader, _pmAddress, _quantity.abs(), _side);
        if (positionResp.exchangedPositionSize != 0) {
            int256 _newSize = _positionDataWithoutLimit.quantity +
                positionResp.exchangedPositionSize;
            int256 increasedMargin;
            if (_initialMargin != 0) {
                increasedMargin = _initialMargin;
            } else {
                int256 marginBasedOnNotional = int256(
                    positionResp.exchangedQuoteAssetAmount / _leverage
                );
                increasedMargin = _quantity > 0
                    ? marginBasedOnNotional
                    : -marginBasedOnNotional;
            }
            positionResp.marginToVault = int256(
                positionResp.exchangedQuoteAssetAmount / _leverage
            );
            positionResp.position = Position.Data(
                _newSize,
                // handle margin
                PositionMath.handleDepositMargin(
                    increasedMargin,
                    _positionData,
                    _positionDataWithoutLimit,
                    _latestCumulativePremiumFraction
                ),
                // handle absolute margin
                PositionMath.handleMarginInIncrease(
                    positionResp.exchangedQuoteAssetAmount / _leverage,
                    _positionData,
                    _positionDataWithoutLimit,
                    _latestCumulativePremiumFraction
                ),
                PositionMath.handleNotionalInIncrease(
                    positionResp.exchangedQuoteAssetAmount,
                    _positionData,
                    _positionDataWithoutLimit
                ),
                _latestCumulativePremiumFraction,
                PositionMath.blockNumber(),
                _leverage,
                1
            );
        }
    }

    function openReversePosition(
        address _pmAddress,
        Position.Side _side,
        int256 _quantity,
        uint16 _leverage,
        address _trader,
        Position.Data memory _positionData,
        Position.Data memory _positionDataWithoutLimit,
        int128 _latestCumulativePremiumFraction,
        int256 _manualMargin,
        int256 _initialMargin
    ) external returns (PositionHouseStorage.PositionResp memory positionResp) {
        IPositionManager _positionManagerInterface = IPositionManager(
            _pmAddress
        );
        (
            positionResp.exchangedPositionSize,
            positionResp.exchangedQuoteAssetAmount,
            positionResp.entryPrice,

        ) = openMarketOrder(_trader, _pmAddress, _quantity.abs(), _side);
        {
            positionResp.fee = _positionManagerInterface.calcTakerFee(
                positionResp.exchangedQuoteAssetAmount,
                false
            );
        }
        {
            uint256 reduceMarginRequirement = (_positionData.margin.abs() *
                _quantity.abs()) / _positionData.quantity.abs();
            positionResp.realizedPnl = PositionMath.calculatePnlWhenClose(
                _positionData.quantity,
                positionResp.exchangedPositionSize,
                _positionData.openNotional,
                positionResp.exchangedQuoteAssetAmount
            );

            positionResp.exchangedQuoteAssetAmount =
                (_positionData.openNotional * _quantity.abs()) /
                _positionData.quantity.abs();
            // NOTICE margin to vault can be negative
            positionResp.marginToVault = -(int256(reduceMarginRequirement) +
                positionResp.realizedPnl -
                int256(positionResp.fee));
        }
        int256 reduceMarginWithoutManual;
        {
            int256 marginWithoutManual = PositionMath
                .calculateMarginWithoutManual(
                    _positionData.quantity,
                    _positionData.margin,
                    _manualMargin
                );
            reduceMarginWithoutManual =
                (marginWithoutManual * _quantity) /
                _positionData.quantity;
        }
        uint256 reduceAbsoluteMarginRequirement = (_positionData
            .absoluteMargin * _quantity.abs()) / _positionData.quantity.abs();
        {
            // get positionData.margin without manualMargin
            _positionData.margin = PositionMath.calculateMarginWithoutManual(
                _positionData.quantity,
                _positionData.margin,
                _manualMargin
            );
            positionResp.position = Position.Data(
                _positionDataWithoutLimit.quantity + _quantity,
                // handle margin
                PositionMath.handleDepositMargin(
                    reduceMarginWithoutManual,
                    _positionData,
                    _positionDataWithoutLimit,
                    _latestCumulativePremiumFraction
                ),
                // handle absolute margin
                PositionMath.handleMarginInOpenReverse(
                    reduceAbsoluteMarginRequirement,
                    _positionData,
                    _positionDataWithoutLimit,
                    _latestCumulativePremiumFraction
                ),
                PositionMath.handleNotionalInOpenReverse(
                    positionResp.exchangedQuoteAssetAmount,
                    _positionData,
                    _positionDataWithoutLimit
                ),
                _latestCumulativePremiumFraction,
                PositionMath.blockNumber(),
                _leverage,
                1
            );
        }
        return positionResp;
    }

    function closePosition(
        address _pmAddress,
        address _trader,
        Position.Data memory _positionData
    ) external returns (PositionHouseStorage.PositionResp memory positionResp) {
        uint256 marketOrderQuantity = _positionData.quantity.abs();

        (
            positionResp.exchangedPositionSize,
            positionResp.exchangedQuoteAssetAmount,
            positionResp.entryPrice,

        ) = openMarketOrder(
            _trader,
            _pmAddress,
            marketOrderQuantity,
            _positionData.quantity > 0
                ? Position.Side.SHORT
                : Position.Side.LONG
        );
        positionResp.fee = IPositionManager(_pmAddress).calcTakerFee(
            positionResp.exchangedQuoteAssetAmount,
            false
        );
        positionResp.realizedPnl = PositionMath.calculatePnlWhenClose(
            _positionData.quantity,
            positionResp.exchangedPositionSize,
            _positionData.openNotional,
            positionResp.exchangedQuoteAssetAmount
        );
    }

    function openMarketOrder(
        address trader,
        address _pmAddress,
        uint256 _quantity,
        Position.Side _side
    )
        public
        returns (
            int256 exchangedQuantity,
            uint256 openNotional,
            uint256 entryPrice,
            uint256 fee
        )
    {
        IPositionManager _positionManagerInterface = IPositionManager(
            _pmAddress
        );

        uint256 exchangedSize;
        (
            exchangedSize,
            openNotional,
            entryPrice,
            fee
        ) = _positionManagerInterface.openMarketPosition(
            trader,
            _quantity,
            _side == Position.Side.LONG
        );
        require(exchangedSize == _quantity, Errors.VL_NOT_ENOUGH_LIQUIDITY);
        exchangedQuantity = _side == Position.Side.LONG
            ? int256(exchangedSize)
            : -int256(exchangedSize);
    }

    function deposit(
        IPositionManager _positionManagerInterface,
        address _trader,
        uint256 _amount,
        uint256 _fee
    ) external {
        _positionManagerInterface.deposit(_trader, _amount, _fee);
    }

    function withdraw(
        IPositionManager _positionManagerInterface,
        address _trader,
        uint256 _amount
    ) external {
        _positionManagerInterface.withdraw(_trader, _amount);
    }

    function _getPartialFilledAmount(
        IPositionManager _positionManagerInterface,
        uint128 _pip,
        uint64 _orderId
    ) internal view returns (int256 _filledAmount) {
        (
            bool isFilled,
            bool isBuy,
            uint256 size,
            uint256 partialFilled
        ) = _positionManagerInterface.getPendingOrderDetail(_pip, _orderId);
        _filledAmount = int256(
            !isFilled && partialFilled < size ? partialFilled : size
        );
        _filledAmount = isBuy ? _filledAmount : (-_filledAmount);
    }

    function _accumulatePnLInReduceLimitOrder(
        IPositionManager _positionManagerInterface,
        ClaimAbleState memory _state,
        Position.Data memory _cpIncrPosition,
        int256 _filledAmount,
        PositionLimitOrder.Data memory _limitOrderData
    ) internal view {
        // closedNotional can be negative to calculate pnl in both Long/Short formula
        uint256 closedNotional = PositionMath.calculateNotional(
            _limitOrderData.pip.toNotional(
                _state.baseBasicPoint,
                _state.basisPoint
            ),
            _filledAmount.abs(),
            _state.baseBasicPoint
        );
        _state.accFee += _positionManagerInterface.calcMakerFee(
            closedNotional,
            false
        );
        // already checked if _positionData.openNotional == 0, then used _positionDataWithoutLimit before
        uint256 openNotional = PositionMath.calculateNotional(
            _limitOrderData.entryPrice,
            _filledAmount.abs(),
            _state.baseBasicPoint
        );
        _state.amount += PositionMath.calculatePnl(
            _cpIncrPosition.quantity,
            openNotional,
            closedNotional
        );
        _state.totalReduceOrderFilledAmount += _filledAmount.abs();

        // now position should be reduced
        // should never overflow?
        _cpIncrPosition.quantity = _cpIncrPosition.quantity.subAmount(
            _filledAmount.abs()
        );
        // avoid overflow due to absolute error
        if (openNotional >= _cpIncrPosition.openNotional) {
            _cpIncrPosition.openNotional = 0;
        } else {
            _cpIncrPosition.openNotional -= openNotional;
        }
    }

    /// @dev get total pending order quantity from pending limit orders
    function _getTotalPendingQuantityFromLimitOrders(
        IPositionManager _positionManagerInterface,
        PositionLimitOrder.Data[] memory _limitOrders
    ) internal view returns (uint256 totalPendingQuantity, bool _isBuy) {
        for (uint256 i = 0; i < _limitOrders.length; i++) {
            (
                bool isFilled,
                bool isBuy,
                uint256 quantity,
                uint256 partialFilled
            ) = _positionManagerInterface.getPendingOrderDetail(
                    _limitOrders[i].pip,
                    _limitOrders[i].orderId
                );
            // calculate total quantity of the pending order only (!isFilled)
            // partialFilled == quantity means the order is filled
            if (!isFilled && quantity > partialFilled) {
                totalPendingQuantity += (quantity - partialFilled);
            }
            if (quantity != 0) {
                _isBuy = isBuy;
            }
        }
    }

    struct OrderData {
        uint256 orderEntryPrice;
        uint256 orderNotional;
        uint256 orderAbsoluteMargin;
        int256 orderMargin;
        int256 orderQuantity;
        int256 filledQuantity;
    }

    /// @dev Accumulate limit order to Position Data
    /// @param _pmAddress Position Manager address
    /// @param _limitOrder can be reduce or increase limit order
    /// @param _positionData the position data to accumulate
    /// @param _entryPrice if a reduce limit order, _entryPrice will != 0
    function accumulateLimitOrderToPositionData(
        address _pmAddress,
        PositionLimitOrder.Data memory _limitOrder,
        Position.Data memory _positionData,
        uint256 _entryPrice
    ) internal view returns (Position.Data memory) {
        OrderData memory orderData;
        IPositionManager _positionManagerInterface = IPositionManager(
            _pmAddress
        );
        (uint64 _baseBasicPoint, uint64 _basisPoint) = _positionManagerInterface
            .getBasisPointFactors();
        (
            orderData.filledQuantity,
            orderData.orderQuantity
        ) = _getLimitOrderQuantity(_positionManagerInterface, _limitOrder);
        if (orderData.orderQuantity == 0) {
            return _positionData;
        }
        // if _entryPrice != 0, must calculate notional by _entryPrice (for reduce limit order)
        // if _entryPrice == 0, calculate notional by order pip (current price)
        // NOTE: _entryPrice must divide _baseBasicPoint to get the "raw entry price"
        orderData.orderEntryPrice = _entryPrice == 0
            ? _limitOrder.pip.toNotional(_baseBasicPoint, _basisPoint)
            : _entryPrice;
        orderData.orderNotional = PositionMath.calculateNotional(
            orderData.orderEntryPrice,
            orderData.filledQuantity.abs(),
            _baseBasicPoint
        );
        {
            if (_entryPrice == 0) {
                orderData.orderMargin =
                    (_limitOrder.margin * orderData.filledQuantity) /
                    orderData.orderQuantity;
                orderData.orderAbsoluteMargin =
                    orderData.orderNotional /
                    _limitOrder.leverage;
            } else {
                // NOTICE: this is reduce order, so orderMargin is opposite of positionMargin
                orderData.orderMargin =
                    (-_positionData.margin * int256(orderData.orderNotional)) /
                    int256(_positionData.openNotional);
                orderData.orderAbsoluteMargin =
                    (_positionData.absoluteMargin * orderData.orderNotional) /
                    _positionData.openNotional;
            }
        }
        _positionData = _positionData.accumulateLimitOrder(
            orderData.filledQuantity,
            orderData.orderMargin,
            orderData.orderNotional,
            orderData.orderAbsoluteMargin
        );
        _positionData.leverage = CommonMath.maxU16(
            _positionData.leverage,
            _limitOrder.leverage
        );
        return _positionData;
    }

    function _getLimitOrderQuantity(
        IPositionManager _positionManagerInterface,
        PositionLimitOrder.Data memory _limitOrder
    ) private view returns (int256 _filledQuantity, int256 _orderQuantity) {
        (
            bool isFilled,
            bool isBuy,
            uint256 quantity,
            uint256 partialFilled
        ) = _positionManagerInterface.getPendingOrderDetail(
                _limitOrder.pip,
                _limitOrder.orderId
            );

        // if order is fulfilled
        if (isFilled) {
            _filledQuantity = isBuy ? int256(quantity) : -int256(quantity);
        } else if (!isFilled && partialFilled != 0) {
            // partial filled
            _filledQuantity = isBuy
                ? int256(partialFilled)
                : -int256(partialFilled);
        }
        _orderQuantity = isBuy ? int256(quantity) : -int256(quantity);
    }
}
