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
import "../adapter/interfaces/IDPTPValidator.sol";
import "../adapter/interfaces/IPositionHouseConfigurationProxy.sol";
import "../adapter/PositionManagerAdapter.sol";
import "../adapter/PositionHouseAdapter.sol";
import "../library/types/PositionStrategyOrderStorage.sol";
import "../library/types/PositionHouseStorage.sol";
import "../library/positions/Position.sol";
import {PositionMath} from "../library/positions/PositionMath.sol";
import {Int256Math} from "../library/helpers/Int256Math.sol";
import {Errors} from "../library/helpers/Errors.sol";

contract LiquidatorGateway is
    PausableUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using Int256Math for int256;
    using Quantity for int256;
    using Position for Position.Data;
    using PositionManagerAdapter for LiquidatorGateway;
    using PositionHouseAdapter for LiquidatorGateway;

    IPositionHouse positionHouseInterface;
    IInsuranceFund insuranceFundInterface;
    IPositionHouseConfigurationProxy
        public positionHouseConfigurationProxyInterface;
    IDPTPValidator dptpValidator;
    // TODO upgrade for multi chain
    uint256 destinationChainID;
    address destinationFuturesGateway;
    uint256 myChainID;
    uint256 txIndex;
    bytes4 private constant LIQUIDATE_SELECTOR =
        bytes4(
            keccak256(
                "liquidateAndDistributeReward(address,address,address,uint256,uint256)"
            )
        );

    event FullyLiquidated(address pmAddress, address trader);
    event PartiallyLiquidated(address pmAddress, address trader);

    event OpenMarket(
        address trader,
        int256 quantity,
        uint256 openNotional,
        uint16 leverage,
        uint256 entryPrice,
        IPositionManager positionManager,
        uint256 margin
    );

    event CrossCall(
        bytes32 _txId,
        uint256 _timestamp,
        address _caller,
        uint256 _destBcId,
        address _destContract,
        bytes _destFunctionCall
    );

    function initialize(
        address _positionHouseAddress,
        address _positionHouseConfigurationProxyAddress,
        address _insuranceFundAddress,
        uint256 _myBlockchainId,
        uint256 _destBlockchainId
    ) public initializer {
        __ReentrancyGuard_init();
        __Ownable_init();
        __Pausable_init();

        positionHouseInterface = IPositionHouse(_positionHouseAddress);
        positionHouseConfigurationProxyInterface = IPositionHouseConfigurationProxy(
            _positionHouseConfigurationProxyAddress
        );
        insuranceFundInterface = IInsuranceFund(_insuranceFundAddress);
        destinationChainID = _destBlockchainId;
        myChainID = _myBlockchainId;
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

    function setMyChainID(uint256 _chainID) external onlyOwner {
        myChainID = _chainID;
    }

    function setDestinationChainID(uint256 _chainID) external onlyOwner {
        destinationChainID = _chainID;
    }

    function setDestinationFuturesGateway(address _address) external onlyOwner {
        destinationFuturesGateway = _address;
    }

    function setDPTPValidator(address _address) external onlyOwner {
        dptpValidator = IDPTPValidator(_address);
    }

    function liquidate(
        IPositionManager _positionManagerInterface,
        address _trader
    ) public {
        address _pmAddress = address(_positionManagerInterface);
        {
            uint256 liquidationPenalty;
            (, , uint256 marginRatio, ) = getMaintenanceDetail(
                _positionManagerInterface,
                _trader,
                PositionHouseStorage.PnlCalcOption.TWAP
            );
            uint256 _partialLiquidationRatio = positionHouseConfigurationProxyInterface
                    .partialLiquidationRatio();
            {
                require(
                    marginRatio >= _partialLiquidationRatio,
                    Errors.VL_NOT_ENOUGH_MARGIN_RATIO
                );
            }
            uint256 feeToLiquidator;
            Position.Data memory positionDataWithManualMargin = getPosition(
                _pmAddress,
                _trader
            );
            if (marginRatio < 100) {
                // Step base size of usd-m contract
                uint256 stepBaseSize = _positionManagerInterface
                    .getStepBaseSize();
                (
                    ,
                    uint256 liquidationPenaltyRatio
                ) = positionHouseConfigurationProxyInterface
                        .getLiquidationRatio();
                // calculate amount quantity of position to reduce
                int256 partiallyLiquidateQuantity = PositionMath
                    .getPartialLiquidateQuantity(
                        positionDataWithManualMargin.quantity,
                        liquidationPenaltyRatio,
                        stepBaseSize
                    );
                require(
                    partiallyLiquidateQuantity != 0,
                    Errors.VL_INVALID_SIZE
                );
                // partially liquidate position by reduce position's quantity
                if (partiallyLiquidateQuantity.abs() > 0) {
                    PositionHouseStorage.PositionResp
                        memory positionResp = partialLiquidate(
                            _positionManagerInterface,
                            partiallyLiquidateQuantity,
                            positionDataWithManualMargin,
                            _trader
                        );

                    // half of the liquidationFee goes to liquidator & another half goes to insurance fund
                    liquidationPenalty = uint256(positionResp.marginToVault);
                    feeToLiquidator = liquidationPenalty / 2;
                    uint256 feeToInsuranceFund = liquidationPenalty -
                        feeToLiquidator;
                    emit PartiallyLiquidated(_pmAddress, _trader);
                }
            } else {
                (
                    uint256 _liquidationFeeRatio,

                ) = positionHouseConfigurationProxyInterface
                        .getLiquidationRatio();
                // fully liquidate trader's position
                liquidationPenalty = positionDataWithManualMargin.margin.abs();
                int256 totalClosedPnlAndMarginFromTrader;
                {
                    address a = _pmAddress;
                    address t = _trader;
                    totalClosedPnlAndMarginFromTrader = PositionManagerAdapter
                        .getClaimAmountWhenLiquidated(
                            a,
                            positionHouseInterface.getAddedMargin(a, t),
                            positionHouseInterface.getDebtPosition(a, t),
                            positionHouseInterface.positionMap(a, t),
                            positionHouseInterface.getLimitOrders(a, t),
                            positionHouseInterface.getReduceLimitOrders(a, t),
                            positionHouseInterface.getLimitOrderPremiumFraction(
                                    a,
                                    t
                                ),
                            positionHouseInterface
                                .getLatestCumulativePremiumFraction(a)
                        );
                }
                positionHouseInterface.clearTraderData(_pmAddress, _trader);
                // after clear position, create an opposite market order of old position

                _openLiquidateOrder(
                    _positionManagerInterface,
                    _trader,
                    positionDataWithManualMargin,
                    positionDataWithManualMargin.quantity.abs()
                );
                feeToLiquidator =
                    (liquidationPenalty * _liquidationFeeRatio) /
                    2 /
                    100;
                // return closed profit by limit order to trader
                insuranceFundInterface.withdraw(
                    _pmAddress,
                    _trader,
                    totalClosedPnlAndMarginFromTrader.abs()
                );
                insuranceFundInterface.reduceBonus(_pmAddress, _trader, 0);
                emit FullyLiquidated(_pmAddress, _trader);
            }
            address _liquidator = msg.sender;
            handleLiquidatedEvent(
                _pmAddress,
                _liquidator,
                _trader,
                liquidationPenalty,
                feeToLiquidator
            );
            dptpValidator.updateTraderData(_trader,_pmAddress);
            insuranceFundInterface.withdraw(
                _pmAddress,
                _liquidator,
                feeToLiquidator
            );
        }
    }

    function _openLiquidateOrder(
        IPositionManager _positionManagerInterface,
        address _trader,
        Position.Data memory _positionData,
        uint256 _liquidatedQuantity
    ) internal {
        bool _liquidateOrderIsBuy = _positionData.quantity > 0 ? false : true;
        (
            uint256 sizeOut,
            uint256 openNotional,
            uint256 entryPrice,
            uint256 fee
        ) = _positionManagerInterface.openMarketPosition(
                _trader,
                _liquidatedQuantity != 0
                    ? _liquidatedQuantity
                    : _positionData.quantity.abs(),
                _liquidateOrderIsBuy
            );
        // filledQuantity is sizeOut in type int256
        int256 filledQuantity = _liquidateOrderIsBuy
            ? int256(sizeOut)
            : -int256(sizeOut);

        emit OpenMarket(
            _trader,
            filledQuantity,
            openNotional,
            _positionData.leverage,
            entryPrice,
            _positionManagerInterface,
            0
        );
    }

    function partialLiquidate(
        IPositionManager _positionManager,
        int256 _liquidatedQuantity,
        Position.Data memory _positionData,
        address _trader
    ) internal returns (PositionHouseStorage.PositionResp memory positionResp) {
        address _pmAddress = address(_positionManager);
        int256 _manualMargin = _getAddedMargin(_pmAddress, _trader);
        positionHouseInterface.cancelAllReduceOrder(_positionManager, _trader);
        // if current position is long (_liquidatedQuantity >0) then liquidate order is short
        bool _liquidateOrderIsBuy = _liquidatedQuantity > 0 ? false : true;
        // call directly to position manager to skip check enough liquidity

        _openLiquidateOrder(
            _positionManager,
            _trader,
            _positionData,
            _liquidatedQuantity.abs()
        );

        positionResp.exchangedQuoteAssetAmount = _liquidatedQuantity
            .getExchangedQuoteAssetAmount(
                _positionData.openNotional,
                _positionData.quantity.abs()
            );

        // TODO need to calculate remain margin with funding payment
        int256 positionMarginWithoutManual;
        {
            if (_positionData.quantity > 0) {
                positionMarginWithoutManual =
                    _positionData.margin -
                    _manualMargin;
            } else {
                positionMarginWithoutManual =
                    _positionData.margin +
                    _manualMargin;
            }
        }
        (
            int256 liquidatedPositionMargin,
            int256 liquidatedManualMargin,
            uint256 liquidatedAbsoluteMargin
        ) = PositionMath.calculatePartialLiquidateMargin(
                // TODO check later
                positionMarginWithoutManual,
                _manualMargin,
                _positionData.absoluteMargin,
                positionHouseConfigurationProxyInterface.liquidationFeeRatio()
            );
        liquidatedPositionMargin = _liquidatedQuantity *
            liquidatedPositionMargin >
            0
            ? liquidatedPositionMargin
            : -liquidatedPositionMargin;
        uint256 liquidatedMargin = liquidatedPositionMargin.abs() +
            liquidatedManualMargin.abs();
        positionResp.marginToVault = int256(liquidatedMargin);
        positionHouseInterface.updatePartialLiquidatedPosition(
            _pmAddress,
            _trader,
            _liquidatedQuantity,
            liquidatedPositionMargin,
            liquidatedAbsoluteMargin,
            positionResp.exchangedQuoteAssetAmount,
            liquidatedManualMargin
        );
        insuranceFundInterface.reduceBonus(
            _pmAddress,
            _trader,
            liquidatedMargin
        );
        return positionResp;
    }

    function handleLiquidatedEvent(
        address _pmAddress,
        address _liquidator,
        address _trader,
        uint256 _liquidatedBusdBonus,
        uint256 _liquidatorReward
    ) internal {
        crossBlockchainCall(
            destinationChainID,
            destinationFuturesGateway,
            abi.encodeWithSelector(
                LIQUIDATE_SELECTOR,
                _pmAddress,
                _liquidator,
                _trader,
                _liquidatedBusdBonus,
                _liquidatorReward
            )
        );
    }

    function crossBlockchainCall(
        uint256 _destBcId,
        address _destContract,
        bytes memory _destData
    ) internal {
        txIndex++;
        bytes32 txId = keccak256(
            abi.encodePacked(
                block.timestamp,
                myChainID,
                _destBcId,
                _destContract,
                _destData,
                txIndex
            )
        );
        emit CrossCall(
            txId,
            block.timestamp,
            msg.sender,
            _destBcId,
            _destContract,
            _destData
        );
    }

    function _getAddedMargin(address _pmAddress, address _trader)
        internal
        view
        returns (int256)
    {
        return positionHouseInterface.getAddedMargin(_pmAddress, _trader);
    }

    function getPositionWithIntMargin(address _pmAddress, address _trader)
        internal
        view
        returns (Position.Data memory positionData)
    {
        positionData = positionHouseInterface.getPosition(_pmAddress, _trader);
        int256 manualAddedMargin = positionHouseInterface.getAddedMargin(
            _pmAddress,
            _trader
        );
        positionData.margin = PositionMath.calculateMarginWithoutManual(
            positionData.quantity,
            positionData.margin,
            manualAddedMargin
        );
    }

    function getPosition(address _pmAddress, address _trader)
        internal
        view
        returns (Position.Data memory positionData)
    {
        positionData = getPositionWithoutManualMargin(_pmAddress, _trader);
        positionData.margin =
            positionData.margin.absInt() +
            _getAddedMargin(_pmAddress, _trader);
    }

    function getPositionWithoutManualMargin(address _pmAddress, address _trader)
        internal
        view
        returns (Position.Data memory positionData)
    {
        positionData = positionHouseInterface.getPosition(_pmAddress, _trader);
    }

    function getPositionHouse() external view returns (address) {
        return address(positionHouseInterface);
    }

    function setPositionHouse(address _address) external onlyOwner {
        positionHouseInterface = IPositionHouse(_address);
    }

    function getDptpValidator() external view returns (address) {
        return address(dptpValidator);
    }

    function setDptpValidator(address _address) external onlyOwner {
        dptpValidator = IDPTPValidator(_address);
    }

    function getInsuranceFundInterface() external view returns (address) {
        return address(insuranceFundInterface);
    }

    function setInsuranceFundInterface(address _address) external onlyOwner {
        insuranceFundInterface = IInsuranceFund(_address);
    }

    bytes4 private constant WITHDRAW_SELECTOR =
        bytes4(
            keccak256(
                "receiveFromOtherBlockchain(address,address,uint256,uint256)"
            )
        );
}
