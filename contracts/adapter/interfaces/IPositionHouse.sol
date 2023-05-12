// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

import "../../library/positions/Position.sol";
import "../../library/positions/PositionLimitOrder.sol";
import "../../library/positions/HouseBaseParam.sol";

interface IPositionHouse {
    function getPosition(address _pmAddress, address _trader)
        external
        view
        returns (Position.Data memory positionData);

    function getPositionWithManualMargin(
        address _pmAddress,
        address _trader,
        Position.Data memory _positionData
    ) external view returns (Position.Data memory positionData);

    function positionMap(address _pmAddress, address _trader)
        external
        view
        returns (Position.Data memory positionData);

    function getLimitOrders(address _pmAddress, address _trader)
        external
        view
        returns (PositionLimitOrder.Data[] memory);

    function getReduceLimitOrders(address _pmAddress, address _trader)
        external
        view
        returns (PositionLimitOrder.Data[] memory);

    //    function getManualMargin(address _pmAddress, address _trader)
    //        external
    //        view
    //        returns (int256);

    function getClaimableAmount(address _pmAddress, address _trader)
        external
        view
        returns (uint256);

    function getLatestCumulativePremiumFraction(address _pmAddress)
        external
        view
        returns (int128);

    function getLimitOrderPremiumFraction(address _pmAddress, address _trader)
        external
        view
        returns (int128);

    function getAddedMargin(address _positionManager, address _trader)
        external
        view
        returns (int256);

    function getDebtPosition(address _pmAddress, address _trader)
        external
        view
        returns (Position.LiquidatedData memory);

    function triggerClosePosition(
        IPositionManager _positionManager,
        address _trader
    )
        external
        returns (
            uint256,
            uint256,
            uint256
        );

    function openMarketPosition(
        HouseBaseParam.OpenMarketOrderParams memory param
    )
        external
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        );
    function executeStorePosition(
        address pmAddress,
        address trader
    ) external;

    function clearStorePendingPosition(
        address pmAddress,
        address trader
    ) external;

    function openLimitOrder(HouseBaseParam.OpenLimitOrderParams memory param)
        external
        returns (
            uint256,
            uint256,
            uint256
        );

    function closePosition(
        IPositionManager _positionManager,
        uint256 _quantity,
        address _trader
    )
        external
        returns (
            uint256,
            uint256,
            uint256
        );

    function instantlyClosePosition(
        IPositionManager _positionManager,
        uint256 _quantity,
        address _trader
    )
        external
        returns (
            uint256,
            uint256,
            uint256
        );

    function closeLimitPosition(
        IPositionManager _positionManager,
        uint128 _pip,
        uint256 _quantity,
        address _trader,
        bytes32 sourceChainRequestKey
    )
        external
        returns (
            uint256,
            uint256,
            uint256
        );

    function liquidate(
        IPositionManager _positionManager,
        address _trader,
        address _liquidator
    ) external;

    function cancelLimitOrder(
        IPositionManager _positionManager,
        uint64 _orderIdx,
        uint8 _isReduce,
        address _trader
    )
        external
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint128,
            uint8
        );

    function cancelAllReduceOrder(
        IPositionManager _positionManager,
        address _trader
    )
        external
        returns (
            uint256,
            uint256,
            uint256
        );

    function addMargin(
        IPositionManager _positionManager,
        uint256 _amount,
        uint256 _busdBonusAmount,
        address _trader
    )
        external
        returns (
            uint256,
            uint256,
            uint256
        );

    function removeMargin(
        IPositionManager _positionManager,
        uint256 _amount,
        address _trader
    )
        external
        returns (
            uint256,
            uint256,
            uint256
        );

    function clearTraderData(address _pmAddress, address _trader) external;

    function claimFund(IPositionManager _positionManager, address _trader)
        external
        returns (
            uint256,
            uint256,
            uint256
        );

    function payFunding(IPositionManager _positionManager) external;

    function updatePartialLiquidatedPosition(
        address _pmAddress,
        address _trader,
        int256 _liquidatedQuantity,
        int256 _liquidatedMargin,
        uint256 _liquidatedAbsoluteMargin,
        uint256 _liquidatedNotional,
        int256 _liquidatedManualMargin
    ) external;
}
