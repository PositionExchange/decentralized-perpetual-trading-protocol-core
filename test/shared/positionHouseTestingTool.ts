import {BEP20Mintable, PositionHouse, UserGatewayTest, PositionManager, LiquidatorGateway} from "../../typeChain";
import {BigNumber} from "ethers";
import {
    CancelLimitOrderParams,
    ClaimFund, fromWei,
    LimitOrderReturns, MaintenanceDetail,
    OpenLimitPositionAndExpectParams,
    OpenMarketPositionParams, OrderData, PendingOrder, pipToPrice,
    PositionData,
    priceToPip
} from "./utilities";
import {ethers} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";

async function getOrderIdByTx(tx: any) {
    const receipt = await tx.wait();
    const orderId = ((receipt?.events || [])[1]?.args || [])['orderIdInPip']
    const priceLimit = ((receipt?.events || [])[1]?.args || [])['priceLimit']
    return {
        orderId,
        priceLimit,
    }
}

export interface CloseLimitPositionParams {
    trader: SignerWithAddress
    price: number | string
    quantity: number | string
    positionManager?: any
}

export interface CloseMarketPositionParams {
    trader: SignerWithAddress,
    positionManager?: any,
    quantity?: any
}

export interface InstantlyClosePositionParams {
    trader: SignerWithAddress,
    quantity: any,
    positionManager?: any,
}

export interface BasicParam {
    trader: SignerWithAddress
}

export interface PendingOrderParam {
    pip: number | string,
    orderId: number | string

}


export interface ClosePositionParams {
    trader: SignerWithAddress
    positionManager: PositionManager
    quantity: number | string | BigNumber
    leverage?: number
    getBackMargin?: number | string | BigNumber
    pnl?: number | string | BigNumber
}


export default class PositionHouseTestingTool {
    private positionHouse: PositionHouse;
    private positionManager: PositionManager;
    private userGateway: UserGatewayTest;
    private liquidatorGateway: LiquidatorGateway

    constructor(positionHouse: PositionHouse, positionManager: PositionManager, userGateway: UserGatewayTest, liquidatorGateway: LiquidatorGateway) {
        this.positionHouse = positionHouse;
        this.positionManager = positionManager;
        this.userGateway = userGateway;
        this.liquidatorGateway = liquidatorGateway;
    }

    async openMarketPosition({
                                 quantity,
                                 leverage,
                                 side,
                                 trader,
                                 instanceTrader,
                                 expectedMargin,
                                 expectedNotional,
                                 expectedSize,
                                 expectDeposit,
                                 price = 5000,
                                 _positionManager = this.positionManager
                             }: OpenMarketPositionParams) {
        trader = instanceTrader && instanceTrader.address || trader
        if (!trader) throw new Error("No trader")
        await this.userGateway.connect(instanceTrader).openMarketPosition(
            _positionManager.address,
            side,
            quantity,
            leverage,
        )

        const positionInfo = await this.userGateway.getPosition(_positionManager.address, trader) as unknown as PositionData;
        const currentPrice = Number((await _positionManager.getPrice()).toString())
        const openNotional = positionInfo.openNotional.div('10000').toString()
        expectedNotional = expectedNotional && expectedNotional.toString() || quantity.mul(price).toString()
        return positionInfo
        // expect(positionInfo.quantity.toString()).eq((expectedSize || (side == 0 ? quantity : -quantity)).toString())
    }

    async closePosition({trader, positionManager, quantity, leverage = 0, pnl = 0, getBackMargin = 0}: ClosePositionParams) {
        quantity = BigNumber.from(quantity.toString())
        const currentPosition = await this.userGateway.getPosition(positionManager.address, trader.address) as unknown as PositionData;
        if(currentPosition.quantity.eq(0)){
            throw new Error("No opening position")
        }
        leverage = leverage || currentPosition.leverage
        const side = currentPosition.quantity.lt(0) ? 0 : 1
        const quoteBalanceBefore = await this.getQuoteBalance(positionManager, trader)
        if(!pnl){
            // const liquidityRange = await positionManager.getLiquidityInPipRange(await positionManager.getCurrentPip(), 500, side == 0)
            // const liquidity = liquidityRange[0].map(o => ({pip: o[0].toString(), quantity: o[1].toString()}));
            // let toPip, rawQuantity = Number(quantity.toString());
            // for(const liquidityObj of liquidity){
            //     rawQuantity -= Number(liquidityObj.quantity)
            //     if(rawQuantity <= 0){
            //         toPip = liquidityObj.pip
            //         break;
            //     }
            // }
            // if(!toPip){
            //     throw new Error(`No liquidity to close`)
            // }
            // pnl = currentPosition.quantity.mul(this.pipToPrice(toPip)).sub(currentPosition.openNotional).mul(quantity).div(currentPosition.quantity)
        }
        await this.userGateway.connect(trader).openMarketPosition(
            positionManager.address,
            side,
            quantity,
            leverage
        )
        const quoteBalanceAfter = await this.getQuoteBalance(positionManager, trader)
        // trader should get back margin = (closeQuantity / positionQuantity) * positionMargin + PnL
        getBackMargin = getBackMargin || quantity.mul(currentPosition.margin).div(currentPosition.quantity)
        expect(quoteBalanceAfter.sub(quoteBalanceBefore)).eq(BigNumber.from(getBackMargin.toString()).add(BigNumber.from(pnl.toString())), `Quote asset receive is not correctly, received: ${quoteBalanceAfter.sub(quoteBalanceBefore).toString()}`)
    }

