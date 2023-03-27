// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "../../library/positions/PositionLimitOrder.sol";
import "../../library/helpers/Quantity.sol";
import "../../library/helpers/Int256Math.sol";
import "../../library/types/PositionHouseStorage.sol";
import {Errors} from "../../library/helpers/Errors.sol";

abstract contract Base {
    function getDebtPosition(address _pmAddress, address _trader)
        public
        view
        virtual
        returns (Position.LiquidatedData memory);

    function getPositionWithManualMargin(address _pmAddress, address _trader)
        public
        view
        virtual
        returns (Position.Data memory);

    function getPosition(address _pmAddress, address _trader)
        public
        view
        virtual
        returns (Position.Data memory);

    function getAddedMargin(address _positionManager, address _trader)
        public
        view
        virtual
        returns (int256);

    function getLatestCumulativePremiumFraction(address _pmAddress)
        public
        view
        virtual
        returns (int128);

    //    function getManualMargin(address _pmAddress, address _trader)
    //        public
    //        view
    //        virtual
    //        returns (int256);

    function _requireOrderSideAndQuantity(
        address _pmAddress,
        address _trader,
        Position.Side _side,
        uint256 _quantity,
        int256 _positionQuantity
    ) internal view virtual returns (bool, uint256);

    enum CancelAllOption {
        ONLY_INCREASE,
        ONLY_REDUCE,
        BOTH
    }

    function _internalCancelMultiPendingOrder(
        IPositionManager _positionManager,
        address _trader,
        CancelAllOption _option
    ) internal virtual returns (uint256);

    function _getClaimAmount(address _pmAddress, address _trader)
        internal
        view
        virtual
        returns (int256);

    function _updatePositionMap(
        address _pmAddress,
        address _trader,
        Position.Data memory newData
    ) internal virtual;

    function _updateManualMargin(
        address _pmAddress,
        address _trader,
        int256 _changedAmount
    ) internal virtual;

    function clearPosition(address _pmAddress, address _trader)
        internal
        virtual;

    function _checkMaxNotional(
        uint256 _notional,
        address _pmAddress,
        uint16 _leverage
    ) internal virtual returns (bool);

    function _getPositionMap(address _pmAddress, address _trader)
        internal
        view
        virtual
        returns (Position.Data memory);
}
