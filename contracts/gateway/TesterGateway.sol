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
import "../adapter/PositionManagerAdapter.sol";
import "../adapter/PositionHouseAdapter.sol";
import "../library/types/PositionStrategyOrderStorage.sol";
import "../library/types/PositionHouseStorage.sol";
import "../library/positions/Position.sol";
import "../library/positions/HouseBaseParam.sol";
import {PositionMath} from "../library/positions/PositionMath.sol";
import {Int256Math} from "../library/helpers/Int256Math.sol";
import {Errors} from "../library/helpers/Errors.sol";

contract TesterGateway is
    PausableUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using Int256Math for int256;
    using Quantity for int256;
    using Position for Position.Data;
    using PositionManagerAdapter for TesterGateway;
    using PositionHouseAdapter for TesterGateway;

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
        require(
            _positionHouseAddress != address(0) &&
                _positionStrategyOrderAddress != address(0) &&
                _positionHouseConfigurationProxyAddress != address(0) &&
                _insuranceFundAddress != address(0),
            Errors.VL_INVALID_INPUT
        );
        __ReentrancyGuard_init();
        __Ownable_init();
        __Pausable_init();

        positionHouseInterface = IPositionHouse(_positionHouseAddress);
        positionStrategyOrderInterface = IPositionStrategyOrder(
            _positionStrategyOrderAddress
        );
        positionHouseConfigurationProxyInterface = IPositionHouseConfigurationProxy(
            _positionHouseConfigurationProxyAddress
        );
        insuranceFundInterface = IInsuranceFund(_insuranceFundAddress);
    }

    function openMarketPosition(
        IPositionManager _positionManagerInterface,
        Position.Side _side,
        uint256 _quantity,
        uint16 _leverage
    ) public nonReentrant {
        address _trader = msg.sender;
        HouseBaseParam.OpenMarketOrderParams memory param;
        {
            param = HouseBaseParam.OpenMarketOrderParams({
                positionManager: _positionManagerInterface,
                side: _side,
                quantity: _quantity,
                leverage: _leverage,
                trader: _trader,
                initialMargin: 0,
                busdBonusAmount: 0
            });
        }
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount
        ) = positionHouseInterface.openMarketPosition(param);
        _handleMarginToInsuranceFund(
            _positionManagerInterface,
            _trader,
            depositAmount,
            fee,
            withdrawAmount
        );
    }

    function openMarketPositionWithDeposit(
        IPositionManager _positionManagerInterface,
        Position.Side _side,
        uint256 _quantity,
        uint16 _leverage,
        uint256 _depositedAmount
    ) public nonReentrant {
        address _trader = msg.sender;
        HouseBaseParam.OpenMarketOrderParams memory param;
        {
            param = HouseBaseParam.OpenMarketOrderParams({
                positionManager: _positionManagerInterface,
                side: _side,
                quantity: _quantity,
                leverage: _leverage,
                trader: _trader,
                initialMargin: _depositedAmount,
                busdBonusAmount: 0
            });
        }
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount
        ) = positionHouseInterface.openMarketPosition(param);
        _handleMarginToInsuranceFund(
            _positionManagerInterface,
            _trader,
            depositAmount,
            fee,
            withdrawAmount
        );
    }

    function openLimitOrder(
        IPositionManager _positionManagerInterface,
        Position.Side _side,
        uint256 _uQuantity,
        uint128 _pip,
        uint16 _leverage
    ) public nonReentrant {
        address _trader = msg.sender;
        HouseBaseParam.OpenLimitOrderParams memory param;
        {
            param = HouseBaseParam.OpenLimitOrderParams({
                positionManager: _positionManagerInterface,
                side: _side,
                quantity: _uQuantity,
                pip: _pip,
                leverage: _leverage,
                trader: _trader,
                initialMargin: 0,
                busdBonusAmount: 0,
                sourceChainRequestKey: 0
            });
        }
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount
        ) = positionHouseInterface.openLimitOrder(param);
        _handleMarginToInsuranceFund(
            _positionManagerInterface,
            _trader,
            depositAmount,
            fee,
            withdrawAmount
        );
    }

    function openLimitOrderWithDeposit(
        IPositionManager _positionManagerInterface,
        Position.Side _side,
        uint256 _uQuantity,
        uint128 _pip,
        uint16 _leverage,
        uint256 _depositedAmount
    ) public nonReentrant {
        address _trader = msg.sender;
        HouseBaseParam.OpenLimitOrderParams memory param;
        {
            param = HouseBaseParam.OpenLimitOrderParams({
                positionManager: _positionManagerInterface,
                side: _side,
                quantity: _uQuantity,
                pip: _pip,
                leverage: _leverage,
                trader: _trader,
                initialMargin: _depositedAmount,
                busdBonusAmount: 0,
                sourceChainRequestKey: 0
            });
        }
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount
        ) = positionHouseInterface.openLimitOrder(param);
        _handleMarginToInsuranceFund(
            _positionManagerInterface,
            _trader,
            depositAmount,
            fee,
            withdrawAmount
        );
    }

    function cancelLimitOrder(
        IPositionManager _positionManagerInterface,
        uint64 _orderIdx,
        uint8 _isReduce
    ) external nonReentrant {
        address _trader = msg.sender;
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount
        ) = positionHouseInterface.cancelLimitOrder(
                _positionManagerInterface,
                _orderIdx,
                _isReduce,
                _trader
            );
        _handleMarginToInsuranceFund(
            _positionManagerInterface,
            _trader,
            depositAmount,
            fee,
            withdrawAmount
        );
    }

    // DEPRECATED
    //    function cancelAllPendingOrder(IPositionManager _positionManagerInterface)
    //        external
    //        nonReentrant
    //    {
    //        address _trader = msg.sender;
    //        (
    //            uint256 depositAmount,
    //            uint256 fee,
    //            uint256 withdrawAmount
    //        ) = positionHouseInterface.cancelAllPendingOrder(
    //                _positionManagerInterface,
    //                _trader
    //            );
    //        _handleMarginToInsuranceFund(
    //            _positionManagerInterface,
    //            _trader,
    //            depositAmount,
    //            fee,
    //            withdrawAmount
    //        );
    //    }

    function addMargin(
        IPositionManager _positionManagerInterface,
        uint256 _amount
    ) external nonReentrant {
        address _trader = msg.sender;
        (uint256 depositAmount, uint256 fee, uint256 withdrawAmount) = positionHouseInterface
            .addMargin(
                _positionManagerInterface,
                _amount,
                // busd bonus amount
                0,
                _trader
            );
        _handleMarginToInsuranceFund(
            _positionManagerInterface,
            _trader,
            depositAmount,
            fee,
            withdrawAmount
        );
    }

    function removeMargin(
        IPositionManager _positionManagerInterface,
        uint256 _amount
    ) external nonReentrant {
        address _trader = msg.sender;
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount
        ) = positionHouseInterface.removeMargin(
                _positionManagerInterface,
                _amount,
                _trader
            );
        _handleMarginToInsuranceFund(
            _positionManagerInterface,
            _trader,
            depositAmount,
            fee,
            withdrawAmount
        );
    }

    function closePosition(
        IPositionManager _positionManagerInterface,
        uint256 _quantity
    ) public nonReentrant {
        address _trader = msg.sender;
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount
        ) = positionHouseInterface.closePosition(
                _positionManagerInterface,
                _quantity,
                _trader
            );
        _handleMarginToInsuranceFund(
            _positionManagerInterface,
            _trader,
            depositAmount,
            fee,
            withdrawAmount
        );
    }

    function instantlyClosePosition(
        IPositionManager _positionManagerInterface,
        uint256 _quantity
    ) public nonReentrant {
        address _trader = msg.sender;
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount
        ) = positionHouseInterface.instantlyClosePosition(
                _positionManagerInterface,
                _quantity,
                _trader
            );
        _handleMarginToInsuranceFund(
            _positionManagerInterface,
            _trader,
            depositAmount,
            fee,
            withdrawAmount
        );
    }

    function closeLimitPosition(
        IPositionManager _positionManagerInterface,
        uint128 _pip,
        uint256 _quantity
    ) public nonReentrant {
        address _trader = msg.sender;
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount
        ) = positionHouseInterface.closeLimitPosition(
                _positionManagerInterface,
                _pip,
                _quantity,
                _trader
            );
        _handleMarginToInsuranceFund(
            _positionManagerInterface,
            _trader,
            depositAmount,
            fee,
            withdrawAmount
        );
    }

    function claimFund(IPositionManager _positionManagerInterface)
        public
        nonReentrant
    {
        address _trader = msg.sender;
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount
        ) = positionHouseInterface.claimFund(
                _positionManagerInterface,
                _trader
            );
        _handleMarginToInsuranceFund(
            _positionManagerInterface,
            _trader,
            depositAmount,
            fee,
            withdrawAmount
        );
    }

    function triggerTPSL(address _pmAddress, address _trader)
        external
        nonReentrant
    {
        (
            uint256 depositAmount,
            uint256 fee,
            uint256 withdrawAmount,
        ) = positionStrategyOrderInterface.triggerTPSL(_pmAddress, _trader);
        _handleMarginToInsuranceFund(
            IPositionManager(_pmAddress),
            _trader,
            depositAmount,
            fee,
            withdrawAmount
        );
    }

    function setTPSL(
        address _pmAddress,
        uint128 _higherPip,
        uint128 _lowerPip,
        PositionStrategyOrderStorage.SetTPSLOption _option
    ) external nonReentrant {
        address _trader = msg.sender;
        positionStrategyOrderInterface.setTPSL(
            _pmAddress,
            _trader,
            _higherPip,
            _lowerPip,
            _option,
            // current chain id
            0
        );
    }

    function unsetTPAndSL(address _pmAddress) external nonReentrant {
        address _trader = msg.sender;
        positionStrategyOrderInterface.unsetTPAndSL(_pmAddress, _trader);
    }

    function unsetTPOrSL(address _pmAddress, bool _isHigherPrice)
        external
        nonReentrant
    {
        address _trader = msg.sender;
        positionStrategyOrderInterface.unsetTPOrSL(
            _pmAddress,
            _trader,
            _isHigherPrice
        );
    }

    function payFunding(IPositionManager _positionManagerInterface)
        public
        nonReentrant
    {
        positionHouseInterface.payFunding(_positionManagerInterface);
    }

    function getTPSLDetail(address _pmAddress, address _trader)
        public
        view
        returns (uint120 lowerPip, uint120 higherPip)
    {
        return
            positionStrategyOrderInterface.getTPSLDetail(_pmAddress, _trader);
    }

    function getClaimAmount(address _pmAddress, address _trader)
        public
        view
        returns (int256 totalClaimableAmount)
    {
        return
            PositionManagerAdapter.getClaimAmount(
                _pmAddress,
                positionHouseInterface.getAddedMargin(_pmAddress, _trader),
                positionHouseInterface.getDebtPosition(_pmAddress, _trader),
                positionHouseInterface.positionMap(_pmAddress, _trader),
                positionHouseInterface.getLimitOrders(_pmAddress, _trader),
                positionHouseInterface.getReduceLimitOrders(
                    _pmAddress,
                    _trader
                ),
                positionHouseInterface.getLimitOrderPremiumFraction(
                    _pmAddress,
                    _trader
                ),
                positionHouseInterface.getLatestCumulativePremiumFraction(
                    _pmAddress
                )
            );
    }

    function getListOrderPending(address _pmAddress, address _trader)
        public
        view
        returns (PositionHouseStorage.LimitOrderPending[] memory)
    {
        return
            PositionManagerAdapter.getListOrderPending(
                _pmAddress,
                _trader,
                positionHouseInterface.getLimitOrders(_pmAddress, _trader),
                positionHouseInterface.getReduceLimitOrders(_pmAddress, _trader)
            );
    }

    function getNextFundingTime(IPositionManager _positionManagerInterface)
        external
        view
        returns (uint256)
    {
        return _positionManagerInterface.getNextFundingTime();
    }

    function getCurrentFundingRate(IPositionManager _positionManagerInterface)
        external
        view
        returns (int256)
    {
        return _positionManagerInterface.getCurrentFundingRate();
    }

    function getAddedMargin(address _pmAddress, address _trader)
        public
        view
        returns (int256)
    {
        return positionHouseInterface.getAddedMargin(_pmAddress, _trader);
    }

    function getRemovableMargin(
        IPositionManager _positionManagerInterface,
        address _trader
    ) public view returns (uint256) {
        int256 _marginAdded = positionHouseInterface.getAddedMargin(
            address(_positionManagerInterface),
            _trader
        );
        (
            uint256 maintenanceMargin,
            int256 marginBalance,
            ,

        ) = getMaintenanceDetail(
                _positionManagerInterface,
                _trader,
                PositionHouseStorage.PnlCalcOption.TWAP
            );
        int256 _remainingMargin = marginBalance - int256(maintenanceMargin);
        return
            uint256(
                _marginAdded <= _remainingMargin
                    ? _marginAdded
                    : _remainingMargin.kPositive()
            );
    }

    function getMaintenanceDetail(
        IPositionManager _positionManagerInterface,
        address _trader,
        PositionHouseStorage.PnlCalcOption _calcOption
    )
        public
        view
        returns (
            uint256 maintenanceMargin,
            int256 marginBalance,
            uint256 marginRatio,
            uint256 liquidationPip
        )
    {
        address _pmAddress = address(_positionManagerInterface);
        Position.Data memory _positionDataWithManualMargin = getPosition(
            _pmAddress,
            _trader
        );
        (, int256 unrealizedPnl) = getPositionNotionalAndUnrealizedPnl(
            _positionManagerInterface,
            _trader,
            _calcOption,
            _positionDataWithManualMargin
        );
        PositionHouseAdapter.GetMaintenanceDetailParam
            memory param = PositionHouseAdapter.GetMaintenanceDetailParam({
                positionDataWithManualMargin: _positionDataWithManualMargin,
                positionHouseInterface: positionHouseInterface,
                pmAddress: _pmAddress,
                trader: _trader,
                unrealizedPnl: unrealizedPnl,
                maintenanceMarginRatio: positionHouseConfigurationProxyInterface
                    .maintenanceMarginRatio(),
                basisPoint: uint64(_positionManagerInterface.getBasisPoint())
            });

        return PositionHouseAdapter.getMaintenanceDetail(param);
    }

    function getPositionNotionalAndUnrealizedPnl(
        IPositionManager _positionManagerInterface,
        address _trader,
        PositionHouseStorage.PnlCalcOption _pnlCalcOption,
        Position.Data memory _positionData
    ) public view returns (uint256 positionNotional, int256 unrealizedPnl) {
        (positionNotional, unrealizedPnl) = PositionManagerAdapter
            .getPositionNotionalAndUnrealizedPnl(
                address(_positionManagerInterface),
                _trader,
                _pnlCalcOption,
                _positionData
            );
    }

    function getPositionAndUnreliablePnl(
        IPositionManager _positionManagerInterface,
        address _trader,
        PositionHouseStorage.PnlCalcOption _pnlCalcOption
    )
        public
        view
        returns (
            Position.Data memory position,
            uint256 positionNotional,
            int256 unrealizedPnl
        )
    {
        position = getPosition(address(_positionManagerInterface), _trader);
        (positionNotional, unrealizedPnl) = getPositionNotionalAndUnrealizedPnl(
            _positionManagerInterface,
            _trader,
            _pnlCalcOption,
            position
        );
    }

    function getFundingPaymentAmount(
        IPositionManager _positionManagerInterface,
        address _trader
    ) public view returns (int256 fundingPayment) {
        address _pmAddress = address(_positionManagerInterface);
        Position.Data memory _positionData = getPositionWithoutManualMargin(
            _pmAddress,
            _trader
        );
        int256 manualAddedMargin = getAddedMargin(_pmAddress, _trader);
        (, , fundingPayment) = PositionMath.calcRemainMarginWithFundingPayment(
            _positionData,
            _positionData.margin + manualAddedMargin,
            positionHouseInterface.getLatestCumulativePremiumFraction(
                _pmAddress
            )
        );
    }

    function getLatestCumulativePremiumFraction(address _pmAddress)
        public
        view
        returns (int128)
    {
        return
            positionHouseInterface.getLatestCumulativePremiumFraction(
                _pmAddress
            );
    }

    function getPosition(address _pmAddress, address _trader)
        public
        view
        returns (Position.Data memory positionData)
    {
        positionData = positionHouseInterface.getPosition(_pmAddress, _trader);
        positionData.margin =
            positionData.margin.absInt() +
            positionHouseInterface.getAddedMargin(_pmAddress, _trader);
    }

    function getPositionWithoutManualMargin(address _pmAddress, address _trader)
        public
        view
        returns (Position.Data memory positionData)
    {
        positionData = positionHouseInterface.getPosition(_pmAddress, _trader);
        positionData.margin = positionData.margin.absInt();
    }

    /// @notice Get mark price (twap of last price in selected pair)
    /// @param _positionManagerInterface position manager interface address
    /// @param _interval interval time to get twap price
    /// @return _markPrice in wei (10**18)
    function getMarkPrice(
        IPositionManager _positionManagerInterface,
        uint256 _interval
    ) public view returns (uint256) {
        uint256 baseBasisPoint = _positionManagerInterface.getBaseBasisPoint();
        uint256 markPrice = _positionManagerInterface.getTwapPrice(_interval);
        return _formatBaseBasisPriceToWei(markPrice, baseBasisPoint);
    }

    /// @notice Get index price (twap of index price in selected pair)
    /// @param _positionManagerInterface position manager interface address
    /// @param _interval interval time to get twap price
    /// @return _indexPrice in wei (10**18)
    function getIndexPrice(
        IPositionManager _positionManagerInterface,
        uint256 _interval
    ) public view returns (uint256) {
        uint256 baseBasisPoint = _positionManagerInterface.getBaseBasisPoint();
        uint256 indexPrice = _positionManagerInterface.getUnderlyingTwapPrice(
            _interval
        );
        return _formatBaseBasisPriceToWei(indexPrice, baseBasisPoint);
    }

    struct PipLiquidity {
        uint128 pip;
        uint128 liquidity;
    }

    function getOrderbook(
        IPositionManager _positionManagerInterface,
        uint256 _dataLength
    ) public view returns (PipLiquidity[] memory, PipLiquidity[] memory) {
        // isFullBuy == 0 => not set
        // isFullBuy == 1 => buy
        // isFullBuy == 2 => sell
        (uint128 currentPip, uint128 isFullBuy) = _positionManagerInterface
            .getCurrentSingleSlot();

        uint128 startBuyPip = currentPip;
        uint128 startSellPip = currentPip;

        if (isFullBuy == 1) {
            // currentPip has buy order => startSellPip = currentPip + 1;
            startSellPip += 1;
        } else if (isFullBuy == 2) {
            // currentPip has sell order => startBuyPip = currentPip - 1;
            startBuyPip -= 1;
        }
        // get all initialized pip lower than _fromPip
        uint128[] memory lowerInitializedPips = _positionManagerInterface
            .getAllInitializedPips(startBuyPip, _dataLength, true);
        // get all initialized pip higher than _fromPip
        uint128[] memory higherInitializedPips = _positionManagerInterface
            .getAllInitializedPips(startSellPip, _dataLength, false);

        PipLiquidity[] memory buyOrders = new PipLiquidity[](_dataLength);
        PipLiquidity[] memory sellOrders = new PipLiquidity[](_dataLength);

        // get buy orders data
        for (uint256 i = 0; i < _dataLength; i++) {
            if (lowerInitializedPips[i] == 0) {
                break;
            }
            buyOrders[i] = PipLiquidity({
                pip: lowerInitializedPips[i],
                liquidity: _positionManagerInterface.getLiquidityInPip(
                    lowerInitializedPips[i]
                )
            });
        }

        // get sell orders data
        for (uint256 i = 0; i < _dataLength; i++) {
            if (higherInitializedPips[i] == 0) {
                break;
            }
            sellOrders[i] = PipLiquidity({
                pip: higherInitializedPips[i],
                liquidity: _positionManagerInterface.getLiquidityInPip(
                    higherInitializedPips[i]
                )
            });
        }
        return (buyOrders, sellOrders);
    }

    function _handleMarginToInsuranceFund(
        IPositionManager _positionManagerInterface,
        address _trader,
        uint256 _depositAmount,
        uint256 _fee,
        uint256 _withdrawAmount
    ) internal {
        if (_depositAmount > _withdrawAmount) {
            insuranceFundInterface.deposit(
                address(_positionManagerInterface),
                _trader,
                _depositAmount - _withdrawAmount,
                _fee
            );
        } else {
            insuranceFundInterface.withdraw(
                address(_positionManagerInterface),
                _trader,
                _withdrawAmount - _depositAmount
            );
        }
    }

    function _formatBaseBasisPriceToWei(uint256 _price, uint256 _baseBasisPoint)
        internal
        view
        returns (uint256)
    {
        return (_price * 10**18) / _baseBasisPoint;
    }

    function updatePositionStrategyOrder(address _strategyOrderAddress) public {
        positionStrategyOrderInterface = IPositionStrategyOrder(
            _strategyOrderAddress
        );
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}
