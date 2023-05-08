// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

interface ICrossChainGateway {
    function crossBlockchainCall(
        uint256 _destBcId,
        bytes memory _destData
    ) external;

    function crossBlockchainCall(
        uint256 _destBcId,
        address _destContract,
        bytes memory _destData
    ) external;
}
