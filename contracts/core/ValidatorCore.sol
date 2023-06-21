// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "../adapter/interfaces/IPositionHouse.sol";
import "../adapter/interfaces/IPositionStrategyOrder.sol";
import "../adapter/interfaces/IPositionManager.sol";
import "../adapter/interfaces/IPositionHouseConfigurationProxy.sol";
import "../adapter/interfaces/IInsuranceFund.sol";
import "../library/types/PositionStrategyOrderStorage.sol";
import "../library/types/PositionHouseStorage.sol";
import "../library/positions/Position.sol";
import "../library/positions/HouseBaseParam.sol";
import {Int256Math} from "../library/helpers/Int256Math.sol";
import {Errors} from "../library/helpers/Errors.sol";

contract ValidatorCore is
    PausableUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using Int256Math for int256;
    using Quantity for int256;
    using Position for Position.Data;

    IPositionHouse public positionHouseInterface;
    IPositionStrategyOrder public positionStrategyOrderInterface;
    IPositionHouseConfigurationProxy
        public positionHouseConfigurationProxyInterface;
    IInsuranceFund public insuranceFundInterface;

    function initialize(
        address _positionHouseAddress,
        address _positionStrategyOrderAddress,
        address _positionHouseConfigurationProxyAddress,
        address _insuranceFundAddress
    ) public initializer {
        __ReentrancyGuard_init();
        __Ownable_init();
        __Pausable_init();

        require(
            _positionHouseAddress != address(0) &&
                _positionStrategyOrderAddress != address(0) &&
                _positionHouseConfigurationProxyAddress != address(0) &&
                _insuranceFundAddress != address(0),
            Errors.VL_INVALID_INPUT
        );

        positionHouseInterface = IPositionHouse(_positionHouseAddress);
        positionStrategyOrderInterface = IPositionStrategyOrder(
            _positionStrategyOrderAddress
        );
        positionHouseConfigurationProxyInterface = IPositionHouseConfigurationProxy(
            _positionHouseConfigurationProxyAddress
        );
        insuranceFundInterface = IInsuranceFund(_insuranceFundAddress);
    }

    function openMarketOrder(
        IPositionManager _positionManagerInterface,
        Position.Side _side,
        uint256 _quantity,
        uint16 _leverage,
        uint256 _initialMargin,
        uint256 _busdBonusAmount,
        address _trader
    ) public {
        HouseBaseParam.OpenMarketOrderParams memory param;
        {
            param = HouseBaseParam.OpenMarketOrderParams({
                positionManager: _positionManagerInterface,
                side: _side,
                quantity: _quantity,
                leverage: _leverage,
                trader: _trader,
                initialMargin: _initialMargin,
                busdBonusAmount: _busdBonusAmount
            });
        }
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount,

        ) = positionHouseInterface.openMarketPosition(param);
        revert(Errors.VL_PASS_ALL);
    }

    function openLimitOrder(
        IPositionManager _positionManagerInterface,
        Position.Side _side,
        uint256 _uQuantity,
        uint128 _pip,
        uint16 _leverage,
        uint256 _initialMargin,
        uint256 _busdBonusAmount,
        address _trader
    ) public {
        HouseBaseParam.OpenLimitOrderParams memory param;
        {
            param = HouseBaseParam.OpenLimitOrderParams({
                positionManager: _positionManagerInterface,
                side: _side,
                quantity: _uQuantity,
                pip: _pip,
                leverage: _leverage,
                trader: _trader,
                initialMargin: _initialMargin,
                busdBonusAmount: _busdBonusAmount,
                sourceChainRequestKey: 0
            });
        }
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount,

        ) = positionHouseInterface.openLimitOrder(param);
        revert(Errors.VL_PASS_ALL);
    }

    function cancelLimitOrder(
        IPositionManager _positionManagerInterface,
        uint64 _orderIdx,
        uint8 _isReduce,
        address _trader
    ) public {
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount,
            ,
            ,

        ) = positionHouseInterface.cancelLimitOrder(
                _positionManagerInterface,
                _orderIdx,
                _isReduce,
                _trader
            );
        revert(Errors.VL_PASS_ALL);
    }

    function addMargin(
        IPositionManager _positionManagerInterface,
        uint256 _amount,
        uint256 _busdBonusAmount,
        address _trader
    ) external {
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount
        ) = positionHouseInterface.addMargin(
                _positionManagerInterface,
                _amount,
                _busdBonusAmount,
                _trader
            );
        revert(Errors.VL_PASS_ALL);
    }

    function removeMargin(
        IPositionManager _positionManagerInterface,
        uint256 _amount,
        address _trader
    ) external {
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount
        ) = positionHouseInterface.removeMargin(
                _positionManagerInterface,
                _amount,
                _trader
            );
        revert(Errors.VL_PASS_ALL);
    }

    function closeMarketPosition(
        IPositionManager _positionManagerInterface,
        uint256 _quantity,
        address _trader
    ) public {
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount
        ) = positionHouseInterface.closePosition(
                _positionManagerInterface,
                _quantity,
                _trader
            );
        revert(Errors.VL_PASS_ALL);
    }

    function instantlyClosePosition(
        IPositionManager _positionManagerInterface,
        uint256 _quantity,
        address _trader
    ) public {
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount
        ) = positionHouseInterface.closePosition(
                _positionManagerInterface,
                _quantity,
                _trader
            );
        revert(Errors.VL_PASS_ALL);
    }

    function closeLimitPosition(
        IPositionManager _positionManagerInterface,
        uint128 _pip,
        uint256 _quantity,
        address _trader
    ) public {
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount,

        ) = positionHouseInterface                                                                                                      .closeLimitPosition(
                _positionManagerInterface,
                _pip,
                _quantity,
                _trader,
                0
            );
        revert(Errors.VL_PASS_ALL);
    }

    function claimFund(
        IPositionManager _positionManagerInterface,
        address _trader
    ) public {
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount
        ) = positionHouseInterface.claimFund(
                _positionManagerInterface,
                _trader
            );
        revert(Errors.VL_PASS_ALL);
    }

    function triggerTPSL(address _pmAddress, address _trader) external {
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount,

        ) = positionStrategyOrderInterface.triggerTPSL(_pmAddress, _trader);
        revert(Errors.VL_PASS_ALL);
    }

    function setTPSL(
        address _pmAddress,
        uint128 _higherPip,
        uint128 _lowerPip,
        PositionStrategyOrderStorage.SetTPSLOption _option,
        address _trader
    ) external {
        positionStrategyOrderInterface.setTPSL(
            _pmAddress,
            _trader,
            _higherPip,
            _lowerPip,
            _option,
            0
        );
        revert(Errors.VL_PASS_ALL);
    }

    function unsetTPAndSL(address _pmAddress, address _trader) external {
        positionStrategyOrderInterface.unsetTPAndSL(_pmAddress, _trader);
        revert(Errors.VL_PASS_ALL);
    }

    function unsetTPOrSL(
        address _pmAddress,
        bool _isHigherPrice,
        address _trader
    ) external {
        positionStrategyOrderInterface.unsetTPOrSL(
            _pmAddress,
            _trader,
            _isHigherPrice
        );
        revert(Errors.VL_PASS_ALL);
    }

    function test() external {}

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}
