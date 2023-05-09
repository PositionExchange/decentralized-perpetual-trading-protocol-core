// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../adapter/interfaces/IChainLinkPriceFeed.sol";
import "../../adapter/interfaces/IInsuranceFund.sol";
import "../../adapter/interfaces/IAccessController.sol";
import "../../adapter/interfaces/IOrderTracker.sol";
import "../positions/TickPosition.sol";
import "../positions/LiquidityBitmap.sol";

contract PositionManagerStorage {
    using TickPosition for TickPosition.Data;
    using LiquidityBitmap for mapping(uint128 => uint256);

    uint64 public basisPoint; //0.01
    uint64 public BASE_BASIC_POINT;
    // fee = quoteAssetAmount / tollRatio (means if fee = 0.001% then tollRatio = 100000)
    uint256 tollRatio;

    int256 public fundingRate;

    uint256 public spotPriceTwapInterval;
    uint256 public fundingPeriod;
    uint256 public fundingBufferPeriod;
    uint256 public nextFundingTime;
    bytes32 public priceFeedKey;
    // Max finding word can be 3500
    uint128 public maxFindingWordsIndex;

    uint128 public leverage;

    bool internal _isInitiatedPip;

    struct TollRatio {
        uint64 makerOpenTollRatio;
        uint64 makerCloseTollRatio;
        uint64 takerOpenTollRatio;
        uint64 takerCloseTollRatio;
    }

    struct SingleSlot {
        uint128 pip;
        //0: not set
        //1: buy
        //2: sell
        uint128 isFullBuy;
    }

    //    struct PipLiquidity {
    //        uint128 pip;
    //        uint128 liquidity;
    //    }

    struct ReserveSnapshot {
        uint128 pip;
        uint64 timestamp;
        uint64 blockNumber;
    }

    struct TwapPriceCalcParams {
        uint256 snapshotIndex;
    }

    struct SwapState {
        uint128 remainingSize;
        // the tick associated with the current price
        uint128 pip;
        uint128 remainingLiquidity;
        uint128 startPip;
        uint128 lastMatchedPip;
        uint32 basisPoint;
        uint32 baseBasisPoint;
        uint8 isFullBuy;
        bool isSkipFirstPip;
    }

    struct StepComputations {
        uint128 pipNext;
    }

    enum CurrentLiquiditySide {
        NotSet,
        Buy,
        Sell
    }

    // array of reserveSnapshots
    ReserveSnapshot[] public reserveSnapshots;

    SingleSlot public singleSlot;
    mapping(uint128 => TickPosition.Data) public tickPosition;
    // a packed array of bit, where liquidity is filled or not
    mapping(uint128 => uint256) public liquidityBitmap;

    uint16 public maxMarketMakerSlipage;
    uint32 internal constant PERCENT_BASE = 1000000;

    uint128 public maxWordRangeForLimitOrder;
    uint128 public maxWordRangeForMarketOrder;
    IERC20 quoteAsset;
    IChainLinkPriceFeed public priceFeed;
    IInsuranceFund public insuranceFundInterface;
    IAccessController public accessControllerInterface;
    bool isRFIToken;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
    uint256 requestId;
    TollRatio public tollsRatio;
    // minimum stepBaseSize in wei (10**18)
    uint256 stepBaseSize;
    address validatedMarketMaker;
    IOrderTracker public orderTrackerInterface;

    function setInsuranceFund(address _address) external {
        insuranceFundInterface = IInsuranceFund(_address);
    }

    function setOrderTracker(address _address) external {
        orderTrackerInterface = IOrderTracker(_address);
    }
}
