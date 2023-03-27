import {
    AccessController,
    BEP20Mintable,
    FundingRateTest,
    InsuranceFund,
    LiquidatorGateway,
    PositionHouse, PositionHouseConfigurationProxy, PositionManager, TesterGateway,
    UserGateway, UserGatewayTest
} from "../../typeChain";
import {
    ExpectTestCaseParams, fromWei,
    OpenLimitOrderParam,
    OpenMarketPositionParam, pipToPrice,
    PositionData,
    priceToPip,
    toWei
} from "../shared/utilities";
import {expect} from "chai";
import YAML from "js-yaml"
import {deployPositionHouse} from "../shared/deploy";
import {BigNumber, ContractFactory} from "ethers";
import PositionHouseTestingTool from "../shared/positionHouseTestingTool";
import {ethers} from "hardhat";


export class TestFutureHelper {
    listTrader: [any, any, any, any, any, any, any, any]
    mockToken: BEP20Mintable
    positionManager: FundingRateTest
    positionHouse: PositionHouse
    userGateway: UserGatewayTest
    liquidatorGateway: LiquidatorGateway
    insuranceFund: InsuranceFund
    accessController: AccessController

    constructor(signers, opts : {
        mockToken: BEP20Mintable,
        positionManager: FundingRateTest,
        positionHouse: PositionHouse,
        userGateway: UserGatewayTest,
        liquidatorGateway: LiquidatorGateway,
        insuranceFund: InsuranceFund,
        accessController: AccessController
    }) {
        this.accessController = opts.accessController;
        this.mockToken = opts.mockToken;
        this.positionManager = opts.positionManager;
        this.positionHouse = opts.positionHouse;
        this.userGateway = opts.userGateway;
        this.liquidatorGateway = opts.liquidatorGateway;
        this.insuranceFund = opts.insuranceFund;
        this.listTrader = signers
        console.log(signers[1].address)
    }

    async expectData(position, pendingOrder, maintenance, claimableAmount, traderId) {


        await this.expectPositionData(position, traderId)

        await this.expectMaintenanceDetail(maintenance, traderId)

        await this.expectClaimableAmount(claimableAmount, traderId)

        await this.expectPendingOrder(pendingOrder, traderId)

        return true;
    }

    async expectMaintenanceDetail(maintenance, traderId) {
        const maintenanceDetail = await this.userGateway.getMaintenanceDetail(
            this.positionManager.address,
            this.listTrader[traderId].address,
            1
        )

        if (maintenance != "" && maintenance != undefined) {
            console.log("expect margin ratio", maintenance.marginRatio)
            if (maintenance.marginRatio != '')
                expect(await this.expectDataInRange(maintenance.marginRatio, Number(maintenanceDetail.marginRatio), 0.001)).eq(true, `wrong expect margin ratio: expect ${maintenance.marginRatio}, actual ${maintenanceDetail.marginRatio}`)
            console.log("expect margin balance", maintenance.marginBalance)
            if (maintenance.marginBalance != '')
                expect(await this.expectDataInRange(toWei(maintenance.marginBalance), Number(maintenanceDetail.marginBalance), 0.001)).eq(true, `wrong expect margin ratio: expect ${maintenance.marginBalance}, actual ${maintenanceDetail.marginBalance}`)
            console.log("expect margin maintenance", maintenance.maintenanceMargin)
            if (maintenance.maintenanceMargin != '')
                expect(await this.expectDataInRange(toWei(maintenance.maintenanceMargin), Number(maintenanceDetail.maintenanceMargin), 0.001)).eq(true, `wrong expect maintenance margin: expect ${maintenance.maintenanceMargin}, actual ${maintenanceDetail.maintenanceMargin}`)
        }
    }

    async expectPositionData(position, traderId) {
        const traderPosition = (await this.userGateway.getPosition(this.positionManager.address, this.listTrader[traderId].address)) as unknown as PositionData

        const positionNotionalAndPnLTrader = await this.userGateway.getPositionNotionalAndUnrealizedPnl(
            this.positionManager.address,
            this.listTrader[traderId].address,
            1,
            traderPosition
        )
        console.log("before expect position data #######################", position, traderPosition.toString());
        if (position != "" && position != undefined) {
            console.log("log position absolute margin", fromWei(traderPosition.absoluteMargin.toString()))
            if (position.marginAbsolute != '')
                expect(await this.expectDataInRange(toWei(position.marginAbsolute), Number(traderPosition.absoluteMargin), 0.001)).eq(true, `wrong expect absolute margin: expect ${position.marginAbsolute}, actual ${traderPosition.absoluteMargin}`)
            console.log("log position quantity ", fromWei(traderPosition.quantity.toString()))
            if (position.quantity != '') {
                expect(toWei(position.quantity)).eq(traderPosition.quantity, "wrong expect quantity");
            }
            console.log("log position pnl", fromWei(positionNotionalAndPnLTrader.unrealizedPnl.toString()))
            if (position.pnl != '')
                expect(await this.expectDataInRange(toWei(position.pnl), Number(positionNotionalAndPnLTrader.unrealizedPnl), 0.001)).eq(true, `wrong expect pnl: expect ${position.pnl}, actual ${positionNotionalAndPnLTrader.unrealizedPnl}`)
            console.log("log position openNotional", fromWei(traderPosition.openNotional.toString()))
            if (position.notional != '')
                expect(await this.expectDataInRange(toWei(position.notional), Number(traderPosition.openNotional), 0.001)).eq(true, `wrong expect notional: expect ${position.notional}, actual ${traderPosition.openNotional}`)
            console.log("log position margin", fromWei(traderPosition.margin.toString()))
            if (position.margin != '')
                expect(await this.expectDataInRange(toWei(position.margin), Number(traderPosition.margin), 0.001)).eq(true, `wrong expect margin: expect ${position.margin}, actual ${traderPosition.margin}`)
        }
    }

