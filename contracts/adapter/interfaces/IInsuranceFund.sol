// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

interface IInsuranceFund {
    function deposit(
        address positionManager,
        address trader,
        uint256 amount,
        uint256 fee
    ) external;

    function withdraw(
        address positionManager,
        address trader,
        uint256 amount
    ) external;

    function buyBackAndBurn(address token, uint256 amount) external;

    function transferFeeFromTrader(
        address token,
        address trader,
        uint256 amountFee
    ) external;

    function reduceBonus(
        address _positionManager,
        address _trader,
        uint256 _reduceAmount
    ) external;

    function validateOrderBusdBonusAmount(
        address _positionManager,
        address _trader,
        uint256 _initialMargin,
        uint256 _leverage,
        uint256 _busdBonusAmount
    ) external;

    function validateAddMarginBusdBonusAmount(
        address _positionManager,
        address _trader,
        uint256 _busdBonusAmount
    ) external;

    function calculateWithdrawBusdBonusAmount(
        address _positionManager,
        address _trader,
        uint256 _totalWithdrawAmount,
        uint256 _busdBonusBalances
    ) external returns (uint256);

    function getRemainingBusdBonusAccepted(
        address _positionManager,
        address _trader
    ) external view returns (uint256);

    function getBusdBonusBalances(address _pmAddress, address _trader)
        external
        view
        returns (uint256);
}
