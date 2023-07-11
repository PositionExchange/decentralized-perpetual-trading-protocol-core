// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.8;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../adapter/AccessControllerAdapter.sol";
import "../adapter/interfaces/IUniswapV2Pair.sol";
import "../adapter/interfaces/IUniswapV2Factory.sol";
import "../adapter/interfaces/IUniswapV2Router.sol";
import "../adapter/interfaces/IPositionManager.sol";
import "../adapter/interfaces/IAccessController.sol";
import {Errors} from "../library/helpers/Errors.sol";
import {WhitelistManager} from "./modules/WhitelistManager.sol";

import "hardhat/console.sol";

contract InsuranceFund is
    Initializable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable,
    WhitelistManager
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using AccessControllerAdapter for InsuranceFund;
    address public constant BURN_ADDRESS =
        0x000000000000000000000000000000000000dEaD;

    uint256 public totalFee;
    uint256 public totalBurned;

    address private counterParty;

    IERC20Upgradeable public posi;
    IERC20Upgradeable public busd;
    IUniswapV2Router02 public router;
    IUniswapV2Factory public factory;
    IAccessController public accessControllerInterface;
    IERC20Upgradeable public busdBonus;
    // PositionManager => (Trader => (BonusBalance))
    mapping(address => mapping(address => uint256)) public busdBonusBalances;
    bool public acceptBonus;

    event BuyBackAndBurned(
        address _token,
        uint256 _tokenAmount,
        uint256 _posiAmount
    );
    event SoldPosiForFund(uint256 _posiAmount, uint256 _tokenAmount);

    event Deposit(
        address indexed _token,
        address indexed _trader,
        uint256 _amount
    );
    event Withdraw(
        address indexed _token,
        address indexed _trader,
        uint256 _amount
    );
    event CounterPartyTransferred(address _old, address _new);
    event PosiChanged(address _new);
    event RouterChanged(address _new);
    event FactoryChanged(address _new);
    event WhitelistManagerUpdated(address positionManager, bool isWhitelist);
    event BonusBalanceCleared(address positionManager, address trader);
    event MaxBUSDBonusAcceptedPerPositionUpdated(
        uint256 oldMax,
        uint256 newMax
    );

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
        IAccessController _accessControllerInterface
    ) public initializer {
        __ReentrancyGuard_init();
        __Ownable_init();

        posi = IERC20Upgradeable(0x5CA42204cDaa70d5c773946e69dE942b85CA6706);
        busd = IERC20Upgradeable(0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56);
        busdBonus = IERC20Upgradeable(
            0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56
        ); // TODO: Change later
        router = IUniswapV2Router02(0x10ED43C718714eb63d5aA57B78B54704E256024E);
        factory = IUniswapV2Factory(0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73);
        accessControllerInterface = _accessControllerInterface;
    }

    struct AcceptBusdBonusConfig {
        uint256 notional;
        uint256 percentage;
        // 1 -> <=
        // 2 -> <
        // 3 -> >=
        uint8 comparator;
    }

    function _getAcceptBusdBonusConfig()
        public
        pure
        returns (AcceptBusdBonusConfig[] memory)
    {
        AcceptBusdBonusConfig[] memory configs = new AcceptBusdBonusConfig[](6);

        configs[0] = AcceptBusdBonusConfig(500 * 1e18, 70, 1);
        configs[1] = AcceptBusdBonusConfig(1000 * 1e18, 60, 1);
        configs[2] = AcceptBusdBonusConfig(10000 * 1e18, 40, 1);
        configs[3] = AcceptBusdBonusConfig(20000 * 1e18, 25, 1);
        configs[4] = AcceptBusdBonusConfig(30000 * 1e18, 15, 2);
        configs[5] = AcceptBusdBonusConfig(30000 * 1e18, 5, 3);
        return configs;
    }

    function _correctBusdBonusNewRules(
        uint256 _notional,
        uint256 busdAmount,
        uint256 bonusAmount
    ) internal pure returns (uint256, uint256) {
        /*
        if notional
             <=500 BUSD then use busdBonus 70%, 30% for busdAmount
             // same as above
             <=1000 BUSD	60%
             <=10000 BUSD	40%
             <=200000 BUSD	25%
             <300000 BUSD	15%
             >300000 BUSD	5%
         */
        AcceptBusdBonusConfig[] memory configs = _getAcceptBusdBonusConfig();
        for (uint256 i = 0; i < configs.length; i++) {
            if (configs[i].comparator == 1) {
                if (_notional <= configs[i].notional) {
                    return (
                        (bonusAmount * (100 - configs[i].percentage)) /
                            100 +
                            busdAmount,
                        (bonusAmount * configs[i].percentage) / 100
                    );
                }
            } else if (configs[i].comparator == 2) {
                if (_notional < configs[i].notional) {
                    return (
                        (bonusAmount * (100 - configs[i].percentage)) /
                            100 +
                            busdAmount,
                        (bonusAmount * configs[i].percentage) / 100
                    );
                }
            } else if (configs[i].comparator == 3) {
                if (_notional >= configs[i].notional) {
                    return (
                        (bonusAmount * (100 - configs[i].percentage)) /
                            100 +
                            busdAmount,
                        (bonusAmount * configs[i].percentage) / 100
                    );
                }
            }
        }
        return (busdAmount + bonusAmount, 0);
    }

    function getMaximumBusdBonusWithConfig(
        address _positionManager,
        address _trader,
        uint256 _initialMargin,
        uint256 _leverage,
        uint256 _busdBonusAmount
    )
        public
        view
        returns (uint256 bonusMarginNeeded, uint256 remainingBusdBonusAccepted)
    {
        uint256 positionNotional = _initialMargin * _leverage;
        uint256 realMarginNeeded = _initialMargin - _busdBonusAmount;
        uint256 userBonusBalance = busdBonusBalances[_positionManager][_trader];
        uint256 memMaximumBUSDBonusAccepted = maximumBUSDBonusAccepted;
        if (memMaximumBUSDBonusAccepted > userBonusBalance) {
            remainingBusdBonusAccepted =
                memMaximumBUSDBonusAccepted -
                userBonusBalance;
        }
        (, bonusMarginNeeded) = _correctBusdBonusNewRules(
            positionNotional,
            realMarginNeeded,
            _initialMargin
        );
    }

    function getRemainingBusdBonusAccepted(
        address _positionManager,
        address _trader
    ) public view returns (uint256 remainingBusdBonusAccepted) {
        uint256 userBonusBalance = busdBonusBalances[_positionManager][_trader];
        uint256 memMaximumBUSDBonusAccepted = maximumBUSDBonusAccepted;
        if (memMaximumBUSDBonusAccepted > userBonusBalance) {
            remainingBusdBonusAccepted =
                memMaximumBUSDBonusAccepted -
                userBonusBalance;
        }
    }

    function getBusdBonusBalances(
        address _pmAddress,
        address _trader
    ) external view returns (uint256) {
        return busdBonusBalances[_pmAddress][_trader];
    }

    function validateOrderBusdBonusAmount(
        address _positionManager,
        address _trader,
        uint256 _initialMargin,
        uint256 _leverage,
        uint256 _busdBonusAmount
    ) public {
        onlyCounterParty();
        if (!acceptBonus) {
            if (_busdBonusAmount != 0) {
                revert(Errors.VL_INVALID_BUSD_BONUS_AMOUNT);
            }
            return;
        }
        if (
            maxLeverageAcceptBonus[_positionManager] < _leverage &&
            _busdBonusAmount != 0
        ) {
            revert(Errors.VL_INVALID_BUSD_BONUS_AMOUNT);
        }
        if (_busdBonusAmount > _initialMargin) {
            revert(Errors.VL_INVALID_BUSD_BONUS_AMOUNT);
        }
        (
            uint256 bonusMarginNeeded,
            uint256 remainingBusdBonusAccepted
        ) = getMaximumBusdBonusWithConfig(
                _positionManager,
                _trader,
                _initialMargin,
                _leverage,
                _busdBonusAmount
            );
        if (
            bonusMarginNeeded < _busdBonusAmount ||
            _busdBonusAmount > remainingBusdBonusAccepted
        ) {
            revert(Errors.VL_INVALID_BUSD_BONUS_AMOUNT);
        }
        _addBusdBonusBalance(_positionManager, _trader, _busdBonusAmount);
    }

    function validateAddMarginBusdBonusAmount(
        address _positionManager,
        address _trader,
        uint256 _busdBonusAmount
    ) public {
        onlyCounterParty();
        if (_busdBonusAmount != 0) {
            revert(Errors.VL_INVALID_BUSD_BONUS_AMOUNT);
        }
        // @deprecated cause not use busd bonus for add margin
        //        if (!acceptBonus) {
        //            if (_busdBonusAmount != 0) {
        //                revert(Errors.VL_INVALID_BUSD_BONUS_AMOUNT);
        //            }
        //            return;
        //        }
        //        uint256 remainingBusdBonusAccepted = maximumBUSDBonusAccepted -
        //            busdBonusBalances[_positionManager][_trader];
        //        require(
        //            _busdBonusAmount <= remainingBusdBonusAccepted,
        //            Errors.VL_INVALID_BUSD_BONUS_AMOUNT
        //        );
        //        _addBusdBonusBalance(_positionManager, _trader, _busdBonusAmount);
    }

    function _addBusdBonusBalance(
        address _positionManager,
        address _trader,
        uint256 _busdBonusAmount
    ) internal {
        busdBonusBalances[_positionManager][_trader] += _busdBonusAmount;
    }

    function calculateWithdrawBusdBonusAmount(
        address _positionManager,
        address _trader,
        uint256 _totalWithdrawAmount,
        uint256 _busdBonusBalances
    ) public returns (uint256 _busdBonusAmount) {
        onlyCounterParty();
        if (_busdBonusBalances != 0) {
            if (_totalWithdrawAmount > _busdBonusBalances) {
                _busdBonusAmount = _busdBonusBalances;
            } else {
                _busdBonusAmount = _totalWithdrawAmount;
            }
            _reduceBusdBonusBalance(
                _positionManager,
                _trader,
                _busdBonusAmount
            );
            return _busdBonusAmount;
        }
        return 0;
    }

    function deposit(
        address _positionManager,
        address _trader,
        uint256 _amount,
        uint256 _fee
    ) public onlyWhitelistManager(_positionManager) {
        onlyCounterParty();
        address _tokenAddress = address(
            IPositionManager(_positionManager).getQuoteAsset()
        );
        IERC20Upgradeable _token = IERC20Upgradeable(_tokenAddress);

        uint256 collectableAmount = _amount + _fee;
        if (acceptBonus) {
            uint256 bonusBalance = busdBonus.balanceOf(_trader);
            (
                uint256 collectableBUSDAmount,
                uint256 collectableBonusAmount,
                uint256 depositedBonusAmount
            ) = calcDepositAmount(
                    _amount,
                    _fee,
                    bonusBalance,
                    collectableAmount
                );

            if (collectableBonusAmount > 0) {
                busdBonus.safeTransferFrom(
                    _trader,
                    address(this),
                    collectableBonusAmount
                );
            }

            if (depositedBonusAmount > 0) {
                busdBonusBalances[_positionManager][
                    _trader
                ] += depositedBonusAmount;
            }

            collectableAmount = collectableBUSDAmount;
            if (collectableAmount == 0) {
                emit Deposit(address(_token), _trader, _amount + _fee);
                return;
            }
        }

        totalFee += _fee;
        _token.safeTransferFrom(_trader, address(this), collectableAmount);
        emit Deposit(address(_token), _trader, _amount + _fee);
    }

    function withdraw(
        address _positionManager,
        address _trader,
        uint256 _amount
    ) public onlyWhitelistManager(_positionManager) {
        onlyCounterParty();
        address _token = address(
            IPositionManager(_positionManager).getQuoteAsset()
        );
        uint256 _originalWithdrawAmount = _amount;

        if (acceptBonus) {
            uint256 bonusBalance = busdBonusBalances[_positionManager][_trader];
            (
                uint256 withdrawBUSDAmount,
                uint256 withdrawBonusAmount,
                uint256 remainingBonusAmount
            ) = calcWithdrawAmount(_amount, bonusBalance);

            if (withdrawBonusAmount > 0) {
                busdBonus.safeTransfer(_trader, withdrawBonusAmount);
            }

            busdBonusBalances[_positionManager][_trader] = remainingBonusAmount;

            _amount = withdrawBUSDAmount;
            if (_amount == 0) {
                emit Withdraw(_token, _trader, withdrawBonusAmount);
                return;
            }
        }

        // if insurance fund not enough amount for trader, should sell posi and pay for trader
        uint256 _tokenBalance = IERC20Upgradeable(_token).balanceOf(
            address(this)
        );
        if (_tokenBalance < _amount) {
            uint256 _gap = ((_amount - _tokenBalance) * 110) / 100;
            uint256[] memory _amountIns = router.getAmountsIn(
                _gap,
                getPosiToTokenRoute(_token)
            );
            router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                _amountIns[0],
                0,
                getPosiToTokenRoute(_token),
                address(this),
                block.timestamp
            );
            emit SoldPosiForFund(_amountIns[0], _gap);
        }
        IERC20Upgradeable(_token).safeTransfer(_trader, _amount);
        emit Withdraw(_token, _trader, _amount);
    }

    function reduceBonus(
        address _positionManager,
        address _trader,
        uint256 _reduceAmount
    ) external {
        onlyCounterParty();
        _reduceBusdBonusBalance(_positionManager, _trader, _reduceAmount);
    }

    function _reduceBusdBonusBalance(
        address _positionManager,
        address _trader,
        uint256 _reduceAmount
    ) internal {
        if (
            _reduceAmount != 0 &&
            _reduceAmount < busdBonusBalances[_positionManager][_trader]
        ) {
            busdBonusBalances[_positionManager][_trader] -= _reduceAmount;
            return;
        }

        // Use when fully liquidated
        busdBonusBalances[_positionManager][_trader] = 0;
        emit BonusBalanceCleared(_positionManager, _trader);
    }

    //******************************************************************************************************************
    // ONLY OWNER FUNCTIONS
    //******************************************************************************************************************

    // Approve for the reserved funds
    // due to security issue, the reserved funds contract address is hardcode
    function approveReserveFund() external onlyOwner {
        busd.approve(
            0xF323C72fc1c1711CBE33D492bbE39Ff6fD90f15a,
            type(uint256).max
        );
    }

    function updateAccessController(
        address _accessController
    ) public onlyOwner {
        accessControllerInterface = IAccessController(_accessController);
    }

    function updateMaximumBUSDBonusAcceptedPerPosition(
        uint256 _newMaximumBUSDBonusAccepted
    ) public onlyOwner {
        emit MaxBUSDBonusAcceptedPerPositionUpdated(
            maximumBUSDBonusAccepted,
            _newMaximumBUSDBonusAccepted
        );
        maximumBUSDBonusAccepted = _newMaximumBUSDBonusAccepted;
    }

    function updateWhitelistManager(
        address _positionManager,
        bool _isWhitelist
    ) external onlyOwner {
        if (_isWhitelist) {
            _setWhitelistManager(_positionManager);
        } else {
            _removeWhitelistManager(_positionManager);
        }
        emit WhitelistManagerUpdated(_positionManager, _isWhitelist);
    }

    function updatePosiAddress(
        IERC20Upgradeable _newPosiAddress
    ) public onlyOwner {
        posi = _newPosiAddress;
        emit PosiChanged(address(_newPosiAddress));
    }

    function updateRouterAddress(
        IUniswapV2Router02 _newRouterAddress
    ) public onlyOwner {
        router = _newRouterAddress;
        emit RouterChanged(address(_newRouterAddress));
    }

    function updateFactoryAddress(
        IUniswapV2Factory _newFactory
    ) public onlyOwner {
        factory = _newFactory;
        emit FactoryChanged(address(_newFactory));
    }

    // Buy POSI on market and burn it
    function buyBackAndBurn(address _token, uint256 _amount) public onlyOwner {
        // buy back
        uint256 _posiBalanceBefore = posi.balanceOf(address(this));
        router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            _amount,
            0,
            getTokenToPosiRoute(_token),
            address(this),
            block.timestamp
        );
        uint256 _posiBalanceAfter = posi.balanceOf(address(this));
        uint256 _posiAmount = _posiBalanceAfter - _posiBalanceBefore;

        // burn
        posi.safeTransfer(BURN_ADDRESS, _posiAmount);

        totalBurned += _posiAmount;
        emit BuyBackAndBurned(_token, _amount, _posiAmount);
    }

    function setCounterParty(address _counterParty) public onlyOwner {
        require(_counterParty != address(0), Errors.VL_EMPTY_ADDRESS);
        emit CounterPartyTransferred(counterParty, _counterParty);
        counterParty = _counterParty;
    }

    // approve token for router in order to swap tokens
    function approveTokenForRouter(address _token) public onlyOwner {
        IERC20Upgradeable(_token).safeApprove(
            address(router),
            0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
        );
    }

    function setBUSDBonusAddress(
        IERC20Upgradeable _newBUSDBonusAddress
    ) public onlyOwner {
        busdBonus = _newBUSDBonusAddress;
    }

    function shouldAcceptBonus(bool _acceptBonus) public onlyOwner {
        acceptBonus = _acceptBonus;
    }

    function disableBonus() external onlyOwner {
        acceptBonus = false;
    }

    function migrateBusdBonusBalance(
        address _pmAddress,
        address _trader,
        uint256 _amount
    ) external onlyOwner {
        busdBonusBalances[_pmAddress][_trader] = _amount;
    }

    //******************************************************************************************************************
    // VIEW FUNCTIONS
    //******************************************************************************************************************

    function getTokenToPosiRoute(
        address token
    ) private view returns (address[] memory paths) {
        paths = new address[](2);
        paths[0] = token;
        paths[1] = address(posi);
    }

    function getPosiToTokenRoute(
        address token
    ) private view returns (address[] memory paths) {
        paths = new address[](2);
        paths[0] = address(posi);
        paths[1] = token;
    }

    function calcDepositAmount(
        uint256 _amount,
        uint256 _fee,
        uint256 _busdBonusBalance,
        uint256 _totalCollectable
    )
        private
        view
        returns (
            uint256 collectableBUSDAmount,
            uint256 collectableBonusAmount,
            uint256 depositedBonusAmount
        )
    {
        if (_busdBonusBalance == 0) {
            return (_totalCollectable, 0, 0);
        }

        if (_totalCollectable <= _busdBonusBalance) {
            return (0, _totalCollectable, _amount);
        }

        if (_fee >= _busdBonusBalance) {
            return (
                _totalCollectable - _busdBonusBalance,
                _busdBonusBalance,
                0
            );
        }

        return (
            _totalCollectable - _busdBonusBalance,
            _busdBonusBalance,
            _busdBonusBalance - _fee
        );
    }

    function calcWithdrawAmount(
        uint256 _withdrawAmount,
        uint256 _busdBonusBalance
    )
        private
        view
        returns (
            uint256 withdrawBUSDAmount,
            uint256 withdrawBonusAmount,
            uint256 remainingBonusAmount
        )
    {
        if (_busdBonusBalance == 0) {
            return (_withdrawAmount, 0, 0);
        }

        if (_withdrawAmount <= _busdBonusBalance) {
            return (0, _withdrawAmount, _busdBonusBalance - _withdrawAmount);
        }

        return (_withdrawAmount - _busdBonusBalance, _busdBonusBalance, 0);
    }

    function updateMaxLeverageAcceptBonus(
        address _pmAddress,
        uint256 _leverage
    ) external onlyOwner {
        maxLeverageAcceptBonus[_pmAddress] = _leverage;
    }

    function setBusd(address _busd) external onlyOwner {
        busd = IERC20Upgradeable(_busd);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
    uint256 public maximumBUSDBonusAccepted;
    mapping(address => uint256) public maxLeverageAcceptBonus;
}