    async expectClaimableAmount(claimableAmount, traderId) {
        const traderClaimableAmount = await this.userGateway.getClaimAmount(this.positionManager.address, this.listTrader[traderId].address)
        console.log("claimable amount when expect", claimableAmount)
        if (claimableAmount != "" && claimableAmount != undefined) {
            expect(await this.expectDataInRange(toWei(claimableAmount), Number(traderClaimableAmount), 0.001)).eq(true, `wrong expect claimable amount: expect ${claimableAmount}, actual ${traderClaimableAmount}`)
        }
    }

    async expectPendingOrder(pendingOrder, traderId) {
        const traderAddress = this.listTrader[traderId].address
        const listPendingOrder = await this.userGateway.getListOrderPending(this.positionManager.address, traderAddress)
        if (pendingOrder != "" && pendingOrder != undefined) {
            if (pendingOrder.orders > 1) {
                for (let i = 0; i < pendingOrder.length; i++) {
                    const order = listPendingOrder.find(x => (x.orderId.toString() == pendingOrder.id && x.pip.toString() == priceToPip(pendingOrder.price)))
                    if (order == undefined) console.log("NOT FOUND ORDER")
                    console.log("log before expect pending order quantity index", i)
                    expect(toWei(pendingOrder[i].quantity)).eq(order.quantity, "wrong expect order quantity")

                    console.log("log before expect pending order partial filled index", i)
                    expect(toWei(pendingOrder[i].partialFilled)).eq(order.partialFilled, "wrong expect order partial filled")
                }
            } else {
                const order = listPendingOrder.find(x => (x.orderId.toString() == pendingOrder.id && x.pip.toString() == priceToPip(pendingOrder.price)))
                if (order == undefined) console.log("NOT FOUND ORDER")
                console.log("log before expect pending order quantity")
                if (pendingOrder.quantity != "")
                    expect(toWei(pendingOrder.quantity)).eq(order.quantity, "wrong expect order quantity")

                console.log("log before expect pending order partial filled")
                if (pendingOrder.partialFilled != "")
                    expect(toWei(pendingOrder.partialFilled)).eq(order.partialFilled, "wrong expect order partial filled")
            }
        }
    }

    async expectDataInRange(_expect: number, _actual: number, _percentage: number): Promise<boolean> {
        // default _percentage is 0.1%
        if (_actual > 0) {
            return _expect >= _actual * (1 - _percentage) && _expect <= _actual * (1 + _percentage);
        }
        return _expect <= _actual * (1 - _percentage) && _expect >= _actual * (1 + _percentage);
    }

    async openLimitOrderAndExpect(input, balanceChanged, revert) {
        const traderSigner = this.listTrader[input.trader]
        const traderAddress = traderSigner.address

        const balanceBeforeOpen = await this.mockToken.balanceOf(traderAddress)
        if (revert != '' && revert != undefined) {
            await expect(this.userGateway.connect(traderSigner).openLimitOrderTest(this.positionManager.address, input.side, toWei(input.quantity), priceToPip(input.price), input.leverage, toWei(input.deposit))).to.be.revertedWith(revert)
        } else {
            await this.userGateway.connect(traderSigner).openLimitOrderTest(this.positionManager.address, input.side, toWei(input.quantity), priceToPip(input.price), input.leverage, toWei(input.deposit))

            // update mark price and index price
            const lastPriceAfterMarketOrder = Number(await this.positionManager.getPrice()) / Number(await this.positionManager.getBaseBasisPoint())
            await this.positionManager.setMockPrice(lastPriceAfterMarketOrder, lastPriceAfterMarketOrder)
        }
        const balanceAfterOpen = await this.mockToken.balanceOf(traderAddress)

        console.log("log balance changed before open limit")
        if (balanceChanged != undefined && balanceChanged != '')
        // await expect(toWei(balanceChanged)).eq(balanceAfterOpen.sub(balanceBeforeOpen), "wrong balance when open limit")
        expect(await this.expectDataInRange(toWei(balanceChanged), Number(balanceAfterOpen.sub(balanceBeforeOpen)), 0.001)).eq(true, `wrong balance changed when open limit: expect ${balanceChanged}, actual ${balanceAfterOpen.sub(balanceBeforeOpen)}`)

    }

