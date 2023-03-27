// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "./Position.sol";
import "../../adapter/interfaces/IPositionManager.sol";

library PositionLimitOrder {
    struct Data {
        uint128 pip;
        uint64 orderId;
        uint16 leverage;
        uint8 isBuy;
        uint32 blockNumber;
        uint128 entryPrice;
        int128 margin;
    }
}
