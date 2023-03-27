// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "../core/PositionManager.sol";
import "../adapter/InsuranceFundAdapter.sol";
import "../adapter/AccessControllerAdapter.sol";

contract PositionManagerTest is PositionManager {
    function getUnderlyingPriceInPip() public view override returns (uint256) {
        return getCurrentPip();
    }
}