    async openMarketOrderAndExpect(input, balanceChanged, revert) {
        const traderSigner = this.listTrader[input.trader]
        const traderAddress = traderSigner.address

        const balanceBeforeOpen = await this.mockToken.balanceOf(traderAddress)
        console.log("revert reason", revert)
        if (revert != '' && revert != undefined) {
            await expect(this.userGateway.connect(traderSigner).openMarketPositionTest(this.positionManager.address, input.side, toWei(input.quantity), input.leverage, toWei(input.deposit))).to.be.revertedWith(revert)
        } else {
            await this.userGateway.connect(traderSigner).openMarketPositionTest(this.positionManager.address, input.side, toWei(input.quantity), input.leverage, toWei(input.deposit))

            // update mark price and index price
            const lastPriceAfterMarketOrder = Number(await this.positionManager.getPrice()) / Number(await this.positionManager.getBaseBasisPoint())
            await this.positionManager.setMockPrice(lastPriceAfterMarketOrder, lastPriceAfterMarketOrder)
        }
        const balanceAfterOpen = await this.mockToken.balanceOf(traderAddress)

        console.log("log balance changed before open market")
        if (balanceChanged != undefined && balanceChanged != '')
        // await expect(toWei(balanceChanged)).eq(balanceAfterOpen.sub(balanceBeforeOpen), "wrong balance when open market")
        expect(await this.expectDataInRange(toWei(balanceChanged), Number(balanceAfterOpen.sub(balanceBeforeOpen)), 0.001)).eq(true, `wrong balance changed when open market: expect ${balanceChanged}, actual ${balanceAfterOpen.sub(balanceBeforeOpen)}`)


    }

    async closeMarketOrderAndExpect(input, balanceChanged, revert) {
        const traderSigner = this.listTrader[input.trader]
        const traderAddress = traderSigner.address

        const balanceBeforeOpen = await this.mockToken.balanceOf(traderAddress)
        if (revert != '' && revert != undefined) {
            await expect(this.userGateway.connect(traderSigner).closePosition(this.positionManager.address, toWei(input.quantity))).to.be.revertedWith(revert)
        } else {
            await this.userGateway.connect(traderSigner).closePosition(this.positionManager.address, toWei(input.quantity))

            // update mark price and index price
            const lastPriceAfterMarketOrder = Number(await this.positionManager.getPrice()) / Number(await this.positionManager.getBaseBasisPoint())
            await this.positionManager.setMockPrice(lastPriceAfterMarketOrder, lastPriceAfterMarketOrder)
        }
        const balanceAfterOpen = await this.mockToken.balanceOf(traderAddress)

        console.log("log balance changed before close market")
        if (balanceChanged != undefined && balanceChanged != '')
            // await expect(toWei(balanceChanged)).eq(balanceAfterOpen.sub(balanceBeforeOpen), "wrong balance when close market")
        expect(await this.expectDataInRange(toWei(balanceChanged), Number(balanceAfterOpen.sub(balanceBeforeOpen)), 0.001)).eq(true, `wrong balance changed when close market: expect ${balanceChanged}, actual ${balanceAfterOpen.sub(balanceBeforeOpen)}`)

    }

    async instantlyCloseMarketAndExpect(input, balanceChanged, revert) {
        const traderSigner = this.listTrader[input.trader]
        const traderAddress = traderSigner.address

        const balanceBeforeOpen = await this.mockToken.balanceOf(traderAddress)
        if (revert != '' && revert != undefined) {
            await expect(this.userGateway.connect(traderSigner).instantlyClosePosition(this.positionManager.address, toWei(input.quantity))).to.be.revertedWith(revert)
        } else {
            await this.userGateway.connect(traderSigner).instantlyClosePosition(this.positionManager.address, toWei(input.quantity))

            // update mark price and index price
            const lastPriceAfterMarketOrder = Number(await this.positionManager.getPrice()) / Number(await this.positionManager.getBaseBasisPoint())
            await this.positionManager.setMockPrice(lastPriceAfterMarketOrder, lastPriceAfterMarketOrder)
        }
        const balanceAfterOpen = await this.mockToken.balanceOf(traderAddress)

        console.log("log balance changed before instantly close")
        if (balanceChanged != undefined && balanceChanged != '')
            // await expect(toWei(balanceChanged)).eq(balanceAfterOpen.sub(balanceBeforeOpen), "wrong balance when instantly close market")
        expect(await this.expectDataInRange(toWei(balanceChanged), Number(balanceAfterOpen.sub(balanceBeforeOpen)), 0.001)).eq(true, `wrong balance changed when instantly close: expect ${balanceChanged}, actual ${balanceAfterOpen.sub(balanceBeforeOpen)}`)

    }

