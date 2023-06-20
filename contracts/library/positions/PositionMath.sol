// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import {USDMargin} from "./maths/USDMargin.sol";
import "./Position.sol";
import "../positions/Position.sol";
import "../positions/PositionLimitOrder.sol";
import "../positions/PipConversionMath.sol";
import "../positions/PositionMath.sol";
import "../helpers/Quantity.sol";
import "../helpers/Int256Math.sol";
import "../helpers/CommonMath.sol";
import "../helpers/Errors.sol";
import "../types/PositionHouseStorage.sol";

library PositionMath {
    using Position for Position.Data;
    using Position for Position.LiquidatedData;
    using Quantity for int256;
    using Quantity for int128;
    using Int256Math for int256;
    using PipConversionMath for uint128;

    int256 private constant PREMIUM_FRACTION_DENOMINATOR = 10 ** 10;

    function blockNumber() internal view returns (uint64) {
        return uint64(block.number);
    }

    function calculateNotional(
        uint256 _price,
        uint256 _quantity,
        uint256 _baseBasisPoint
    ) public pure returns (uint256) {
        return USDMargin.calculateNotional(_price, _quantity, _baseBasisPoint);
    }

    function calculateEntryPrice(
        uint256 _notional,
        uint256 _quantity,
        uint256 _baseBasisPoint
    ) public pure returns (uint256) {
        return
            USDMargin.calculateEntryPrice(
                _notional,
                _quantity,
                _baseBasisPoint
            );
    }

    function calculatePnl(
        int256 _quantity,
        uint256 _openNotional,
        uint256 _closeNotional
    ) public pure returns (int256) {
        return USDMargin.calculatePnl(_quantity, _openNotional, _closeNotional);
    }

    function calculateFundingPayment(
        int256 _deltaPremiumFraction,
        int256 _margin,
        int256 _PREMIUM_FRACTION_DENOMINATOR
    ) public pure returns (int256) {
        return
            (_margin * _deltaPremiumFraction) / _PREMIUM_FRACTION_DENOMINATOR;
    }

    function calculateLiquidationPip(
        int256 _quantity,
        uint256 _margin,
        uint256 _positionNotional,
        uint256 _maintenanceMargin,
        uint256 _basisPoint
    ) public pure returns (uint256) {
        return
            USDMargin.calculateLiquidationPip(
                _quantity,
                _margin,
                _positionNotional,
                _maintenanceMargin,
                _basisPoint
            );
    }

    function calculateRefundMarginCancelOrder(
        uint256 margin,
        uint256 refundQuantity,
        uint256 partialFilledQuantity
    ) public pure returns (uint256 refundMargin) {
        return
            (margin * refundQuantity) /
            (refundQuantity + partialFilledQuantity);
    }

    function calculatePartialLiquidateQuantity(
        int256 _quantity,
        uint256 _liquidationPenaltyRatio,
        uint256 _stepBaseSize
    ) public pure returns (int256) {
        int256 partialLiquidateQuantity = (_quantity *
            int256(_liquidationPenaltyRatio)) / 100;
        if (_stepBaseSize != 0) {
            return
                floorQuantity(partialLiquidateQuantity, int256(_stepBaseSize));
        }
        return partialLiquidateQuantity;
    }

    function floorQuantity(
        int256 _quantity,
        int256 _stepBaseSize
    ) public pure returns (int256) {
        return (_quantity / _stepBaseSize) * _stepBaseSize;
    }

    // Update Position.Data when limit order got partial filled when opening in inappropriate price (buy at high price, sell at low price)
    function handleMarketPart(
        Position.Data memory _positionData,
        Position.Data memory _positionDataWithoutLimit,
        uint256 _newNotional,
        int256 _newQuantity,
        uint16 _leverage,
        int128 _latestCumulativePremiumFraction,
        int256 _depositMargin
    ) external view returns (Position.Data memory newData) {
        if (_newQuantity * _positionData.quantity >= 0) {
            newData = Position.Data(
                _positionDataWithoutLimit.quantity + _newQuantity,
                // handle deposit margin
                handleDepositMargin(
                    _depositMargin,
                    _positionData,
                    _positionDataWithoutLimit,
                    _latestCumulativePremiumFraction
                ),
                // handle absolute margin
                handleMarginInIncrease(
                    _newNotional / _leverage,
                    _positionData,
                    _positionDataWithoutLimit,
                    _latestCumulativePremiumFraction
                ),
                handleNotionalInIncrease(
                    _newNotional,
                    _positionData,
                    _positionDataWithoutLimit
                ),
                _latestCumulativePremiumFraction,
                blockNumber(),
                _leverage,
                1
            );
        } else {
            int256 _reduceMargin = (_positionData.margin * _newQuantity) /
                _positionData.quantity;
            newData = Position.Data(
                _positionDataWithoutLimit.quantity + _newQuantity,
                // handle deposit margin
                handleDepositMargin(
                    _reduceMargin,
                    _positionData,
                    _positionDataWithoutLimit,
                    _latestCumulativePremiumFraction
                ),
                // handle absolute margin
                handleMarginInOpenReverse(
                    (_positionData.absoluteMargin * _newQuantity.abs()) /
                        _positionData.quantity.abs(),
                    _positionData,
                    _positionDataWithoutLimit,
                    _latestCumulativePremiumFraction
                ),
                handleNotionalInOpenReverse(
                    (_positionData.openNotional * _newQuantity.abs()) /
                        _positionData.quantity.abs(),
                    _positionData,
                    _positionDataWithoutLimit
                ),
                _latestCumulativePremiumFraction,
                blockNumber(),
                _leverage,
                1
            );
        }
    }

    // There are 4 cases could happen:
    //      1. oldPosition created by limitOrder, new marketOrder reversed it => ON = positionResp.exchangedQuoteAssetAmount
    //      2. oldPosition created by marketOrder, new marketOrder reversed it => ON = oldPosition.openNotional - positionResp.exchangedQuoteAssetAmount
    //      3. oldPosition created by both marketOrder and limitOrder, new marketOrder reversed it => ON = oldPosition.openNotional (of _positionDataWithoutLimit only) - positionResp.exchangedQuoteAssetAmount
    //      4. oldPosition increased by limitOrder and reversed by marketOrder, new MarketOrder reversed it => ON = oldPosition.openNotional (of _positionDataWithoutLimit only) + positionResp.exchangedQuoteAssetAmount
    function handleNotionalInOpenReverse(
        uint256 _exchangedQuoteAmount,
        Position.Data memory _positionData,
        Position.Data memory _positionDataWithoutLimit
    ) public view returns (uint256 openNotional) {
        if (_positionDataWithoutLimit.quantity * _positionData.quantity < 0) {
            openNotional =
                _positionDataWithoutLimit.openNotional +
                _exchangedQuoteAmount;
        } else {
            if (
                _positionDataWithoutLimit.openNotional > _exchangedQuoteAmount
            ) {
                openNotional =
                    _positionDataWithoutLimit.openNotional -
                    _exchangedQuoteAmount;
            } else {
                openNotional =
                    _exchangedQuoteAmount -
                    _positionDataWithoutLimit.openNotional;
            }
        }
    }

    // There are 5 cases could happen:
    //      1. Old position created by long limit and short market, reverse position is short => margin = oldMarketMargin + reduceMarginRequirement
    //      2. Old position created by long limit and long market, reverse position is short and < old long market => margin = oldMarketMargin - reduceMarginRequirement
    //      3. Old position created by long limit and long market, reverse position is short and > old long market => margin = reduceMarginRequirement - oldMarketMargin
    //      4. Old position created by long limit and no market, reverse position is short => margin = reduceMarginRequirement - oldMarketMargin
    //      5. Old position created by short limit and long market, reverse position is short => margin = oldMarketMargin - reduceMarginRequirement
    function handleMarginInOpenReverse(
        uint256 _reduceMarginRequirement,
        Position.Data memory _positionData,
        Position.Data memory _positionDataWithoutLimit,
        int256 _latestCumulativePremiumFraction
    ) public view returns (uint256 margin) {
        uint256 positionAbsoluteMargin = _positionDataWithoutLimit
            .absoluteMargin;
        (, , int256 fundingPayment) = calcRemainMarginWithFundingPayment(
            _positionData,
            // not used in this function call
            int256(margin),
            _latestCumulativePremiumFraction
        );
        int256 newPositionSide = _positionData.quantity < 0
            ? int256(1)
            : int256(-1);
        if (_positionDataWithoutLimit.quantity * _positionData.quantity < 0) {
            margin = (int256(
                positionAbsoluteMargin + _reduceMarginRequirement
            ) - fundingPayment).abs();
        } else {
            if (positionAbsoluteMargin > _reduceMarginRequirement) {
                margin = (int256(
                    positionAbsoluteMargin - _reduceMarginRequirement
                ) + fundingPayment).abs();
            } else {
                margin = (int256(
                    _reduceMarginRequirement - positionAbsoluteMargin
                ) - fundingPayment).abs();
            }
        }
    }

    // There are 5 cases could happen:
    //      1. Old position created by long limit and long market, increase position is long => notional = oldNotional + exchangedQuoteAssetAmount
    //      2. Old position created by long limit and short market, increase position is long and < old short market => notional = oldNotional - exchangedQuoteAssetAmount
    //      3. Old position created by long limit and short market, increase position is long and > old short market => notional = exchangedQuoteAssetAmount - oldNotional
    //      4. Old position created by long limit and no market, increase position is long => notional = oldNotional + exchangedQuoteAssetAmount
    //      5. Old position created by short limit and long market, increase position is long => notional = oldNotional + exchangedQuoteAssetAmount
    function handleNotionalInIncrease(
        uint256 _exchangedQuoteAmount,
        Position.Data memory _positionData,
        Position.Data memory _positionDataWithoutLimit
    ) public view returns (uint256 openNotional) {
        if (_positionDataWithoutLimit.quantity * _positionData.quantity < 0) {
            if (
                _positionDataWithoutLimit.openNotional > _exchangedQuoteAmount
            ) {
                openNotional =
                    _positionDataWithoutLimit.openNotional -
                    _exchangedQuoteAmount;
            } else {
                openNotional =
                    _exchangedQuoteAmount -
                    _positionDataWithoutLimit.openNotional;
            }
        } else {
            openNotional =
                _positionDataWithoutLimit.openNotional +
                _exchangedQuoteAmount;
        }
    }

    // There are 6 cases could happen:
    //      1. Old position created by long limit and long market, increase position is long market => margin = oldMarketMargin + increaseMarginRequirement
    //      2. Old position created by long limit and short market, increase position is long market and < old short market => margin = oldMarketMargin - increaseMarginRequirement
    //      3. Old position created by long limit and short market, increase position is long market and > old short market => margin = increaseMarginRequirement - oldMarketMargin
    //      4. Old position created by long limit and no market, increase position is long market => margin = increaseMarginRequirement - oldMarketMargin
    //      5. Old position created by short limit and long market, increase position is long market => margin = oldMarketMargin + increaseMarginRequirement
    //      6. Old position created by no limit and long market, increase position is long market => margin = oldMarketMargin + increaseMarginRequirement
    function handleMarginInIncrease(
        uint256 _increaseMarginRequirement,
        Position.Data memory _positionData,
        Position.Data memory _positionDataWithoutLimit,
        int256 _latestCumulativePremiumFraction
    ) public view returns (uint256 margin) {
        uint256 positionAbsoluteMargin = _positionDataWithoutLimit
            .absoluteMargin;
        (, , int256 fundingPayment) = calcRemainMarginWithFundingPayment(
            _positionData,
            // not used in this function call
            int256(margin),
            _latestCumulativePremiumFraction
        );
        if (_positionDataWithoutLimit.quantity * _positionData.quantity < 0) {
            if (positionAbsoluteMargin > _increaseMarginRequirement) {
                margin = (int256(
                    positionAbsoluteMargin - _increaseMarginRequirement
                ) + fundingPayment).abs();
            } else {
                margin = (int256(
                    _increaseMarginRequirement - positionAbsoluteMargin
                ) - fundingPayment).abs();
            }
        } else {
            margin = (int256(
                positionAbsoluteMargin + _increaseMarginRequirement
            ) + fundingPayment).abs();
        }
    }

    function handleDepositMargin(
        int256 _newOrderMargin,
        Position.Data memory _positionData,
        Position.Data memory _positionDataWithoutManual,
        int256 _latestCumulativePremiumFraction
    ) public view returns (int256 margin) {
        uint256 positionAbsoluteMargin = _positionData.absoluteMargin;
        (, , int256 fundingPayment) = calcRemainMarginWithFundingPayment(
            _positionData,
            // not used in this function call
            margin,
            _latestCumulativePremiumFraction
        );
        // if total position is Long, margin plus fundingPayment
        if (_positionData.quantity > 0) {
            margin =
                _positionDataWithoutManual.margin +
                _newOrderMargin +
                fundingPayment;
        } else {
            // if total position is Short, margin minus fundingPayment
            margin =
                _positionDataWithoutManual.margin +
                _newOrderMargin -
                fundingPayment;
        }
    }

    function calcReturnWhenOpenReverse(
        uint256 _sizeOut,
        uint256 _openNotional,
        Position.Data memory _positionData
    ) external view returns (uint256 reducedMargin, int256 realizedPnl) {
        realizedPnl = calculatePnlWhenClose(
            _positionData.quantity,
            int256(_sizeOut),
            _positionData.openNotional,
            _openNotional
        );
        reducedMargin =
            (_positionData.margin.abs() * _sizeOut) /
            _positionData.quantity.abs();
    }

    function calcRemainMarginWithFundingPayment(
        // only use position data without manual margin
        Position.Data memory _positionData,
        int256 _pMargin,
        int256 _latestCumulativePremiumFraction
    )
        public
        view
        returns (int256 remainMargin, uint256 badDebt, int256 fundingPayment)
    {
        // calculate fundingPayment
        if (_positionData.quantity != 0) {
            int256 deltaPremiumFraction = _latestCumulativePremiumFraction -
                _positionData.lastUpdatedCumulativePremiumFraction;
            if (deltaPremiumFraction != 0) {
                if (_positionData.quantity > 0) {
                    fundingPayment = calculateFundingPayment(
                        deltaPremiumFraction,
                        -int256(_positionData.absoluteMargin),
                        PREMIUM_FRACTION_DENOMINATOR
                    );
                } else {
                    fundingPayment = calculateFundingPayment(
                        deltaPremiumFraction,
                        int256(_positionData.absoluteMargin),
                        PREMIUM_FRACTION_DENOMINATOR
                    );
                }
            }
        }

        // calculate remain margin, if remain margin is negative, set to zero and leave the rest to bad debt
        if (_positionData.quantity >= 0) {
            remainMargin = _pMargin + fundingPayment;
        } else {
            remainMargin = _pMargin - fundingPayment;
        }
    }

    function getPartialLiquidateQuantity(
        int256 _quantity,
        uint256 _liquidationPenaltyRatio,
        uint256 _stepBaseSize
    ) external pure returns (int256) {
        return
            calculatePartialLiquidateQuantity(
                _quantity,
                _liquidationPenaltyRatio,
                _stepBaseSize
            );
    }

    function calculateMarginWithoutManual(
        int256 _positionQuantity,
        int256 _positionMargin,
        int256 _manualMargin
    ) external pure returns (int256) {
        if (_positionQuantity > 0) {
            return _positionMargin - _manualMargin;
        }
        return _positionMargin + _manualMargin;
    }

    function calculateMarginIncludeManual(
        int256 _positionQuantity,
        int256 _positionMargin,
        int256 _manualMargin
    ) external pure returns (int256) {
        if (_positionQuantity > 0) {
            return _positionMargin + _manualMargin;
        }
        return _positionMargin - _manualMargin;
    }

    function getInitialMarginBasedOnSide(
        bool _isBuy,
        int256 _initialMargin
    ) external pure returns (int256) {
        if (_isBuy) {
            return _initialMargin;
        }
        return -_initialMargin;
    }

    function calculateRemainMarginInLimitOrder(
        bool _isBuy,
        int128 _orderMargin,
        int128 _refundMargin
    ) external pure returns (int128) {
        if (_isBuy) {
            return _orderMargin - _refundMargin;
        }
        return _orderMargin + _refundMargin;
    }

    function calculatePnlWhenClose(
        int256 _positionQuantity,
        int256 _closeQuantity,
        uint256 _positionNotional,
        uint256 _closeNotional
    ) public pure returns (int256 pnl) {
        uint256 percentageNotional = (_positionNotional *
            _closeQuantity.abs()) / _positionQuantity.abs();
        pnl = calculatePnl(
            _positionQuantity,
            percentageNotional,
            _closeNotional
        );
    }

    function calculatePartialLiquidateMargin(
        int256 _positionAbsoluteMargin,
        int256 _manualMargin,
        uint256 _absoluteMargin,
        uint256 _liquidationFeeRatio
    )
        external
        pure
        returns (
            int256 liquidatedPositionAbsoluteMargin,
            int256 liquidatedManualMargin,
            uint256 liquidatedAbsoluteMargin
        )
    {
        liquidatedPositionAbsoluteMargin =
            (_positionAbsoluteMargin * int256(_liquidationFeeRatio)) /
            100;
        liquidatedManualMargin =
            (_manualMargin * int256(_liquidationFeeRatio)) /
            100;
        liquidatedAbsoluteMargin =
            (_absoluteMargin * _liquidationFeeRatio) /
            100;
    }
}
