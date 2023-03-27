// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

import "./interfaces/IPositionHouse.sol";
import "../library/types/PositionHouseStorage.sol";
import "../library/positions/Position.sol";
import {PositionMath} from "../library/positions/PositionMath.sol";
import {Int256Math} from "../library/helpers/Int256Math.sol";
import {Errors} from "../library/helpers/Errors.sol";

library PositionHouseAdapter {
    using Int256Math for int256;
    using Quantity for int256;
    using Position for Position.Data;

    struct GetMaintenanceDetailParam {
        Position.Data positionDataWithManualMargin;
        IPositionHouse positionHouseInterface;
        address pmAddress;
        address trader;
        int256 unrealizedPnl;
        uint256 maintenanceMarginRatio;
        uint64 basisPoint;
    }

    function getMaintenanceDetail(GetMaintenanceDetailParam memory _param)
        public
        view
        returns (
            uint256 maintenanceMargin,
            int256 marginBalance,
            uint256 marginRatio,
            uint256 liquidationPip
        )
    {
        Position.Data memory positionDataWithoutManualMargin = _param
            .positionHouseInterface
            .getPosition(_param.pmAddress, _param.trader);
        {
            // NOTICE: remainMarginWithFundingPayment is absolute
            (int256 remainMarginWithFundingPayment, , ) = PositionMath
                .calcRemainMarginWithFundingPayment(
                    positionDataWithoutManualMargin,
                    _param.positionDataWithManualMargin.margin,
                    _param
                        .positionHouseInterface
                        .getLatestCumulativePremiumFraction(_param.pmAddress)
                );
            maintenanceMargin =
                (positionDataWithoutManualMargin.absoluteMargin *
                    _param.maintenanceMarginRatio) /
                100;
            // TODO plus margin by pnl based on position side
            marginBalance =
                remainMarginWithFundingPayment +
                _param.unrealizedPnl;
            marginRatio = marginBalance <= 0
                ? 100
                : (maintenanceMargin * 100) / uint256(marginBalance);
            // if marginRatio > 100 then return 100
            if (marginRatio > 100) marginRatio = 100;
        }

        if (_param.positionDataWithManualMargin.quantity == 0) {
            marginRatio = 0;
        } else {
            liquidationPip = PositionMath.calculateLiquidationPip(
                _param.positionDataWithManualMargin.quantity,
                _param.positionDataWithManualMargin.margin.abs(),
                _param.positionDataWithManualMargin.openNotional,
                maintenanceMargin,
                _param.basisPoint
            );
        }
    }

    function triggerClosePosition(
        IPositionHouse _positionHouseInterface,
        IPositionManager _positionManagerInterface,
        address _trader
    )
        external
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        return
            _positionHouseInterface.triggerClosePosition(
                _positionManagerInterface,
                _trader
            );
    }

    function hasPosition(
        IPositionHouse _positionHouseInterface,
        address _pmAddress,
        address _trader
    ) public view returns (bool) {
        Position.Data memory positionData = _positionHouseInterface.getPosition(
            _pmAddress,
            _trader
        );
        if (positionData.quantity != 0) {
            return true;
        }
        return false;
    }
}
