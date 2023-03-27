// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

import "../../library/positions/Position.sol";
import "../../library/positions/PositionLimitOrder.sol";
import "../../library/positions/HouseBaseParam.sol";
import "../../library/types/PositionHouseStorage.sol";

interface IValidatorCore {
    function openMarketOrder(
        IPositionManager _positionManagerInterface,
        Position.Side _side,
        uint256 _quantity,
        uint16 _leverage,
        uint256 _initialMargin,
        uint256 _busdBonusAmount,
        address _trader
    ) external;

    function openLimitOrder(
        IPositionManager _positionManagerInterface,
        Position.Side _side,
        uint256 _uQuantity,
        uint128 _pip,
        uint16 _leverage,
        uint256 _initialMargin,
        uint256 _busdBonusAmount,
        address _trader
    ) external;

    function cancelLimitOrder(
        IPositionManager _positionManagerInterface,
        uint64 _orderIdx,
        uint8 _isReduce,
        address _trader
    ) external;

    function addMargin(
        IPositionManager _positionManagerInterface,
        uint256 _amount,
        uint256 _busdBonusAmount,
        address _trader
    ) external;

    function removeMargin(
        IPositionManager _positionManagerInterface,
        uint256 _amount,
        address _trader
    ) external;

    function closeMarketPosition(
        IPositionManager _positionManagerInterface,
        uint256 _quantity,
        address _trader
    ) external;

    function instantlyClosePosition(
        IPositionManager _positionManagerInterface,
        uint256 _quantity,
        address _trader
    ) external;

    function closeLimitPosition(
        IPositionManager _positionManagerInterface,
        uint128 _pip,
        uint256 _quantity,
        address _trader
    ) external;

    function claimFund(
        IPositionManager _positionManagerInterface,
        address _trader
    ) external;

    function triggerTPSL(address _pmAddress, address _trader) external;

    function setTPSL(
        address _pmAddress,
        uint128 _higherPip,
        uint128 _lowerPip,
        PositionStrategyOrderStorage.SetTPSLOption _option,
        address _trader
    ) external;

    function unsetTPAndSL(address _pmAddress, address _trader) external;

    function unsetTPOrSL(
        address _pmAddress,
        bool _isHigherPrice,
        address _trader
    ) external;
}