    async closeLimitOrderAndExpect(input, balanceChanged, revert) {
        const traderSigner = this.listTrader[input.trader]
        const traderAddress = traderSigner.address

        const balanceBeforeOpen = await this.mockToken.balanceOf(traderAddress)
        if (revert != '' && revert != undefined) {
            await expect(this.userGateway.connect(traderSigner).closeLimitPosition(this.positionManager.address, priceToPip(input.price), toWei(input.quantity))).to.be.revertedWith(revert)
        } else {
            await this.userGateway.connect(traderSigner).closeLimitPosition(this.positionManager.address, priceToPip(input.price), toWei(input.quantity))

            // update mark price and index price
            const lastPriceAfterMarketOrder = Number(await this.positionManager.getPrice()) / Number(await this.positionManager.getBaseBasisPoint())
            await this.positionManager.setMockPrice(lastPriceAfterMarketOrder, lastPriceAfterMarketOrder)
        }
        const balanceAfterOpen = await this.mockToken.balanceOf(traderAddress)

        console.log("log balance changed before close limit")
        if (balanceChanged != undefined && balanceChanged != '')
            expect(await this.expectDataInRange(toWei(balanceChanged), Number(balanceAfterOpen.sub(balanceBeforeOpen)), 0.001)).eq(true, `wrong balance changed when close limit: expect ${balanceChanged}, actual ${balanceAfterOpen.sub(balanceBeforeOpen)}`)
    }

    async cancelLimitOrderAndExpect(input, balanceChanged, revert) {
        const traderSigner = this.listTrader[input.trader]
        const traderAddress = traderSigner.address

        const listPendingOrder = await this.userGateway.connect(traderSigner).getListOrderPending(this.positionManager.address, traderAddress)

        const obj = listPendingOrder.find(x => (x.orderId.toString() == input.orderId && x.pip.toString() == priceToPip(input.price)))
        console.log("object", obj)
        const balanceBeforeOpen = await this.mockToken.balanceOf(traderAddress)
        if (revert != '' && revert != undefined) {
            await expect(this.userGateway.connect(traderSigner).cancelLimitOrder(this.positionManager.address, obj.orderIdx, obj.isReduce)).to.be.revertedWith(revert)
        } else {
            await this.userGateway.connect(traderSigner).cancelLimitOrder(this.positionManager.address, obj.orderIdx, obj.isReduce);
        }
        const balanceAfterOpen = await this.mockToken.balanceOf(traderAddress)

        console.log("log balance changed before cancel limit")
        if (balanceChanged != undefined && balanceChanged != '')
            expect(await this.expectDataInRange(toWei(balanceChanged), Number(balanceAfterOpen.sub(balanceBeforeOpen)), 0.001)).eq(true, `wrong balance changed when cancel limit: expect ${balanceChanged}, actual ${balanceAfterOpen.sub(balanceBeforeOpen)}`)
    }

    async liquidateAndExpect(input, balanceChanged, claimedProfit, revert) {
        const currentPip = await this.positionManager.getCurrentPip()
        await this.positionManager.setMockPrice(pipToPrice(Number(currentPip)), pipToPrice(Number(currentPip)))
        const traderSigner = this.listTrader[input.trader]
        const traderAddress = traderSigner.address

        const liquidatorSigner = this.listTrader[input.liquidator]
        const liquidatorAddress = liquidatorSigner.address

        const liquidatorBalanceBeforeOpen = await this.mockToken.balanceOf(liquidatorAddress)
        const traderBalanceBeforeOpen = await this.mockToken.balanceOf(traderAddress)
        if (revert != '' && revert != undefined) {
            await expect(this.liquidatorGateway.connect(liquidatorSigner).liquidate(this.positionManager.address, traderAddress)).to.be.revertedWith(revert)
        } else {
            await this.liquidatorGateway.connect(liquidatorSigner).liquidate(this.positionManager.address, traderAddress)
        }
        const liquidatorBalanceAfterOpen = await this.mockToken.balanceOf(liquidatorAddress)
        const traderBalanceAfterOpen = await this.mockToken.balanceOf(traderAddress)

        console.log("log balance changed before liquidate")
        if (balanceChanged != undefined && balanceChanged != '')
            expect(await this.expectDataInRange(toWei(balanceChanged), Number(liquidatorBalanceAfterOpen.sub(liquidatorBalanceBeforeOpen)), 0.001)).eq(true, `wrong balance changed when liquidate: expect ${balanceChanged}, actual ${liquidatorBalanceAfterOpen.sub(liquidatorBalanceBeforeOpen)}`)

        if (claimedProfit != undefined && claimedProfit != '')
            // await expect(toWei(claimedProfit)).eq(traderBalanceAfterOpen.sub(traderBalanceBeforeOpen), "wrong claimed profit expect")
        expect(await this.expectDataInRange(toWei(claimedProfit), Number(traderBalanceAfterOpen.sub(traderBalanceBeforeOpen)), 0.001)).eq(true, `wrong claimed profit when liquidate: expect ${claimedProfit}, actual ${traderBalanceAfterOpen.sub(traderBalanceBeforeOpen)}`)

    }

