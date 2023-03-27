// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

import "./interfaces/IAccessController.sol";

library AccessControllerAdapter {
    function isGatewayOrCoreContract(
        IAccessController _accessControllerInterface,
        address _caller
    ) external returns (bool) {
        return _accessControllerInterface.isGatewayOrCoreContract(_caller);
    }
}