    async instantlyClosePosition({trader, quantity, positionManager} : InstantlyClosePositionParams) {
        positionManager = positionManager || this.positionManager
        await this.userGateway.connect(trader).instantlyClosePosition(positionManager.address, quantity)
        const listOrderPending = await this.userGateway.getListOrderPending(positionManager.address, trader.address)
        await expect(listOrderPending.length).eq(0, "still have pending order")
        const positionData = await this.userGateway.getPosition(positionManager.address, trader.address)
        await expect(positionData.quantity).eq(0, "still have position")
    }

    async expectPositionMargin(positionManager, trader, marginAmount, pnl?: number){
        const {position, positionNotional, unrealizedPnl} = await this.userGateway.getPositionAndUnreliablePnl(positionManager.address, trader.address, 1)
        const {margin} = position
        expect(margin.toString()).eq(margin.toString())
        pnl && expect(unrealizedPnl.toString()).eq(pnl.toString())
    }

    async openLimitPositionAndExpect({
                                         _trader,
                                         limitPrice,
                                         leverage,
                                         quantity,
                                         side,
                                         _positionManager,
                                        skipCheckBalance = false
                                     }: OpenLimitPositionAndExpectParams) {
        _positionManager = _positionManager || this.positionManager

        quantity = BigNumber.from(quantity.toString())
        limitPrice = BigNumber.from(Math.round(Number(priceToPip(limitPrice.toString()))))
        leverage = BigNumber.from(leverage.toString())
        const [trader0] = await ethers.getSigners()
        _trader = _trader || trader0;
        if (!_positionManager) throw Error("No position manager")
        if (!_trader) throw Error("No trader")
        const quoteBalanceBefore = await this.getQuoteBalance(_positionManager, _trader)
        const tx = await this.userGateway.connect(_trader).openLimitOrder(_positionManager.address, side, quantity, limitPrice, leverage)
        const quoteBalanceAfter = await this.getQuoteBalance(_positionManager, _trader)
        const margin = quantity.mul(Math.round(Number(pipToPrice(Number(limitPrice))))).div(leverage).mul(BigNumber.from('-1'))
        const fee = quantity.mul(Math.round(Number(pipToPrice(Number(limitPrice))))).div(BigNumber.from('10000')).mul(BigNumber.from('-1'))
        !skipCheckBalance && expect(quoteBalanceAfter.sub(quoteBalanceBefore)).eq(margin.add(fee))
        const {orderId, priceLimit} = await getOrderIdByTx(tx)
        // const orderDetails = await this.getPendingOrder({orderId, pip: priceToPip(Number(limitPrice))})
        // expect(orderDetails.isFilled).eq(false)
        return {
            orderId: orderId,
            pip: priceToPip(limitPrice.toNumber())
        } as LimitOrderReturns
    }

    async closeLimitPosition({trader, price, quantity, positionManager}: CloseLimitPositionParams) {
        const positionManagerInterface = positionManager || this.positionManager
        const tx = await this.userGateway
            .connect(trader)
            .closeLimitPosition(
                positionManagerInterface.address,
                priceToPip(Number(price)),
                quantity
            );
        console.log("has liquidity",await positionManagerInterface.hasLiquidity(priceToPip(price)))
        const {orderId, priceLimit} = await getOrderIdByTx(tx)
        console.log("priceLimit", priceLimit)
        // const orderDetails = await this.getPendingOrder({orderId, pip: priceToPip(Number(price))})
        // expect(orderDetails.isFilled).eq(false)
        // // expect(orderDetails.size).eq(quantity)
        // expect(orderDetails.partialFilled).eq(0)
        return {
            orderId,
            pip: priceToPip(Number(price))
        } as LimitOrderReturns
    }