    async claimFundAndExpect(input, balanceChanged, revert) {
        const traderSigner = this.listTrader[input.trader]
        const traderAddress = traderSigner.address

        const balanceBeforeOpen = await this.mockToken.balanceOf(traderAddress)
        if (revert != '' && revert != undefined) {
            await expect(this.userGateway.connect(traderSigner).claimFund(this.positionManager.address)).to.be.revertedWith(revert)
        } else {
            await this.userGateway.connect(traderSigner).claimFund(this.positionManager.address)
        }
        const balanceAfterOpen = await this.mockToken.balanceOf(traderAddress)

        console.log("log balance changed before claim fund")
        // if (balanceChanged != undefined && balanceChanged != '')
        expect(await this.expectDataInRange(toWei(balanceChanged), Number(balanceAfterOpen.sub(balanceBeforeOpen)), 0.001)).eq(true, `wrong balance changed when claim fund: expect ${balanceChanged}, actual ${balanceAfterOpen.sub(balanceBeforeOpen)}`)
    }

    async addMarginAndExpect(input, balanceChanged, revert) {
        const traderSigner = this.listTrader[input.trader]
        const traderAddress = traderSigner.address

        const balanceBeforeOpen = await this.mockToken.balanceOf(traderAddress)
        if (revert != '' && revert != undefined) {
            await expect(this.userGateway.connect(traderSigner).addMargin(this.positionManager.address, toWei(input.margin))).to.be.revertedWith(revert)
        } else {
            await this.userGateway.connect(traderSigner).addMargin(this.positionManager.address, toWei(input.margin))
        }
        const balanceAfterOpen = await this.mockToken.balanceOf(traderAddress)

        console.log("log balance changed before add margin")
        // if (balanceChanged != undefined && balanceChanged != '')
        expect(await this.expectDataInRange(toWei(balanceChanged), Number(balanceAfterOpen.sub(balanceBeforeOpen)), 0.001)).eq(true, `wrong balance changed when add margin: expect ${balanceChanged}, actual ${balanceAfterOpen.sub(balanceBeforeOpen)}`)

    }

    async removeMarginAndExpect(input, balanceChanged, revert) {
        const traderSigner = this.listTrader[input.trader]
        const traderAddress = traderSigner.address

        const balanceBeforeOpen = await this.mockToken.balanceOf(traderAddress)
        if (revert != '' && revert != undefined) {
            await expect(this.userGateway.connect(traderSigner).removeMargin(this.positionManager.address, toWei(input.margin))).to.be.revertedWith(revert)
            return
        } else {
            await this.userGateway.connect(traderSigner).removeMargin(this.positionManager.address, toWei(input.margin))
        }
        const balanceAfterOpen = await this.mockToken.balanceOf(traderAddress)

        console.log("log balance changed before remove margin")
        // if (balanceChanged != undefined && balanceChanged != '')
        expect(await this.expectDataInRange(toWei(balanceChanged), Number(balanceAfterOpen.sub(balanceBeforeOpen)), 0.001)).eq(true, `wrong balance changed when remove margin: expect ${balanceChanged}, actual ${balanceAfterOpen.sub(balanceBeforeOpen)}`)
    }

    async changePrice(price) {
        const traderCp1Signer = this.listTrader[6]
        const traderCp2Signer = this.listTrader[7]

        const currentPrice = pipToPrice(Number(await this.positionManager.getCurrentPip()))
        if (price > currentPrice) {
            await this.userGateway.connect(traderCp1Signer).openLimitOrderTest(this.positionManager.address, 1, toWei('1'), priceToPip(price), 10, toWei(price/10))

            await this.userGateway.connect(traderCp2Signer).openMarketPositionTest(this.positionManager.address, 0, toWei('1'), 10, toWei(price/10))
        } else {
            await this.userGateway.connect(traderCp1Signer).openLimitOrderTest(this.positionManager.address, 0, toWei('1'), priceToPip(price), 10, toWei(price/10))

            await this.userGateway.connect(traderCp2Signer).openMarketPositionTest(this.positionManager.address, 1, toWei('1'), 10, toWei(price/10))
        }

        await this.positionManager.setMockPrice(BigNumber.from(price), BigNumber.from(price))
    }

    // process test case by yaml
    async process(yaml) {
        let docs;
        try {
            docs = YAML.loadAll(yaml)
        } catch (e) {
            throw new Error(`Parse YAML error: ${e.message}. Please check the format`);
        }
        this.log(`Total cases: ${docs.length}`)
        const processor = new YamlTestCaseProcess(this)
        let i = 0
        for (const steps of docs) {
            const startPrice = steps[0].getProp("Price") || 5000;
            i++;
            console.group(`---------------- Run case #${i}`)
            for (let step of steps) {
                const stepIdentityKey = Object.keys(step)[0];
                let stepFnName = step[stepIdentityKey];
                if(typeof stepFnName === 'object') {
                    step = stepFnName;
                    stepFnName = Object.keys(stepFnName)[0];
                }
                this.log("stepFnName", stepFnName);
                if (!processor[stepFnName]) {
                    throw new Error(`${stepFnName} is not supported yet. Need to implement`)
                }
                this.log("\x1b[33m%s\x1b[0m", `--- Processing ${stepIdentityKey} ${stepFnName}`)
                await processor[stepFnName](step);
            }
            console.groupEnd();
        }
    }

    log(...args) {
        console.log('[TestFutureHelper]: ', ...args);
    }


}

class YamlTestCaseProcess {
    testHelper: TestFutureHelper

