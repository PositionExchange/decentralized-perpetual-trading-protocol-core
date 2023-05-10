// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

interface ICrossChainGateway {
    function executeIncreaseOrder(
        uint256 _sourceBcId,
        bytes32 _requestKey,
        uint256 _entryPrice,
        uint256 _quantity,
        bool _isLong
    ) external;

    function executeDecreaseOrder(
        uint256 _sourceBcId,
        bytes32 _requestKey,
        uint256 _withdrawAmount,
        uint256 _fee,
        uint256 _entryPrice,
        uint256 _quantity,
        bool _isLong
    ) external;
}
