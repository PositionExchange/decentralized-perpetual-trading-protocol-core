// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {Errors} from "../library/helpers/Errors.sol";
import {AccessControllerAdapter} from "../adapter/AccessControllerAdapter.sol";
import {IOrderTracker} from "../adapter/interfaces/IOrderTracker.sol";
import {IPositionManager} from "../adapter/interfaces/IPositionManager.sol";
import {IAccessController} from "../adapter/interfaces/IAccessController.sol";
import "hardhat/console.sol";

contract OrderTracker is
    IOrderTracker,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    OwnableUpgradeable
{
    using AccessControllerAdapter for OrderTracker;

    IAccessController public accessControllerInterface;

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

    function initialize() public initializer {
        __ReentrancyGuard_init();
        __Ownable_init();
        __Pausable_init();
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
            (
                ,
                pendingOrderDetail.isBuy,
                pendingOrderDetail.size,
                pendingOrderDetail.partialFilled,
                pendingOrderDetail.trader
            ) = positionManagerInterface.getPendingOrderDetailFull(_pip, i);
            if (pendingOrderDetail.trader != mmAddress) {
                uint256 filledSize = pendingOrderDetail.size -
                    pendingOrderDetail.partialFilled;
                // input leverage = 1 cause we don't use it
                (uint256 orderNotional, , ) = positionManagerInterface
                    .getNotionalMarginAndFee(filledSize, _pip, 1);
                _updatePositionInfo(
                    pmAddress,
                    pendingOrderDetail.isBuy,
                    uint128(filledSize),
                    uint128(orderNotional)
                );
                emit LimitOrderFilled(
                    pmAddress,
                    _pip,
                    i,
                    pendingOrderDetail.isBuy,
                    filledSize,
                    pendingOrderDetail.trader
                );
            }
        }
    }

    function accumulatePartialFilledOrder(
        uint128 _pip,
        uint128 _size,
        uint256 _orderNotional
    ) external {
        onlyCounterParty();
//        address pmAddress = msg.sender;
        IPositionManager positionManagerInterface = IPositionManager(msg.sender);
        (uint64 filledIndex, uint64 currentIndex) = positionManagerInterface
            .getTickPositionIndexes(_pip);
        if (filledIndex == 0) {
            filledIndex++;
        }

        address mmAddress = positionManagerInterface.getMarketMakerAddress();
        uint256 remainingSize = _size;
        bool isFullFilled;
        for ( uint64 i = filledIndex; i <= currentIndex; i++) {

            PendingOrderDetail memory pendingOrderDetail;
            (
                ,
                pendingOrderDetail.isBuy,
                pendingOrderDetail.size,
                pendingOrderDetail.partialFilled,
                pendingOrderDetail.trader
            ) = positionManagerInterface.getPendingOrderDetailFull(
                _pip,
                i
            );

            uint256 filledSize = pendingOrderDetail.size - pendingOrderDetail.partialFilled;

            if ( remainingSize >= filledSize ) {
                remainingSize = remainingSize - filledSize;
                isFullFilled = true;
            } else if ( remainingSize < filledSize){
                filledSize = remainingSize;
                remainingSize = 0;
                isFullFilled = false;
            }

            if (pendingOrderDetail.trader != positionManagerInterface.getMarketMakerAddress()) {

                (uint256 orderNotional, , ) = positionManagerInterface
                    .getNotionalMarginAndFee(filledSize, _pip, 1);

                _updatePositionInfo(
                    address(positionManagerInterface),
                    pendingOrderDetail.isBuy,
                    uint128(filledSize),
                    uint128(orderNotional)
                );

                if ( !isFullFilled) {
                    emit LimitOrderPartialFilled(
                        address(positionManagerInterface),
                        _pip,
                        i,
                        pendingOrderDetail.isBuy,
                        filledSize,
                        pendingOrderDetail.trader
                    );
                }else {
                    emit LimitOrderFilled(
                        address(positionManagerInterface),
                        _pip,
                        i,
                        pendingOrderDetail.isBuy,
                        filledSize,
                        pendingOrderDetail.trader
                    );
                }

            }

            if (remainingSize == 0 ) break;

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
        IPositionManager positionManagerInterface = IPositionManager(_pmAddress);
        PositionInfo memory memPositionInfo = positionInfo;
        uint128 currentPip = positionManagerInterface.getCurrentPip();
        // input leverage = 1 cause we don't use it
        (uint256 totalPositionLongNotional, , ) = positionManagerInterface.getNotionalMarginAndFee(memPositionInfo.totalLongBaseSize, currentPip, 1);
        (uint256 totalPositionShortNotional, ,) = positionManagerInterface.getNotionalMarginAndFee(memPositionInfo.totalShortBaseSize, currentPip, 1);
        // totalPnl = totalPnlLong + totalPnlShort
        // = totalPositionLongNotional - totalLongQuoteSize + totalShortQuoteSize - totalPositionShortNotional
        int256 totalPnl = int256(totalPositionLongNotional) - int128(memPositionInfo.totalLongQuoteSize) + int128(memPositionInfo.totalShortQuoteSize) - int256(totalPositionShortNotional);
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
        IPositionManager positionManagerInterface = IPositionManager(_pmAddress);
        PositionInfo memory memPositionInfo = positionManagerInfos[_pmAddress];
        uint128 currentPip = positionManagerInterface.getCurrentPip();
        // input leverage = 1 cause we don't use it
        (uint256 totalPositionLongNotional, , ) = positionManagerInterface.getNotionalMarginAndFee(memPositionInfo.totalLongBaseSize, currentPip, 1);
        (uint256 totalPositionShortNotional, ,) = positionManagerInterface.getNotionalMarginAndFee(memPositionInfo.totalShortBaseSize, currentPip, 1);
        // totalPnl = totalPnlLong + totalPnlShort
        // = totalPositionLongNotional - totalLongQuoteSize + totalShortQuoteSize - totalPositionShortNotional
        int256 totalPnl = int256(totalPositionLongNotional) - int128(memPositionInfo.totalLongQuoteSize) + int128(memPositionInfo.totalShortQuoteSize) - int256(totalPositionShortNotional);
        return totalPnl;
    }

    function getTotalPnlBatch(address[] memory _pmAddress) public view returns (int256[] memory){
        int256[] memory pnls = new int256[](_pmAddress.length);
        for (uint i = 0; i < _pmAddress.length; i++){
            pnls[i] = getTotalPnl(_pmAddress[i]);
        }
        return pnls;
    }

    //    function crossBlockchainCall(
    //        uint256 _destBcId,
    //        address _destContract,
    //        bytes memory _destData
    //    ) internal {
    //        txIndex++;
    //        bytes32 txId = keccak256(
    //            abi.encodePacked(
    //                block.timestamp,
    //                myBlockchainId,
    //                _destBcId,
    //                _destContract,
    //                _destData,
    //                txIndex
    //            )
    //        );
    //        emit CrossCall(
    //            txId,
    //            block.timestamp,
    //            msg.sender,
    //            _destBcId,
    //            _destContract,
    //            _destData
    //        );
    //    }

    function updateAccessControllerInterface(address _accessControllerAddress)
        public
        onlyOwner
    {
        accessControllerInterface = IAccessController(_accessControllerAddress);
    }
}
