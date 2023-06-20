// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

interface IAccessController {
    function isGatewayOrCoreContract(
        address _contractAddress
    ) external view returns (bool);

    function updateValidatedContractStatus(
        address _contractAddress,
        bool _isValidated
    ) external;
}
