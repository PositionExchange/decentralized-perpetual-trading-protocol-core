// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

import "../gateway/TesterGateway.sol";

contract UserGatewayTest is TesterGateway {
    function openMarketPositionTest(
        IPositionManager _positionManagerInterface,
        Position.Side _side,
        uint256 _quantity,
        uint16 _leverage,
        uint256 _depositAmount
    ) public {
        address _trader = msg.sender;
        HouseBaseParam.OpenMarketOrderParams memory param;
        {
            param = HouseBaseParam.OpenMarketOrderParams({
                positionManager: _positionManagerInterface,
                side: _side,
                quantity: _quantity,
                leverage: _leverage,
                trader: _trader,
                initialMargin: _depositAmount,
                busdBonusAmount: 0
            });
        }
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount
        ) = positionHouseInterface.openMarketPosition(param);
        _handleMarginToInsuranceFund(
            _positionManagerInterface,
            _trader,
            _depositAmount,
            0,
            withdrawAmount
        );
    }

    function openLimitOrderTest(
        IPositionManager _positionManagerInterface,
        Position.Side _side,
        uint256 _uQuantity,
        uint128 _pip,
        uint16 _leverage,
        uint256 _depositAmount
    ) public {
        address _trader = msg.sender;
        HouseBaseParam.OpenLimitOrderParams memory param;
        {
            param = HouseBaseParam.OpenLimitOrderParams({
                positionManager: _positionManagerInterface,
                side: _side,
                quantity: _uQuantity,
                pip: _pip,
                leverage: _leverage,
                trader: _trader,
                initialMargin: _depositAmount,
                busdBonusAmount: 0
            });
        }
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount
        ) = positionHouseInterface.openLimitOrder(param);
        _handleMarginToInsuranceFund(
            _positionManagerInterface,
            _trader,
            _depositAmount,
            0,
            withdrawAmount
        );
    }
}
