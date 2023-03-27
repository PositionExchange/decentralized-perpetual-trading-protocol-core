import {BigNumber, BigNumberish, ContractFactory, Signer, Wallet} from 'ethers'
import {ethers, waffle} from 'hardhat'
import {expect} from 'chai'
import {
    PositionManager,
    PositionHouse,
    InsuranceFund,
    BEP20Mintable,
    PositionHouseConfigurationProxy,
    FundingRateTest, UserGateway, LiquidatorGateway, AccessController
} from "../../typeChain";
import {
    ClaimFund,
    LimitOrderReturns,
    PositionData,
    PositionLimitOrderID,
    ChangePriceParams,
    priceToPip,
    SIDE,
    toWeiBN,
    toWeiWithString,
    ExpectTestCaseParams,
    ExpectMaintenanceDetail,
    toWei,
    OpenLimitWithDepositAmountParam,
    OpenLimitOrderParam,
    OpenMarketWithDepositAmountParam,
    OpenMarketPositionParam,
    CloseMarketOrderParam,
    CloseLimitOrderParam
} from "../shared/utilities";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {CHAINLINK_ABI_TESTNET} from "../../constants";
import PositionManagerTestingTool from "../shared/positionManagerTestingTool";

import PositionHouseTestingTool from "../shared/positionHouseTestingTool";
import {deployPositionHouse} from "../shared/deploy";

