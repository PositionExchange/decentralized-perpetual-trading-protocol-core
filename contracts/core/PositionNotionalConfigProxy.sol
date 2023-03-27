// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract PositionNotionalConfigProxy is Initializable {
    bytes32 constant BTC_BUSD = "BTC_BUSD";
    bytes32 constant BNB_BUSD = "BNB_BUSD";
    bytes32 constant ETH_BUSD = "ETH_BUSD";
    bytes32 constant SOL_BUSD = "SOL_BUSD";

    function getMaxNotional(bytes32 key, uint16 leverage)
        external
        view
        returns (uint256)
    {
        if (key == BTC_BUSD) {
            //BTC_BUSD hash
            if (leverage == 1) {
                return 500_000_000;
            } else if (leverage == 2) {
                return 300_000_000;
            } else if (leverage == 3) {
                return 200_000_000;
            } else if (leverage == 4) {
                return 100_000_000;
            } else if (leverage >= 5 && leverage <= 9) {
                return 50_000_000;
            } else if (leverage >= 10 && leverage <= 14) {
                return 20_000_000;
            } else if (leverage >= 15 && leverage <= 24) {
                return 10_000_000;
            } else if (leverage >= 25 && leverage <= 99) {
                return 1_000_000;
            } else if (leverage >= 100 && leverage <= 124) {
                return 250_000;
            } else return 50_000;
        } else if (key == BNB_BUSD) {
            //BNB_BUSD hash
            if (leverage == 1) {
                return 5_000_000;
            } else if (leverage >= 2 && leverage <= 4) {
                return 1_000_000;
            } else if (leverage >= 5 && leverage <= 7) {
                return 250_000;
            } else if (leverage >= 8 && leverage <= 9) {
                return 100_000;
            } else if (leverage >= 10 && leverage <= 19) {
                return 25_000;
            } else {
                return 5_000;
            }
        } else if (key == ETH_BUSD) {
            if (leverage == 1) {
                return 300_000_000;
            } else if (leverage == 2) {
                return 150_000_000;
            } else if (leverage == 3) {
                return 80_000_000;
            } else if (leverage == 4) {
                return 40_000_000;
            } else if (leverage == 5) {
                return 20_000_000;
            } else if (leverage >= 6 && leverage <= 10) {
                return 10_000_000;
            } else if (leverage >= 11 && leverage <= 20) {
                return 5_000_000;
            } else if (leverage >= 21 && leverage <= 25) {
                return 1_000_000;
            } else if (leverage >= 26 && leverage <= 49) {
                return 100_000;
            } else {
                return 50_000;
            }
        } else if (key == SOL_BUSD) {
            if (leverage == 1) {
                return 8_000_000;
            } else if (leverage == 2) {
                return 5_000_000;
            } else if (leverage >= 3 && leverage <= 4) {
                return 2_000_000;
            } else if (leverage >= 5 && leverage <= 9) {
                return 1_000_000;
            } else {
                return 500_000;
            }
        } else {
            if (leverage == 1) {
                return 5_000_000;
            } else if (leverage >= 2 && leverage <= 4) {
                return 1_000_000;
            } else if (leverage >= 5 && leverage <= 7) {
                return 250_000;
            } else if (leverage >= 8 && leverage <= 9) {
                return 100_000;
            } else if (leverage >= 10 && leverage <= 19) {
                return 25_000;
            } else {
                return 5_000;
            }
        }
    }
}
