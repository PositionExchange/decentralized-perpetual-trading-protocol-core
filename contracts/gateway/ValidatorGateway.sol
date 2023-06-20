// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
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
import "../adapter/interfaces/IValidatorCore.sol";

contract ValidatorGateway is
    PausableUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    IValidatorCore public validatorCore;

    function initialize(address _validatorCoreAddress) public initializer {
        require(_validatorCoreAddress != address(0), Errors.VL_INVALID_INPUT);

        __ReentrancyGuard_init();
        __Ownable_init();
        __Pausable_init();

        validatorCore = IValidatorCore(_validatorCoreAddress);
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
        try
            validatorCore.openMarketOrder(
                _positionManagerInterface,
                _side,
                _quantity,
                _leverage,
                _initialMargin,
                _busdBonusAmount,
                _trader
            )
        {} catch Error(string memory reason) {
            _validateRevertReason(reason);
        }
    }

    // @notice openMarketOrder without busdBonus
    function openMarketOrder(
        IPositionManager _positionManagerInterface,
        Position.Side _side,
        uint256 _quantity,
        uint16 _leverage,
        uint256 _initialMargin,
        address _trader
    ) public {
        try
            validatorCore.openMarketOrder(
                _positionManagerInterface,
                _side,
                _quantity,
                _leverage,
                _initialMargin,
                0,
                _trader
            )
        {} catch Error(string memory reason) {
            _validateRevertReason(reason);
        }
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
        try
            validatorCore.openLimitOrder(
                _positionManagerInterface,
                _side,
                _uQuantity,
                _pip,
                _leverage,
                _initialMargin,
                _busdBonusAmount,
                _trader
            )
        {} catch Error(string memory reason) {
            _validateRevertReason(reason);
        }
    }

    // @notice openLimitOrder without busdBonus
    function openLimitOrder(
        IPositionManager _positionManagerInterface,
        Position.Side _side,
        uint256 _uQuantity,
        uint128 _pip,
        uint16 _leverage,
        uint256 _initialMargin,
        address _trader
    ) public {
        try
            validatorCore.openLimitOrder(
                _positionManagerInterface,
                _side,
                _uQuantity,
                _pip,
                _leverage,
                _initialMargin,
                0,
                _trader
            )
        {} catch Error(string memory reason) {
            _validateRevertReason(reason);
        }
    }

    function cancelLimitOrder(
        IPositionManager _positionManagerInterface,
        uint64 _orderIdx,
        uint8 _isReduce,
        address _trader
    ) public {
        try
            validatorCore.cancelLimitOrder(
                _positionManagerInterface,
                _orderIdx,
                _isReduce,
                _trader
            )
        {} catch Error(string memory reason) {
            _validateRevertReason(reason);
        }
    }

    function addMargin(
        IPositionManager _positionManagerInterface,
        uint256 _amount,
        uint256 _busdBonusAmount,
        address _trader
    ) public {
        try
            validatorCore.addMargin(
                _positionManagerInterface,
                _amount,
                _busdBonusAmount,
                _trader
            )
        {} catch Error(string memory reason) {
            _validateRevertReason(reason);
        }
    }

    // @notice addMargin without busdBonus
    function addMargin(
        IPositionManager _positionManagerInterface,
        uint256 _amount,
        address _trader
    ) public {
        try
            validatorCore.addMargin(
                _positionManagerInterface,
                _amount,
                0,
                _trader
            )
        {} catch Error(string memory reason) {
            _validateRevertReason(reason);
        }
    }

    function removeMargin(
        IPositionManager _positionManagerInterface,
        uint256 _amount,
        address _trader
    ) public {
        try
            validatorCore.removeMargin(
                _positionManagerInterface,
                _amount,
                _trader
            )
        {} catch Error(string memory reason) {
            _validateRevertReason(reason);
        }
    }

    function closeMarketPosition(
        IPositionManager _positionManagerInterface,
        uint256 _quantity,
        address _trader
    ) public {
        try
            validatorCore.closeMarketPosition(
                _positionManagerInterface,
                _quantity,
                _trader
            )
        {} catch Error(string memory reason) {
            _validateRevertReason(reason);
        }
    }

    function instantlyClosePosition(
        IPositionManager _positionManagerInterface,
        uint256 _quantity,
        address _trader
    ) public {
        try
            validatorCore.closeMarketPosition(
                _positionManagerInterface,
                _quantity,
                _trader
            )
        {} catch Error(string memory reason) {
            _validateRevertReason(reason);
        }
    }

    function closeLimitPosition(
        IPositionManager _positionManagerInterface,
        uint128 _pip,
        uint256 _quantity,
        address _trader
    ) public {
        try
            validatorCore.closeLimitPosition(
                _positionManagerInterface,
                _pip,
                _quantity,
                _trader
            )
        {} catch Error(string memory reason) {
            _validateRevertReason(reason);
        }
    }

    function claimFund(
        IPositionManager _positionManagerInterface,
        address _trader
    ) public {
        try
            validatorCore.claimFund(_positionManagerInterface, _trader)
        {} catch Error(string memory reason) {
            _validateRevertReason(reason);
        }
    }

    function triggerTPSL(address _pmAddress, address _trader) public {
        try validatorCore.triggerTPSL(_pmAddress, _trader) {} catch Error(
            string memory reason
        ) {
            _validateRevertReason(reason);
        }
    }

    function setTPSL(
        address _pmAddress,
        uint128 _higherPip,
        uint128 _lowerPip,
        PositionStrategyOrderStorage.SetTPSLOption _option,
        address _trader
    ) public {
        try
            validatorCore.setTPSL(
                _pmAddress,
                _higherPip,
                _lowerPip,
                _option,
                _trader
            )
        {} catch Error(string memory reason) {
            _validateRevertReason(reason);
        }
    }

    function unsetTPAndSL(address _pmAddress, address _trader) public {
        try validatorCore.unsetTPAndSL(_pmAddress, _trader) {} catch Error(
            string memory reason
        ) {
            _validateRevertReason(reason);
        }
    }

    function unsetTPOrSL(
        address _pmAddress,
        bool _isHigherPrice,
        address _trader
    ) public {
        try
            validatorCore.unsetTPOrSL(_pmAddress, _isHigherPrice, _trader)
        {} catch Error(string memory reason) {
            _validateRevertReason(reason);
        }
    }

    function updateValidateCoreAddress(
        address _newValidatorCore
    ) external onlyOwner {
        validatorCore = IValidatorCore(_newValidatorCore);
    }

    function _validateRevertReason(string memory _reason) internal {
        if (keccak256(bytes(_reason)) != keccak256(bytes(Errors.VL_PASS_ALL))) {
            revert((_reason));
        }
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}
