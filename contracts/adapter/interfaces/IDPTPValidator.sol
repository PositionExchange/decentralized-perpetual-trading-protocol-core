// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

interface IDPTPValidator {
    function validateChainIDAndAddedMargin(
        address _trader,
        address _pmAddress,
        uint256 _chainID,
        uint256 _addedMargin
    ) external;

    function updateTraderData(
        address _trader,
        address _pmAddress
    ) external;

}
