// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "../adapter/interfaces/IPositionManager.sol";
import "../library/types/MarketMaker.sol";
import "../library/positions/Position.sol";
import {Errors} from "../library/helpers/Errors.sol";

contract MarketMakerGateway is
    PausableUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using Quantity for int256;

    mapping(address => bool) private _whitelist;

    modifier onlyMMWhitelist() {
        require(isMarketMaker(msg.sender), "!MMW");
        _;
    }

    function setMMWhitelist(address addr, bool status) external onlyOwner {
        _whitelist[addr] = status;
    }

    function initialize() public initializer {
        __ReentrancyGuard_init();
        __Ownable_init();
        __Pausable_init();
    }

    function marketMakerFill(
        IPositionManager _positionManagerInterface,
        MarketMaker.MMFill[] memory _mmFills,
        uint256 _leverage
    ) external onlyMMWhitelist {
        _positionManagerInterface.marketMakerFill(
            tx.origin,
            _mmFills,
            _leverage
        );
    }

    function fillToPip(
        IPositionManager _positionManagerInterface,
        uint128 _targetPip,
        MarketMaker.MMOrder[] memory _nearestOrders,
        MarketMaker.MMOrder[] memory _otherOrders
    ) external onlyMMWhitelist {
        MarketMaker.MMCancelOrder[] memory currentWallOrders = wallOrders;
        if (currentWallOrders.length > 0) {
            _positionManagerInterface.marketMakerRemove(currentWallOrders);
            delete wallOrders;
        }
        // TODO implement function fillToPip
        _positionManagerInterface.marketMakerFillToPip(tx.origin, _targetPip);
        MarketMaker.MMCancelOrder[]
            memory newWallOrders = _positionManagerInterface.marketMakerSupply(
                tx.origin,
                _nearestOrders,
                1
            );
        for (uint256 i = 0; i < newWallOrders.length; i++) {
            wallOrders.push(newWallOrders[i]);
        }
        _positionManagerInterface.marketMakerSupply(
            tx.origin,
            _otherOrders,
            // unused leverage
            1
        );
    }

    function supplyFresh(
        IPositionManager _positionManagerInterface,
        MarketMaker.MMCancelOrder[] memory _cOrders,
        MarketMaker.MMOrder[] memory _oOrders,
        uint256 _leverage
    ) external onlyMMWhitelist {
        _positionManagerInterface.marketMakerRemove(_cOrders);
        _positionManagerInterface.marketMakerSupply(
            tx.origin,
            _oOrders,
            _leverage
        );
    }

    function remove(
        IPositionManager _positionManagerInterface,
        MarketMaker.MMCancelOrder[] memory _orders
    ) external onlyMMWhitelist {
        _positionManagerInterface.marketMakerRemove(_orders);
    }

    function supply(
        IPositionManager _positionManagerInterface,
        MarketMaker.MMOrder[] memory _orders,
        uint16 _leverage
    ) external virtual onlyMMWhitelist {
        _positionManagerInterface.marketMakerSupply(
            tx.origin,
            _orders,
            _leverage
        );
    }

    function isMarketMaker(address addr) public view returns (bool) {
        return _whitelist[addr];
    }

    function min(uint256 a, uint256 b) private pure returns (uint256) {
        if (a == 0) return b;
        if (b == 0) return a;
        return a > b ? b : a;
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
    uint128 fillToPipGap;
    MarketMaker.MMCancelOrder[] public wallOrders;
}
