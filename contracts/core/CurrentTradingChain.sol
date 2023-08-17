/**
 * @author Musket
 */
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "../adapter/interfaces/IPositionHouse.sol";
import "../adapter/PositionHouseAdapter.sol";
import "../adapter/PositionManagerAdapter.sol";
import "../adapter/AccessControllerAdapter.sol";


interface  ICurrentTradingChain {

    function setCurrentTradingChain(address positionManager, address trader, uint256 chainId) external;
    function getCurrentTradingChain(address positionManager, address trader) external view returns (uint256);
    function getChainIdByRequestKey(bytes32 requestKey) external view returns (uint256);
    function setChainIdByRequestKey(bytes32 requestKey, uint256 chainId) external;

}

contract CurrentTradingChain is
    PausableUpgradeable,
    OwnableUpgradeable
{

    using PositionManagerAdapter for CurrentTradingChain;
    using PositionHouseAdapter for CurrentTradingChain;
    using AccessControllerAdapter for CurrentTradingChain;


    IPositionHouse public positionHouse;
    IAccessController public accessController;

    /// address => positionManager => chainId
    mapping(address => mapping(address => uint256)) internal currentTradingChain;

    mapping(bytes32 => uint256) public chainIdByRequestKey;



    function initialize(
        address _positionHouse,
        address _accessController
    ) public initializer {
        __Ownable_init();
        __Pausable_init();

        positionHouse = IPositionHouse(_positionHouse);
        accessController = IAccessController(_accessController);

    }



    function onlyCounterParty() internal {
        require(
            AccessControllerAdapter.isGatewayOrCoreContract(
                accessController,
                msg.sender
            ),
            Errors.VL_NOT_COUNTERPARTY
        );
    }




    function setCurrentTradingChain(address positionManager, address trader, uint256 chainId) external {
        onlyCounterParty();
        uint256 currentChainId = getCurrentTradingChain(positionManager, trader);

        if (currentChainId == chainId) {
            return;
        }
        require(currentChainId == 0, Errors.VL_INVALID_CURRENT_TRADING_CHAIN);
        currentTradingChain[trader][positionManager] = chainId;
    }

    function setChainIdByRequestKey(bytes32 requestKey, uint256 chainId) external {
        onlyCounterParty();
        chainIdByRequestKey[requestKey] = chainId;
    }


    function getChainIdByRequestKey(bytes32 requestKey) public view returns (uint256) {
        return chainIdByRequestKey[requestKey];
    }

    function getCurrentTradingChain(address positionManager, address trader) public view returns (uint256) {

        bool hasPosition = PositionHouseAdapter.hasPosition(
            positionHouse,
            positionManager,
            trader
        );

        bool hasPendingOrder = hasPendingOrder(
            positionManager,
            trader
        );

        return hasPosition || hasPendingOrder ? currentTradingChain[trader][positionManager] : 0;
    }



    function hasPendingOrder(address positionManager, address trader) public view returns (bool) {

        PositionHouseStorage.LimitOrderPending[] memory pendingOrders = PositionManagerAdapter.getListOrderPending(
            positionManager,
            trader,
            positionHouse.getLimitOrders(positionManager, trader),
            positionHouse.getReduceLimitOrders(positionManager, trader)
        );

        return pendingOrders.length > 0;
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;


}
