// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "../helpers/Quantity.sol";
import "../../adapter/interfaces/IPositionManager.sol";

library Position {
    using Quantity for int256;
    enum Side {
        LONG,
        SHORT
    }
    struct Data {
        int256 quantity;
        int256 margin;
        uint256 absoluteMargin;
        uint256 openNotional;
        // Packed slot
        int128 lastUpdatedCumulativePremiumFraction;
        uint64 blockNumber;
        uint16 leverage;
        // this slot leaves 48 bit
        // use 8 bit for this dummy
        // set __dummy to 1 when clear position
        // to avoid reinitializing a new slot
        // when open a new position
        // saved ~20,000 gas
        uint8 __dummy;
    }

    struct LiquidatedData {
        int256 quantity;
        int256 margin;
        uint256 absoluteMargin;
        uint256 notional;
    }

    function updateDebt(
        Position.LiquidatedData storage _self,
        int256 _quantity,
        int256 _margin,
        uint256 _absoluteMargin,
        uint256 _notional
    ) internal {
        _self.quantity += _quantity;
        _self.margin += _margin;
        _self.absoluteMargin += _absoluteMargin;
        _self.notional += _notional;
    }

    /// Override new position data
    function update(
        Position.Data storage _self,
        Position.Data memory _newPosition
    ) internal {
        _self.quantity = _newPosition.quantity;
        _self.margin = _newPosition.margin;
        _self.absoluteMargin = _newPosition.absoluteMargin;
        _self.openNotional = _newPosition.openNotional;
        _self.lastUpdatedCumulativePremiumFraction = _newPosition
            .lastUpdatedCumulativePremiumFraction;
        _self.blockNumber = _newPosition.blockNumber;
        _self.leverage = _newPosition.leverage;
    }

    function updateMargin(
        Position.Data storage _self,
        int256 _newMargin
    ) internal {
        _self.margin = _newMargin;
    }

    function updatePartialLiquidate(
        Position.Data storage _self,
        Position.Data memory _newPosition
    ) internal {
        _self.quantity += _newPosition.quantity;
        _self.margin += _newPosition.margin;
        _self.absoluteMargin -= _newPosition.absoluteMargin;
        _self.openNotional -= _newPosition.openNotional;
        _self.lastUpdatedCumulativePremiumFraction += _newPosition
            .lastUpdatedCumulativePremiumFraction;
        _self.blockNumber += _newPosition.blockNumber;
        _self.leverage = _self.leverage;
    }

    function clearDebt(Position.LiquidatedData storage _self) internal {
        _self.quantity = 0;
        _self.margin = 0;
        _self.absoluteMargin = 0;
        _self.notional = 0;
    }

    function clear(Position.Data storage _self) internal {
        _self.quantity = 0;
        _self.margin = 0;
        _self.absoluteMargin = 0;
        _self.openNotional = 0;
        _self.lastUpdatedCumulativePremiumFraction = 0;
        _self.blockNumber = uint64(block.number);
        _self.leverage = 0;
        _self.__dummy = 1;
    }

    function side(
        Position.Data memory _self
    ) internal view returns (Position.Side) {
        return _self.quantity > 0 ? Position.Side.LONG : Position.Side.SHORT;
    }

    function getEntryPrice(
        Position.Data memory _self,
        address _addressPositionManager
    ) internal view returns (uint256) {
        IPositionManager _positionManager = IPositionManager(
            _addressPositionManager
        );
        return
            (_self.openNotional * _positionManager.getBaseBasisPoint()) /
            _self.quantity.abs();
    }

    function accumulateLimitOrder(
        Position.Data memory _self,
        int256 _quantity,
        int256 _orderMargin,
        uint256 _orderNotional,
        uint256 _orderAbsoluteMargin
    ) internal view returns (Position.Data memory) {
        // same side
        if (_self.quantity * _quantity > 0) {
            _self.absoluteMargin = _self.absoluteMargin + _orderAbsoluteMargin;
            _self.openNotional = _self.openNotional + _orderNotional;
        } else {
            _self.absoluteMargin = _self.absoluteMargin > _orderAbsoluteMargin
                ? _self.absoluteMargin - _orderAbsoluteMargin
                : _orderAbsoluteMargin - _self.absoluteMargin;
            _self.openNotional = _self.openNotional > _orderNotional
                ? _self.openNotional - _orderNotional
                : _orderNotional - _self.openNotional;
        }
        _self.quantity = _self.quantity + _quantity;
        _self.margin = _self.margin + _orderMargin;
        return _self;
    }
}
