// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../library/positions/TickPosition.sol";
import "../library/positions/LimitOrder.sol";
import "../library/positions/LiquidityBitmap.sol";
import {PositionMath} from "../library/positions/PositionMath.sol";
import "../library/types/PositionManagerStorage.sol";
import "../library/types/MarketMaker.sol";
import "../library/helpers/Quantity.sol";
import {Errors} from "../library/helpers/Errors.sol";
import {IChainLinkPriceFeed} from "../adapter/interfaces/IChainLinkPriceFeed.sol";
import {IInsuranceFund} from "../adapter/interfaces/IInsuranceFund.sol";
import {IAccessController} from "../adapter/interfaces/IAccessController.sol";
import {InsuranceFundAdapter} from "../adapter/InsuranceFundAdapter.sol";
import {AccessControllerAdapter} from "../adapter/AccessControllerAdapter.sol";
import {IOrderTracker} from "../adapter/interfaces/IOrderTracker.sol";
import "hardhat/console.sol";

contract PositionManager is
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    OwnableUpgradeable,
    PositionManagerStorage
{
    using TickPosition for TickPosition.Data;
    using LiquidityBitmap for mapping(uint128 => uint256);
    using InsuranceFundAdapter for PositionManager;
    using AccessControllerAdapter for PositionManager;

    // IMPORTANT this digit must be the same to TOKEN_DIGIT in ChainLinkPriceFeed
    uint256 private constant PRICE_FEED_TOKEN_DIGIT = 10**18;
    int256 private constant PREMIUM_FRACTION_DENOMINATOR = 10**10;
    // EVENT

    // Events that supports building order book
    event MarketFilled(
        bool isBuy,
        uint256 amount,
        uint128 toPip,
        uint256 passedPipCount,
        uint128 remainingLiquidity
    );

    event LimitOrderCreated(
        uint64 orderId,
        address trader,
        uint128 pip,
        bool isBuy,
        uint128 size,
        uint256 requestId
    );
    event LimitOrderCancelled(
        bool isBuy,
        uint64 orderId,
        uint128 pip,
        uint256 remainingSize,
        uint256 requestId,
        address trader
    );
    event MarketOrderCreated(
        address trader,
        bool isBuy,
        uint256 size,
        uint256 requestId
    );
    event LimitOrderUpdated(uint64 orderId, uint128 pip, uint256 size);

    //    event UpdateMaxFindingWordsIndex(uint128 newMaxFindingWordsIndex);
    //    event MaxWordRangeForLimitOrderUpdated(uint128 newMaxWordRangeForLimitOrder);
    //    event MaxWordRangeForMarketOrderUpdated(uint128 newMaxWordRangeForMarketOrder);
    //    event UpdateBasisPoint(uint256 newBasicPoint);
    //    event UpdateBaseBasicPoint(uint256 newBaseBasisPoint);
    //    event UpdateTollRatio(uint256 newTollRatio);
    //    event UpdateSpotPriceTwapInterval(uint256 newSpotPriceTwapInterval);
    //    event ReserveSnapshotted(uint128 pip, uint256 timestamp);

    //    event FundingRateUpdated(int256 fundingRate, uint256 underlyingPrice);
    //    event LeverageUpdated(uint128 oldLeverage, uint128 newLeverage);
    //    event MaxMarketMakerSlipageUpdated(
    //        uint32 oldMaxMarketMakerSlipage,
    //        uint32 newMaxMarketMakerSlipage
    //    );

    function onlyCounterParty() internal {
        require(
            AccessControllerAdapter.isGatewayOrCoreContract(
                accessControllerInterface,
                msg.sender
            ),
            Errors.VL_NOT_COUNTERPARTY
        );
    }

    function initialize(
        // moved to initializePip
        uint128 _initialPip,
        address _quoteAsset,
        bytes32 _priceFeedKey,
        uint64 _basisPoint,
        uint64 _BASE_BASIC_POINT,
        uint256 _tollRatio,
        uint128 _maxFindingWordsIndex,
        uint256 _fundingPeriod,
        address _priceFeed
    ) public initializer {
        require(
            _fundingPeriod != 0 &&
                _quoteAsset != address(0) &&
                _priceFeed != address(0),
            Errors.VL_INVALID_INPUT
        );

        __ReentrancyGuard_init();
        __Ownable_init();
        __Pausable_init();

        priceFeedKey = _priceFeedKey;
        quoteAsset = IERC20(_quoteAsset);
        basisPoint = _basisPoint;
        BASE_BASIC_POINT = _BASE_BASIC_POINT;
        uint64 u64TollRatio = uint64(_tollRatio);
        updateTollsRatio(
            u64TollRatio * 2,
            u64TollRatio * 2,
            u64TollRatio,
            u64TollRatio
        );
        spotPriceTwapInterval = 1 hours;
        fundingPeriod = _fundingPeriod;
        fundingBufferPeriod = _fundingPeriod / 2;
        maxFindingWordsIndex = _maxFindingWordsIndex;
        maxWordRangeForLimitOrder = _maxFindingWordsIndex;
        maxWordRangeForMarketOrder = _maxFindingWordsIndex;
        priceFeed = IChainLinkPriceFeed(_priceFeed);
        leverage = 125;
        // default is 1% Market market slippage
        maxMarketMakerSlipage = 10000;
        if (_initialPip != 0) {
            reserveSnapshots.push(
                ReserveSnapshot(_initialPip, _now(), _blocknumber())
            );
            singleSlot.pip = _initialPip;
            //            emit ReserveSnapshotted(_initialPip, _now());
        }
    }

    function initializePip() external {
        // initialize singleSlot.pip
        require(!_isInitiatedPip && singleSlot.pip == 0, "!init");
        uint256 _price = priceFeed.getPrice(priceFeedKey);
        uint128 _pip = uint128((_price * basisPoint) / PRICE_FEED_TOKEN_DIGIT);
        singleSlot.pip = _pip;
        reserveSnapshots.push(ReserveSnapshot(_pip, _now(), _blocknumber()));
        _isInitiatedPip = true;
        //        emit ReserveSnapshotted(_pip, _now());
    }

    function updatePartialFilledOrder(uint128 _pip, uint64 _orderId)
        external
        whenNotPaused
    {
        onlyCounterParty();
        uint256 newSize = tickPosition[_pip].updateOrderWhenClose(_orderId);
        emit LimitOrderUpdated(_orderId, _pip, newSize);
    }

    function cancelLimitOrder(uint128 _pip, uint64 _orderId)
        external
        whenNotPaused
        returns (uint256 remainingSize, uint256 partialFilled)
    {
        onlyCounterParty();
        TickPosition.Data storage _tickPosition = tickPosition[_pip];
        require(
            hasLiquidity(_pip) && _orderId >= _tickPosition.filledIndex,
            Errors.VL_ONLY_PENDING_ORDER
        );
        return _internalCancelLimitOrder(_tickPosition, _pip, _orderId);
    }

    function marketMakerRemove(MarketMaker.MMCancelOrder[] memory _orders)
        external
        whenNotPaused
    {
        onlyCounterParty();
        address _validatedMarketMaker = validatedMarketMaker;
        for (uint256 i = 0; i < _orders.length; i++) {
            MarketMaker.MMCancelOrder memory _order = _orders[i];
            TickPosition.Data storage _tickPosition = tickPosition[_order.pip];
            if (
                _order.orderId >= _tickPosition.filledIndex &&
                hasLiquidity(_order.pip)
            ) {
                if (
                    _tickPosition.orderQueue[_order.orderId].trader ==
                    validatedMarketMaker
                ) {
                    _internalCancelLimitOrder(
                        _tickPosition,
                        _order.pip,
                        _order.orderId
                    );
                }
            }
        }
    }

    // NOTE: unused param leverage
    function marketMakerSupply(
        address _marketMakerAddress,
        MarketMaker.MMOrder[] memory _orders,
        uint256 leverage
    ) external whenNotPaused returns (MarketMaker.MMCancelOrder[] memory) {
        onlyCounterParty();
        SingleSlot memory _singleSlotMM = singleSlot;
        MarketMaker.MMCancelOrder[]
            memory _newWallOrder = new MarketMaker.MMCancelOrder[](
                _orders.length
            );
        for (uint256 i = 0; i < _orders.length; i++) {
            MarketMaker.MMOrder memory _order = _orders[i];
            // BUY, price should always less than market price
            if (_order.quantity > 0 && _order.pip >= _singleSlotMM.pip) {
                //skip
                continue;
            }
            // SELL, price should always greater than market price
            if (_order.quantity < 0 && _order.pip <= _singleSlotMM.pip) {
                //skip
                continue;
            }
            uint128 _quantity = uint128(Quantity.abs(_order.quantity));
            bool _hasLiquidity = liquidityBitmap.hasLiquidity(_order.pip);
            uint64 _orderId = _internalInsertLimitOrder(
                _quantity,
                _order.pip,
                _hasLiquidity,
                _order.quantity > 0,
                _marketMakerAddress
            );
            if (!_hasLiquidity) {
                // TODO using toggle in multiple pips
                liquidityBitmap.toggleSingleBit(_order.pip, true);
            }
            requestId++;
            emit LimitOrderCreated(
                _orderId,
                _marketMakerAddress,
                _order.pip,
                _order.quantity > 0,
                _quantity,
                requestId
            );
            _newWallOrder[i] = MarketMaker.MMCancelOrder(_order.pip, _orderId);
        }
        return _newWallOrder;
    }

    // mean max for market market fill is 1%

    function marketMakerFillToPip(
        address _marketMakerAddress,
        uint128 _targetPip
    ) external whenNotPaused {
        onlyCounterParty();
        uint128 _beforePip = singleSlot.pip;
        bool marketOrderIsBuy = _targetPip > _beforePip ? true : false;
        bool hasLiquidityInTargetPip = liquidityBitmap.hasLiquidity(_targetPip);
        uint128 memStepBaseSize = uint128(stepBaseSize);
        uint16 memMaxMarketMakerSlipage = maxMarketMakerSlipage;
        uint32 memPercentBase = PERCENT_BASE;
        bool pass;
        if (marketOrderIsBuy) {
            pass = ((_targetPip - _beforePip) * memPercentBase) / _beforePip >
                memMaxMarketMakerSlipage
                ? false
                : true;
        } else {
            pass = ((_beforePip - _targetPip) * memPercentBase) / _beforePip >
                memMaxMarketMakerSlipage
                ? false
                : true;
        }
        require(pass, "!MM");

        if (!hasLiquidityInTargetPip) {
            uint64 _orderId = _internalInsertLimitOrder(
                memStepBaseSize,
                _targetPip,
                hasLiquidityInTargetPip,
                !marketOrderIsBuy,
                _marketMakerAddress
            );
            liquidityBitmap.toggleSingleBit(_targetPip, true);
            requestId++;
            emit LimitOrderCreated(
                _orderId,
                _marketMakerAddress,
                _targetPip,
                !marketOrderIsBuy,
                memStepBaseSize,
                requestId
            );
        }
        (uint256 sizeOut, ) = _internalOpenMarketOrder(
            type(uint128).max,
            marketOrderIsBuy,
            _targetPip
        );
        require(sizeOut != 0, Errors.VL_INVALID_SIZE);
        requestId++;
        emit MarketOrderCreated(
            _marketMakerAddress,
            marketOrderIsBuy,
            sizeOut,
            requestId
        );
    }

    function marketMakerFill(
        address _marketMakerAddress,
        MarketMaker.MMFill[] memory _mmFills,
        // NOTE: unused param leverage
        uint256 _leverage
    ) external whenNotPaused {
        onlyCounterParty();
        for (uint256 i = 0; i < _mmFills.length; i++) {
            MarketMaker.MMFill memory mmFill = _mmFills[i];
            uint128 _beforePip = singleSlot.pip;
            requestId++;
            emit MarketOrderCreated(
                _marketMakerAddress,
                mmFill.isBuy,
                mmFill.quantity,
                requestId
            );
            (uint256 sizeOut, ) = _internalOpenMarketOrder(
                mmFill.quantity,
                mmFill.isBuy,
                0
            );
            require(sizeOut == mmFill.quantity, Errors.VL_NOT_ENOUGH_LIQUIDITY);
            uint128 _afterPip = singleSlot.pip;
            bool pass;
            if (mmFill.isBuy) {
                if (_afterPip < _beforePip) {
                    revert(Errors.VL_NOT_ENOUGH_LIQUIDITY);
                }
                pass = ((_afterPip - _beforePip) * PERCENT_BASE) / _beforePip >
                    maxMarketMakerSlipage
                    ? false
                    : true;
            } else {
                if (_beforePip < _afterPip) {
                    revert(Errors.VL_NOT_ENOUGH_LIQUIDITY);
                }
                pass = ((_beforePip - _afterPip) * PERCENT_BASE) / _beforePip >
                    maxMarketMakerSlipage
                    ? false
                    : true;
            }

            require(pass, "!MM");
        }
    }

    function openLimitPosition(
        address _trader,
        uint128 _pip,
        uint128 _size,
        bool _isBuy
    )
        external
        whenNotPaused
        returns (
            uint64 orderId,
            uint256 sizeOut,
            uint256 openNotional
        )
    {
        onlyCounterParty();
        require(_size != 0, Errors.VL_INVALID_SIZE);
        SingleSlot memory _singleSlot = singleSlot;
        uint256 underlyingPip = getUnderlyingPriceInPip();
        {
            _requireLimitPipCloseToIndex(
                _isBuy,
                _pip,
                _singleSlot.pip,
                underlyingPip
            );
        }
        bool hasLiquidity = liquidityBitmap.hasLiquidity(_pip);
        //save gas
        {
            bool canOpenMarketWithMaxPip = (_isBuy &&
                _pip >= _singleSlot.pip) ||
                (!_isBuy && _pip <= _singleSlot.pip);
            if (canOpenMarketWithMaxPip) {
                (sizeOut, openNotional) = _openMarketPositionWithMaxPip(
                    _trader,
                    _size,
                    _isBuy,
                    _pip
                );
                // reassign _singleSlot after _openMarketPositionWithMaxPip
                _singleSlot = singleSlot;
                // open market
                _requireLastPipCloseToIndex(
                    _isBuy,
                    _singleSlot.pip,
                    underlyingPip
                );
                orderTrackerInterface.accumulateMarketOrder(
                    _isBuy,
                    uint128(sizeOut),
                    uint128(openNotional)
                );
                hasLiquidity = liquidityBitmap.hasLiquidity(_pip);
            }
        }
        if (_size > sizeOut) {
            {
                if (
                    _pip == _singleSlot.pip &&
                    _singleSlot.isFullBuy != (_isBuy ? 1 : 2)
                ) {
                    singleSlot.isFullBuy = _isBuy ? 1 : 2;
                }
            }
            // save at that pip has how many liquidity
            {
                uint128 remainingSize = _size - uint128(sizeOut);
                orderId = _internalInsertLimitOrder(
                    remainingSize,
                    _pip,
                    hasLiquidity,
                    _isBuy,
                    _trader
                );
                if (remainingSize != _size) {
                    emit LimitOrderUpdated(orderId, _pip, remainingSize);
                }
            }
            if (!hasLiquidity) {
                // set the bit to mark it has liquidity
                liquidityBitmap.toggleSingleBit(_pip, true);
            }
        }

        requestId++;
        emit LimitOrderCreated(
            orderId,
            _trader,
            _pip,
            _isBuy,
            _size,
            requestId
        );
    }

    function openMarketPosition(
        address _trader,
        uint256 _size,
        bool _isBuy
    )
        external
        whenNotPaused
        returns (
            uint256 sizeOut,
            uint256 openNotional,
            uint256 entryPrice,
            uint256 fee
        )
    {
        onlyCounterParty();
        uint256 underlyingPip = getUnderlyingPriceInPip();
        requestId++;
        (sizeOut, openNotional) = _internalOpenMarketOrder(_size, _isBuy, 0);
        orderTrackerInterface.accumulateMarketOrder(
            _isBuy,
            uint128(sizeOut),
            uint128(openNotional)
        );
        emit MarketOrderCreated(_trader, _isBuy, sizeOut, requestId);
        uint128 _afterPip = singleSlot.pip;

        _requireLastPipCloseToIndex(_isBuy, _afterPip, underlyingPip);
        //        bool pass = _isBuy
        //            ? _afterPip <= (underlyingPip + maxWordRangeForMarketOrder * 250)
        //            : int128(_afterPip) >=
        //                (int256(underlyingPip) -
        //                    int128(maxWordRangeForMarketOrder * 250));
        //        if (!pass) {
        //            revert(Errors.VL_MARKET_ORDER_MUST_CLOSE_TO_INDEX_PRICE);
        //        }
        fee = calcTakerFee(openNotional, true);
        // need to calculate entryPrice in pip
        entryPrice = PositionMath.calculateEntryPrice(
            openNotional,
            sizeOut,
            getBasisPoint()
        );
    }

    /**
     * @notice update funding rate
     * @dev only allow to update while reaching `nextFundingTime`
     * @return premiumFraction of this period in 18 digits
     */
    function settleFunding()
        external
        whenNotPaused
        returns (int256 premiumFraction)
    {
        onlyCounterParty();
        require(_now() >= nextFundingTime, Errors.VL_SETTLE_FUNDING_TOO_EARLY);
        uint256 underlyingPrice;
        (premiumFraction, underlyingPrice) = getPremiumFraction();

        // update funding rate = premiumFraction / twapIndexPrice
        _updateFundingRate(premiumFraction, underlyingPrice);

        // in order to prevent multiple funding settlement during very short time after network congestion
        uint256 minNextValidFundingTime = _now() + fundingBufferPeriod;

        // floor((nextFundingTime + fundingPeriod) / 3600) * 3600
        uint256 nextFundingTimeOnHourStart = ((nextFundingTime +
            fundingPeriod) / (1 hours)) * (1 hours);

        // max(nextFundingTimeOnHourStart, minNextValidFundingTime)
        nextFundingTime = nextFundingTimeOnHourStart > minNextValidFundingTime
            ? nextFundingTimeOnHourStart
            : minNextValidFundingTime;

        return premiumFraction;
    }

    //******************************************************************************************************************
    // VIEW FUNCTIONS
    //******************************************************************************************************************

    function getBasisPointFactors()
        external
        view
        returns (uint64 base, uint64 basisPoint)
    {
        return (BASE_BASIC_POINT, uint64(getBasisPoint()));
    }

    function getCurrentFundingRate()
        external
        view
        returns (int256 fundingRate)
    {
        (
            int256 premiumFraction,
            uint256 underlyingPrice
        ) = getPremiumFraction();
        return premiumFraction;
    }

    function getPremiumFraction()
        public
        view
        returns (int256 premiumFraction, uint256 underlyingPrice)
    {
        // premium = twapMarketPrice - twapIndexPrice
        // timeFraction = fundingPeriod(1 hour) / 1 day
        // premiumFraction = premium * timeFraction
        uint256 baseBasisPoint = getBaseBasisPoint();
        underlyingPrice = getUnderlyingTwapPrice(spotPriceTwapInterval);
        int256 _twapPrice = int256(getTwapPrice(spotPriceTwapInterval));
        // 10 ** 8 is the divider
        int256 premium = ((_twapPrice - int256(underlyingPrice)) *
            PREMIUM_FRACTION_DENOMINATOR) / int256(baseBasisPoint);
        premiumFraction =
            (premium * int256(fundingPeriod) * int256(baseBasisPoint)) /
            (int256(1 days) * int256(underlyingPrice));
    }

    function getLeverage() external view returns (uint128) {
        return leverage;
    }

    function getMarketMakerAddress() external view returns (address) {
        return validatedMarketMaker;
    }

    function getBaseBasisPoint() public view returns (uint256) {
        return BASE_BASIC_POINT;
    }

    function getBasisPoint() public view returns (uint256) {
        return basisPoint;
    }

    function getStepBaseSize() public view returns (uint256) {
        return stepBaseSize;
    }

    function getCurrentPip() public view returns (uint128) {
        return singleSlot.pip;
    }

    function getCurrentSingleSlot() external view returns (uint128, uint128) {
        return (singleSlot.pip, singleSlot.isFullBuy);
    }

    function getPrice() public view returns (uint256) {
        return (uint256(singleSlot.pip) * BASE_BASIC_POINT) / basisPoint;
    }

    // Converting underlying price to the pip value
    function getUnderlyingPriceInPip() public view virtual returns (uint256) {
        return (getUnderlyingPrice() * basisPoint) / BASE_BASIC_POINT;
    }

    function getNextFundingTime() public view returns (uint256) {
        return nextFundingTime;
    }

    function getTickPositionIndexes(uint128 _pip)
        public
        view
        returns (uint64 filledIndex, uint64 currentIndex)
    {
        return (
            tickPosition[_pip].filledIndex,
            tickPosition[_pip].currentIndex
        );
    }

    function pipToPrice(uint128 _pip) public view returns (uint256) {
        return (uint256(_pip) * BASE_BASIC_POINT) / basisPoint;
    }

    function priceToWei(uint256 _price) public view returns (uint256) {
        return (_price * 10**18) / BASE_BASIC_POINT;
    }

    function getLiquidityInCurrentPip() public view returns (uint128) {
        return
            liquidityBitmap.hasLiquidity(singleSlot.pip)
                ? tickPosition[singleSlot.pip].liquidity
                : 0;
    }

    function getLiquidityInMultiplePip(uint128[] memory _arrPip)
        external
        view
        returns (uint128[] memory)
    {
        uint128[] memory arrLiquidity = new uint128[](_arrPip.length);
        for (uint256 i = 0; i < _arrPip.length; i++) {
            if (hasLiquidity(_arrPip[i])) {
                arrLiquidity[i] = getLiquidityInPip(_arrPip[i]);
            } else {
                arrLiquidity[i] = 0;
            }
        }
        return arrLiquidity;
    }

    function hasLiquidity(uint128 _pip) public view returns (bool) {
        return liquidityBitmap.hasLiquidity(_pip);
    }

    function getPendingOrderDetail(uint128 _pip, uint64 _orderId)
        public
        view
        returns (
            bool isFilled,
            bool isBuy,
            uint256 size,
            uint256 partialFilled
        )
    {
        (isFilled, isBuy, size, partialFilled, ) = tickPosition[_pip]
            .getQueueOrder(_orderId);

        if (!liquidityBitmap.hasLiquidity(_pip)) {
            isFilled = true;
        }
        if (size != 0 && size == partialFilled) {
            isFilled = true;
        }
    }

    function getPendingOrderDetailFull(uint128 _pip, uint64 _orderId)
        public
        view
        returns (
            bool isFilled,
            bool isBuy,
            uint256 size,
            uint256 partialFilled,
            address trader
        )
    {
        (isFilled, isBuy, size, partialFilled, trader) = tickPosition[_pip]
            .getQueueOrder(_orderId);

        if (!liquidityBitmap.hasLiquidity(_pip)) {
            isFilled = true;
        }
        if (size != 0 && size == partialFilled) {
            isFilled = true;
        }
    }

    function getNotionalMarginAndFee(
        uint256 _pQuantity,
        uint128 _pip,
        uint16 _leverage
    )
        public
        view
        returns (
            uint256 notional,
            uint256 margin,
            uint256 fee
        )
    {
        notional = PositionMath.calculateNotional(
            pipToPrice(_pip),
            _pQuantity,
            getBaseBasisPoint()
        );
        margin = notional / _leverage;
        // true means it's an open order
        fee = calcMakerFee(notional, true);
    }

    // Calculate fee for maker (limit order)
    /**
     * @notice calculate total fee (including toll and spread) by input quote asset amount
     * @param _positionNotional quote asset amount
     * @param _isOpen order is open or close position
     * @return fee total tx fee
     */
    function calcMakerFee(uint256 _positionNotional, bool _isOpen)
        public
        view
        returns (uint256 fee)
    {
        TollRatio memory _tollRatio = tollsRatio;
        if (_isOpen) {
            return
                _internalCalcFee(
                    _positionNotional,
                    _tollRatio.makerOpenTollRatio
                );
        }
        return
            _internalCalcFee(_positionNotional, _tollRatio.makerCloseTollRatio);
    }

    // Calculate fee for taker (market order)
    /**
     * @notice calculate total fee (including toll and spread) by input quote asset amount
     * @param _positionNotional quote asset amount
     * @param _isOpen order is open or close position
     * @return fee total tx fee
     */
    function calcTakerFee(uint256 _positionNotional, bool _isOpen)
        public
        view
        returns (uint256 fee)
    {
        TollRatio memory _tollRatio = tollsRatio;
        if (_isOpen) {
            return
                _internalCalcFee(
                    _positionNotional,
                    _tollRatio.takerOpenTollRatio
                );
        }
        return
            _internalCalcFee(_positionNotional, _tollRatio.takerCloseTollRatio);
    }

    /**
     * @notice calculate total fee (including toll and spread) by input quote asset amount
     * @param _positionNotional quote asset amount
     * @return total tx fee
     */
    function _internalCalcFee(uint256 _positionNotional, uint64 _tollRatio)
        internal
        view
        returns (uint256)
    {
        if (_tollRatio != 0) {
            return _positionNotional / uint256(_tollRatio);
        }
        return 0;
    }

    function getLiquidityInPip(uint128 _pip) public view returns (uint128) {
        return tickPosition[_pip].liquidity;
    }

    function getQuoteAsset() public view returns (IERC20) {
        return quoteAsset;
    }

    /**
     * @notice get underlying price provided by oracle
     * @return underlying price
     */
    function getUnderlyingPrice() public view returns (uint256) {
        return
            _formatPriceFeedToBaseBasisPoint(priceFeed.getPrice(priceFeedKey));
    }

    /**
     * @notice get underlying twap price provided by oracle
     * @return underlying price
     */
    function getUnderlyingTwapPrice(uint256 _intervalInSeconds)
        public
        view
        virtual
        returns (uint256)
    {
        return
            _formatPriceFeedToBaseBasisPoint(
                priceFeed.getTwapPrice(priceFeedKey, _intervalInSeconds)
            );
    }

    /**
     * @notice get twap price
     */
    function getTwapPrice(uint256 _intervalInSeconds)
        public
        view
        virtual
        returns (uint256)
    {
        TwapPriceCalcParams memory params;
        params.snapshotIndex = reserveSnapshots.length - 1;
        return calcTwap(params, _intervalInSeconds);
    }

    function calcTwap(
        TwapPriceCalcParams memory _params,
        uint256 _intervalInSeconds
    ) public view returns (uint256) {
        uint256 currentPrice = _getPriceWithSpecificSnapshot(_params);
        if (_intervalInSeconds == 0) {
            return currentPrice;
        }

        uint256 baseTimestamp = _now() - _intervalInSeconds;
        ReserveSnapshot memory currentSnapshot = reserveSnapshots[
            _params.snapshotIndex
        ];
        // return the latest snapshot price directly
        // if only one snapshot or the timestamp of latest snapshot is earlier than asking for
        if (
            reserveSnapshots.length == 1 ||
            currentSnapshot.timestamp <= baseTimestamp
        ) {
            return currentPrice;
        }

        uint256 previousTimestamp = currentSnapshot.timestamp;
        // period same as cumulativeTime
        uint256 period = _now() - previousTimestamp;
        uint256 weightedPrice = currentPrice * period;
        while (true) {
            // if snapshot history is too short
            if (_params.snapshotIndex == 0) {
                return weightedPrice / period;
            }

            _params.snapshotIndex = _params.snapshotIndex - 1;
            currentSnapshot = reserveSnapshots[_params.snapshotIndex];
            currentPrice = _getPriceWithSpecificSnapshot(_params);

            // check if current snapshot timestamp is earlier than target timestamp
            if (currentSnapshot.timestamp <= baseTimestamp) {
                // weighted time period will be (target timestamp - previous timestamp). For example,
                // now is 1000, _intervalInSeconds is 100, then target timestamp is 900. If timestamp of current snapshot is 970,
                // and timestamp of NEXT snapshot is 880, then the weighted time period will be (970 - 900) = 70,
                // instead of (970 - 880)
                weightedPrice =
                    weightedPrice +
                    (currentPrice * (previousTimestamp - baseTimestamp));
                break;
            }

            uint256 timeFraction = previousTimestamp -
                currentSnapshot.timestamp;
            weightedPrice = weightedPrice + (currentPrice * timeFraction);
            period = period + timeFraction;
            previousTimestamp = currentSnapshot.timestamp;
        }
        return weightedPrice / _intervalInSeconds;
    }

    //******************************************************************************************************************
    // ONLY OWNER FUNCTIONS
    //******************************************************************************************************************

    function updateMaxPercentMarketMarket(uint16 newMarketMakerSlipage)
        public
        onlyOwner
    {
        maxMarketMakerSlipage = newMarketMakerSlipage;
    }

    function updateStepBaseSize(uint256 _stepBaseSize) external onlyOwner {
        stepBaseSize = _stepBaseSize;
    }

    function setValidatedMarketMaker(address _marketMaker) external onlyOwner {
        validatedMarketMaker = _marketMaker;
    }

    function updateAccessControllerInterface(address _accessControllerAddress)
        public
        onlyOwner
    {
        accessControllerInterface = IAccessController(_accessControllerAddress);
    }

    function updateOrderTrackerInterface(address _orderTrackerAddress)
        public
        onlyOwner
    {
        orderTrackerInterface = IOrderTracker(_orderTrackerAddress);
    }

    function updateLeverage(uint128 _newLeverage) public onlyOwner {
        require(0 < _newLeverage, Errors.VL_INVALID_LEVERAGE);

        // emit LeverageUpdated(leverage, _newLeverage);
        leverage = _newLeverage;
    }

    function updateTollsRatio(
        uint64 _makerOpenTollRatio,
        uint64 _makerCloseTollRatio,
        uint64 _takerOpenTollRatio,
        uint64 _takerCloseTollRatio
    ) public onlyOwner {
        tollsRatio.makerOpenTollRatio = _makerOpenTollRatio;
        tollsRatio.makerCloseTollRatio = _makerCloseTollRatio;
        tollsRatio.takerOpenTollRatio = _takerOpenTollRatio;
        tollsRatio.takerCloseTollRatio = _takerCloseTollRatio;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function updateMaxFindingWordsIndex(uint128 _newMaxFindingWordsIndex)
        public
        onlyOwner
    {
        maxFindingWordsIndex = _newMaxFindingWordsIndex;
        // emit UpdateMaxFindingWordsIndex(_newMaxFindingWordsIndex);
    }

    function updateMaxWordRangeForLimitOrder(
        uint128 _newMaxWordRangeForLimitOrder
    ) public onlyOwner {
        maxWordRangeForLimitOrder = _newMaxWordRangeForLimitOrder;
        // emit MaxWordRangeForLimitOrderUpdated(_newMaxWordRangeForLimitOrder);
    }

    function updateMaxWordRangeForMarketOrder(
        uint128 _newMaxWordRangeForMarketOrder
    ) public onlyOwner {
        maxWordRangeForMarketOrder = _newMaxWordRangeForMarketOrder;
        // emit MaxWordRangeForMarketOrderUpdated(_newMaxWordRangeForMarketOrder);
    }

    //    function updateBasisPoint(uint64 _newBasisPoint) public onlyOwner {
    //        basisPoint = _newBasisPoint;
    //        // emit UpdateBasisPoint(_newBasisPoint);
    //    }
    //
    //    function updateBaseBasicPoint(uint64 _newBaseBasisPoint)
    //        public
    //        onlyOwner
    //    {
    //        BASE_BASIC_POINT = _newBaseBasisPoint;
    //        // emit UpdateBaseBasicPoint(_newBaseBasisPoint);
    //    }

    //    function updateSpotPriceTwapInterval(uint256 _spotPriceTwapInterval)
    //        public
    //        onlyOwner
    //    {
    //        spotPriceTwapInterval = _spotPriceTwapInterval;
    //        // emit UpdateSpotPriceTwapInterval(_spotPriceTwapInterval);
    //    }

    //******************************************************************************************************************
    // INTERNAL FUNCTIONS
    //******************************************************************************************************************

    function _openMarketPositionWithMaxPip(
        address _trader,
        uint256 _size,
        bool _isBuy,
        uint128 _maxPip
    ) internal returns (uint256 sizeOut, uint256 openNotional) {
        return _internalOpenMarketOrder(_size, _isBuy, _maxPip);
    }

    function _internalCancelLimitOrder(
        TickPosition.Data storage _tickPosition,
        uint128 _pip,
        uint64 _orderId
    ) internal returns (uint256 remainingSize, uint256 partialFilled) {
        bool isBuy;
        address trader;
        (remainingSize, partialFilled, isBuy, trader) = _tickPosition
            .cancelLimitOrder(_orderId);
        // if that pip doesn't have liquidity after closed order, toggle pip to uninitialized
        if (_tickPosition.liquidity == 0) {
            liquidityBitmap.toggleSingleBit(_pip, false);
            // only unset isFullBuy when cancel order pip == current pip
            if (_pip == singleSlot.pip) {
                singleSlot.isFullBuy = 0;
            }
        }
        requestId++;
        emit LimitOrderCancelled(
            isBuy,
            _orderId,
            _pip,
            remainingSize,
            requestId,
            trader
        );
    }

    function _internalOpenMarketOrder(
        uint256 _size,
        bool _isBuy,
        uint128 _maxPip
    ) internal returns (uint256 sizeOut, uint256 openNotional) {
        require(_size != 0, Errors.VL_INVALID_SIZE);
        // get current tick liquidity
        SingleSlot memory _initialSingleSlot = singleSlot;
        //save gas
        SwapState memory state = SwapState({
            remainingSize: uint128(_size),
            pip: _initialSingleSlot.pip,
            remainingLiquidity: 0,
            startPip: 0,
            lastMatchedPip: _initialSingleSlot.pip,
            basisPoint: uint32(getBasisPoint()),
            baseBasisPoint: uint32(getBaseBasisPoint()),
            isFullBuy: 0,
            isSkipFirstPip: false
        });
        uint256 passedPipCount = 0;
        {
            CurrentLiquiditySide currentLiquiditySide = CurrentLiquiditySide(
                _initialSingleSlot.isFullBuy
            );
            if (currentLiquiditySide != CurrentLiquiditySide.NotSet) {
                if (_isBuy)
                    // if buy and latest liquidity is buy. skip current pip
                    state.isSkipFirstPip =
                        currentLiquiditySide == CurrentLiquiditySide.Buy;
                    // if sell and latest liquidity is sell. skip current pip
                else
                    state.isSkipFirstPip =
                        currentLiquiditySide == CurrentLiquiditySide.Sell;
            }
        }
        while (state.remainingSize != 0) {
            StepComputations memory step;
            (step.pipNext) = liquidityBitmap.findHasLiquidityInMultipleWords(
                state.pip,
                maxWordRangeForMarketOrder,
                !_isBuy
            );

            // when open market with a limit max pip
            if (_maxPip != 0) {
                // if order is buy and step.pipNext (pip has liquidity) > maxPip then break cause this is limited to maxPip and vice versa
                if (
                    (_isBuy && step.pipNext > _maxPip) ||
                    (!_isBuy && step.pipNext < _maxPip)
                ) {
                    break;
                }
            }
            if (step.pipNext == 0) {
                // no more next pip
                // state pip back 1 pip
                if (_isBuy) {
                    state.pip--;
                } else {
                    state.pip++;
                }
                break;
            } else {
                if (!state.isSkipFirstPip) {
                    if (state.startPip == 0) state.startPip = step.pipNext;

                    // get liquidity at a tick index
                    uint128 liquidity = tickPosition[step.pipNext].liquidity;
                    if (_maxPip != 0) {
                        state.lastMatchedPip = step.pipNext;
                    }
                    uint256 orderNotional;
                    if (liquidity > state.remainingSize) {
                        // pip position will partially filled and stop here
                        orderNotional = PositionMath.calculateNotional(
                            pipToPrice(step.pipNext),
                            state.remainingSize,
                            BASE_BASIC_POINT
                        );
                        orderTrackerInterface.accumulatePartialFilledOrder(
                            step.pipNext,
                            state.remainingSize,
                            orderNotional
                        );
                        tickPosition[step.pipNext].partiallyFill(
                            state.remainingSize
                        );
                        openNotional += orderNotional;
                        // remaining liquidity at current pip
                        state.remainingLiquidity =
                            liquidity -
                            state.remainingSize;
                        state.remainingSize = 0;
                        state.pip = step.pipNext;
                        state.isFullBuy = uint8(
                            !_isBuy
                                ? CurrentLiquiditySide.Buy
                                : CurrentLiquiditySide.Sell
                        );

                    } else if (state.remainingSize > liquidity) {
                        // order in that pip will be fulfilled
                        orderNotional = PositionMath.calculateNotional(
                            pipToPrice(step.pipNext),
                            liquidity,
                            BASE_BASIC_POINT
                        );
                        orderTrackerInterface.accumulateFulfilledOrder(
                            step.pipNext,
                            liquidity,
                            orderNotional
                        );
                        state.remainingSize -= liquidity;
                        openNotional += orderNotional;
                        state.pip = state.remainingSize > 0
                            ? (_isBuy ? step.pipNext + 1 : step.pipNext - 1)
                            : step.pipNext;
                        passedPipCount++;
                    } else {
                        // remaining size = liquidity
                        // only 1 pip should be toggled, so we call it directly here
                        orderNotional = PositionMath.calculateNotional(
                            pipToPrice(step.pipNext),
                            liquidity,
                            BASE_BASIC_POINT
                        );
                        orderTrackerInterface.accumulateFulfilledOrder(
                            step.pipNext,
                            liquidity,
                            orderNotional
                        );
                        liquidityBitmap.toggleSingleBit(step.pipNext, false);
                        openNotional += orderNotional;
                        state.remainingSize = 0;
                        state.pip = step.pipNext;
                        state.isFullBuy = 0;
                    }
                } else {
                    state.isSkipFirstPip = false;
                    state.pip = _isBuy ? step.pipNext + 1 : step.pipNext - 1;
                }
            }
        }

        if (state.remainingSize != _size) {
            // if limit order with max pip filled other order, update isFullBuy
            singleSlot.isFullBuy = state.isFullBuy;

            // all ticks in shifted range must be marked as filled
            // if market order fill multiple pip, use `liquidityBitmap.unsetBitsRange` to save gas
            if (state.startPip != state.pip) {
                if (_maxPip != 0) {
                    state.pip = state.lastMatchedPip;
                }
                liquidityBitmap.unsetBitsRange(
                    state.startPip,
                    state.remainingLiquidity > 0
                        ? (_isBuy ? state.pip - 1 : state.pip + 1)
                        : state.pip
                );
            }
            // else if market order only fill one pip, use `liquidityBitmap.toggleSingleBit` to save gas
            else if (state.startPip == state.pip && state.remainingSize != 0) {
                // if limit order with max pip filled current pip, toggle current pip to initialized
                // after that when create new limit order will initialize pip again in `OpenLimitPosition`
                liquidityBitmap.toggleSingleBit(state.pip, false);
            }
        }
        if (_maxPip != 0) {
            // if limit order still have remainingSize, change current price to limit price
            // else change current price to last matched pip
            if (state.remainingSize != 0) {
                singleSlot.pip = _maxPip;
                passedPipCount = passedPipCount > 0 ? passedPipCount - 1 : 0;
            } else {
                singleSlot.pip = state.lastMatchedPip;
            }
        } else {
            singleSlot.pip = state.pip;
        }
        sizeOut = _size - state.remainingSize;
        _addReserveSnapshot();
        if (sizeOut != 0) {
            emit MarketFilled(
                _isBuy,
                sizeOut,
                _maxPip != 0 ? state.lastMatchedPip : state.pip,
                passedPipCount,
                state.remainingLiquidity
            );
        }
    }

    function _internalInsertLimitOrder(
        uint128 _orderSize,
        uint128 _pip,
        bool _hasLiquidity,
        bool _isBuy,
        address _trader
    ) internal returns (uint64) {
        return
            tickPosition[_pip].insertLimitOrder(
                _orderSize,
                _hasLiquidity,
                _isBuy,
                _trader
            );
    }

    function _requireLimitPipCloseToIndex(
        bool _isBuy,
        uint128 _limitPip,
        uint128 _currentPip,
        uint256 _underlyingPip
    ) internal {
        uint128 _maxWordRangeForLimit = maxWordRangeForLimitOrder;
        if (_isBuy && _currentPip != 0) {
            int256 maxPip = int256(_underlyingPip) -
                int128(_maxWordRangeForLimit * 250);
            if (maxPip > 0) {
                require(
                    int128(_limitPip) >= maxPip,
                    Errors.VL_MUST_CLOSE_TO_INDEX_PRICE_LONG
                );
            } else {
                require(
                    _limitPip >= 1,
                    Errors.VL_MUST_CLOSE_TO_INDEX_PRICE_LONG
                );
            }
        } else {
            require(
                _limitPip <= (_underlyingPip + _maxWordRangeForLimit * 250),
                Errors.VL_MUST_CLOSE_TO_INDEX_PRICE_SHORT
            );
        }
    }

    function _requireLastPipCloseToIndex(
        bool _isBuy,
        uint128 _lastPip,
        uint256 _underlyingPip
    ) internal {
        uint128 _maxWordRangeForMarketOrder = maxWordRangeForMarketOrder;
        bool pass;
        if (_isBuy) {
            // higher pip when long must lower than max word range for market order short
            pass =
                _lastPip <= _underlyingPip + _maxWordRangeForMarketOrder * 250;
            //            require(
            //                _lastPip <= _underlyingPip + _maxWordRangeForMarketOrder * 250,
            //                Errors.VL_MARKET_ORDER_MUST_CLOSE_TO_INDEX_PRICE
            //            );
        } else {
            // lower pip when short must higher than max word range for market order long
            pass =
                int128(_lastPip) >=
                (int256(_underlyingPip) -
                    int128(_maxWordRangeForMarketOrder * 250));
            //            require(
            //                int128(_lastPip) >=
            //                    (int256(_underlyingPip) -
            //                        int128(_maxWordRangeForMarketOrder * 250)),
            //                Errors.VL_MARKET_ORDER_MUST_CLOSE_TO_INDEX_PRICE
            //            );
        }
        require(pass, Errors.VL_MARKET_ORDER_MUST_CLOSE_TO_INDEX_PRICE);
    }

    function _getPriceWithSpecificSnapshot(TwapPriceCalcParams memory _params)
        internal
        view
        virtual
        returns (uint256)
    {
        return pipToPrice(reserveSnapshots[_params.snapshotIndex].pip);
    }

    function _now() internal view virtual returns (uint64) {
        return uint64(block.timestamp);
    }

    function _blocknumber() internal view virtual returns (uint64) {
        return uint64(block.number);
    }

    function _formatPriceFeedToBaseBasisPoint(uint256 _price)
        internal
        view
        virtual
        returns (uint256)
    {
        return (_price * BASE_BASIC_POINT) / PRICE_FEED_TOKEN_DIGIT;
    }

    // update funding rate = premiumFraction / twapIndexPrice
    function _updateFundingRate(
        int256 _premiumFraction,
        uint256 _underlyingPrice
    ) internal {
        fundingRate = _premiumFraction / int256(_underlyingPrice);
        // emit FundingRateUpdated(fundingRate, _underlyingPrice);
    }

    function _addReserveSnapshot() internal {
        uint64 currentBlock = _blocknumber();
        ReserveSnapshot memory latestSnapshot = reserveSnapshots[
            reserveSnapshots.length - 1
        ];
        if (currentBlock == latestSnapshot.blockNumber) {
            reserveSnapshots[reserveSnapshots.length - 1].pip = singleSlot.pip;
        } else {
            reserveSnapshots.push(
                ReserveSnapshot(singleSlot.pip, _now(), currentBlock)
            );
        }
    }

    function getRequestId() public view returns (uint256) {
        return requestId;
    }
}
