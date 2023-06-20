// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

interface IDPTPValidator {
    function validateChainIDAndManualMargin(
        address _trader,
        address _pmAddress,
        uint256 _chainID,
        uint256 _amount
    ) external;

    function updateTraderData(address _trader, address _pmAddress) external;
}
