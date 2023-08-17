// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

interface IOrderTracker {
    function accumulateMarketOrder(
        bool _isBuy,
        uint128 _size,
        uint128 _orderNotional
    ) external;

    function accumulateFulfilledOrder(
        uint128 _pip,
        uint128 _size,
        uint256 _orderNotional
    ) external;

    function accumulatePartialFilledOrder(
        uint128 _pip,
        uint128 _size,
        uint256 _orderNotional
    ) external;

    function claimPendingFund(uint256 chainId) external;
}