    constructor(testHelper: TestFutureHelper) {
        this.testHelper = testHelper
    }

    async OpenLimit(stepData) {
        const input = stepData.getProp("Input") || ""
        let quantity, leverage, trader, deposit, side, price
        if (input != "") {
            [
                quantity,
                leverage,
                trader,
                deposit,
                side,
                price
            ] = this.extractOpenOrderInput(input)
        }
        const expect = stepData.getProp("Expect") || ""
        let position,
            pendingOrder,
            maintenance,
            balanceChanged,
            claimableAmount,
            revert
        if (expect != "") {
            [
                position,
                pendingOrder,
                maintenance,
                balanceChanged,
                claimableAmount,
                revert
            ] = this.extractExpectData(expect)
        }

        await this.testHelper.openLimitOrderAndExpect({
            quantity,
            leverage,
            trader,
            deposit,
            side,
            price
        }, balanceChanged, revert)
        if (expect != "") {
            await this.testHelper.expectData(position, pendingOrder, maintenance, claimableAmount, trader)
        }
    }

    async OpenMarket(stepData) {
        const input = stepData.getProp("Input") || ""
        let quantity, leverage, trader, deposit, side, price
        if (input != "") {
            [
                quantity,
                leverage,
                trader,
                deposit,
                side,
                price
            ] = this.extractOpenOrderInput(input)
        }
        const expect = stepData.getProp("Expect") || ""
        let position,
            pendingOrder,
            maintenance,
            balanceChanged,
            claimableAmount,
            revert
        if (expect != "") {
            [
                position,
                pendingOrder,
                maintenance,
                balanceChanged,
                claimableAmount,
                revert
            ] = this.extractExpectData(expect)
        }

        await this.testHelper.openMarketOrderAndExpect({
            quantity,
            leverage,
            trader,
            deposit,
            side
        }, balanceChanged, revert)
        if (expect != "") {
            await this.testHelper.expectData(position, pendingOrder, maintenance, claimableAmount, trader)
        }
    }

    async CloseLimit(stepData) {
        const input = stepData.getProp("Input") || ""
        let quantity, trader, price
        if (input != "") {
            [
                quantity,
                trader,
                price
            ] = this.extractCloseOrderInput(input)
        }

        const expect = stepData.getProp("Expect") || ""
        let position,
            pendingOrder,
            maintenance,
            balanceChanged,
            claimableAmount,
            revert
        if (expect != "") {
            [
                position,
                pendingOrder,
                maintenance,
                balanceChanged,
                claimableAmount,
                revert
            ] = this.extractExpectData(expect)
        }
        await this.testHelper.closeLimitOrderAndExpect({
            quantity,
            trader,
            price
        }, balanceChanged, revert)

        if (expect != "")
            await this.testHelper.expectData(position, pendingOrder, maintenance, claimableAmount, trader)
    }

    async CloseMarket(stepData) {
        const input = stepData.getProp("Input") || ""
        let quantity, trader, price
        if (input != "") {
            [
                quantity,
                trader,
                price
            ] = this.extractCloseOrderInput(input)
        }

        const expect = stepData.getProp("Expect") || ""
        let position,
            pendingOrder,
            maintenance,
            balanceChanged,
            claimableAmount,
            revert
        if (expect != "") {
            [
                position,
                pendingOrder,
                maintenance,
                balanceChanged,
                claimableAmount,
                revert
            ] = this.extractExpectData(expect)
        }

        await this.testHelper.closeMarketOrderAndExpect({
            quantity,
            trader
        }, balanceChanged, revert)

        await this.testHelper.expectData(position, pendingOrder, maintenance, claimableAmount, trader)
    }

    async CancelLimit(stepData) {
        const input = stepData.getProp("Input") || ""
        let trader, price, orderId
        if (input != "") {
            [
                trader,
                price,
                orderId
            ] = this.extractCancelLimitInput(input)
        }

        const expect = stepData.getProp("Expect") || ""
        let position,
            pendingOrder,
            maintenance,
            balanceChanged,
            claimableAmount,
            revert
        if (expect != "") {
            [
                position,
                pendingOrder,
                maintenance,
                balanceChanged,
                claimableAmount,
                revert
            ] = this.extractExpectData(expect)
        }

        await this.testHelper.cancelLimitOrderAndExpect({
            trader,
            price,
            orderId
        }, balanceChanged, revert)

        await this.testHelper.expectData(position, pendingOrder, maintenance, claimableAmount, trader)
    }

    async AddMargin(stepData) {
        const input = stepData.getProp("Input") || ""
        let trader, margin
        if (input != "") {
            [
                trader,
                margin
            ] = this.extractManualMarginInput(input)
        }

        const expect = stepData.getProp("Expect") || ""
        let position,
            pendingOrder,
            maintenance,
            balanceChanged,
            claimableAmount,
            revert
        if (expect != "") {
            [
                position,
                pendingOrder,
                maintenance,
                balanceChanged,
                claimableAmount,
                revert
            ] = this.extractExpectData(expect)
        }

        await this.testHelper.addMarginAndExpect({
            margin,
            trader
        }, balanceChanged, revert)

        await this.testHelper.expectData(position, pendingOrder, maintenance, claimableAmount, trader)
    }

