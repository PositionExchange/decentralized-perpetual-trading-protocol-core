// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "../adapter/interfaces/IPositionHouse.sol";
import "../adapter/interfaces/IDPTPValidator.sol";
import "../adapter/PositionManagerAdapter.sol";
import "../library/positions/Position.sol";
import "../library/types/PositionHouseStorage.sol";
import "../library/helpers/Quantity.sol";
import {Int256Math} from "../library/helpers/Int256Math.sol";
import {Errors} from "../library/helpers/Errors.sol";

contract DPTPValidator is
    IDPTPValidator,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using Int256Math for int256;
    using Quantity for int256;
    using PositionManagerAdapter for DPTPValidator;
    using Position for Position.Data;
    IPositionHouse public positionHouse;
    // mapping trader address with a map of position manager and chain id
    mapping(address => mapping(address => uint256)) public traderData;

    function initialize(address _positionHouseAddress) public initializer {
        require(_positionHouseAddress != address(0), Errors.VL_INVALID_INPUT);
        __ReentrancyGuard_init();
        __Ownable_init();
        __Pausable_init();
        positionHouse = IPositionHouse(_positionHouseAddress);
    }

    function setPositionHouse(address _positionHouseAddress) public onlyOwner {
        positionHouse = IPositionHouse(_positionHouseAddress);
    }

    function validateChainIDAndManualMargin(
        address _trader,
        address _pmAddress,
        uint256 _chainID,
        uint256 _amount
    ) external {
        uint256 _currentChainID = traderData[_trader][_pmAddress];
        if (_currentChainID != 0 && _currentChainID != _chainID) {
            revert("Cannot have positions on different chains");
        }
        if (_amount != 0) {
            Position.Data memory  _positionData = positionHouse.getPosition(_pmAddress, _trader);
            _positionData.margin = _positionData.margin.absInt() + positionHouse.getAddedMargin(_pmAddress, _trader);
            if (_positionData.margin.abs()+ _amount > _positionData.openNotional) {
                revert("Invalid added margin amount");
            }
        }
        traderData[_trader][_pmAddress]=_chainID;
    }

    function updateTraderData(address _trader,address _pmAddress) external {
        int256 _claimAmount = PositionManagerAdapter.getClaimAmount(
            _pmAddress,
            positionHouse.getAddedMargin(_pmAddress, _trader),
            positionHouse.getDebtPosition(_pmAddress, _trader),
            positionHouse.positionMap(_pmAddress, _trader),
            positionHouse.getLimitOrders(_pmAddress, _trader),
            positionHouse.getReduceLimitOrders(
                _pmAddress,
                _trader
            ),
            positionHouse.getLimitOrderPremiumFraction(
                _pmAddress,
                _trader
            ),
            positionHouse.getLatestCumulativePremiumFraction(
                _pmAddress
            )
        );

        PositionHouseStorage.LimitOrderPending[] memory _pendingOrders = PositionManagerAdapter.getListOrderPending(
            _pmAddress,
            _trader,
            positionHouse.getLimitOrders(_pmAddress, _trader),
            positionHouse.getReduceLimitOrders(_pmAddress, _trader)
        );

        if (_claimAmount == 0 && _pendingOrders.length == 0) {
            delete traderData[_trader][_pmAddress];
        }
    }
}
