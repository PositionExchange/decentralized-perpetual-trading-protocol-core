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
import "../core/CurrentTradingChain.sol";

contract UserGateway is
    PausableUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using Int256Math for int256;
    using Quantity for int256;
    using Position for Position.Data;
    using PositionManagerAdapter for UserGateway;
    using PositionHouseAdapter for UserGateway;

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

    function payFunding(
        IPositionManager _positionManagerInterface
    ) public nonReentrant {
        positionHouseInterface.payFunding(_positionManagerInterface);
    }

    function payFundingMultiplePair(IPositionManager[] memory _positionManagerInterfaces) public nonReentrant {
        for (uint256 i = 0; i < _positionManagerInterfaces.length; i++) {
            positionHouseInterface.payFunding(_positionManagerInterfaces[i]);
        }
    }

    function getTPSLDetail(
        address _pmAddress,
        address _trader
    ) public view returns (uint120 lowerPip, uint120 higherPip) {
        return
            positionStrategyOrderInterface.getTPSLDetail(_pmAddress, _trader);
    }

//    function getClaimAmount(
//        address _pmAddress,
//        address _trader
//    ) public view returns (int256 totalClaimableAmount) {
//        return
//            PositionManagerAdapter.getClaimAmount(
//                _pmAddress,
//                positionHouseInterface.getAddedMargin(_pmAddress, _trader),
//                positionHouseInterface.getDebtPosition(_pmAddress, _trader),
//                positionHouseInterface.positionMap(_pmAddress, _trader),
//                positionHouseInterface.getLimitOrders(_pmAddress, _trader),
//                positionHouseInterface.getReduceLimitOrders(
//                    _pmAddress,
//                    _trader
//                ),
//                positionHouseInterface.getLimitOrderPremiumFraction(
//                    _pmAddress,
//                    _trader
//                ),
//                positionHouseInterface.getLatestCumulativePremiumFraction(
//                    _pmAddress
//                )
//            );
//    }

    function getListOrderPending(
        address _pmAddress,
        address _trader
    ) public view returns (PositionHouseStorage.LimitOrderPending[] memory, uint256 activeChain) {
        return
            (
                PositionManagerAdapter.getListOrderPending(
                _pmAddress,
                _trader,
                positionHouseInterface.getLimitOrders(_pmAddress, _trader),
                positionHouseInterface.getReduceLimitOrders(_pmAddress, _trader)
            ),
            getActiveChain(_pmAddress, _trader)

            );
    }

    function getNextFundingTime(
        IPositionManager _positionManagerInterface
    ) external view returns (uint256) {
        return _positionManagerInterface.getNextFundingTime();
    }

    function getCurrentFundingRate(
        IPositionManager _positionManagerInterface
    ) external view returns (int256) {
        return _positionManagerInterface.getCurrentFundingRate();
    }

    function getAddedMargin(
        address _pmAddress,
        address _trader
    ) public view returns (int256) {
        return positionHouseInterface.getAddedMargin(_pmAddress, _trader);
    }

    function getRemovableMargin(
        IPositionManager _positionManagerInterface,
        address _trader
    ) public view returns (uint256, uint256 activeChain) {
        int256 _marginAdded = positionHouseInterface.getAddedMargin(
            address(_positionManagerInterface),
            _trader
        );
        (
            uint256 maintenanceMargin,
            int256 marginBalance,
            ,
            ,
            uint256 _activeChain
        ) = getMaintenanceDetail(
                _positionManagerInterface,
                _trader,
                PositionHouseStorage.PnlCalcOption.TWAP
            );
        activeChain =  _activeChain;
        int256 _remainingMargin = marginBalance - int256(maintenanceMargin);
        return (
            uint256(
                _marginAdded <= _remainingMargin
                    ? _marginAdded
                    : _remainingMargin.kPositive()
            ),
            activeChain)
        ;
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
            uint256 liquidationPip,
            uint256 activeChain
        )
    {
        address _pmAddress = address(_positionManagerInterface);

        (Position.Data memory _positionDataWithManualMargin, ) = getPosition(
            _pmAddress,
            _trader
        );
        (, int256 unrealizedPnl, uint256 _activeChain) = getPositionNotionalAndUnrealizedPnl(
            _positionManagerInterface,
            _trader,
            _calcOption,
            _positionDataWithManualMargin
        );
        activeChain = _activeChain;
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


        (
            uint256 maintenanceMargin,
            int256 marginBalance,
            uint256 marginRatio,
            uint256 liquidationPip
        ) = PositionHouseAdapter.getMaintenanceDetail(param);


        return (
            maintenanceMargin,
            marginBalance,
            marginRatio,
            liquidationPip,
            activeChain
        );
    }

    function getPositionNotionalAndUnrealizedPnl(
        IPositionManager _positionManagerInterface,
        address _trader,
        PositionHouseStorage.PnlCalcOption _pnlCalcOption,
        Position.Data memory _positionData
    ) public view returns (uint256 positionNotional, int256 unrealizedPnl, uint256 activeChain) {
        (positionNotional, unrealizedPnl) = PositionManagerAdapter
            .getPositionNotionalAndUnrealizedPnl(
                address(_positionManagerInterface),
                _trader,
                _pnlCalcOption,
                _positionData
            );

        activeChain = getActiveChain(address(_positionManagerInterface), _trader);
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
            int256 unrealizedPnl,
            uint256 activeChain
        )
    {
        (position, activeChain) = getPosition(address(_positionManagerInterface), _trader);
        (positionNotional, unrealizedPnl,) = getPositionNotionalAndUnrealizedPnl(
            _positionManagerInterface,
            _trader,
            _pnlCalcOption,
            position
        );
    }

    function getFundingPaymentAmount(
        IPositionManager _positionManagerInterface,
        address _trader
    ) public view returns (int256 fundingPayment, uint256 activeChain){
        address _pmAddress = address(_positionManagerInterface);
        (Position.Data memory _positionData, uint256 _activeChain) = getPositionWithoutManualMargin(
            _pmAddress,
            _trader
        );
        activeChain = _activeChain;
        int256 manualAddedMargin = getAddedMargin(_pmAddress, _trader);
        (, , fundingPayment) = PositionMath.calcRemainMarginWithFundingPayment(
            _positionData,
            _positionData.margin + manualAddedMargin,
            positionHouseInterface.getLatestCumulativePremiumFraction(
                _pmAddress
            )
        );
    }

    function getLatestCumulativePremiumFraction(
        address _pmAddress
    ) public view returns (int128) {
        return
            positionHouseInterface.getLatestCumulativePremiumFraction(
                _pmAddress
            );
    }

    function getPosition(
        address _pmAddress,
        address _trader
    ) public view returns (Position.Data memory positionData, uint256 activeChain) {
        positionData = positionHouseInterface.getPosition(_pmAddress, _trader);
        positionData.margin =
            positionData.margin.absInt() +
            positionHouseInterface.getAddedMargin(_pmAddress, _trader);

        activeChain = getActiveChain(_pmAddress, _trader);
    }

    // only for client use, return margin is unsigned
    function getPositionWithoutManualMargin(
        address _pmAddress,
        address _trader
    ) public view returns (Position.Data memory positionData, uint256 activeChain) {
        positionData = positionHouseInterface.getPosition(_pmAddress, _trader);
        positionData.margin = positionData.margin.absInt();
        activeChain = getActiveChain(_pmAddress, _trader);

    }

    function getRemainingBusdBonusAccepted(
        address _pmAddress,
        address _trader
    ) public view returns (uint256) {
        return
            insuranceFundInterface.getRemainingBusdBonusAccepted(
                _pmAddress,
                _trader
            );
    }

    function getActiveChain(address _pmAddress, address _trader) public view returns (uint256) {
        return currentTradingChain.getCurrentTradingChain(_pmAddress, _trader);
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

    //    function getOrderbook(
    //        IPositionManager _positionManagerInterface,
    //        uint256 _dataLength
    //    ) public view returns (PipLiquidity[] memory, PipLiquidity[] memory) {
    //        // isFullBuy == 0 => not set
    //        // isFullBuy == 1 => buy
    //        // isFullBuy == 2 => sell
    //        (uint128 currentPip, uint128 isFullBuy) = _positionManagerInterface
    //            .getCurrentSingleSlot();
    //
    //        uint128 startBuyPip = currentPip;
    //        uint128 startSellPip = currentPip;
    //
    //        if (isFullBuy == 1) {
    //            // currentPip has buy order => startSellPip = currentPip + 1;
    //            startSellPip += 1;
    //        } else if (isFullBuy == 2) {
    //            // currentPip has sell order => startBuyPip = currentPip - 1;
    //            startBuyPip -= 1;
    //        }
    //        // get all initialized pip lower than _fromPip
    //        uint128[] memory lowerInitializedPips = _positionManagerInterface
    //            .getAllInitializedPips(startBuyPip, _dataLength, true);
    //        // get all initialized pip higher than _fromPip
    //        uint128[] memory higherInitializedPips = _positionManagerInterface
    //            .getAllInitializedPips(startSellPip, _dataLength, false);
    //
    //        PipLiquidity[] memory buyOrders = new PipLiquidity[](_dataLength);
    //        PipLiquidity[] memory sellOrders = new PipLiquidity[](_dataLength);
    //
    //        // get buy orders data
    //        for (uint256 i = 0; i < _dataLength; i++) {
    //            if (lowerInitializedPips[i] == 0) {
    //                break;
    //            }
    //            buyOrders[i] = PipLiquidity({
    //                pip: lowerInitializedPips[i],
    //                liquidity: _positionManagerInterface.getLiquidityInPip(
    //                    lowerInitializedPips[i]
    //                )
    //            });
    //        }
    //
    //        // get sell orders data
    //        for (uint256 i = 0; i < _dataLength; i++) {
    //            if (higherInitializedPips[i] == 0) {
    //                break;
    //            }
    //            sellOrders[i] = PipLiquidity({
    //                pip: higherInitializedPips[i],
    //                liquidity: _positionManagerInterface.getLiquidityInPip(
    //                    higherInitializedPips[i]
    //                )
    //            });
    //        }
    //        return (buyOrders, sellOrders);
    //    }

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

    function _formatBaseBasisPriceToWei(
        uint256 _price,
        uint256 _baseBasisPoint
    ) internal view returns (uint256) {
        return (_price * 10 ** 18) / _baseBasisPoint;
    }

    function setPositionStrategyOrder(address _strategyOrderAddress) public {
        positionStrategyOrderInterface = IPositionStrategyOrder(
            _strategyOrderAddress
        );
    }

    function setPositionHouse(address _address) public {
        positionHouseInterface = IPositionHouse(_address);
    }


    function setCurrentTradingChain(ICurrentTradingChain _currentTradingChain) external onlyOwner {
        currentTradingChain = _currentTradingChain;
    }


    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
    ICurrentTradingChain public currentTradingChain;

}
