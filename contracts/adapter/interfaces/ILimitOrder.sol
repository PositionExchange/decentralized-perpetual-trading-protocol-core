/**
 * @author Musket
 */
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

import "../../library/positions/HouseBaseParam.sol";
import "../../library/types/PositionHouseStorage.sol";

interface ILimitOrder {

    function openLimitOrder(
        HouseBaseParam.OpenLimitOrderParams memory param
    )
    external
    returns (
        uint256,
        uint256,
        uint256,
        PositionHouseStorage.LimitOverPricedFilled memory
    );

    function cancelLimitOrder(
        IPositionManager _positionManager,
        uint64 _orderIdx,
        uint8 _isReduce,
        address _trader
    ) external returns (uint256, uint256, uint256, uint256, uint128, uint8);

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
        uint256,
        PositionHouseStorage.LimitOverPricedFilled memory
    );

}