describe("Position House Base", () => {
    let positionHouse: PositionHouse;
    let trader0: any;
    let trader1: any;
    let trader2: any;
    let trader3: any;
    let trader4: any;
    let trader5: any;
    let tradercp: any;
    let tradercp2: any;

    let positionManager: PositionManager;
    let positionHouseConfiguration: PositionHouseConfigurationProxy;
    let bep20Mintable: BEP20Mintable
    let insuranceFund: InsuranceFund
    let userGateway: UserGateway;
    let liquidatorGateway: LiquidatorGateway
    let positionHouseConfigurationProxy: PositionHouseConfigurationProxy;
    let positionHouseTestingTool: PositionHouseTestingTool;
    let fundingRateTest: FundingRateTest;
    let accessController : AccessController
    let _;

    beforeEach(async () => {
        [trader0, trader1, trader2, trader3, trader4, trader5, tradercp, tradercp2] = await ethers.getSigners();
        [
            positionHouse,
            positionManager,
            positionHouseConfiguration,
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

        await positionHouseConfiguration.updateInitialMarginSlippage(100)
    })

    async function openMarketWithDepositAmount(param: OpenMarketWithDepositAmountParam) {
        await accessController.connect(trader0).updateValidatedContractStatus(param.trader.address, true)
        const openMarketPositionParam : OpenMarketPositionParam = {
            positionManager: param.positionManager,
            trader: param.trader.address,
            side: param.side,
            quantity: param.quantity,
            leverage: param.leverage,
            initialMargin: param.initialMargin,
            busdBonusAmount: 0
        }
        await positionHouse.connect(param.trader).openMarketPosition(openMarketPositionParam)
    }

    async function openLimitWithDepositAmount(param: OpenLimitWithDepositAmountParam) {
        await accessController.connect(trader0).updateValidatedContractStatus(param.trader.address, true)
        const openLimitOrderParam : OpenLimitOrderParam = {
            positionManager: param.positionManager,
            trader: param.trader.address,
            side: param.side,
            quantity: param.quantity,
            pip: param.pip,
            leverage: param.leverage,
            initialMargin: param.initialMargin,
            busdBonusAmount: 0
        }
        await positionHouse.connect(param.trader).openLimitOrder(openLimitOrderParam)
    }

    async function closeMarketOrder(param: CloseMarketOrderParam) {
        await accessController.connect(trader0).updateValidatedContractStatus(param.trader.address, true)
        await positionHouse.connect(param.trader).closePosition(param.positionManager, param.quantity, param.trader.address)
    }

    async function closeLimitOrder(param: CloseLimitOrderParam) {
        await accessController.connect(trader0).updateValidatedContractStatus(param.trader.address, true)
        await positionHouse.connect(param.trader).closeLimitPosition(param.positionManager, param.pip, param.quantity, param.trader.address)
    }

    async function liquidate(_positionManagerAddress, _traderAddress) {
        await liquidatorGateway.liquidate(_positionManagerAddress, _traderAddress)
    }

    async function changePrice({
                                   limitPrice,
                                   toHigherPrice,
                                   _positionManager
                               }: ChangePriceParams) {

        if (toHigherPrice) {
            await openLimitWithDepositAmount({
                pip: priceToPip(limitPrice, 0.01),
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei('3')),
                trader: tradercp,
                positionManager: _positionManager.address || positionManager.address,
                initialMargin: BigNumber.from(toWei('0'))
            })

            await openMarketWithDepositAmount({
                    quantity: BigNumber.from(toWei('3')),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: tradercp2,
                    positionManager: _positionManager.address || positionManager.address,
                    initialMargin: BigNumber.from(toWei('0'))
                }
            );
        } else {
            await openLimitWithDepositAmount({
                pip: priceToPip(limitPrice, 0.01),
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from(toWei('3')),
                trader: tradercp,
                positionManager: _positionManager.address || positionManager.address,
                initialMargin: BigNumber.from(toWei('0'))
            })

            await openMarketWithDepositAmount({
                    quantity: BigNumber.from(toWei('3')),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: tradercp2,
                    positionManager: _positionManager.address || positionManager.address,
                    initialMargin: BigNumber.from(toWei('0'))
                }
            );
        }
    }

    async function expectMarginPnlAndOP({
                                            positionManagerAddress,
                                            traderAddress,
                                            expectedOpenNotional,
                                            expectedMargin,
                                            expectedAbsoluteMargin,
                                            expectedPnl = undefined,
                                            expectedQuantity = undefined,
                                            expectedMaintenanceMargin,
                                            expectedMarginRatio,
                                            expectedMarginBalance
                                        }: ExpectTestCaseParams) {
        const traderPosition = (await userGateway.getPositionWithoutManualMargin(positionManagerAddress, traderAddress)) as unknown as PositionData
        const positionNotionalAndPnLTrader = await userGateway.getPositionNotionalAndUnrealizedPnl(
            positionManagerAddress,
            traderAddress,
            1,
            traderPosition
        )

        const maintenanceDetail = await userGateway.getMaintenanceDetail(
            positionManagerAddress,
            traderAddress,
            1
        )

        console.log("margin ratio", maintenanceDetail.marginRatio)
        if (expectedMarginRatio != undefined)
            expect(maintenanceDetail.marginRatio).eq(expectedMarginRatio)

        if (expectedMarginBalance != undefined)
            expect(maintenanceDetail.marginBalance).eq(expectedMarginBalance)

        if (expectedMaintenanceMargin != undefined)
            expect(maintenanceDetail.maintenanceMargin).eq(expectedMaintenanceMargin)

        if (expectedAbsoluteMargin != undefined)
            expect(traderPosition.absoluteMargin).eq(expectedAbsoluteMargin)

        console.log("expect all: quantity, openNotional, positionNotional, margin, unrealizedPnl", Number(traderPosition.quantity), Number(traderPosition.openNotional), Number(positionNotionalAndPnLTrader.positionNotional), Number(traderPosition.margin), Number(positionNotionalAndPnLTrader.unrealizedPnl))
        if (expectedQuantity != undefined) {
            expect(traderPosition.quantity).eq(expectedQuantity);
        }
        if (expectedOpenNotional != undefined) expect(positionNotionalAndPnLTrader.unrealizedPnl).eq(expectedPnl)
        expect(traderPosition.openNotional).eq(expectedOpenNotional);
        expect(traderPosition.margin).eq(expectedMargin);
        return true;
    }

    describe("open market and limit with deposit amount", async () => {
        it("open market and limit order deposit enough margin", async () => {
            await openLimitWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader1,
                side: SIDE.LONG,
                quantity: BigNumber.from(toWei('5')),
                pip: priceToPip(5000, 0.01),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('2500'))
            })

            await openMarketWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader2,
                side: SIDE.SHORT,
                quantity: BigNumber.from(toWei('5')),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('2500'))
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader1.address,
                expectedOpenNotional: BigNumber.from(toWei('25000')),
                expectedMargin: BigNumber.from(toWei('2500')),
                expectedQuantity: BigNumber.from(toWei('5')),
                expectedPnl: BigNumber.from(toWei('0')),
                expectedMarginRatio: 3
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader2.address,
                expectedOpenNotional: BigNumber.from(toWei('25000')),
                expectedMargin: BigNumber.from(toWei('2500')),
                expectedQuantity: BigNumber.from(toWei('-5')),
                expectedPnl: BigNumber.from(toWei('0')),
                expectedMarginRatio: 3
            })
        })

        it('open market and limit deposit not enough margin', async () => {
            await openLimitWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader1,
                side: SIDE.LONG,
                quantity: BigNumber.from(toWei('5')),
                pip: priceToPip(5000, 0.01),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('1800'))
            })

            await openMarketWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader2,
                side: SIDE.SHORT,
                quantity: BigNumber.from(toWei('5')),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('1500'))
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader1.address,
                expectedOpenNotional: BigNumber.from(toWei('25000')),
                expectedMargin: BigNumber.from(toWei('1800')),
                expectedAbsoluteMargin: BigNumber.from(toWei('2500')),
                expectedQuantity: BigNumber.from(toWei('5')),
                expectedPnl: BigNumber.from(toWei('0')),
                expectedMarginRatio: 4
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader2.address,
                expectedOpenNotional: BigNumber.from(toWei('25000')),
                expectedMargin: BigNumber.from(toWei('1500')),
                expectedAbsoluteMargin: BigNumber.from(toWei('2500')),
                expectedQuantity: BigNumber.from(toWei('-5')),
                expectedPnl: BigNumber.from(toWei('0')),
                expectedMarginRatio: 5
            })
        })
    })

    describe("increase position", async () => {
        it("should increase position by limit and market order (increase limit by limit, market by market)", async () => {
            await openLimitWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader1,
                side: SIDE.LONG,
                quantity: BigNumber.from(toWei('5')),
                pip: priceToPip(5000, 0.01),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('1800'))
            })

            await openMarketWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader2,
                side: SIDE.SHORT,
                quantity: BigNumber.from(toWei('5')),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('1500'))
            })

            await openLimitWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader1,
                side: SIDE.LONG,
                quantity: BigNumber.from(toWei('10')),
                pip: priceToPip(4800, 0.01),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('4500'))
            })

            await openMarketWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader2,
                side: SIDE.SHORT,
                quantity: BigNumber.from(toWei('10')),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('5000'))
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader1.address,
                expectedOpenNotional: BigNumber.from(toWei('73000')),
                expectedMargin: BigNumber.from(toWei('6300')),
                expectedAbsoluteMargin: BigNumber.from(toWei('7300')),
                expectedQuantity: BigNumber.from(toWei('15')),
                expectedPnl: BigNumber.from(toWei('-1000')),
                expectedMarginRatio: 4
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader2.address,
                expectedOpenNotional: BigNumber.from(toWei('73000')),
                expectedMargin: BigNumber.from(toWei('6500')),
                expectedAbsoluteMargin: BigNumber.from(toWei('7300')),
                expectedQuantity: BigNumber.from(toWei('-15')),
                expectedPnl: BigNumber.from(toWei('1000')),
                expectedMarginRatio: 2
            })
        })

        it("should increase position by limit and market order (increase limit by market, market by limit)", async () => {
            await openLimitWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader1,
                side: SIDE.LONG,
                quantity: BigNumber.from(toWei('5')),
                pip: priceToPip(5000, 0.01),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('1800'))
            })

            await openMarketWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader2,
                side: SIDE.SHORT,
                quantity: BigNumber.from(toWei('5')),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('1500'))
            })

            await openLimitWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader2,
                side: SIDE.SHORT,
                quantity: BigNumber.from(toWei('10')),
                pip: priceToPip(5200, 0.01),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('4500'))
            })

            await openMarketWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader1,
                side: SIDE.LONG,
                quantity: BigNumber.from(toWei('10')),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('5400'))
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader1.address,
                expectedOpenNotional: BigNumber.from(toWei('77000')),
                expectedMargin: BigNumber.from(toWei('7200')),
                expectedAbsoluteMargin: BigNumber.from(toWei('7700')),
                expectedQuantity: BigNumber.from(toWei('15')),
                expectedPnl: BigNumber.from(toWei('1000')),
                expectedMarginRatio: 2
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader2.address,
                expectedOpenNotional: BigNumber.from(toWei('77000')),
                expectedMargin: BigNumber.from(toWei('6000')),
                expectedAbsoluteMargin: BigNumber.from(toWei('7700')),
                expectedQuantity: BigNumber.from(toWei('-15')),
                expectedPnl: BigNumber.from(toWei('-1000')),
                expectedMarginRatio: 4
            })
        })
        it("should increase position by both limit and market order (limit -> market -> limit, market -> limit -> market)", async () => {
            // create position
            await openLimitWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader1,
                side: SIDE.LONG,
                quantity: BigNumber.from(toWei('5')),
                pip: priceToPip(5000, 0.01),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('1800'))
            })

            await openMarketWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader2,
                side: SIDE.SHORT,
                quantity: BigNumber.from(toWei('5')),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('1500'))
            })

            // increase position (limit by market, market by limit)
            await openLimitWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader2,
                side: SIDE.SHORT,
                quantity: BigNumber.from(toWei('10')),
                pip: priceToPip(5200, 0.01),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('4500'))
            })

            await openMarketWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader1,
                side: SIDE.LONG,
                quantity: BigNumber.from(toWei('10')),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('5400'))
            })

            // increase position (limit by limit, market by market)
            await openLimitWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader1,
                side: SIDE.LONG,
                quantity: BigNumber.from(toWei('10')),
                pip: priceToPip(4800, 0.01),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('4500'))
            })

            await openMarketWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader2,
                side: SIDE.SHORT,
                quantity: BigNumber.from(toWei('10')),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('5000'))
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader1.address,
                expectedOpenNotional: BigNumber.from(toWei('125000')),
                expectedMargin: BigNumber.from(toWei('11700')),
                expectedAbsoluteMargin: BigNumber.from(toWei('12500')),
                expectedQuantity: BigNumber.from(toWei('25')),
                expectedPnl: BigNumber.from(toWei('-5000')),
                expectedMarginRatio: 5
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader2.address,
                expectedOpenNotional: BigNumber.from(toWei('125000')),
                expectedMargin: BigNumber.from(toWei('11000')),
                expectedAbsoluteMargin: BigNumber.from(toWei('12500')),
                expectedQuantity: BigNumber.from(toWei('-25')),
                expectedPnl: BigNumber.from(toWei('5000')),
                expectedMarginRatio: 2
            })
        })

        it("should increase position by both limit and market order (limit -> limit -> market, market -> market -> limit)", async () => {
            // create position
            await openLimitWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader1,
                side: SIDE.LONG,
                quantity: BigNumber.from(toWei('5')),
                pip: priceToPip(5000, 0.01),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('1800'))
            })

            await openMarketWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader2,
                side: SIDE.SHORT,
                quantity: BigNumber.from(toWei('5')),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('1500'))
            })

            // increase position (limit by limit, market by market)
            await openLimitWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader1,
                side: SIDE.LONG,
                quantity: BigNumber.from(toWei('10')),
                pip: priceToPip(4800, 0.01),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('4500'))
            })

            await openMarketWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader2,
                side: SIDE.SHORT,
                quantity: BigNumber.from(toWei('10')),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('5000'))
            })

            // increase position (limit by market, market by limit)
            await openLimitWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader2,
                side: SIDE.SHORT,
                quantity: BigNumber.from(toWei('10')),
                pip: priceToPip(5200, 0.01),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('4500'))
            })

            await openMarketWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader1,
                side: SIDE.LONG,
                quantity: BigNumber.from(toWei('10')),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('5400'))
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader1.address,
                expectedOpenNotional: BigNumber.from(toWei('125000')),
                expectedMargin: BigNumber.from(toWei('11700')),
                expectedAbsoluteMargin: BigNumber.from(toWei('12500')),
                expectedQuantity: BigNumber.from(toWei('25')),
                expectedPnl: BigNumber.from(toWei('5000')),
                expectedMarginRatio: 2
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader2.address,
                expectedOpenNotional: BigNumber.from(toWei('125000')),
                expectedMargin: BigNumber.from(toWei('11000')),
                expectedAbsoluteMargin: BigNumber.from(toWei('12500')),
                expectedQuantity: BigNumber.from(toWei('-25')),
                expectedPnl: BigNumber.from(toWei('-5000')),
                expectedMarginRatio: 6
            })
        })

        it("should increase position by both limit and market order with different leverage", async () => {
            // create position
            await openLimitWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader1,
                side: SIDE.LONG,
                quantity: BigNumber.from(toWei('5')),
                pip: priceToPip(5000, 0.01),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('1800'))
            })

            await openMarketWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader2,
                side: SIDE.SHORT,
                quantity: BigNumber.from(toWei('5')),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('1500'))
            })

            // increase position (limit by market, market by limit)
            await openLimitWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader2,
                side: SIDE.SHORT,
                quantity: BigNumber.from(toWei('10')),
                pip: priceToPip(5200, 0.01),
                leverage: 15,
                initialMargin: BigNumber.from(toWei('4500'))
            })

            await openMarketWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader1,
                side: SIDE.LONG,
                quantity: BigNumber.from(toWei('10')),
                leverage: 15,
                initialMargin: BigNumber.from(toWei('5400'))
            })

            // increase position (limit by limit, market by market)
            await openLimitWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader1,
                side: SIDE.LONG,
                quantity: BigNumber.from(toWei('10')),
                pip: priceToPip(4800, 0.01),
                leverage: 20,
                initialMargin: BigNumber.from(toWei('4500'))
            })

            await openMarketWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader2,
                side: SIDE.SHORT,
                quantity: BigNumber.from(toWei('10')),
                leverage: 20,
                initialMargin: BigNumber.from(toWei('4800'))
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader1.address,
                expectedOpenNotional: BigNumber.from(toWei('125000')),
                expectedMargin: BigNumber.from(toWei('11700')),
                expectedAbsoluteMargin: BigNumber.from(toWei('8366.666666666666666666')),
                expectedQuantity: BigNumber.from(toWei('25')),
                expectedPnl: BigNumber.from(toWei('-5000')),
                expectedMarginRatio: 3
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader2.address,
                expectedOpenNotional: BigNumber.from(toWei('125000')),
                expectedMargin: BigNumber.from(toWei('10800')),
                expectedAbsoluteMargin: BigNumber.from(toWei('8366.666666666666666666')),
                expectedQuantity: BigNumber.from(toWei('-25')),
                expectedPnl: BigNumber.from(toWei('5000')),
                expectedMarginRatio: 1
            })
        })
    })

    describe("reduce position", async () => {
        it("should reduce position by limit and market order (reduce limit by limit, market by market)", async () => {
            await openLimitWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader1,
                side: SIDE.LONG,
                quantity: BigNumber.from(toWei('10')),
                pip: priceToPip(5000, 0.01),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('3600'))
            })

            await openMarketWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader2,
                side: SIDE.SHORT,
                quantity: BigNumber.from(toWei('10')),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('3000'))
            })

            await closeLimitOrder({
                positionManager: positionManager.address,
                trader: trader1,
                quantity: BigNumber.from(toWei('5')),
                pip: priceToPip(5200, 0.01),
            })

            await closeMarketOrder({
                positionManager: positionManager.address,
                trader: trader2,
                quantity: BigNumber.from(toWei('5')),
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader1.address,
                expectedOpenNotional: BigNumber.from(toWei('25000')),
                expectedMargin: BigNumber.from(toWei('1800')),
                expectedAbsoluteMargin: BigNumber.from(toWei('2500')),
                expectedQuantity: BigNumber.from(toWei('5')),
                expectedPnl: BigNumber.from(toWei('1000')),
                expectedMarginRatio: 2
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader2.address,
                expectedOpenNotional: BigNumber.from(toWei('25000')),
                expectedMargin: BigNumber.from(toWei('1500')),
                expectedAbsoluteMargin: BigNumber.from(toWei('2500')),
                expectedQuantity: BigNumber.from(toWei('-5')),
                expectedPnl: BigNumber.from(toWei('-1000')),
                expectedMarginRatio: 15
            })
        })
        it("should reduce position by limit and market order (reduce limit by market, market by limit)", async () => {
            await openLimitWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader1,
                side: SIDE.LONG,
                quantity: BigNumber.from(toWei('10')),
                pip: priceToPip(5000, 0.01),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('3600'))
            })

            await openMarketWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader2,
                side: SIDE.SHORT,
                quantity: BigNumber.from(toWei('10')),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('3000'))
            })

            await closeLimitOrder({
                positionManager: positionManager.address,
                trader: trader2,
                quantity: BigNumber.from(toWei('5')),
                pip: priceToPip(4800, 0.01),
            })

            await closeMarketOrder({
                positionManager: positionManager.address,
                trader: trader1,
                quantity: BigNumber.from(toWei('5')),
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader1.address,
                expectedOpenNotional: BigNumber.from(toWei('25000')),
                expectedMargin: BigNumber.from(toWei('1800')),
                expectedAbsoluteMargin: BigNumber.from(toWei('2500')),
                expectedQuantity: BigNumber.from(toWei('5')),
                expectedPnl: BigNumber.from(toWei('-1000')),
                expectedMarginRatio: 9
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader2.address,
                expectedOpenNotional: BigNumber.from(toWei('25000')),
                expectedMargin: BigNumber.from(toWei('1500')),
                expectedAbsoluteMargin: BigNumber.from(toWei('2500')),
                expectedQuantity: BigNumber.from(toWei('-5')),
                expectedPnl: BigNumber.from(toWei('1000')),
                expectedMarginRatio: 3
            })
        })

        it("should reduce position by both limit and market order (limit -> market -> limit, market -> limit -> market)", async () => {
            await openLimitWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader1,
                side: SIDE.LONG,
                quantity: BigNumber.from(toWei('10')),
                pip: priceToPip(5000, 0.01),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('3600'))
            })

            await openMarketWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader2,
                side: SIDE.SHORT,
                quantity: BigNumber.from(toWei('10')),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('3000'))
            })

            await closeLimitOrder({
                positionManager: positionManager.address,
                trader: trader2,
                quantity: BigNumber.from(toWei('5')),
                pip: priceToPip(4800, 0.01),
            })

            await closeMarketOrder({
                positionManager: positionManager.address,
                trader: trader1,
                quantity: BigNumber.from(toWei('5')),
            })

            await closeLimitOrder({
                positionManager: positionManager.address,
                trader: trader1,
                quantity: BigNumber.from(toWei('3')),
                pip: priceToPip(5200, 0.01),
            })

            await closeMarketOrder({
                positionManager: positionManager.address,
                trader: trader2,
                quantity: BigNumber.from(toWei('3')),
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader1.address,
                expectedOpenNotional: BigNumber.from(toWei('10000')),
                expectedMargin: BigNumber.from(toWei('720')),
                expectedAbsoluteMargin: BigNumber.from(toWei('1000')),
                expectedQuantity: BigNumber.from(toWei('2')),
                expectedPnl: BigNumber.from(toWei('400')),
                expectedMarginRatio: 2
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader2.address,
                expectedOpenNotional: BigNumber.from(toWei('10000')),
                expectedMargin: BigNumber.from(toWei('600')),
                expectedAbsoluteMargin: BigNumber.from(toWei('1000')),
                expectedQuantity: BigNumber.from(toWei('-2')),
                expectedPnl: BigNumber.from(toWei('-400')),
                expectedMarginRatio: 15
            })
        })

        it("should reduce position by both limit and market order (limit -> limit -> market, market -> market -> limit)", async () => {
            await openLimitWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader1,
                side: SIDE.LONG,
                quantity: BigNumber.from(toWei('10')),
                pip: priceToPip(5000, 0.01),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('3600'))
            })

            await openMarketWithDepositAmount({
                positionManager: positionManager.address,
                trader: trader2,
                side: SIDE.SHORT,
                quantity: BigNumber.from(toWei('10')),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('3000'))
            })

            await closeLimitOrder({
                positionManager: positionManager.address,
                trader: trader1,
                quantity: BigNumber.from(toWei('3')),
                pip: priceToPip(5200, 0.01),
            })

            await closeMarketOrder({
                positionManager: positionManager.address,
                trader: trader2,
                quantity: BigNumber.from(toWei('3')),
            })

            await closeLimitOrder({
                positionManager: positionManager.address,
                trader: trader2,
                quantity: BigNumber.from(toWei('5')),
                pip: priceToPip(4800, 0.01),
            })

            await closeMarketOrder({
                positionManager: positionManager.address,
                trader: trader1,
                quantity: BigNumber.from(toWei('5')),
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader1.address,
                expectedOpenNotional: BigNumber.from(toWei('10000')),
                expectedMargin: BigNumber.from(toWei('720')),
                expectedAbsoluteMargin: BigNumber.from(toWei('1000')),
                expectedQuantity: BigNumber.from(toWei('2')),
                expectedPnl: BigNumber.from(toWei('-400')),
                expectedMarginRatio: 9
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: positionManager.address,
                traderAddress: trader2.address,
                expectedOpenNotional: BigNumber.from(toWei('10000')),
                expectedMargin: BigNumber.from(toWei('600')),
                expectedAbsoluteMargin: BigNumber.from(toWei('1000')),
                expectedQuantity: BigNumber.from(toWei('-2')),
                expectedPnl: BigNumber.from(toWei('400')),
                expectedMarginRatio: 3
            })
        })
    })

    describe("liquidate position", async () => {
        it("should partial liquidate position success", async () => {
            await openLimitWithDepositAmount({
                positionManager: fundingRateTest.address,
                trader: trader1,
                side: SIDE.LONG,
                quantity: BigNumber.from(toWei('10')),
                pip: priceToPip(5000, 0.01),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('1800'))
            })

            await openMarketWithDepositAmount({
                positionManager: fundingRateTest.address,
                trader: trader2,
                side: SIDE.SHORT,
                quantity: BigNumber.from(toWei('10')),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('1500'))
            })

            await changePrice({
                limitPrice: 4838,
                toHigherPrice: false,
                _positionManager: fundingRateTest
            })

            await fundingRateTest.setMockPrice(4838, 4838)

            console.log((await liquidatorGateway.getMaintenanceDetail(fundingRateTest.address, trader1.address, 0)).toString())


            await liquidatorGateway.liquidate(fundingRateTest.address, trader1.address)

            await expectMarginPnlAndOP({
                positionManagerAddress: fundingRateTest.address,
                traderAddress: trader1.address,
                expectedOpenNotional: BigNumber.from(toWei('40000')),
                expectedMargin: BigNumber.from(toWei('1746')),
                expectedAbsoluteMargin: BigNumber.from(toWei('4850')),
                expectedQuantity: BigNumber.from(toWei('8')),
                expectedPnl: BigNumber.from(toWei('-1295.92')),
                expectedMarginRatio: 32
            })
        })

        it("should full liquidate position success", async () => {
            await openLimitWithDepositAmount({
                positionManager: fundingRateTest.address,
                trader: trader1,
                side: SIDE.LONG,
                quantity: BigNumber.from(toWei('10')),
                pip: priceToPip(5000, 0.01),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('1800'))
            })

            await openMarketWithDepositAmount({
                positionManager: fundingRateTest.address,
                trader: trader2,
                side: SIDE.SHORT,
                quantity: BigNumber.from(toWei('10')),
                leverage: 10,
                initialMargin: BigNumber.from(toWei('1500'))
            })

            await changePrice({
                limitPrice: 4700,
                toHigherPrice: false,
                _positionManager: fundingRateTest
            })

            await fundingRateTest.setMockPrice(4700, 4700)

            console.log((await liquidatorGateway.getMaintenanceDetail(fundingRateTest.address, trader1.address, 0)).toString())


            await liquidatorGateway.liquidate(fundingRateTest.address, trader1.address)

            await expectMarginPnlAndOP({
                positionManagerAddress: fundingRateTest.address,
                traderAddress: trader1.address,
                expectedOpenNotional: BigNumber.from(toWei('0')),
                expectedMargin: BigNumber.from(toWei('0')),
                expectedAbsoluteMargin: BigNumber.from(toWei('0')),
                expectedQuantity: BigNumber.from(toWei('0')),
                expectedPnl: BigNumber.from(toWei('0')),
                expectedMarginRatio: 0
            })
        })
    })
})
