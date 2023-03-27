// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {Errors} from "../library/helpers/Errors.sol";

contract AccessController is
    PausableUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    mapping(address => bool) public validatedContract;

    function initialize() public initializer {
        __ReentrancyGuard_init();
        __Ownable_init();
        __Pausable_init();
    }

    function isGatewayOrCoreContract(address _contractAddress)
        public
        view
        returns (bool)
    {
        return validatedContract[_contractAddress];
    }

    function updateValidatedContractStatus(
        address _contractAddress,
        bool _isValidated
    ) public onlyOwner {
        validatedContract[_contractAddress] = _isValidated;
    }
}
