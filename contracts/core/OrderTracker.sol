// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {Errors} from "../library/helpers/Errors.sol";
import "../library/positions/Position.sol";
import {AccessControllerAdapter} from "../adapter/AccessControllerAdapter.sol";
import {IOrderTracker} from "../adapter/interfaces/IOrderTracker.sol";
import {IPositionManager} from "../adapter/interfaces/IPositionManager.sol";
import {IAccessController} from "../adapter/interfaces/IAccessController.sol";
import {ICrossChainGateway} from "../adapter/interfaces/ICrossChainGateway.sol";
import {IPositionHouse} from "../adapter/interfaces/IPositionHouse.sol";
import "hardhat/console.sol";

contract OrderTracker is
    IOrderTracker,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    OwnableUpgradeable
{
    using AccessControllerAdapter for OrderTracker;
    using Position for Position.Data;

    IAccessController public accessControllerInterface;
    address public crossChainGateway;
    address public positionHouse;

    event LimitOrderFilled(
        address pmAddress,
        uint128 pip,
        uint64 orderId,
        bool isBuy,
        uint256 filledSize,
        address trader
    );

    event LimitOrderPartialFilled(
        address pmAddress,
        uint128 pip,
        uint64 orderId,
        bool isBuy,
        uint256 filledSize,
        address trader
    );

    event PositionInfoUpdated(
        address pmAddress,
        uint128 totalLongBaseSize,
        uint128 totalLongQuoteSize,
        uint128 totalShortBaseSize,
        uint128 totalShortQuoteSize,
        int256 totalPnl
    );

    event CrossCall(
        bytes32 _txId,
        uint256 _timestamp,
        address _caller,
        uint256 _destBcId,
        address _destContract,
        bytes _destFunctionCall
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
        address _accessControllerInterface,
        address _crossChainGateway,
        address _positionHouse
    ) public initializer {
        __ReentrancyGuard_init();
        __Ownable_init();
        __Pausable_init();

        accessControllerInterface = IAccessController(
            _accessControllerInterface
        );
        crossChainGateway = _crossChainGateway;
        positionHouse = _positionHouse;
    }

    struct PositionInfo {
        // total long position size in base
        uint128 totalLongBaseSize;
        // total long position size in quote
        uint128 totalLongQuoteSize;
        // total short position size in base
        uint128 totalShortBaseSize;
        // total short position size in quote
        uint128 totalShortQuoteSize;
    }

    // mapping of position manager address to PositionInfo
    mapping(address => PositionInfo) public positionManagerInfos;

    // only user's order will call this function
    function accumulateMarketOrder(
        bool _isBuy,
        uint128 _size,
        uint128 _orderNotional
    ) external {
        onlyCounterParty();
        address pmAddress = msg.sender;
        IPositionManager positionManagerInterface = IPositionManager(pmAddress);
        _updatePositionInfo(pmAddress, _isBuy, _size, _orderNotional);
    }

    struct PendingOrderDetail {
        bool isBuy;
        uint256 size;
        uint256 partialFilled;
        address trader;
    }

    function accumulateFulfilledOrder(
        uint128 _pip,
        uint128 _size,
        uint256 _orderNotional
    ) external {
        onlyCounterParty();
        address pmAddress = msg.sender;
        IPositionManager positionManagerInterface = IPositionManager(pmAddress);
        (uint64 filledIndex, uint64 currentIndex) = positionManagerInterface
            .getTickPositionIndexes(_pip);
        if (filledIndex == 0) {
            filledIndex++;
        }
        PendingOrderDetail memory pendingOrderDetail;
        address mmAddress = positionManagerInterface.getMarketMakerAddress();
        for (uint64 i = filledIndex; i <= currentIndex; i++) {
            bool isReduce;
            bytes32 sourceChainRequestKey;
            (
                ,
                pendingOrderDetail.isBuy,
                pendingOrderDetail.size,
                pendingOrderDetail.partialFilled,
                pendingOrderDetail.trader,
                isReduce,
                sourceChainRequestKey
            ) = positionManagerInterface.getPendingOrderDetailFull(_pip, i);
            if (pendingOrderDetail.trader == mmAddress) {
                continue;
            }

            _executeOrderFilled(pendingOrderDetail, pmAddress, _pip, i);

            if (isReduce) {
                _executeDecreasePosition(
                    pmAddress,
                    pendingOrderDetail.trader,
                    sourceChainRequestKey,
                    _pip,
                    pendingOrderDetail.size,
                    pendingOrderDetail.isBuy
                );
                continue;
            }

            _executeIncreasePosition(
                positionManagerInterface,
                sourceChainRequestKey,
                _pip,
                pendingOrderDetail.size,
                pendingOrderDetail.isBuy
            );
        }
    }

    function accumulatePartialFilledOrder(
        uint128 _pip,
        uint128 _size,
        uint256 _orderNotional
    ) external {
        onlyCounterParty();
        //        address pmAddress = msg.sender;
        IPositionManager positionManagerInterface = IPositionManager(
            msg.sender
        );
        (uint64 filledIndex, uint64 currentIndex) = positionManagerInterface
            .getTickPositionIndexes(_pip);
        if (filledIndex == 0) {
            filledIndex++;
        }

        address mmAddress = positionManagerInterface.getMarketMakerAddress();
        uint256 remainingSize = _size;
        bool isFullFilled;
        for (uint64 i = filledIndex; i <= currentIndex; i++) {
            PendingOrderDetail memory pendingOrderDetail;
            bool isReduce;
            bytes32 sourceChainRequestKey;
            (
                ,
                pendingOrderDetail.isBuy,
                pendingOrderDetail.size,
                pendingOrderDetail.partialFilled,
                pendingOrderDetail.trader,
                isReduce,
                sourceChainRequestKey
            ) = positionManagerInterface.getPendingOrderDetailFull(_pip, i);

            uint256 filledSize = pendingOrderDetail.size -
                pendingOrderDetail.partialFilled;

            if (remainingSize >= filledSize) {
                remainingSize = remainingSize - filledSize;
                isFullFilled = true;
            } else if (remainingSize < filledSize) {
                filledSize = remainingSize;
                remainingSize = 0;
                isFullFilled = false;
            }

            if (
                pendingOrderDetail.trader !=
                positionManagerInterface.getMarketMakerAddress()
            ) {
                uint256 filledSize_ = filledSize;
                uint128 pip_ = _pip;

                (uint256 orderNotional, , ) = positionManagerInterface
                    .getNotionalMarginAndFee(filledSize_, pip_, 1);

                _updatePositionInfo(
                    address(positionManagerInterface),
                    pendingOrderDetail.isBuy,
                    uint128(filledSize_),
                    uint128(orderNotional)
                );

                if (!isFullFilled) {
                    emit LimitOrderPartialFilled(
                        address(positionManagerInterface),
                        pip_,
                        i,
                        pendingOrderDetail.isBuy,
                        filledSize_,
                        pendingOrderDetail.trader
                    );
                } else {
                    emit LimitOrderFilled(
                        address(positionManagerInterface),
                        pip_,
                        i,
                        pendingOrderDetail.isBuy,
                        filledSize_,
                        pendingOrderDetail.trader
                    );

                    if (isReduce) {
                        _executeDecreasePosition(
                            address(positionManagerInterface),
                            pendingOrderDetail.trader,
                            sourceChainRequestKey,
                            pip_,
                            pendingOrderDetail.size,
                            pendingOrderDetail.isBuy
                        );
                    } else {
                        _executeIncreasePosition(
                            positionManagerInterface,
                            sourceChainRequestKey,
                            pip_,
                            pendingOrderDetail.size,
                            pendingOrderDetail.isBuy
                        );
                    }
                }
            }

            if (remainingSize == 0) break;
        }
    }

    function _updatePositionInfo(
        address _pmAddress,
        bool _isBuy,
        uint128 _size,
        uint128 _orderNotional
    ) internal {
        PositionInfo storage positionInfo = positionManagerInfos[_pmAddress];
        if (_isBuy) {
            positionInfo.totalLongBaseSize += _size;
            positionInfo.totalLongQuoteSize += _orderNotional;
        } else {
            positionInfo.totalShortBaseSize += _size;
            positionInfo.totalShortQuoteSize += _orderNotional;
        }
        IPositionManager positionManagerInterface = IPositionManager(
            _pmAddress
        );
        PositionInfo memory memPositionInfo = positionInfo;
        uint128 currentPip = positionManagerInterface.getCurrentPip();
        // input leverage = 1 cause we don't use it
        (uint256 totalPositionLongNotional, , ) = positionManagerInterface
            .getNotionalMarginAndFee(
                memPositionInfo.totalLongBaseSize,
                currentPip,
                1
            );
        (uint256 totalPositionShortNotional, , ) = positionManagerInterface
            .getNotionalMarginAndFee(
                memPositionInfo.totalShortBaseSize,
                currentPip,
                1
            );
        // totalPnl = totalPnlLong + totalPnlShort
        // = totalPositionLongNotional - totalLongQuoteSize + totalShortQuoteSize - totalPositionShortNotional
        int256 totalPnl = int256(totalPositionLongNotional) -
            int128(memPositionInfo.totalLongQuoteSize) +
            int128(memPositionInfo.totalShortQuoteSize) -
            int256(totalPositionShortNotional);
        emit PositionInfoUpdated(
            _pmAddress,
            memPositionInfo.totalLongBaseSize,
            memPositionInfo.totalLongQuoteSize,
            memPositionInfo.totalShortBaseSize,
            memPositionInfo.totalShortQuoteSize,
            totalPnl
        );
    }

    function getTotalPnl(address _pmAddress) public view returns (int256) {
        IPositionManager positionManagerInterface = IPositionManager(
            _pmAddress
        );
        PositionInfo memory memPositionInfo = positionManagerInfos[_pmAddress];
        uint128 currentPip = positionManagerInterface.getCurrentPip();
        // input leverage = 1 cause we don't use it
        (uint256 totalPositionLongNotional, , ) = positionManagerInterface
            .getNotionalMarginAndFee(
                memPositionInfo.totalLongBaseSize,
                currentPip,
                1
            );
        (uint256 totalPositionShortNotional, , ) = positionManagerInterface
            .getNotionalMarginAndFee(
                memPositionInfo.totalShortBaseSize,
                currentPip,
                1
            );
        // totalPnl = totalPnlLong + totalPnlShort
        // = totalPositionLongNotional - totalLongQuoteSize + totalShortQuoteSize - totalPositionShortNotional
        int256 totalPnl = int256(totalPositionLongNotional) -
            int128(memPositionInfo.totalLongQuoteSize) +
            int128(memPositionInfo.totalShortQuoteSize) -
            int256(totalPositionShortNotional);
        return totalPnl;
    }

    function getTotalPnlBatch(address[] memory _pmAddress)
        external
        view
        returns (int256[] memory)
    {
        int256[] memory pnls = new int256[](_pmAddress.length);
        for (uint256 i = 0; i < _pmAddress.length; i++) {
            pnls[i] = getTotalPnl(_pmAddress[i]);
        }
        return pnls;
    }

    function updateAccessControllerInterface(address _accessControllerAddress)
        external
        onlyOwner
    {
        accessControllerInterface = IAccessController(_accessControllerAddress);
    }

    function setCrossChainGateway(address _address) external onlyOwner {
        crossChainGateway = _address;
    }

    function setPositionHouse(address _address) external onlyOwner {
        positionHouse = _address;
    }

    function _executeOrderFilled(
        PendingOrderDetail memory _pendingOrderDetail,
        address _pmAddress,
        uint128 _pip,
        uint64 _index
    ) private {
        uint256 filledSize = _pendingOrderDetail.size -
            _pendingOrderDetail.partialFilled;

        // input leverage = 1 cause we don't use it
        (uint256 orderNotional, , ) = IPositionManager(_pmAddress)
            .getNotionalMarginAndFee(filledSize, _pip, 1);

        _updatePositionInfo(
            _pmAddress,
            _pendingOrderDetail.isBuy,
            uint128(filledSize),
            uint128(orderNotional)
        );

        emit LimitOrderFilled(
            _pmAddress,
            _pip,
            _index,
            _pendingOrderDetail.isBuy,
            filledSize,
            _pendingOrderDetail.trader
        );
    }

    function _executeIncreasePosition(
        IPositionManager _positionManagerInterface,
        bytes32 _requestKey,
        uint128 _pip,
        uint256 _size,
        bool _isBuy
    ) private {
        uint256 basisPoint = _positionManagerInterface.getBasisPoint();
        uint256 entryPrice = (uint256(_pip) * (10**18)) / basisPoint;

        ICrossChainGateway(crossChainGateway).executeIncreaseOrder(
            421613, // TODO: Refactor later
            _requestKey,
            entryPrice,
            _size,
            _isBuy
        );
    }

    function _executeDecreasePosition(
        address _manager,
        address _trader,
        bytes32 _requestKey,
        uint128 _pip,
        uint256 _size,
        bool _isBuy
    ) private {
        // TODO: Refactor this function later
        Position.Data memory positionData = IPositionHouse(positionHouse)
            .getPosition(_manager, _trader);

        bool isLong = positionData.quantity > 0;
        uint256 quantityAbs = positionData.quantity > 0
            ? uint256(positionData.quantity)
            : uint256(-positionData.quantity);
        bool isFullyClose = _size >= quantityAbs;

        uint256 basisPoint = IPositionManager(_manager).getBasisPoint();
        uint256 baseBasisPoint = IPositionManager(_manager).getBaseBasisPoint();

        uint256 entryPrice = _calculateEntryPrice(
            positionData.openNotional,
            quantityAbs,
            baseBasisPoint
        );
        uint256 openNotional = _calculateNotional(
            entryPrice,
            _size,
            baseBasisPoint
        );

        uint256 closeNotional;
        {
            uint256 closePrice = _toPrice(_pip, baseBasisPoint, basisPoint);
            closeNotional = _calculateNotional(
                closePrice,
                _size,
                baseBasisPoint
            );
        }

        int256 amountOutUsd;
        {
            int256 marginOut = int256(openNotional / positionData.leverage);
            int256 pnl = _calculatePnl(isLong, openNotional, closeNotional);
            amountOutUsd = marginOut + pnl;
        }

        _executeDecreaseOrder(
            _requestKey,
            uint256(amountOutUsd),
            isFullyClose ? 0 : (entryPrice * (10**18)) / baseBasisPoint,
            _size,
            isLong
        );
    }

    function _executeDecreaseOrder(
        bytes32 requestKey_,
        uint256 amountOutUsd_,
        uint256 entryPrice_,
        uint256 size_,
        bool isLong_
    ) private {
        ICrossChainGateway(crossChainGateway).executeDecreaseOrder(
            421613, // TODO: Refactor later
            requestKey_,
            amountOutUsd_,
            0, // Temporary set fee to 0, will calculate later
            entryPrice_,
            size_,
            isLong_
        );
    }

    function _calculatePnl(
        bool _isLong,
        uint256 _openNotional,
        uint256 _closeNotional
    ) private pure returns (int256) {
        // LONG position
        if (_isLong) {
            return (int256(_closeNotional) - int256(_openNotional));
        }
        // SHORT position
        return (int256(_openNotional) - int256(_closeNotional));
    }

    function _toPrice(
        uint128 pip,
        uint256 baseBasicPoint,
        uint256 basisPoint
    ) private pure returns (uint256) {
        return (uint256(pip) * baseBasicPoint) / basisPoint;
    }

    function _calculateNotional(
        uint256 _price,
        uint256 _quantity,
        uint256 _baseBasisPoint
    ) private pure returns (uint256) {
        return (_quantity * _price) / _baseBasisPoint;
    }

    function _calculateEntryPrice(
        uint256 _notional,
        uint256 _quantity,
        uint256 _baseBasisPoint
    ) private pure returns (uint256) {
        if (_quantity != 0) {
            return (_notional * _baseBasisPoint) / _quantity;
        }
        return 0;
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}
