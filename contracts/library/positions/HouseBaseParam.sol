// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "./Position.sol";
import "../../adapter/interfaces/IPositionManager.sol";

library HouseBaseParam {
    /**
     * @param _positionManager IPositionManager address
     * @param _side Side of position LONG or SHORT
     * @param _quantity quantity of size after mul with leverage
     * @param _leverage leverage of position
     * @param _trader trader who opened the order
     * @param _initialMargin total amount of money that trader deposited when open order
     */
    struct OpenMarketOrderParams {
        IPositionManager positionManager;
        Position.Side side;
        uint256 quantity;
        uint16 leverage;
        address trader;
        uint256 initialMargin;
        uint256 busdBonusAmount;
    }

    /**
     * @param _positionManager IPositionManager address
     * @param _side Side of position LONG or SHORT
     * @param _quantity quantity of size after mul with leverage
     * @param _pip limit pip of the order
     * @param _leverage leverage of position
     * @param _trader trader who opened the order
     * @param _initialMargin total amount of money that trader deposited when open order
     */
    struct OpenLimitOrderParams {
        IPositionManager positionManager;
        Position.Side side;
        uint256 quantity;
        uint128 pip;
        uint16 leverage;
        address trader;
        uint256 initialMargin;
        uint256 busdBonusAmount;
    }
}
