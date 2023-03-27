// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.0;

library Uint256Math {
    function fromU256ToI128(uint256 _input) internal pure returns (int128) {
        return int128(uint128(_input));
    }
}
