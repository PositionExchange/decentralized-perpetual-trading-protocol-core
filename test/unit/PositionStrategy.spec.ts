import {BigNumber, BigNumberish, ContractFactory, Signer, Wallet} from 'ethers'
import {ethers, waffle} from 'hardhat'
// import {PositionHouse} from "../../typeChain";
import {loadFixture} from "ethereum-waffle";
// import checkObservationEquals from "../../shared/checkObservationEquals";
// import snapshotGasCost from "../../shared/snapshotGasCost";
// import {expect} from "../../shared/expect";
// import {TEST_POOL_START_TIME} from "../../shared/fixtures";
import {expect} from 'chai'
import {
    PositionManager,
    PositionHouse,
    InsuranceFund,
    BEP20Mintable,
    PositionHouseConfigurationProxy,
    FundingRateTest, PositionStrategyOrder, UserGateway, LiquidatorGateway, UserGatewayTest
} from "../../typeChain";
import {
    ClaimFund,
    LimitOrderReturns,
    PositionData,
    PositionLimitOrderID,
    ChangePriceParams,
    priceToPip, SIDE,
    toWeiBN,
    toWeiWithString, ExpectTestCaseParams, ExpectMaintenanceDetail, toWei
} from "../shared/utilities";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {CHAINLINK_ABI_TESTNET} from "../../constants";
import PositionManagerTestingTool from "../shared/positionManagerTestingTool";

import PositionHouseTestingTool from "../shared/positionHouseTestingTool";
import {deployPositionHouse} from "../shared/deploy";

