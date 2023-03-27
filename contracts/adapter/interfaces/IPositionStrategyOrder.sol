// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

import "../../library/types/PositionStrategyOrderStorage.sol";

interface IPositionStrategyOrder {
    function triggerTPSL(address _pmAddress, address _trader)
        external
        returns (
            uint256,
            uint256,
            uint256
        );

    function setTPSL(
        address _pmAddress,
        address _trader,
        uint128 _higherPip,
        uint128 _lowerPip,
        PositionStrategyOrderStorage.SetTPSLOption _option,
        uint256 _sourceChainId
    ) external;

    function unsetTPAndSL(address _pmAddress, address _trader) external;

    function unsetTPOrSL(
        address _pmAddress,
        address _trader,
        bool _isHigherPrice
    ) external;

    function unsetTPAndSLWhenClosePosition(address _pmAddress, address _trader)
        external;

    function getTPSLDetail(address _pmAddress, address _trader)
        external
        view
        returns (uint120, uint120);

    function hasTPOrSL(address _pmAddress, address _trader)
        external
        view
        returns (bool);
}
