// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../library/types/PositionManagerStorage.sol";
import "../../library/types/MarketMaker.sol";

interface IPositionManager {
    // FUNCTIONS
    function pause() external;

    function unpause() external;

    function updateMaxFindingWordsIndex(uint128 _newMaxFindingWordsIndex)
        external;

    function updateMaxWordRangeForLimitOrder(
        uint128 _newMaxWordRangeForLimitOrder
    ) external;

    function updateMaxWordRangeForMarketOrder(
        uint128 _newMaxWordRangeForMarketOrder
    ) external;

    function updateBasisPoint(uint64 _newBasisPoint) external;

    function updateBaseBasicPoint(uint64 _newBaseBasisPoint) external;

    function updateTollRatio(uint256 _newTollRatio) external;

    function updateSpotPriceTwapInterval(uint256 _spotPriceTwapInterval)
        external;

    function getBasisPointFactors()
        external
        view
        returns (uint64 base, uint64 basisPoint);

    function hasLiquidity(uint128 _pip) external returns (bool);

    function getLeverage() external view returns (uint128);

    function getCurrentPip() external view returns (uint128);

    function getBaseBasisPoint() external view returns (uint256);

    function getBasisPoint() external view returns (uint256);

    function getStepBaseSize() external view returns (uint256);

    function getCurrentSingleSlot() external view returns (uint128, uint8);

    function getLiquidityInCurrentPip() external view returns (uint128);

    function getPrice() external view returns (uint256);

    function getUnderlyingPriceInPip() external view returns (uint256);

    function pipToPrice(uint128 pip) external view returns (uint256);

    function getQuoteAsset() external view returns (IERC20);

    function getUnderlyingPrice() external view returns (uint256);

    function getNextFundingTime() external view returns (uint256);

    function getPremiumFraction() external view returns (int256, uint256);

    function getTickPositionIndexes(uint128 _pip) external view returns (uint64 filledIndex, uint64 currentIndex);

    function calcMakerFee(uint256 _positionNotional, bool _isOpen)
        external
        view
        returns (uint256);

    function calcTakerFee(uint256 _positionNotional, bool _isOpen)
        external
        view
        returns (uint256);

    function updatePartialFilledOrder(uint128 pip, uint64 orderId) external;

    function getUnderlyingTwapPrice(uint256 _intervalInSeconds)
        external
        view
        returns (uint256);

    function getTwapPrice(uint256 _intervalInSeconds)
        external
        view
        returns (uint256);

    function calcTwap(
        PositionManagerStorage.TwapPriceCalcParams memory _params,
        uint256 _intervalInSeconds
    ) external view returns (uint256);

    function getPendingOrderDetail(uint128 pip, uint64 orderId)
        external
        view
        returns (
            bool isFilled,
            bool isBuy,
            uint256 size,
            uint256 partialFilled
        );

    function getPendingOrderDetailFull(uint128 pip, uint64 orderId)
    external
    view
    returns (
        bool isFilled,
        bool isBuy,
        uint256 size,
        uint256 partialFilled,
        address trader
    );

    function getNotionalMarginAndFee(
        uint256 _pQuantity,
        uint128 _pip,
        uint16 _leverage
    )
        external
        view
        returns (
            uint256 notional,
            uint256 margin,
            uint256 fee
        );

    function getMarketMakerAddress() external view returns (address);

    function getAllInitializedPips(
        uint128 _fromPip,
        uint256 _dataLength,
        bool _toHigher
    ) external view returns (uint128[] memory);

    function getLiquidityInPip(uint128 _pip) external view returns (uint128);

    function marketMakerRemove(MarketMaker.MMCancelOrder[] memory _orders)
        external;

    function marketMakerSupply(
        address _marketMakerAddress,
        MarketMaker.MMOrder[] memory _orders,
        uint256 leverage
    ) external returns (MarketMaker.MMCancelOrder[] memory);

    function marketMakerFill(
        address _marketMakerAddress,
        MarketMaker.MMFill[] memory _mmFills,
        uint256 _leverage
    ) external;

    function marketMakerFillToPip(
        address _marketMakerAddress,
        uint128 _targetPip
    ) external;

    function openLimitPosition(
        address trader,
        uint128 pip,
        uint128 size,
        bool isBuy
    )
        external
        returns (
            uint64 orderId,
            uint256 sizeOut,
            uint256 openNotional
        );

    function openMarketPosition(
        address trader,
        uint256 size,
        bool isBuy
    )
        external
        returns (
            uint256 sizeOut,
            uint256 openNotional,
            uint256 entryPrice,
            uint256 fee
        );

    function getCurrentFundingRate() external view returns (int256 fundingRate);

    function cancelLimitOrder(uint128 pip, uint64 orderId)
        external
        returns (uint256 refundSize, uint256 partialFilled);

    function settleFunding() external returns (int256 premiumFraction);

    function updateLeverage(uint128 _newLeverage) external;

    function deposit(
        address _trader,
        uint256 _amount,
        uint256 _fee
    ) external;

    function withdraw(address _trader, uint256 _amount) external;
}
