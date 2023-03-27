// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

import "./interfaces/IInsuranceFund.sol";

library InsuranceFundAdapter {
    function deposit(
        IInsuranceFund _insuranceFundInterface,
        address _pmAddress,
        address _trader,
        uint256 _amount,
        uint256 _fee
    ) external {
        _insuranceFundInterface.deposit(_pmAddress, _trader, _amount, _fee);
    }

    function withdraw(
        IInsuranceFund _insuranceFundInterface,
        address _pmAddress,
        address _trader,
        uint256 _amount
    ) external {
        _insuranceFundInterface.withdraw(_pmAddress, _trader, _amount);
    }

    function reduceBonus(
        IInsuranceFund _insuranceFundInterface,
        address _pmAddress,
        address _trader,
        uint256 _amount
    ) external {
        _insuranceFundInterface.reduceBonus(_pmAddress, _trader, _amount);
    }

    function buyBackAndBurn(
        IInsuranceFund _insuranceFundInterface,
        address _token,
        uint256 _amount
    ) external {
        _insuranceFundInterface.buyBackAndBurn(_token, _amount);
    }
}
