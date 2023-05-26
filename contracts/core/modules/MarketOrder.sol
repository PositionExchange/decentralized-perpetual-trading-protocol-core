// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import {PositionManagerAdapter} from "../../adapter/PositionManagerAdapter.sol";
import {PositionMath} from "../../library/positions/PositionMath.sol";
import "../../library/positions/PositionLimitOrder.sol";
import "../../library/helpers/Quantity.sol";
import "../../library/helpers/Int256Math.sol";
import "../../library/types/PositionHouseStorage.sol";
import {Errors} from "../../library/helpers/Errors.sol";
import "./Base.sol";

abstract contract MarketOrder is PositionHouseStorage, Base {
    using PositionLimitOrder for mapping(address => mapping(address => PositionLimitOrder.Data[]));
    using Quantity for int256;
    using Int256Math for int256;
    using Quantity for int128;

    using Position for Position.Data;
    using Position for Position.LiquidatedData;
    using PositionManagerAdapter for MarketOrder;

    event OpenMarket(
        address trader,
        int256 quantity,
        uint256 openNotional,
        uint16 leverage,
        uint256 entryPrice,
        address positionManager,
        uint256 margin
    );
    event MarketPositionOpened(address trader, address positionManager);

    struct InternalOpenMarketPositionParam {
        IPositionManager positionManager;
        Position.Side side;
        uint256 quantity;
        uint16 leverage;
        Position.Data positionData;
        address trader;
        int256 initialMargin;
    }

    function _internalOpenMarketPosition(
        InternalOpenMarketPositionParam memory _param,
        bool isReducePosition
    )
        internal
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        address _pmAddress = address(_param.positionManager);
        {
            // @notice
            // check side and quantity of new order compared to old position
            // if close quantity > remainClosableQuantity then cancel all pending order close
            // to ensure this is a reduce only order
            (
                bool isReduceOrder,
                uint256 remainClosableQuantity
            ) = _requireOrderSideAndQuantity(
                    _pmAddress,
                    _param.trader,
                    _param.side,
                    _param.quantity,
                    _param.positionData.quantity
                );
            if (isReduceOrder) {
                if (_param.positionData.quantity.abs() < _param.quantity) {
                    _param.quantity = _param.positionData.quantity.abs();
                }
                if (remainClosableQuantity < _param.quantity) {
                    _internalCancelMultiPendingOrder(
                        _param.positionManager,
                        _param.trader,
                        CancelAllOption.ONLY_REDUCE
                    );
                }
            }
        }
        int256 iQuantity = _param.side == Position.Side.LONG
            ? int256(_param.quantity)
            : -int256(_param.quantity);
        //leverage must be greater than old position and in range of allowed leverage
        require(
            _param.leverage >= _param.positionData.leverage &&
                _param.leverage <= _param.positionManager.getLeverage() &&
                _param.leverage > 0,
            Errors.VL_INVALID_LEVERAGE
        );
        PositionResp memory pResp;
        // check if old position quantity is the same side with the new one
        uint256 orderMargin;
        if (
            _param.positionData.quantity == 0 ||
            _param.positionData.side() == _param.side
        ) {
            InternalOpenMarketPositionParam memory param_ = _param;
            pResp = increasePosition(
                _pmAddress,
                param_.side,
                iQuantity,
                param_.leverage,
                param_.trader,
                param_.positionData,
                param_.initialMargin
            );
            require(
                _checkMaxNotional(
                    pResp.exchangedQuoteAssetAmount,
                    _pmAddress,
                    param_.leverage
                ),
                Errors.VL_EXCEED_MAX_NOTIONAL
            );
            orderMargin = param_.initialMargin != 0
                ? param_.initialMargin.abs()
                : pResp.marginToVault.abs();
        } else {
            InternalOpenMarketPositionParam memory param_ = _param;
            pResp = openReversePosition(
                param_.positionManager,
                param_.side,
                iQuantity,
                param_.leverage,
                param_.trader,
                param_.positionData,
                param_.initialMargin
            );
        }
        uint256 entryPrice = pResp.entryPrice;
        // update position state
        InternalOpenMarketPositionParam memory param_ = _param;
        _updatePositionMap(_pmAddress, param_.trader, pResp.position, isReducePosition);
        {
            // Store to the queue and then execute later
            // !Note support multiple execute update positions
            // To determine which order should be emited
            // Currently only support 1 execute per pairmanager and trader, hence there is always only 1 queue event at a time
            pendingOpenMarketOrderQueues[_pmAddress][_param.trader] = OpenMarketEventQueue(
                pResp.exchangedPositionSize,
                pResp.exchangedQuoteAssetAmount,
                _param.leverage,
                pResp.entryPrice,
                orderMargin
            );
            emit OpenMarket(
                _param.trader,
                pResp.exchangedPositionSize,
                pResp.exchangedQuoteAssetAmount,
                _param.leverage,
                pResp.entryPrice,
                address(_param.positionManager),
                orderMargin
            );
        }
        if (pResp.marginToVault > 0) {
            return (pResp.marginToVault.abs(), pResp.fee, 0, entryPrice);
        } else {
            return (0, pResp.fee, pResp.marginToVault.abs(), entryPrice);
        }
    }
    
    function _affectOpenMarketEvent(address pm, address trader, bool shouldEmit) internal {
        if (shouldEmit) {
          // OpenMarketEventQueue memory pResp = pendingOpenMarketOrderQueues[pm][trader];
          emit MarketPositionOpened(trader, pm);
          // emit OpenMarket(
          //     trader,
          //     pResp.quantity,
          //     pResp.openNotional,
          //     pResp.leverage,
          //     pResp.entryPrice,
          //     pm,
          //     pResp.margin
          // );
        } 
        // Now delete the queue
        delete pendingOpenMarketOrderQueues[pm][trader];
    }

    function _internalCloseMarketPosition(
        address _pmAddress,
        address _trader,
        uint256 _quantity
    )
        internal
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        Position.Data
            memory _positionDataWithManualMargin = getPositionWithManualMargin(
                _pmAddress,
                _trader
            );
        {
            require(
                _positionDataWithManualMargin.quantity.abs() != 0,
                Errors.VL_INVALID_CLOSE_QUANTITY
            );
        }
        InternalOpenMarketPositionParam memory param;
        {
            param = InternalOpenMarketPositionParam({
                positionManager: IPositionManager(_pmAddress),
                side: _positionDataWithManualMargin.quantity > 0
                    ? Position.Side.SHORT
                    : Position.Side.LONG,
                quantity: _quantity,
                leverage: _positionDataWithManualMargin.leverage,
                positionData: _positionDataWithManualMargin,
                trader: _trader,
                initialMargin: 0
            });
        }
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount
            ,
        ) = _internalOpenMarketPosition(param, true);
        return (depositAmount, fee, withdrawAmount);
    }

    function increasePosition(
        address _pmAddress,
        Position.Side _side,
        int256 _quantity,
        uint16 _leverage,
        address _trader,
        // position data included manual margin
        Position.Data memory _positionData,
        int256 _initialMargin
    ) internal returns (PositionResp memory positionResp) {
        int256 manualAddedMargin = getAddedMargin(_pmAddress, _trader);
        // remove manual added margin from positionData.margin
        _positionData.margin = PositionMath.calculateMarginWithoutManual(
            _positionData.quantity,
            _positionData.margin,
            manualAddedMargin
        );
        Position.Data memory positionDataWithoutLimitOrder = _getPositionMap(
            _pmAddress,
            _trader
        );
        int128 latestCumulativePremiumFraction = getLatestCumulativePremiumFraction(
                _pmAddress
            );
        {
            positionResp = PositionManagerAdapter.increasePosition(
                _pmAddress,
                _side,
                _quantity,
                _leverage,
                _trader,
                _positionData,
                positionDataWithoutLimitOrder,
                latestCumulativePremiumFraction,
                _initialMargin
            );
        }
    }

    function openReversePosition(
        IPositionManager _positionManager,
        Position.Side _side,
        int256 _quantity,
        uint16 _leverage,
        address _trader,
        Position.Data memory _positionData,
        int256 _initialMargin
    ) internal returns (PositionResp memory positionResp) {
        address _pmAddress = address(_positionManager);
        if (_quantity.abs() < _positionData.quantity.abs()) {
            int256 _manualAddedMargin = getAddedMargin(_pmAddress, _trader);
            {
                positionResp = PositionManagerAdapter.openReversePosition(
                    _pmAddress,
                    _side,
                    _quantity,
                    _leverage,
                    _trader,
                    _positionData,
                    _getPositionMap(_pmAddress, _trader),
                    getLatestCumulativePremiumFraction(_pmAddress),
                    _manualAddedMargin,
                    _initialMargin
                );
                {
                    int256 changedMargin = (-_manualAddedMargin *
                        _quantity.absInt()) / _positionData.quantity.absInt();
                    _updateManualMargin(_pmAddress, _trader, changedMargin);
                }
                return positionResp;
            }
        }
        // if new position is larger then close old and open new
        PositionResp memory closePositionResp = _internalClosePosition(
            _positionManager,
            _trader,
            _positionData
        );
        positionResp = closePositionResp;
        return positionResp;
    }

    function _internalClosePosition(
        IPositionManager _positionManager,
        address _trader,
        Position.Data memory _positionData
    ) internal returns (PositionResp memory positionResp) {
        address _pmAddress = address(_positionManager);

        positionResp = PositionManagerAdapter.closePosition(
            _pmAddress,
            _trader,
            _positionData
        );

        positionResp.marginToVault = -positionResp
            .realizedPnl
            .add(_getClaimAmount(_pmAddress, _trader))
            .add(-int256(positionResp.fee))
            .kPositive();

        clearPosition(_pmAddress, _trader);
    }
}