describe("PositionStrategy", () => {
    let trader0: any;
    let trader1: any;
    let trader2: any;
    let trader3: any;
    let trader4: any;
    let trader5: any;
    let tradercp: any;
    let tradercp2: any;

    let positionManager: PositionManager;
    let positionManagerFactory: ContractFactory;
    let bep20Mintable: BEP20Mintable
    let insuranceFund: InsuranceFund
    let positionHouseConfigurationProxy: PositionHouseConfigurationProxy;
    let positionHouseTestingTool: PositionHouseTestingTool;
    let fundingRateTest: FundingRateTest;
    let positionStrategyOrder : PositionStrategyOrder
    let userGateway: UserGatewayTest
    let liquidatorGateway: LiquidatorGateway
    let _;
    beforeEach(async () => {
        [trader0, trader1, trader2, trader3, trader4, trader5, tradercp, tradercp2] = await ethers.getSigners();
        [
            userGateway,
            positionManager,
            positionHouseConfigurationProxy,
            _,
            positionHouseTestingTool,
            bep20Mintable,
            insuranceFund,
            userGateway,
            _,
            fundingRateTest,
            positionStrategyOrder,
            _,
            liquidatorGateway
        ] = await deployPositionHouse() as any

        await positionHouseConfigurationProxy.updateInitialMarginSlippage(100)


    })

    const openMarketPosition = async (input) => {
        return positionHouseTestingTool.openMarketPosition(input)
    }

    interface OpenLimitPositionAndExpectParams {
        _trader?: SignerWithAddress
        limitPrice: number | string
        leverage: number,
        quantity: number | BigNumber
        side: number
        _positionManager?: PositionManager
    }

    async function getOrderIdByTx(tx) {
        const receipt = await tx.wait();
        const orderId = ((receipt?.events || [])[1]?.args || [])['orderId']
        return orderId
    }

    async function openLimitPositionAndExpect(input): Promise<LimitOrderReturns> {
        return positionHouseTestingTool.openLimitPositionAndExpect(input)
    }

    async function liquidate(_positionManagerAddress, _traderAddress) {
        await liquidatorGateway.liquidate(_positionManagerAddress, _traderAddress)
    }

    async function getMaintenanceDetailAndExpect({
                                                     positionManagerAddress,
                                                     traderAddress,
                                                     expectedMarginRatio,
                                                     expectedMaintenanceMargin,
                                                     expectedMarginBalance
                                                 }: ExpectMaintenanceDetail) {
        const calcOptionSpot = 1;
        const maintenanceData = await userGateway.getMaintenanceDetail(positionManagerAddress, traderAddress, calcOptionSpot);
        expect(maintenanceData.marginRatio).eq(expectedMarginRatio);
        expect(maintenanceData.maintenanceMargin).eq(expectedMaintenanceMargin);
        expect(maintenanceData.marginBalance).eq(expectedMarginBalance);
    }


    async function changePrice({
                                   limitPrice,
                                   toHigherPrice,
                                   _positionManager
                               }: ChangePriceParams) {

        if (toHigherPrice) {
            let response1 = (await openLimitPositionAndExpect({
                limitPrice: limitPrice,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: 3,
                _trader: tradercp,
                _positionManager: _positionManager || positionManager,
                skipCheckBalance: true
            })) as unknown as PositionLimitOrderID

            await openMarketPosition({
                    quantity: BigNumber.from('3'),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: tradercp2.address,
                    instanceTrader: tradercp2,
                    _positionManager: _positionManager || positionManager,
                    expectedSize: BigNumber.from(0)
                }
            );
        } else {
            let response1 = (await openLimitPositionAndExpect({
                limitPrice: limitPrice,
                side: SIDE.LONG,
                leverage: 10,
                quantity: 3,
                _trader: tradercp,
                _positionManager: _positionManager || positionManager,
                skipCheckBalance: true
            })) as unknown as PositionLimitOrderID

            await openMarketPosition({
                    quantity: BigNumber.from('3'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: tradercp2.address,
                    instanceTrader: tradercp2,
                    _positionManager: _positionManager || positionManager,
                    expectedSize: BigNumber.from(0)
                }
            );
        }
    }

    async function expectMarginPnlAndOP({
                                            positionManagerAddress,
                                            traderAddress,
                                            expectedOpenNotional,
                                            expectedMargin,
                                            expectedPnl = undefined,
                                            expectedQuantity = 0
                                        }: ExpectTestCaseParams) {
        const oldPosition = await userGateway.getPosition(positionManagerAddress, traderAddress)
        const positionNotionalAndPnLTrader = await userGateway.getPositionNotionalAndUnrealizedPnl(
            positionManagerAddress,
            traderAddress,
            1,
            oldPosition
        )
        const positionTrader = (await userGateway.getPosition(positionManagerAddress, traderAddress)) as unknown as PositionData
        console.log("expect all: quantity, openNotional, positionNotional, margin, unrealizedPnl", Number(positionTrader.quantity), Number(positionTrader.openNotional), Number(positionNotionalAndPnLTrader.positionNotional), Number(positionTrader.margin), Number(positionNotionalAndPnLTrader.unrealizedPnl))
        if (expectedQuantity != 0) {
            expect(positionTrader.quantity).eq(expectedQuantity);
        }
        if (expectedOpenNotional != undefined) expect(positionNotionalAndPnLTrader.unrealizedPnl).eq(expectedPnl)
        expect(positionTrader.openNotional).eq(expectedOpenNotional);
        expect(positionTrader.margin).eq(expectedMargin);
        return true;
    }

    const closePosition = async ({
                                     trader,
                                     instanceTrader,
                                     _positionManager = positionManager,
                                     _percentQuantity = 100
                                 }: {
        trader: string,
        instanceTrader: any,
        _positionManager?: any,
        _percentQuantity?: any
    }) => {
        const positionData1 = (await userGateway.connect(instanceTrader).getPosition(_positionManager.address, trader)) as unknown as PositionData;
        await userGateway.connect(instanceTrader).closePosition(_positionManager.address, _percentQuantity);

        const positionData = (await userGateway.getPosition(_positionManager.address, trader)) as unknown as PositionData;
        expect(positionData.margin).eq(0);
        expect(positionData.quantity).eq(0);
    }

    async function cancelLimitOrder(positionManagerAddress: string, trader: SignerWithAddress, orderId: string, pip: string) {
        const listPendingOrder = await userGateway.connect(trader).getListOrderPending(positionManagerAddress, trader.address)
        const obj = listPendingOrder.find(x => () => {
            (x.orderId.toString() == orderId && x.pip.toString() == pip)
        });
        await userGateway.connect(trader).cancelLimitOrder(positionManagerAddress, obj.orderIdx, obj.isReduce);
    }

    async function expectPositionMargin(positionManager, trader, amount) {
        const {margin} = await userGateway.getPosition(positionManager.address, trader.address)
        await expect(margin.toString()).eq(amount.toString())
    }

    describe("should set TP/SL success", async () => {
        it ("it should set TP/SL success", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 1,
                quantity: BigNumber.from('3'),
                _trader: trader2,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from('3'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: positionManager,
                }
            );

            await userGateway.connect(trader1).setTPSL(positionManager.address, 520000, 0, 1)
            await userGateway.connect(trader1).setTPSL(positionManager.address, 0, 495000, 2)
            await userGateway.connect(trader1).setTPSL(positionManager.address, 530000, 490000, 0)

            await changePrice({
                limitPrice: 5500,
                toHigherPrice: true
            })

            await openLimitPositionAndExpect({
                limitPrice: 5600,
                side: SIDE.SHORT,
                leverage: 1,
                quantity: BigNumber.from('3'),
                _trader: trader2,
                skipCheckBalance: true
            })

            await userGateway.connect(trader2).triggerTPSL(positionManager.address, trader1.address)
        })

    })
    describe("should trigger TP/SL of short position success", async () => {
        it("should trigger negative TP of short position success", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 1,
                quantity: BigNumber.from('3'),
                _trader: trader2,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from('3'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: positionManager,
                }
            );

            await changePrice({
                limitPrice: 5200,
                toHigherPrice: true
            })

            await userGateway.connect(trader1).setTPSL(positionManager.address, 0, 510000, 2)

            await changePrice({
                limitPrice: 5000,
                toHigherPrice: false
            })

            await openLimitPositionAndExpect({
                limitPrice: 5150,
                side: SIDE.SHORT,
                leverage: 1,
                quantity: BigNumber.from('3'),
                _trader: trader2,
                skipCheckBalance: true
            })

            await userGateway.triggerTPSL(positionManager.address, trader1.address)
        })

        it("should trigger negative TP of short position success while having increase limit order", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from('3'),
                _trader: trader2,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from('3'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: positionManager,
                }
            );

            await changePrice({
                limitPrice: 5200,
                toHigherPrice: true
            })

            await userGateway.connect(trader1).setTPSL(positionManager.address, 0, 510000, 2)

            await changePrice({
                limitPrice: 5000,
                toHigherPrice: false
            })

            await openLimitPositionAndExpect({
                limitPrice: 5130,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from('3'),
                _trader: trader1,
                skipCheckBalance: true
            })

            await openLimitPositionAndExpect({
                limitPrice: 5150,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from('3'),
                _trader: trader2,
                skipCheckBalance: true
            })

            const balanceBeforeTriggerTPSL = await bep20Mintable.balanceOf(trader1.address)
            await userGateway.triggerTPSL(positionManager.address, trader1.address)
            const balanceAfterTriggerTPSL = await bep20Mintable.balanceOf(trader1.address)

            // balance change = old position margin + pnl + pending order margin
            // = 5000 * 3 / 10 + (5000 - 5150) * 3 + 5130 * 3 / 10 = 2589
            await expect(balanceAfterTriggerTPSL.sub(balanceBeforeTriggerTPSL).toString()).eq('2589')
        })

        it("should trigger negative SL of short position success while having increase limit orders", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from('3'),
                _trader: trader2,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from('3'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: positionManager,
                }
            );

            await userGateway.connect(trader1).setTPSL(positionManager.address, 520000, 0, 1)

            await changePrice({
                limitPrice: 5200,
                toHigherPrice: true
            })

            await openLimitPositionAndExpect({
                limitPrice: 5230,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from('3'),
                _trader: trader1,
                skipCheckBalance: true
            })

            await openLimitPositionAndExpect({
                limitPrice: 5250,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from('3'),
                _trader: trader2,
                skipCheckBalance: true
            })

            const balanceBeforeTriggerTPSL = await bep20Mintable.balanceOf(trader1.address)
            await userGateway.triggerTPSL(positionManager.address, trader1.address)
            const balanceAfterTriggerTPSL = await bep20Mintable.balanceOf(trader1.address)

            // balance change = old position margin + pnl + pending order margin
            // = 5000 * 3 / 10 + (5000 - 5250) * 3 + 5230 * 3 / 10 = 2319
            await expect(balanceAfterTriggerTPSL.sub(balanceBeforeTriggerTPSL).toString()).eq('2319')
        })

        it("should trigger negative SL of short position success while having reduce limit orders", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from('3'),
                _trader: trader2,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from('3'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: positionManager,
                }
            );

            await userGateway.connect(trader1).setTPSL(positionManager.address, 520000, 0, 1)

            await changePrice({
                limitPrice: 5200,
                toHigherPrice: true
            })

            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from('1'),
                _trader: trader1,
                skipCheckBalance: true
            })

            await openLimitPositionAndExpect({
                limitPrice: 4900,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from('1'),
                _trader: trader1,
                skipCheckBalance: true
            })

            await openLimitPositionAndExpect({
                limitPrice: 5250,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from('3'),
                _trader: trader2,
                skipCheckBalance: true
            })

            const balanceBeforeTriggerTPSL = await bep20Mintable.balanceOf(trader1.address)
            await userGateway.triggerTPSL(positionManager.address, trader1.address)
            const balanceAfterTriggerTPSL = await bep20Mintable.balanceOf(trader1.address)

            // balance change = old position margin + pnl + pending order margin
            // = 5000 * 3 / 10 + (5000 - 5250) * 3 = 750
            await expect(balanceAfterTriggerTPSL.sub(balanceBeforeTriggerTPSL).toString()).eq('750')
        })
    })

    describe("should unset TP/SL success", async () => {
        it("should unset TP/SL success", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 1,
                quantity: BigNumber.from('3'),
                _trader: trader2,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from('3'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: positionManager,
                }
            );

            await userGateway.connect(trader1).setTPSL(positionManager.address, 520000, 0, 1)
            await userGateway.connect(trader1).setTPSL(positionManager.address, 0, 495000, 2)
            await userGateway.connect(trader1).setTPSL(positionManager.address, 530000, 490000, 0)

            await changePrice({
                limitPrice: 5500,
                toHigherPrice: true
            })

            await openLimitPositionAndExpect({
                limitPrice: 5600,
                side: SIDE.SHORT,
                leverage: 1,
                quantity: BigNumber.from('3'),
                _trader: trader2,
                skipCheckBalance: true
            })

            await userGateway.connect(trader1).unsetTPOrSL(positionManager.address, true)

            await expect(userGateway.connect(trader2).triggerTPSL(positionManager.address, trader1.address)).to.be.revertedWith("28")

            await changePrice({
                limitPrice: 4800,
                toHigherPrice: true
            })

            await userGateway.connect(trader1).unsetTPOrSL(positionManager.address, false)

            await expect(userGateway.connect(trader2).triggerTPSL(positionManager.address, trader1.address)).to.be.revertedWith("28")
        })

        it("should unset TP/SL when manually close position", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 1,
                quantity: BigNumber.from('3'),
                _trader: trader2,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from('3'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: positionManager,
                }
            );

            await userGateway.connect(trader1).setTPSL(positionManager.address, 520000, 0, 1)
            await userGateway.connect(trader1).setTPSL(positionManager.address, 0, 495000, 2)
            await userGateway.connect(trader1).setTPSL(positionManager.address, 530000, 490000, 0)

            await openLimitPositionAndExpect({
                limitPrice: 5100,
                side: SIDE.SHORT,
                leverage: 1,
                quantity: BigNumber.from('3'),
                _trader: trader2,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from('3'),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: positionManager,
                }
            );
            expect((await userGateway.getTPSLDetail(positionManager.address, trader1.address)).toString()).eq("0,0")
        })
    })

    describe("should trigger TP/SL in different condition", async () => {
        it("should trigger TP/SL twice after cancel limit order success", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from('24'),
                _trader: trader2,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from('24'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: positionManager,
                }
            );

            await changePrice({
                limitPrice: 5300,
                toHigherPrice: false
            })


            await openLimitPositionAndExpect({
                limitPrice: 5500,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from('10'),
                _trader: trader1,
                skipCheckBalance: true
            })

            await userGateway.connect(trader1).setTPSL(positionManager.address, 0, 520000, 2)


            await userGateway.connect(trader1).cancelLimitOrder(positionManager.address, 0, 0)

            await changePrice({
                limitPrice: 5100,
                toHigherPrice: false
            })

            await openLimitPositionAndExpect({
                limitPrice: 5200,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from('24'),
                _trader: trader2,
                skipCheckBalance: true
            })

            await userGateway.connect(trader2).triggerTPSL(positionManager.address, trader1.address)

            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from('10'),
                _trader: trader2,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from('10'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: positionManager,
                }
            );

            await openLimitPositionAndExpect({
                limitPrice: 5500,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from('10'),
                _trader: trader1,
                skipCheckBalance: true
            })

            await userGateway.connect(trader1).setTPSL(positionManager.address, 0, 400000, 2)

            await openMarketPosition({
                    quantity: BigNumber.from('10'),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: trader2.address,
                    instanceTrader: trader2,
                    _positionManager: positionManager,
                }
            );

            await changePrice({
                limitPrice: 3900,
                toHigherPrice: false
            })

            await openLimitPositionAndExpect({
                limitPrice: 4000,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from('20'),
                _trader: trader2,
                skipCheckBalance: true
            })

            await userGateway.connect(trader2).triggerTPSL(positionManager.address, trader1.address)
        })

        it("should trigger TP/SL success to close a position created by a partial filled limit order", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5100,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from('15'),
                _trader: trader1,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from('10'),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: trader2.address,
                    instanceTrader: trader2,
                    _positionManager: positionManager,
                }
            );

            await openLimitPositionAndExpect({
                limitPrice: 5500,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from('5'),
                _trader: trader1,
                skipCheckBalance: true
            })

            await changePrice({
                limitPrice: 4500,
                toHigherPrice: false
            })

            await userGateway.connect(trader1).setTPSL(positionManager.address, 480000, 440000, 0)

            await changePrice({
                limitPrice: 4800,
                toHigherPrice: true
            })

            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from('10'),
                _trader: trader3,
                skipCheckBalance: true
            })

            await userGateway.connect(trader2).triggerTPSL(positionManager.address, trader1.address)
        })

        it("should trigger TP/SL success when partial closed position by a limit order", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from('4'),
                _trader: trader3,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from('4'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: positionManager,
                }
            );

            await openLimitPositionAndExpect({
                limitPrice: 4900,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from('1'),
                _trader: trader1,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from('1'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader2.address,
                    instanceTrader: trader2,
                    _positionManager: positionManager,
                }
            );

            await userGateway.connect(trader1).setTPSL(positionManager.address, 550000, 450000, 0)

            await openLimitPositionAndExpect({
                limitPrice: 4900,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from('2'),
                _trader: trader1,
                skipCheckBalance: true
            })

            await changePrice({
                limitPrice: 5600,
                toHigherPrice: true
            })

            await openLimitPositionAndExpect({
                limitPrice: 5600,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from('3'),
                _trader: trader3,
                skipCheckBalance: true
            })

            await userGateway.connect(trader3).triggerTPSL(positionManager.address, trader1.address)
        })
    })

})