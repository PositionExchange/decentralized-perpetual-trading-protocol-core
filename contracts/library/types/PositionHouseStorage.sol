// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

import "../positions/PositionLimitOrder.sol";
import "../../adapter/interfaces/IInsuranceFund.sol";
import "../../adapter/interfaces/IPositionHouseConfigurationProxy.sol";
import "../../adapter/interfaces/IPositionNotionalConfigProxy.sol";
import "../../adapter/interfaces/IPositionStrategyOrder.sol";
import "../../adapter/interfaces/IAccessController.sol";
import "../../core/modules/Base.sol";

abstract contract PositionHouseStorage  is Base{
    using PositionLimitOrder for mapping(address => mapping(address => PositionLimitOrder.Data[]));
    using Quantity for int256;
    using Quantity for int128;

    using Position for Position.Data;
    using Position for Position.LiquidatedData;

    enum PnlCalcOption {
        TWAP,
        SPOT_PRICE,
        ORACLE
    }

    struct PositionResp {
        Position.Data position;
        int256 marginToVault;
        int256 realizedPnl;
        int256 unrealizedPnl;
        int256 exchangedPositionSize;
        uint256 exchangedQuoteAssetAmount;
        uint256 fundingPayment;
        uint256 entryPrice;
        uint256 fee;
    }

    struct LimitOrderPending {
        bool isBuy;
        uint256 quantity;
        uint256 partialFilled;
        uint128 pip;
        // can change leverage to uint16 to save gas
        uint16 leverage;
        uint8 isReduce;
        uint64 blockNumber;
        uint256 orderIdx;
        uint256 orderId;
        bytes32 sourceChainRequestKey;
    }

    struct LimitOverPricedFilled {
        uint256 entryPrice;
        uint256 quantity;
        uint16 leverage;
        /// Used for close with limit over price
        uint256 closeFee;
        bool isExecutedFully;
    }

    struct OpenLimitResp {
        uint64 orderId;
        uint256 sizeOut;
        int256 withdrawAmount;
        LimitOverPricedFilled limitOverPricedFilled;
    }

    struct GetNotionalAndFeeResp {
        uint256 notional;
        uint256 depositAmount;
        uint256 fee;
    }

    //    struct PositionManagerData {
    //        uint24 blockNumber;
    //        int256[] cumulativePremiumFraction;
    //        // Position data of each trader
    //        mapping(address => Position.Data) positionMap;
    //        mapping(address => PositionLimitOrder.Data[]) limitOrders;
    //        mapping(address => PositionLimitOrder.Data[]) reduceLimitOrders;
    //        // Amount that trader can claim from exchange
    //        mapping(address => int256) canClaimAmount;
    //        mapping(address => int256) manualMargin;
    //    }
    //    // TODO change separate mapping to positionManagerMap
    //    mapping(address => PositionManagerData) public positionManagerMap;

    // Can join positionMap and cumulativePremiumFractionsMap into a map of struct with key is PositionManager's address
    // Mapping from position manager address of each pair to position data of each trader
    mapping(address => mapping(address => Position.Data)) public positionMap;
    //    mapping(address => int256[]) public cumulativePremiumFractionsMap;

    mapping(address => mapping(address => Position.LiquidatedData))
        public debtPosition;

    // update added margin type from int256 to uint256
    mapping(address => mapping(address => int256)) internal manualMargin;
    //can update with index => no need delete array when close all

    IInsuranceFund public insuranceFundInterface;
    IPositionHouseConfigurationProxy public positionHouseConfigurationProxy;
    IPositionNotionalConfigProxy public positionNotionalConfigProxy;
    IAccessController public accessControllerInterface;
    IPositionStrategyOrder public positionStrategyOrder;

    mapping(address => bytes32) internal configNotionalKey;
    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
    // Mapping pending position of each trader
    // PmManager => trader
    mapping(address => mapping(address => Position.Data)) public pendingPositionMap;

    // increase orders
    mapping(address => mapping(address => PositionLimitOrder.Data[]))
        internal limitOrders;
    // reduce orders
    mapping(address => mapping(address => PositionLimitOrder.Data[]))
        internal reduceLimitOrders;

    mapping(address => mapping(address => int128))
        public limitOrderPremiumFraction;

    uint256[49] private ___gap;

    struct OpenMarketEventQueue {
        int256 quantity;
        uint256 openNotional;
        uint16 leverage; 
        uint256 entryPrice;
        uint256 margin;
        uint256 requestId;
    }
    // Mapping pending open market order of each trader
    // Now only support 1 event at a time, due to pendingPositionMap
    // PmManager => trader
    mapping(address => mapping(address => OpenMarketEventQueue)) public pendingOpenMarketOrderQueues;

    address public owner;
    bool internal _initialized;
}