    async RemoveMargin(stepData) {
        const input = stepData.getProp("Input") || ""
        let trader, margin
        if (input != "") {
            [
                trader,
                margin
            ] = this.extractManualMarginInput(input)
        }

        const expect = stepData.getProp("Expect") || ""
        let position,
            pendingOrder,
            maintenance,
            balanceChanged,
            claimableAmount,
            revert
        if (expect != "") {
            [
                position,
                pendingOrder,
                maintenance,
                balanceChanged,
                claimableAmount,
                revert
            ] = this.extractExpectData(expect)
        }

        await this.testHelper.removeMarginAndExpect({
            margin,
            trader
        }, balanceChanged, revert)

        await this.testHelper.expectData(position, pendingOrder, maintenance, claimableAmount, trader)
    }

    async ClaimFund(stepData) {
        const input = stepData.getProp("Input")
        const [
            trader
        ] = this.extractClaimFundInput(input)

        const expect = stepData.getProp("Expect") || ""
        let position,
            pendingOrder,
            maintenance,
            balanceChanged,
            claimableAmount,
            revert
        if (expect != "") {
            [
                position,
                pendingOrder,
                maintenance,
                balanceChanged,
                claimableAmount,
                revert
            ] = this.extractExpectData(expect)
        }

        await this.testHelper.claimFundAndExpect({
            trader
        }, balanceChanged, revert)

        await this.testHelper.expectData(position, pendingOrder, maintenance, claimableAmount, trader)
    }

    async Liquidate(stepData) {
        const input = stepData.getProp("Input")
        const [
            trader,
            liquidator
        ] = this.extractLiquidateInput(input)

        const expect = stepData.getProp("Expect") || ""
        let position,
            pendingOrder,
            maintenance,
            balanceChanged,
            claimableAmount,
            revert,
            claimedProfit
        if (expect != "") {
            [
                position,
                pendingOrder,
                maintenance,
                balanceChanged,
                claimableAmount,
                revert,
                claimedProfit
            ] = this.extractExpectData(expect)
        }

        await this.testHelper.liquidateAndExpect({
            trader,
            liquidator
        }, balanceChanged, claimedProfit, revert)

        await this.testHelper.expectData(position, pendingOrder, maintenance, claimableAmount, trader)
    }

    async ExpectData(stepData) {
        const input = stepData.getProp("Input")
        const [
            trader
        ] = this.extractExpectInput(input)

        const expect = stepData.getProp("Expect") || ""
        let position,
            pendingOrder,
            maintenance,
            balanceChanged,
            claimableAmount,
            revert
        if (expect != "") {
            [
                position,
                pendingOrder,
                maintenance,
                balanceChanged,
                claimableAmount,
                revert
            ] = this.extractExpectData(expect)
        }

        await this.testHelper.expectData(position, pendingOrder, maintenance, claimableAmount, trader)
    }

    async InstantlyClose(stepData) {
        const input = stepData.getProp("Input") || ""
        let quantity, trader, price
        if (input != "") {
            [
                quantity,
                trader,
                price
            ] = this.extractCloseOrderInput(input)
        }

        const expect = stepData.getProp("Expect") || ""
        let position,
            pendingOrder,
            maintenance,
            balanceChanged,
            claimableAmount,
            revert
        if (expect != "") {
            [
                position,
                pendingOrder,
                maintenance,
                balanceChanged,
                claimableAmount,
                revert
            ] = this.extractExpectData(expect)
        }


        await this.testHelper.instantlyCloseMarketAndExpect({
            quantity,
            trader
        }, balanceChanged, revert)

        await this.testHelper.expectData(position, pendingOrder, maintenance, claimableAmount, trader)
    }

    async ChangePrice(stepData) {
        const input = stepData.getProp("Input")
        const [
            price
        ] = this.extractChangePriceInput(input)

        await this.testHelper.changePrice(price)
    }

    extractCloseOrderInput(input) {
        const quantity = input.getProp("Quantity")
        const trader = input.getProp("Trader")
        const price = input.getProp("Price") || 0
        return [
            quantity,
            trader,
            price
        ]
    }

    extractOpenOrderInput(input) {
        console.log("input data: ", input)
        const quantity = input.getProp("Quantity")
        const leverage = input.getProp("Leverage")
        const trader = input.getProp("Trader")
        const deposit = input.getProp("Deposit")
        const side = input.getProp("Side")
        const price = input.getProp("Price") || 0
        return [
            quantity,
            leverage,
            trader,
            deposit,
            side,
            price
        ]
    }

    extractCancelLimitInput(input) {
        const price = input.getProp("Price")
        const orderId = input.getProp("Id")
        const trader = input.getProp("Trader")
        return [
            trader,
            price,
            orderId
        ]
    }

    extractManualMarginInput(input) {
        const trader = input.getProp("Trader")
        const margin = input.getProp("Margin")
        return [
            trader,
            margin
        ]
    }

    extractClaimFundInput(input) {
        const trader = input.getProp("Trader")
        return [
            trader
        ]
    }

