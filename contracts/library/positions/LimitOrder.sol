// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

//import "hardhat/console.sol";

library LimitOrder {
    struct Data {
        // Type order LONG or SHORT
        uint8 isBuy;
        uint120 size;
        // NOTICE need to add leverage
        uint120 partialFilled;
        address trader;
        bool isReduce;
        bytes32 sourceChainRequestKey;
    }

    function getData(
        LimitOrder.Data storage _self
    )
        internal
        view
        returns (
            bool isBuy,
            uint256 size,
            uint256 partialFilled,
            address trader,
            bool isReduce,
            bytes32 sourceChainRequestKey
        )
    {
        isBuy = _self.isBuy == 1;
        size = uint256(_self.size);
        partialFilled = uint256(_self.partialFilled);
        trader = _self.trader;
        isReduce = _self.isReduce;
        sourceChainRequestKey = _self.sourceChainRequestKey;
    }

    function update(
        LimitOrder.Data storage _self,
        bool _isBuy,
        uint256 _size,
        address _trader,
        bool _isReduce,
        bytes32 _sourceChainRequestKey
    ) internal {
        _self.isBuy = _isBuy ? 1 : 2;
        _self.size = uint120(_size);
        _self.trader = _trader;
        _self.isReduce = _isReduce;
        _self.sourceChainRequestKey = _sourceChainRequestKey;
    }

    function updatePartialFill(
        LimitOrder.Data storage _self,
        uint120 _remainSize
    ) internal {
        // remainingSize should be negative
        _self.partialFilled += (_self.size - _self.partialFilled - _remainSize);
    }

    function updateWhenClose(
        LimitOrder.Data storage _self
    ) internal returns (uint256) {
        _self.size -= _self.partialFilled;
        _self.partialFilled = 0;
        return (uint256(_self.size));
    }

    function getPartialFilled(
        LimitOrder.Data storage _self
    ) internal view returns (bool isPartial, uint256 remainingSize) {
        remainingSize = _self.size - _self.partialFilled;
        isPartial = remainingSize > 0;
    }
}
