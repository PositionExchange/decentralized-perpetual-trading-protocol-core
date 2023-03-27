// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "../adapter/PositionHouseAdapter.sol";
import "../adapter/AccessControllerAdapter.sol";
import "../adapter/interfaces/IPositionHouse.sol";
import "../adapter/interfaces/IAccessController.sol";
import "../adapter/interfaces/IPositionManager.sol";
import "../library/types/PositionStrategyOrderStorage.sol";
import {Errors} from "../library/helpers/Errors.sol";

contract PositionStrategyOrder is
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable,
    PositionStrategyOrderStorage
{
    using Position for Position.Data;
    using PositionHouseAdapter for PositionStrategyOrder;

    event TPSLCreated(
        address pmAddress,
        address trader,
        uint128 higherPip,
        uint128 lowerPip,
        uint256 sourceChainId
    );
    event TPOrSlCanceled(address pmAddress, address trader, bool isHigherPrice);
    event TPAndSLCanceled(address pmAddress, address trader);
    event TPSLTriggered(
        address pmAddress,
        address trader,
        bool triggeredHigherPip
    );

    function initialize(
        IPositionHouse _positionHouse,
        IAccessController _accessControllerInterface
    ) public initializer {
        __ReentrancyGuard_init();
        __Ownable_init();
        positionHouse = _positionHouse;
        accessControllerInterface = _accessControllerInterface;
    }

    function triggerTPSL(address _pmAddress, address _trader)
        external
        nonReentrant
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        IPositionManager positionManager = IPositionManager(_pmAddress);
        uint128 currentPip = positionManager.getCurrentPip();
        TPSLCondition memory condition = TPSLMap[_pmAddress][_trader];
        require(
            reachTPSL(condition, currentPip),
            Errors.VL_MUST_REACH_CONDITION
        );
        bool triggeredHigherPip = (currentPip >= condition.higherPip &&
            condition.higherPip != 0)
            ? true
            : false;
        emit TPSLTriggered(_pmAddress, _trader, triggeredHigherPip);
        TPSLMap[_pmAddress][_trader].lowerPip = 0;
        TPSLMap[_pmAddress][_trader].higherPip = 0;
        return
            PositionHouseAdapter.triggerClosePosition(
                positionHouse,
                positionManager,
                _trader
            );
    }

    function setTPSL(
        address _pmAddress,
        address _trader,
        uint128 _higherPip,
        uint128 _lowerPip,
        SetTPSLOption _option,
        uint256 _sourceChainId
    ) external nonReentrant {
        IPositionManager _positionManager = IPositionManager(_pmAddress);
        uint128 currentPip = _positionManager.getCurrentPip();
        require(
            isValidInput(currentPip, _higherPip, _lowerPip, _option),
            Errors.VL_INVALID_CONDITION
        );

        require(
            PositionHouseAdapter.hasPosition(
                positionHouse,
                _pmAddress,
                _trader
            ),
            Errors.VL_MUST_HAVE_POSITION
        );

        if (_option == SetTPSLOption.ONLY_HIGHER) {
            TPSLMap[_pmAddress][_trader].higherPip = uint120(_higherPip);
        } else if (_option == SetTPSLOption.ONLY_LOWER) {
            TPSLMap[_pmAddress][_trader].lowerPip = uint120(_lowerPip);
        } else if (_option == SetTPSLOption.BOTH) {
            TPSLMap[_pmAddress][_trader].higherPip = uint120(_higherPip);
            TPSLMap[_pmAddress][_trader].lowerPip = uint120(_lowerPip);
        }
        TPSLMap[_pmAddress][_trader].__dummy = 1;
        emit TPSLCreated(
            _pmAddress,
            _trader,
            _higherPip,
            _lowerPip,
            _sourceChainId
        );
    }

    function unsetTPOrSL(
        address _pmAddress,
        address _trader,
        bool _isHigherPrice
    ) external nonReentrant {
        require(
            PositionHouseAdapter.hasPosition(
                positionHouse,
                _pmAddress,
                _trader
            ),
            Errors.VL_MUST_HAVE_POSITION
        );

        if (_isHigherPrice) {
            TPSLMap[_pmAddress][_trader].higherPip = 0;
        } else {
            TPSLMap[_pmAddress][_trader].lowerPip = 0;
        }
        emit TPOrSlCanceled(_pmAddress, _trader, _isHigherPrice);
    }

    function unsetTPAndSL(address _pmAddress, address _trader)
        external
        nonReentrant
    {
        require(
            PositionHouseAdapter.hasPosition(
                positionHouse,
                _pmAddress,
                _trader
            ),
            Errors.VL_MUST_HAVE_POSITION
        );
        _internalUnsetTPAndSL(_pmAddress, _trader);
    }

    function unsetTPAndSLWhenClosePosition(address _pmAddress, address _trader)
        external
    {
        onlyCounterParty();
        if (hasTPOrSL(_pmAddress, _trader)) {
            _internalUnsetTPAndSL(_pmAddress, _trader);
        }
    }

    function updateValidatedTriggererStatus(
        address _triggerer,
        bool _isValidated
    ) external onlyOwner {
        validatedTriggerers[_triggerer] = _isValidated;
    }

    function getTPSLDetail(address _pmAddress, address _trader)
        public
        view
        returns (uint120 lowerPip, uint120 higherPip)
    {
        TPSLCondition memory condition = TPSLMap[_pmAddress][_trader];
        lowerPip = condition.lowerPip;
        higherPip = condition.higherPip;
    }

    function hasTPOrSL(address _pmAddress, address _trader)
        public
        view
        returns (bool)
    {
        TPSLCondition memory condition = TPSLMap[_pmAddress][_trader];
        return condition.lowerPip != 0 || condition.higherPip != 0;
    }

    function onlyCounterParty() internal {
        require(
            AccessControllerAdapter.isGatewayOrCoreContract(
                accessControllerInterface,
                _msgSender()
            ),
            Errors.VL_NOT_COUNTERPARTY
        );
    }

    function _internalUnsetTPAndSL(address _pmAddress, address _trader)
        internal
    {
        TPSLMap[_pmAddress][_trader].lowerPip = 0;
        TPSLMap[_pmAddress][_trader].higherPip = 0;
        emit TPAndSLCanceled(_pmAddress, _trader);
    }

    // REQUIRE FUNCTION
    function reachTPSL(TPSLCondition memory condition, uint128 currentPip)
        internal
        returns (bool)
    {
        return
            (condition.lowerPip != 0 && currentPip <= condition.lowerPip) ||
            (currentPip >= condition.higherPip && condition.higherPip != 0);
    }

    function isValidInput(
        uint128 currentPrice,
        uint128 _higherPip,
        uint128 _lowerPip,
        SetTPSLOption _option
    ) internal returns (bool) {
        if (_option == SetTPSLOption.BOTH) {
            return
                _higherPip != 0 &&
                _lowerPip != 0 &&
                _higherPip > currentPrice &&
                currentPrice > _lowerPip;
        } else if (_option == SetTPSLOption.ONLY_HIGHER) {
            return
                _higherPip != 0 && _lowerPip == 0 && _higherPip > currentPrice;
        } else if (_option == SetTPSLOption.ONLY_LOWER) {
            return
                _higherPip == 0 && _lowerPip != 0 && currentPrice > _lowerPip;
        }
    }

    modifier onlyValidatedTriggerer() {
        require(
            validatedTriggerers[msg.sender],
            Errors.VL_ONLY_VALIDATED_TRIGGERS
        );
        _;
    }
}