    extractLiquidateInput(input) {
        const trader = input.getProp("Trader")
        const liquidator = input.getProp("Liquidator")
        return [
            trader,
            liquidator
        ]
    }

    extractExpectInput(input) {
        const trader = input.getProp("Trader")
        return [
            trader
        ]
    }

    extractChangePriceInput(input) {
        const price = input.getProp("Price")
        return [
            price
        ]
    }

    extractExpectData(expect) {
        console.log("expect data: ", expect)
        const expectPosition = expect.getProp("Position") || ""
        let position
        if (expectPosition != "") {
            position = {
                quantity: expectPosition.getProp("Quantity") || "",
                margin: expectPosition.getProp("MarginDeposit") || "",
                marginAbsolute: expectPosition.getProp("MarginAbsolute") || "",
                notional: expectPosition.getProp("Notional") || "",
                pnl: expectPosition.getProp("Pnl") || "",
                leverage: expectPosition.getProp("Leverage") || ""
            }
        }

        const expectMaintenance = expect.getProp("MaintenanceDetail") || ""
        let maintenance
        console.log("maintenance when extract expect data", expectMaintenance)
        if (expectMaintenance != "") {
            maintenance = {
                maintenanceMargin: expectMaintenance.getProp("MaintenanceMargin") || "",
                marginBalance: expectMaintenance.getProp("MarginBalance") || "",
                marginRatio: expectMaintenance.getProp("MarginRatio") || "",
                liquidationPrice: expectMaintenance.getProp("LiquidationPrice") || ""
            }
        }

        const expectPendingOrder = expect.getProp("PendingOrder")
        let pendingOrder
        if (expectPendingOrder != undefined) {
            let numberOfOrders = expectPendingOrder.getProp("Orders")
            if (numberOfOrders > 1) {
                pendingOrder = {
                    orders: expectPendingOrder.getProp("Orders") || "",
                    price: expectPendingOrder.getProp("Price").split(",") || "",
                    id: expectPendingOrder.getProp("Id").split(",") || "",
                    quantity: expectPendingOrder.getProp("Quantity").split(",") || "",
                    partialFilled: expectPendingOrder.getProp("PartialFilled").split(",") || ""
                }
            } else {
                pendingOrder = {
                    orders: expectPendingOrder.getProp("Orders") || "",
                    price: expectPendingOrder.getProp("Price") || "",
                    id: expectPendingOrder.getProp("Id"),
                    quantity: expectPendingOrder.getProp("Quantity") || "",
                    partialFilled: expectPendingOrder.getProp("PartialFilled") || ""
                }
            }
        }

        const balanceChanged = expect.getProp("BalanceChanged") || ""
        const claimableAmount = expect.getProp("ClaimableAmount") || ""
        const claimedProfit = expect.getProp("ClaimedProfit") || ""
        const revert = expect.getProp("Revert") || ""
        return [
            position,
            pendingOrder,
            maintenance,
            balanceChanged,
            claimableAmount,
            revert,
            claimedProfit
        ]
    }

    log(...args){
        console.log(`[YamlTestCaseProcess]: `, ...args)
    }
}

Object.defineProperty(Object.prototype, "getProp", {
    value: function(prop) {
        var key, self = this;
        for (key in self) {
            if (key.toLowerCase() == prop.toLowerCase()) {
                return self[key];
            }
        }
    },
    //this keeps jquery happy
    enumerable: false
});

export async function deployAndCreateHelper() {
    let positionHouse: PositionHouse;
    let positionManager: PositionManager;
    let bep20Mintable: BEP20Mintable
    let insuranceFund: InsuranceFund
    let userGateway: UserGatewayTest;
    let liquidatorGateway: LiquidatorGateway
    let positionHouseConfigurationProxy: PositionHouseConfigurationProxy;
    let positionHouseTestingTool: PositionHouseTestingTool;
    let fundingRateTest: FundingRateTest;
    let accessController : AccessController;
    let _;

    let trader0: any;
    let trader1: any;
    let trader2: any;
    let trader3: any;
    let trader4: any;
    let trader5: any;
    let tradercp: any;
    let tradercp2: any;

    [
        positionHouse,
        positionManager,
        positionHouseConfigurationProxy,
        _,
        positionHouseTestingTool,
        bep20Mintable,
        insuranceFund,
        userGateway,
        _,
        fundingRateTest,
        _,
        _,
        liquidatorGateway,
        accessController
    ] = await deployPositionHouse() as any

    [trader0, trader1, trader2, trader3, trader4, trader5, tradercp, tradercp2] = await ethers.getSigners();
    let testHelper: TestFutureHelper
    testHelper = new TestFutureHelper([trader0, trader1, trader2, trader3, trader4, trader5, tradercp, tradercp2] ,{
        mockToken: bep20Mintable,
        positionManager: fundingRateTest,
        positionHouse: positionHouse,
        userGateway: userGateway,
        liquidatorGateway: liquidatorGateway,
        insuranceFund: insuranceFund,
        accessController: accessController
    })

    await positionHouseConfigurationProxy.updateInitialMarginSlippage(99)

    return testHelper
}