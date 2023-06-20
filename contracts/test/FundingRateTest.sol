// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "../core/PositionManager.sol";
import "../adapter/InsuranceFundAdapter.sol";

contract FundingRateTest is PositionManager {
    uint64 mockTime;
    uint256 mockUnderlyingPrice;
    uint256 mockTwapPrice;

    function getUnderlyingPriceInPip() public view override returns (uint256) {
        return getCurrentPip();
    }

    function _now() internal view override returns (uint64) {
        return mockTime;
    }

    function setMockTime(uint64 _mockTime) public {
        mockTime = _mockTime;
    }

    function setMockPrice(uint256 underlyingPrice, uint256 twapPrice) public {
        mockUnderlyingPrice = underlyingPrice * getBaseBasisPoint();
        mockTwapPrice = twapPrice * getBaseBasisPoint();
    }

    function getUnderlyingTwapPrice(
        uint256 _intervalInSeconds
    ) public view override returns (uint256) {
        return mockUnderlyingPrice;
    }

    function getTwapPrice(
        uint256 _intervalInSeconds
    ) public view override returns (uint256) {
        return mockTwapPrice;
    }

    //    function getFundingRate()
    //        public
    //        view
    //        returns (int256 premiumFraction, int256 fr)
    //    {
    //        uint256 underlyingAsset;
    //        (premiumFraction, underlyingAsset) = super.getPremiumFraction();
    //        fr = premiumFraction / int256(underlyingAsset);
    //    }
}
