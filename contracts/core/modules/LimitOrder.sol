// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import {PositionManagerAdapter} from "../../adapter/PositionManagerAdapter.sol";
import {PositionMath} from "../../library/positions/PositionMath.sol";
import "../../library/positions/PositionLimitOrder.sol";
import "../../library/helpers/Quantity.sol";
import "../../library/helpers/Int256Math.sol";
import "../../library/helpers/Uint256Math.sol";
import "../../library/types/PositionHouseStorage.sol";
import {Errors} from "../../library/helpers/Errors.sol";
import "./Base.sol";

abstract contract   LimitOrderManager is PositionHouseStorage {
    event OpenLimit(
        uint64 orderId,
        address trader,
        int256 quantity,
        uint16 leverage,
        uint128 pip,
        IPositionManager positionManager,
        uint256 margin
    );

    event CancelLimitOrder(
        address trader,
        address _positionManager,
        uint128 pip,
        uint64 orderId
    );

    using Quantity for int256;
    using Quantity for int128;
    using Int256Math for int256;
    using Uint256Math for uint256;


    function _internalCancelLimitOrder(
        IPositionManager _positionManager,
        uint64 _orderIdx,
        uint8 _isReduce,
        address _trader
    ) internal returns (uint256, uint256, uint128, uint8) {
        address _pmAddress = address(_positionManager);
        // declare a pointer to reduceLimitOrders or limitOrders
        PositionLimitOrder.Data[] storage orders = _getLimitOrderPointer(
            _pmAddress,
            _trader,
            _isReduce
        );
        require(_orderIdx < orders.length, Errors.VL_INVALID_ORDER);
        // save gas
        PositionLimitOrder.Data memory order = orders[_orderIdx];
        PositionLimitOrder.Data memory blankLimitOrderData;

        (
            uint256 refundQuantity,
            uint256 partialFilledQuantity
        ) = _positionManager.cancelLimitOrder(order.pip, order.orderId);
        if (partialFilledQuantity == 0) {
            orders[_orderIdx] = blankLimitOrderData;
        }

        // only increase order can withdraw fund from contract
        if (_isReduce == 0) {
            uint256 refundMargin = PositionMath
                .calculateRefundMarginCancelOrder(
                    order.margin.absFromI128(),
                    refundQuantity,
                    partialFilledQuantity
                );
            // refundNotional = refundMargin * order leverage
            uint256 refundFee = _positionManager.calcMakerFee(
                refundMargin * order.leverage,
                true
            );
            uint64 orderIdx_ = _orderIdx;
            if (partialFilledQuantity != 0) {
                orders[orderIdx_].margin = PositionMath
                    .calculateRemainMarginInLimitOrder(
                        order.isBuy == 1,
                        order.margin,
                        refundMargin.fromU256ToI128()
                    );
            }
            emit CancelLimitOrder(
                _trader,
                _pmAddress,
                order.pip,
                order.orderId
            );
            return (refundMargin + refundFee, partialFilledQuantity, order.pip, order.isBuy);
        }
        emit CancelLimitOrder(_trader, _pmAddress, order.pip, order.orderId);
        return (0, partialFilledQuantity, order.pip, order.isBuy);
    }

    // use this struct as param of function "_internalOpenLimitOrder"
    // to prevent stack too deep
    struct InternalOpenLimitOrderParam {
        IPositionManager positionManager;
        Position.Side side;
        uint256 uQuantity;
        uint128 pip;
        uint16 leverage;
        Position.Data positionData;
        address trader;
        int256 initialMargin;
        bool isReduceOrder;
        bytes32 sourceChainRequestKey;
    }

    function _internalOpenLimitOrder(InternalOpenLimitOrderParam memory _param)
        internal
        returns (
            uint256,
            uint256,
            uint256,
            LimitOverPricedFilled  memory
        )
    {
        PositionHouseStorage.OpenLimitResp memory openLimitResp;
        address pmAddress = address(_param.positionManager);

        (
            bool isReduceOrder,
            uint256 remainClosableQuantity
        ) = _requireOrderSideAndQuantity(
            pmAddress,
            _param.trader,
            _param.side,
            _param.uQuantity,
            _param.positionData.quantity
        );
        if (isReduceOrder && remainClosableQuantity < _param.uQuantity) {
            _param.uQuantity = remainClosableQuantity;
        }

        int256 quantity = _param.side == Position.Side.LONG
            ? int256(_param.uQuantity)
            : -int256(_param.uQuantity);
        {
            OpenLimitOrderParam memory openLimitOrderParam;
            {
                openLimitOrderParam = OpenLimitOrderParam({
                    positionManager: _param.positionManager,
                    trader: _param.trader,
                    pip: _param.pip,
                    rawQuantity: quantity,
                    leverage: _param.leverage,
                    positionData: _param.positionData,
                    initialMargin: PositionMath.getInitialMarginBasedOnSide(
                        quantity > 0,
                        _param.initialMargin
                    ),
                    isReduce: _param.isReduceOrder,
                    sourceChainRequestKey: _param.sourceChainRequestKey
                });
            }

            (
                openLimitResp.orderId,
                openLimitResp.sizeOut,
                openLimitResp.withdrawAmount,
                openLimitResp.limitOverPricedFilled
            ) = _openLimitOrder(openLimitOrderParam);
        }
        {
            if (openLimitResp.sizeOut <= _param.uQuantity) {
                PositionHouseStorage.GetNotionalAndFeeResp
                    memory getNotionalAndFeeResp;
                (
                    getNotionalAndFeeResp.notional,
                    getNotionalAndFeeResp.depositAmount,
                    getNotionalAndFeeResp.fee
                ) = _param.positionManager.getNotionalMarginAndFee(
                    _param.uQuantity,
                    _param.pip,
                    _param.leverage
                );
                int256 orderMargin;
                if (_param.initialMargin != 0) {
                    orderMargin =
                        (_param.initialMargin *
                            int256(_param.uQuantity - openLimitResp.sizeOut)) /
                        int256(_param.uQuantity);
                } else {
                    int256 absOrderMargin = int256(
                        (getNotionalAndFeeResp.depositAmount *
                            (_param.uQuantity - openLimitResp.sizeOut)) /
                            _param.uQuantity
                    );
                    orderMargin = quantity > 0
                        ? absOrderMargin
                        : -absOrderMargin;
                }
                PositionLimitOrder.Data memory _newOrder = PositionLimitOrder
                    .Data({
                        pip: _param.pip,
                        orderId: openLimitResp.orderId,
                        leverage: _param.leverage,
                        isBuy: _param.side == Position.Side.LONG ? 1 : 2,
                        blockNumber: uint32(block.number),
                        entryPrice: 0,
                        margin: int128(orderMargin)
                    });
                if (openLimitResp.orderId != 0) {
                    _storeLimitOrder(
                        _newOrder,
                        _param.positionManager,
                        _param.trader,
                        quantity
                    );
                }
                _setLimitOrderPremiumFraction(pmAddress, _param.trader);
                if (
                    _param.positionData.quantity == 0 ||
                    _param.positionData.quantity.isSameSide(quantity)
                ) {
                    {
                        require(
                            _checkMaxNotional(
                                getNotionalAndFeeResp.notional,
                                pmAddress,
                                _param.leverage
                            ),
                            Errors.VL_EXCEED_MAX_NOTIONAL
                        );
                    }
                    _internalEmitEventOpenLimit(
                        _param,
                        openLimitResp.orderId,
                        quantity,
                        getNotionalAndFeeResp.depositAmount
                    );

                    return (
                        getNotionalAndFeeResp.depositAmount,
                        getNotionalAndFeeResp.fee,
                        uint256(openLimitResp.withdrawAmount.kPositive()),
                        openLimitResp.limitOverPricedFilled
                    );
                }
            }
        }
        _internalEmitEventOpenLimit(_param, openLimitResp.orderId, quantity, 0);
        return (0, 0, uint256(openLimitResp.withdrawAmount.kPositive()),openLimitResp.limitOverPricedFilled);
    }

    function _internalEmitEventOpenLimit(
        InternalOpenLimitOrderParam memory _param,
        uint64 _orderId,
        int256 _quantity,
        uint256 _absoluteMargin
    ) internal {
        uint256 orderMargin = _param.initialMargin != 0
            ? _param.initialMargin.abs()
            : _absoluteMargin;
        emit OpenLimit(
            _orderId,
            _param.trader,
            _quantity,
            _param.leverage,
            _param.pip,
            _param.positionManager,
            orderMargin
        );
    }

    // check the new limit order is fully reduce, increase or both reduce and increase
    function _storeLimitOrder(
        PositionLimitOrder.Data memory _newOrder,
        IPositionManager _positionManager,
        address _trader,
        int256 _quantity
    ) internal {
        address _pmAddress = address(_positionManager);
        // new to fetch newest position data cause it might be changed before
        Position.Data memory oldPosition = getPosition(_pmAddress, _trader);
        if (
            oldPosition.quantity == 0 ||
            _quantity.isSameSide(oldPosition.quantity)
        ) {
            // limit order increasing position
            _pushLimit(_pmAddress, _trader, _newOrder);
        } else {
            // limit order reducing position
            uint256 baseBasisPoint = _positionManager.getBaseBasisPoint();
            _newOrder.entryPrice = uint128(
                PositionMath.calculateEntryPrice(
                    oldPosition.openNotional,
                    oldPosition.quantity.abs(),
                    baseBasisPoint
                )
            );
            _pushReduceLimit(_pmAddress, _trader, _newOrder);
        }
    }

    // use this struct as param of function "_openLimitOrder"
    // to prevent stack too deep
    struct OpenLimitOrderParam {
        IPositionManager positionManager;
        Position.Data positionData;
        address trader;
        int256 initialMargin;
        int256 rawQuantity;
        uint128 pip;
        uint16 leverage;
        bool isReduce;
        bytes32 sourceChainRequestKey;
    }

    function _openLimitOrder(OpenLimitOrderParam memory _param)
        private
        returns (
            uint64 orderId,
            uint256 sizeOut,
            int256 totalReturn,
            LimitOverPricedFilled memory limitOverPricedFilled
        )
    {
        {
            address _pmAddress = address(_param.positionManager);
            {
                require(
                    _param.leverage >= _param.positionData.leverage &&
                        _param.leverage <=
                        _param.positionManager.getLeverage() &&
                        _param.leverage > 0,
                    Errors.VL_INVALID_LEVERAGE
                );
            }
            uint256 openNotional;
            {
                uint128 _quantity = _param.rawQuantity.abs128();
                (orderId, sizeOut, openNotional) = _param
                    .positionManager
                    .openLimitPosition(
                        _param.trader,
                        _param.pip,
                        _quantity,
                        _param.rawQuantity > 0,
                        _param.isReduce,
                        _param.sourceChainRequestKey
                    );
            }
            if (sizeOut != 0) {
                limitOverPricedFilled.entryPrice = PositionMath.calculateEntryPrice(
                    openNotional,
                    sizeOut,
                    _param.positionManager.getBaseBasisPoint()
                );
                limitOverPricedFilled.quantity =  sizeOut;

                int256 intSizeOut = _param.rawQuantity > 0
                    ? int256(sizeOut)
                    : -int256(sizeOut);
                {
                    if (
                        !_param.rawQuantity.isSameSide(
                            _param.positionData.quantity
                        ) && _param.positionData.quantity != 0
                    ) {
                        (
                            uint256 reducedMargin,
                            int256 realizedPnl
                        ) = PositionMath.calcReturnWhenOpenReverse(
                                sizeOut,
                                openNotional,
                                _param.positionData
                            );
                        // total return when partial
                        uint256 closedFee = _param.positionManager.calcTakerFee(
                            openNotional,
                            false
                        );
                        totalReturn =
                            int256(reducedMargin) +
                            realizedPnl -
                            int256(closedFee);
                        // if new limit order is not same side with old position, sizeOut == _param.positionData.quantity
                        // => close all position and clear position, return sizeOut + 1 mean closed position
                        if (sizeOut == _param.positionData.quantity.abs()) {
                            totalReturn =
                                realizedPnl +
                                _getClaimAmount(_pmAddress, _param.trader) -
                                int256(closedFee);
                            clearPosition(_pmAddress, _param.trader);
                            // TODO refactor to a flag
                            // flag to compare if (openLimitResp.sizeOut <= _uQuantity)
                            // in this case, sizeOut is just only used to compare to open the limit order
                            return (orderId, sizeOut + 1, totalReturn, limitOverPricedFilled);
                        }
                    }
                }
                // case: open a limit order at the last price
                // the order must be partially executed
                // then update the current position
                {
                    // get filled initial margin based on filled quantity and raw quantity
                    int256 filledInitialMargin = (_param.initialMargin *
                        intSizeOut) / _param.rawQuantity;
                    _updatePositionAfterOpenLimit(
                        _param.positionData,
                        openNotional,
                        intSizeOut,
                        _param.leverage,
                        _pmAddress,
                        _param.trader,
                        _param.initialMargin != 0
                            ? filledInitialMargin.abs()
                            : (openNotional / _param.leverage)
                    );
                }
            }
        }
    }

    function _getLimitOrderPointer(
        address _pmAddress,
        address _trader,
        uint8 _isReduce
    ) internal view returns (PositionLimitOrder.Data[] storage) {
        return
            _isReduce == 1
                ? reduceLimitOrders[_pmAddress][_trader]
                : limitOrders[_pmAddress][_trader];
    }

    function getLimitOrders(address _pmAddress, address _trader)
        public
        view
        returns (PositionLimitOrder.Data[] memory)
    {
        return limitOrders[_pmAddress][_trader];
    }

    function getReduceLimitOrders(address _pmAddress, address _trader)
        public
        view
        returns (PositionLimitOrder.Data[] memory)
    {
        return reduceLimitOrders[_pmAddress][_trader];
    }

    function _updatePositionAfterOpenLimit(
        Position.Data memory _positionData,
        uint256 _openNotional,
        int256 _intSizeOut,
        uint16 _leverage,
        address _pmAddress,
        address _trader,
        uint256 _depositedMargin
    ) internal {
        {
            int256 manualAddedMargin = getAddedMargin(_pmAddress, _trader);
            // remove manual added margin from positionData.margin
            _positionData.margin = PositionMath.calculateMarginWithoutManual(
                _positionData.quantity,
                _positionData.margin,
                manualAddedMargin
            );
            // reduce storage manual margin when reverse
            if (_intSizeOut * _positionData.quantity < 0) {
                int256 changedMargin = -(manualAddedMargin *
                    _intSizeOut.absInt()) / _positionData.quantity.absInt();
                _updateManualMargin(_pmAddress, _trader, changedMargin);
            }
        }
        // only use position data without manual margin
        {
            Position.Data memory newData = PositionMath.handleMarketPart(
                _positionData,
                _getPositionMap(_pmAddress, _trader),
                _openNotional,
                _intSizeOut,
                _leverage,
                getLatestCumulativePremiumFraction(_pmAddress),
                _intSizeOut > 0
                    ? int256(_depositedMargin)
                    : -int256(_depositedMargin)
            );
            _updatePositionMap(_pmAddress, _trader, newData, false);
        }
    }

    function _pushLimit(
        address _pmAddress,
        address _trader,
        PositionLimitOrder.Data memory order
    ) internal {
        limitOrders[_pmAddress][_trader].push(order);
    }

    function _pushReduceLimit(
        address _pmAddress,
        address _trader,
        PositionLimitOrder.Data memory order
    ) internal {
        reduceLimitOrders[_pmAddress][_trader].push(order);
    }

    function _setLimitOrderPremiumFraction(address _pmAddress, address _trader)
        internal
    {
        limitOrderPremiumFraction[_pmAddress][
            _trader
        ] = getLatestCumulativePremiumFraction(_pmAddress);
    }

    function _emptyLimitOrders(address _pmAddress, address _trader) internal {
        if (getLimitOrders(_pmAddress, _trader).length > 0) {
            delete limitOrders[_pmAddress][_trader];
        }
    }

    function _emptyReduceLimitOrders(address _pmAddress, address _trader)
        internal
    {
        if (getReduceLimitOrders(_pmAddress, _trader).length > 0) {
            delete reduceLimitOrders[_pmAddress][_trader];
        }
    }

    function getLimitOrderPremiumFraction(address _pmAddress, address _trader)
        public
        view
        returns (int128)
    {
        return limitOrderPremiumFraction[_pmAddress][_trader];
    }

    function _needToClaimFund(
        address _pmAddress,
        address _trader,
        Position.Data memory _positionData
    ) internal view returns (bool needClaim, int256 claimableAmount) {
        claimableAmount = _getClaimAmount(_pmAddress, _trader);
        needClaim = claimableAmount != 0 && _positionData.quantity == 0;
    }
}