    async cancelLimitOrder({trader, positionManager, orderIdx, isReduce, refundAmount}: CancelLimitOrderParams) {
        await this.userGateway.connect(trader).cancelLimitOrder(positionManager.address, orderIdx, isReduce)
    }

    async closeMarketPosition({trader, positionManager, quantity}: CloseMarketPositionParams) {
        const positionManagerInterface = positionManager || this.positionManager
        const positionData1 = (await this.userGateway.connect(trader).getPosition(positionManagerInterface.address, trader.address)) as unknown as PositionData;
        await this.userGateway.connect(trader).closePosition(positionManagerInterface.address, quantity);

        const positionData = (await this.userGateway.getPosition(positionManagerInterface.address, trader.address)) as unknown as PositionData;
        expect(positionData.margin).eq(0);
        expect(positionData.quantity).eq(0);
    }

    async liquidate({trader}: BasicParam) {
        await this.liquidatorGateway.liquidate(this.positionManager.address, trader.address);

    }

    async getPosition(trader: SignerWithAddress): Promise<PositionData> {

        return (await this.userGateway.getPosition(this.positionManager.address, trader.address)) as unknown as PositionData;

    }

    async expectPositionData(trader: SignerWithAddress, {
        margin,
        quantity,
        notional
    }: any) {
        const positionData = (await this.getPosition(trader))
        margin && expect(positionData.margin.toString()).eq(margin.toString());
        quantity && expect(positionData.quantity.toString()).eq(quantity.toString());
        notional && expect(positionData.openNotional.toString()).eq(notional.toString());
    }

    async debugPosition(trader: SignerWithAddress, pm?: PositionManager){
        pm = pm || this.positionManager
        const positionInfo = await this.userGateway.getPosition(pm.address, trader.address) as unknown as PositionData;
        // console.log("positionInfo", positionInfo)
        const currentPrice = Number((await pm.getPrice()).div('10000').toString())
        const openNotional = positionInfo.openNotional.toString()
        // expectedNotional = expectedNotional && expectedNotional.toString() || quantity.mul(price).toString()
        // console.log(`debugPosition Position Info of ${trader.address}`)
        const oldPosition = await this.userGateway.getPosition(pm.address, trader.address)
        const pnl = await this.userGateway.getPositionNotionalAndUnrealizedPnl(pm.address, trader.address,1, oldPosition)
        const basicPoint = await pm.getBasisPoint()
        // console.log("positionInfo", positionInfo)
        console.table([
            {
                openNotional: openNotional,
                currentPrice: currentPrice,
                quantity: positionInfo.quantity.toString(),
                margin: positionInfo.margin.toString(),
                unrealizedPnl: pnl.unrealizedPnl.toString(),
                // entryPrice: positionInfo.openNotional.mul(basicPoint).div(positionInfo.quantity.abs()).toString()
            }
        ])
    }

    async getMaintenanceDetail({trader}: BasicParam): Promise<MaintenanceDetail> {

        const calcOptionSpot = 1
        return (await this.userGateway.getMaintenanceDetail(this.positionManager.address, trader.address, calcOptionSpot)) as unknown as MaintenanceDetail;

    }

    /*
     * Pump price when empty order book
     */
    async pumpPrice({toPrice, pumper, pumper2, positionManager} : any) {
        positionManager = positionManager || this.positionManager
        await this.openLimitPositionAndExpect({
            _trader: pumper, leverage: 10, limitPrice: toPrice, quantity: 1, side: 1, _positionManager: positionManager, skipCheckBalance: true
        })
        await this.openMarketPosition({
            instanceTrader: pumper2, leverage: 10, quantity: BigNumber.from('1'), side: 0, expectedSize: BigNumber.from('1'), _positionManager: positionManager
        })
    }

    async dumpPrice({toPrice, pumper, pumper2, positionManager} : any) {
        positionManager = positionManager || this.positionManager
        await this.openLimitPositionAndExpect({
            _trader: pumper, leverage: 10, limitPrice: toPrice, quantity: 1, side: 0, _positionManager: positionManager, skipCheckBalance: true
        })
        await this.openMarketPosition({
            instanceTrader: pumper2, leverage: 10, quantity: BigNumber.from('1'), side: 1, expectedSize: BigNumber.from('1'), _positionManager: positionManager
        })
    }


    async getQuoteBalance(positionManager: PositionManager, user: SignerWithAddress): Promise<BigNumber>{
        const quoteAsset = await positionManager.getQuoteAsset()
        const token = await ethers.getContractAt("BEP20Mintable", quoteAsset) as unknown as BEP20Mintable
        return token.balanceOf(user.address)
    }

    protected pipToPrice(pip): BigNumber{
        return BigNumber.from(pip.toString()).div(100)
    }


}