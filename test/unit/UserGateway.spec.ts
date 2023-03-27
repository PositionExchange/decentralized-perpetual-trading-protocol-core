import {BigNumber, BigNumberish, ContractFactory, Signer, Wallet} from 'ethers'
import {ethers, waffle} from 'hardhat'
import {expect} from 'chai'
import {
    PositionManager,
    PositionHouse,
    InsuranceFund,
    BEP20Mintable,
    PositionHouseConfigurationProxy,
    FundingRateTest, UserGateway, UserGatewayTest
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

describe("UserGateway", () => {
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
    let positionManagerFactory: ContractFactory;
    let bep20Mintable: BEP20Mintable
    let insuranceFund: InsuranceFund
    let userGateway: UserGatewayTest;
    let positionHouseConfigurationProxy: PositionHouseConfigurationProxy;
    let positionHouseTestingTool: PositionHouseTestingTool;
    let fundingRateTest: FundingRateTest;
    let _;

    beforeEach(async () => {
        [trader0, trader1, trader2, trader3, trader4, trader5, tradercp, tradercp2] = await ethers.getSigners();
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
            fundingRateTest
        ] = await deployPositionHouse() as any

        await positionHouseConfigurationProxy.updateInitialMarginSlippage(100)

    })

    const openMarketPosition = async (input) => {
        return positionHouseTestingTool.openMarketPosition(input)
    }

    const instantlyClosePosition = async (input) => {
        return positionHouseTestingTool.instantlyClosePosition(input)
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

    interface OpenMultiLimitOrder {
        limitPrice: number | string,
        quantity: number | BigNumber,
        isBuy: boolean
    }

    async function openMultiLimitOrderAndExpectOrderbook(input : OpenMultiLimitOrder[]) {
        for (let i = 0; i < input.length; i++) {
            if (input[i].isBuy) {
                await openLimitPositionAndExpect({
                    limitPrice: input[i].limitPrice,
                    side: SIDE.LONG,
                    leverage: 1,
                    quantity: input[i].quantity,
                    _trader: trader0,
                    skipCheckBalance: true
                })
            } else {
                await openLimitPositionAndExpect({
                    limitPrice: input[i].limitPrice,
                    side: SIDE.SHORT,
                    leverage: 1,
                    quantity: input[i].quantity,
                    _trader: trader1,
                    skipCheckBalance: true
                })
            }
        }
        // await expectOrderbook(input)
    }

    async function expectOrderbook(input : OpenMultiLimitOrder[]) {
        const buyOrders = (await userGateway.getOrderbook(positionManager.address, 10))[0]
        const sellOrders = (await userGateway.getOrderbook(positionManager.address, 10))[1]
        const basisPoint = Number(await positionManager.getBasisPoint())

        for (let i = 0; i < input.length; i++) {
            if (input[i].isBuy) {
                await expect(buyOrders.find(order =>
                    (order.pip.toString() == (Number(input[i].limitPrice) * basisPoint).toString() &&
                        order.liquidity.toString() == input[i].quantity.toString())
                )).not.eq(undefined)
            } else {
                await expect(sellOrders.find(order =>
                    (order.pip.toString() == (Number(input[i].limitPrice) * basisPoint).toString() &&
                        order.liquidity.toString() == input[i].quantity.toString())
                )).not.eq(undefined)
            }
        }
        if (input.length == 0) {
            await expect(buyOrders.find(order =>
                (order.pip.toString() != '0' &&
                    order.liquidity.toString() != '0')
            )).eq(undefined)
            await expect(sellOrders.find(order =>
                (order.pip.toString() != '0' &&
                    order.liquidity.toString() != '0')
            )).eq(undefined)
        }
    }

    // async function liquidate(_positionManagerAddress, _traderAddress) {
    //     await userGateway.liquidate(_positionManagerAddress, _traderAddress)
    // }

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
                                            expectedQuantity = undefined
                                        }: ExpectTestCaseParams) {
        const traderPosition = (await userGateway.getPositionWithoutManualMargin(positionManagerAddress, traderAddress)) as unknown as PositionData
        const positionNotionalAndPnLTrader = await userGateway.getPositionNotionalAndUnrealizedPnl(
            positionManagerAddress,
            traderAddress,
            1,
            traderPosition
        )
        console.log("expect all: quantity, openNotional, positionNotional, margin, unrealizedPnl", Number(traderPosition.quantity), Number(traderPosition.openNotional), Number(positionNotionalAndPnLTrader.positionNotional), Number(traderPosition.margin), Number(positionNotionalAndPnLTrader.unrealizedPnl))
        if (expectedQuantity != undefined) {
            expect(traderPosition.quantity).eq(expectedQuantity);
        }
        if (expectedOpenNotional != undefined) expect(positionNotionalAndPnLTrader.unrealizedPnl).eq(expectedPnl)
        expect(traderPosition.openNotional).eq(expectedOpenNotional);
        expect(traderPosition.margin).eq(expectedMargin);
        return true;
    }

    const closeMarketPosition = async ({
                                     trader,
                                     _positionManager = positionManager,
                                     quantity
                                 }: {
        trader: any,
        _positionManager?: any,
        quantity: any
    }) => {
        await userGateway.connect(trader).closePosition(_positionManager.address, quantity);
    }

    const closeLimitPosition = async ({
        trader,
        _positionManager = positionManager,
        price,
        quantity
    } : {
        trader: any,
        _positionManager?: any,
        price: any,
        quantity: any
    }) => {
        await userGateway.connect(trader).closeLimitPosition(_positionManager.address, priceToPip(price), quantity)
    }

    async function cancelLimitOrder(positionManagerAddress: string, trader: SignerWithAddress, orderId : string, pip : string) {
        const listPendingOrder = await userGateway.connect(trader).getListOrderPending(positionManagerAddress, trader.address)
        const obj = listPendingOrder.find(x => () => {
            (x.orderId.toString() == orderId && x.pip.toString() == pip)
        });
        await userGateway.connect(trader).cancelLimitOrder(positionManagerAddress, obj.orderIdx, obj.isReduce);
    }

    async function expectPositionMargin(positionManager, trader, amount){
        const {margin} = await userGateway.getPosition(positionManager.address, trader.address)
        await expect(margin.toString()).eq(amount.toString())
    }

    // describe("Get order book", async () => {
    //     it("should get all limit order in order book", async () => {
    //         await openMultiLimitOrderAndExpectOrderbook([
    //             {
    //                 limitPrice: 5100,
    //                 quantity: toWei(1),
    //                 isBuy: false
    //             },
    //             {
    //                 limitPrice: 5200,
    //                 quantity: toWei(2),
    //                 isBuy: false
    //             },
    //             {
    //                 limitPrice: 4900,
    //                 quantity: toWei(3),
    //                 isBuy: true
    //             },
    //             {
    //                 limitPrice: 4850,
    //                 quantity: toWei(5),
    //                 isBuy: true
    //             }
    //         ])
    //
    //         await openMarketPosition({
    //             quantity: BigNumber.from(toWei('2')),
    //             leverage: 10,
    //             side: SIDE.LONG,
    //             trader: trader2.address,
    //             instanceTrader: trader2,
    //             _positionManager: positionManager
    //         })
    //
    //         await expectOrderbook([
    //             {
    //                 limitPrice: 5200,
    //                 quantity: toWei(1),
    //                 isBuy: false
    //             },
    //             {
    //                 limitPrice: 4900,
    //                 quantity: toWei(3),
    //                 isBuy: true
    //             },
    //             {
    //                 limitPrice: 4850,
    //                 quantity: toWei(5),
    //                 isBuy: true
    //             }
    //         ])
    //     })
    //
    //     it("should get liquidity in pip range by order", async () => {
    //         await openMultiLimitOrderAndExpectOrderbook([
    //             {
    //                 limitPrice: 5100,
    //                 quantity: toWei(1),
    //                 isBuy: false
    //             },
    //             {
    //                 limitPrice: 5200,
    //                 quantity: toWei(2),
    //                 isBuy: false
    //             },
    //             {
    //                 limitPrice: 4900,
    //                 quantity: toWei(3),
    //                 isBuy: true
    //             },
    //             {
    //                 limitPrice: 4850,
    //                 quantity: toWei(5),
    //                 isBuy: true
    //             }
    //         ])
    //
    //         console.log((await positionManager.getLiquidityInMultiplePip([485000, 490000, 520000, 510000])).toString())
    //
    //         await openMarketPosition({
    //             quantity: BigNumber.from(toWei('2')),
    //             leverage: 10,
    //             side: SIDE.LONG,
    //             trader: trader2.address,
    //             instanceTrader: trader2,
    //             _positionManager: positionManager
    //         })
    //
    //         await expectOrderbook([
    //             {
    //                 limitPrice: 5200,
    //                 quantity: toWei(1),
    //                 isBuy: false
    //             },
    //             {
    //                 limitPrice: 4900,
    //                 quantity: toWei(3),
    //                 isBuy: true
    //             },
    //             {
    //                 limitPrice: 4850,
    //                 quantity: toWei(5),
    //                 isBuy: true
    //             }
    //         ])
    //
    //         console.log((await positionManager.getLiquidityInMultiplePip([485000, 490000, 520000, 510000])).toString())
    //     })
    //
    //     it("should get limit order with reverse price", async () => {
    //         await openMultiLimitOrderAndExpectOrderbook([
    //             {
    //                 limitPrice: 5100,
    //                 quantity: toWei(1),
    //                 isBuy: true
    //             },
    //             {
    //                 limitPrice: 5200,
    //                 quantity: toWei(2),
    //                 isBuy: false
    //             },
    //             {
    //                 limitPrice: 4900,
    //                 quantity: toWei(3),
    //                 isBuy: true
    //             },
    //             {
    //                 limitPrice: 4850,
    //                 quantity: toWei(5),
    //                 isBuy: true
    //             }
    //         ])
    //
    //         await openLimitPositionAndExpect({
    //             limitPrice: 5000,
    //             side: SIDE.SHORT,
    //             leverage: 10,
    //             quantity: toWei(2),
    //             _trader: trader2
    //         })
    //
    //         await expectOrderbook([
    //             {
    //                 limitPrice: 5000,
    //                 quantity: toWei(1),
    //                 isBuy: false
    //             },
    //             {
    //                 limitPrice: 5200,
    //                 quantity: toWei(2),
    //                 isBuy: false
    //             },
    //             {
    //                 limitPrice: 4900,
    //                 quantity: toWei(3),
    //                 isBuy: true
    //             },
    //             {
    //                 limitPrice: 4850,
    //                 quantity: toWei(5),
    //                 isBuy: true
    //             }
    //         ])
    //
    //         await openLimitPositionAndExpect({
    //             limitPrice: 5500,
    //             side: SIDE.LONG,
    //             leverage: 10,
    //             quantity: toWei(4),
    //             _trader: trader3
    //         })
    //
    //         await expectOrderbook([
    //             {
    //                 limitPrice: 5500,
    //                 quantity: toWei(1),
    //                 isBuy: true
    //             },
    //             {
    //                 limitPrice: 4900,
    //                 quantity: toWei(3),
    //                 isBuy: true
    //             },
    //             {
    //                 limitPrice: 4850,
    //                 quantity: toWei(5),
    //                 isBuy: true
    //             }
    //         ])
    //     })
    //
    //     it("should get blank orderbook when all limit order is filled", async () => {
    //         await openMultiLimitOrderAndExpectOrderbook([
    //             {
    //                 limitPrice: 5200,
    //                 quantity: toWei(2),
    //                 isBuy: false
    //             },
    //             {
    //                 limitPrice: 5300,
    //                 quantity: toWei(4),
    //                 isBuy: false
    //             },
    //             {
    //                 limitPrice: 5100,
    //                 quantity: toWei(1),
    //                 isBuy: true
    //             },
    //             {
    //                 limitPrice: 4900,
    //                 quantity: toWei(3),
    //                 isBuy: true
    //             },
    //             {
    //                 limitPrice: 4850,
    //                 quantity: toWei(5),
    //                 isBuy: true
    //             }
    //         ])
    //
    //         await openMarketPosition({
    //             quantity: toWei(6),
    //             leverage: 10,
    //             side: SIDE.LONG,
    //             trader: trader2.address,
    //             instanceTrader: trader2,
    //             _positionManager: positionManager
    //         })
    //
    //         await openMarketPosition({
    //             quantity: toWei(9),
    //             leverage: 10,
    //             side: SIDE.SHORT,
    //             trader: trader4.address,
    //             instanceTrader: trader4,
    //             _positionManager: positionManager
    //         })
    //
    //         await expectOrderbook([])
    //     })
    // })

    describe("instantly close position", async () => {
        it ("should close position correctly", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5100,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(10)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            await openMarketPosition({
                quantity: toWei(10),
                leverage: 10,
                side: SIDE.LONG,
                trader: trader2.address,
                instanceTrader: trader2,
                _positionManager: positionManager
            })

            await openLimitPositionAndExpect({
                limitPrice: 5200,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(10)),
                _trader: trader2,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            await closeMarketPosition({
                trader: trader1,
                quantity: toWei(10),
                _positionManager: positionManager
            })
        })

        it("should instantly close position when position already have partial closed", async () => {
            // trader1 open position short with quantity = 10
            await openLimitPositionAndExpect({
                limitPrice: 5100,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(10)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            await openMarketPosition({
                quantity: toWei(10),
                leverage: 10,
                side: SIDE.LONG,
                trader: trader2.address,
                instanceTrader: trader2,
                _positionManager: positionManager
            })

            // trader1 partially close position 2 quantity, 8 quantity remain
            await openLimitPositionAndExpect({
                limitPrice: 4900,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from(toWei(2)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            await openMarketPosition({
                quantity: toWei(2),
                leverage: 10,
                side: SIDE.SHORT,
                trader: trader2.address,
                instanceTrader: trader2,
                _positionManager: positionManager
            })

            // trader1 open 2 limit close position, not filled yet
            await openLimitPositionAndExpect({
                limitPrice: 4900,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from(toWei(1)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            await openLimitPositionAndExpect({
                limitPrice: 4800,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from(toWei(1)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            // trader1 instantly close 8 quantity remaining
            await openLimitPositionAndExpect({
                limitPrice: 5200,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(8)),
                _trader: trader2,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            await closeMarketPosition({
                trader: trader1,
                quantity: toWei(8),
                _positionManager: positionManager
            })
        })
    })

    describe("should fill orderbook correctly", async () => {
        it("should fill order book correctly", async () => {
            await changePrice({
                limitPrice: 2000,
                toHigherPrice: false
            })

            await changePrice({
                limitPrice: 271.34,
                toHigherPrice: false
            })

            await openMultiLimitOrderAndExpectOrderbook([
                {
                    limitPrice: 275.41,
                    quantity: toWei(5.48),
                    isBuy: false
                },
                {
                    limitPrice: 271.40,
                    quantity: toWei(22.02),
                    isBuy: false
                },
                {
                    limitPrice: 271.38,
                    quantity: toWei(12.28),
                    isBuy: false
                },
                {
                    limitPrice: 271.36,
                    quantity: toWei(8.86),
                    isBuy: false
                },
                {
                    limitPrice: 271.35,
                    quantity: toWei(7.83),
                    isBuy: false
                },
            ])

            await openMarketPosition({
                quantity: toWei(52.47),
                leverage: 10,
                side: SIDE.LONG,
                trader: trader2.address,
                instanceTrader: trader2,
                _positionManager: positionManager
            })

            console.log("has liquidity", (await positionManager.hasLiquidity(27136)))
            console.log("liquidity", (await positionManager.getLiquidityInPip(27136)).toString())

            console.log("has liquidity", (await positionManager.hasLiquidity(27135)))
            console.log("liquidity", (await positionManager.getLiquidityInPip(27135)).toString())
        })
    })

    describe("should get first order id in pip", async () => {
        it("should get first order id", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 1,
                quantity: toWei(1),
                _trader: trader0,
                skipCheckBalance: true
            })

            console.log((await userGateway.getListOrderPending(positionManager.address, trader0.address)))
        })
    })

    describe("upgrade close position", async () => {
        it("should close market normally when have enough quantity pending to close", async () => {
            // trader1 open position short with quantity = 10
            await openLimitPositionAndExpect({
                limitPrice: 5100,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(10)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            await openMarketPosition({
                quantity: toWei(10),
                leverage: 10,
                side: SIDE.LONG,
                trader: trader2.address,
                instanceTrader: trader2,
                _positionManager: positionManager
            })

            await userGateway.connect(trader1).closeLimitPosition(positionManager.address, BigNumber.from(480000), BigNumber.from(toWei(2)))

            await userGateway.connect(trader1).closeLimitPosition(positionManager.address, BigNumber.from(490000), BigNumber.from(toWei(3)))

            await userGateway.connect(trader2).closeLimitPosition(positionManager.address, BigNumber.from(520000), BigNumber.from(toWei(4)))

            await userGateway.connect(trader1).closePosition(positionManager.address, BigNumber.from(toWei(4)))

            const trader1Position = await userGateway.getPosition(positionManager.address, trader1.address)

            await expect(trader1Position.quantity).eq(toWei(-6))

            const trader1PendingOrders = await userGateway.getListOrderPending(positionManager.address, trader1.address)
            console.log(trader1PendingOrders)
            await expect(trader1PendingOrders.length).eq(4)
        })

        it("should cancel all limit close pending then close market when don't have enough quantity pending to close", async () => {
            // trader1 open position short with quantity = 10
            await openLimitPositionAndExpect({
                limitPrice: 5100,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(10)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            await openMarketPosition({
                quantity: toWei(10),
                leverage: 10,
                side: SIDE.LONG,
                trader: trader2.address,
                instanceTrader: trader2,
                _positionManager: positionManager
            })

            await userGateway.connect(trader1).closeLimitPosition(positionManager.address, BigNumber.from(480000), BigNumber.from(toWei(2)))

            await userGateway.connect(trader1).closeLimitPosition(positionManager.address, BigNumber.from(490000), BigNumber.from(toWei(3)))

            await userGateway.connect(trader2).closeLimitPosition(positionManager.address, BigNumber.from(520000), BigNumber.from(toWei(8)))

            await userGateway.connect(trader1).closePosition(positionManager.address, BigNumber.from(toWei(7)))

            await userGateway.connect(trader2).closeLimitPosition(positionManager.address, BigNumber.from(520000), BigNumber.from(toWei(3)))

            const trader2PendingOrders = await userGateway.getListOrderPending(positionManager.address, trader2.address)

            console.log(trader2PendingOrders.toString())
            await expect(trader2PendingOrders[1].quantity).eq(toWei(2))

            const trader1Position = await userGateway.getPosition(positionManager.address, trader1.address)

            await expect(trader1Position.quantity).eq(toWei(-3))

            const trader1PendingOrders = await userGateway.getListOrderPending(positionManager.address, trader1.address)
            console.log(trader1PendingOrders)
            await expect(trader1PendingOrders.length).eq(0)
        })

        it("should reduce quantity to position quantity", async () => {
            // trader1 open position short with quantity = 10
            await openLimitPositionAndExpect({
                limitPrice: 5100,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(10)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            await openMarketPosition({
                quantity: toWei(10),
                leverage: 10,
                side: SIDE.LONG,
                trader: trader2.address,
                instanceTrader: trader2,
                _positionManager: positionManager
            })

            await userGateway.connect(trader2).closeLimitPosition(positionManager.address, BigNumber.from(520000), BigNumber.from(toWei(13)))

            await userGateway.connect(trader1).closePosition(positionManager.address, BigNumber.from(toWei(13)))

            const trader1Position = await userGateway.getPosition(positionManager.address, trader1.address)

            await expect(trader1Position.quantity).eq(toWei(0))

            const trader2PendingOrder = await userGateway.getListOrderPending(positionManager.address, trader2.address)

            await expect(trader2PendingOrder.length).eq(0)
        })
    })

    describe("should charge different fee ratio for maker and taker", async () => {
        beforeEach(async () => {
            await positionManager.updateTollsRatio(10000, 5000, 5000, 2000)
        })

        it("should charge different fee when open limit/market order", async () => {
            const trader1BalanceBefore = await bep20Mintable.balanceOf(trader1.address)
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(10)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })
            const trader1BalanceAfter = await bep20Mintable.balanceOf(trader1.address)

            // total transferred amount = margin + fee = 5000 + 5000 * 10 * 0.01% (fee for maker) = 5005
            await expect(trader1BalanceBefore.sub(trader1BalanceAfter)).eq(toWei('5005'))

            const trader2BalanceBefore = await bep20Mintable.balanceOf(trader2.address)
            await openMarketPosition({
                quantity: toWei(10),
                leverage: 10,
                side: SIDE.LONG,
                trader: trader2.address,
                instanceTrader: trader2,
                _positionManager: positionManager
            })
            const trader2BalanceAfter = await bep20Mintable.balanceOf(trader2.address)

            // total transferred amount = margin + fee = 5000 + 5000 * 10 * 0.02% (fee for taker) = 5010
            await expect(trader2BalanceBefore.sub(trader2BalanceAfter)).eq(toWei('5010'))
        })

        it("should charge fee when partially and fully close market/limit order", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(10)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            await openMarketPosition({
                quantity: toWei(10),
                leverage: 10,
                side: SIDE.LONG,
                trader: trader2.address,
                instanceTrader: trader2,
                _positionManager: positionManager
            })

            await closeLimitPosition({
                trader: trader1,
                price: 4800,
                quantity: toWei(10),
                _positionManager: positionManager
            })

            const trader2BalanceBeforePartialClose = await bep20Mintable.balanceOf(trader2.address)
            await closeMarketPosition({
                trader: trader2,
                quantity: toWei(8),
                _positionManager: positionManager
            })
            const trader2BalanceAfterPartialClose = await bep20Mintable.balanceOf(trader2.address)

            // total claimed amount after close = margin + pnl - fee = 4000 + (-160) * 10 - 3840 * 10 * 0.05% (taker fee when close)
            // = 2380.8
            await expect(trader2BalanceAfterPartialClose.sub(trader2BalanceBeforePartialClose)).eq(toWei('2380.8'))

            const trader2BalanceBeforeFullyClose = await bep20Mintable.balanceOf(trader2.address)
            await closeMarketPosition({
                trader: trader2,
                quantity: toWei(2),
                _positionManager: positionManager
            })
            const trader2BalanceAfterFullyClose = await bep20Mintable.balanceOf(trader2.address)

            // total claimed amount after close = margin + pnl - fee = 1000 + (-40) * 10 - 960 * 10 * 0.05% (taker fee when close)
            // = 595.2
            await expect(trader2BalanceAfterFullyClose.sub(trader2BalanceBeforeFullyClose)).eq(toWei('595.2'))

            const trader1ClaimableAmount = await userGateway.getClaimAmount(positionManager.address, trader1.address)
            console.log(trader1ClaimableAmount.toString())
            // total claimable amount = margin + pnl - fee = 5000 + 200 * 10 - 4800 * 10 * 0.02% (maker fee when close)
            // = 6990.4
            await expect(trader1ClaimableAmount).eq(toWei(6990.4))
        })

        it("should charge fee correctly when close position by both limit and market", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(10)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            await openMarketPosition({
                quantity: toWei(10),
                leverage: 10,
                side: SIDE.LONG,
                trader: trader2.address,
                instanceTrader: trader2,
                _positionManager: positionManager
            })

            await closeLimitPosition({
                trader: trader1,
                price: 4800,
                quantity: toWei(6),
                _positionManager: positionManager
            })

            const trader2BalanceBeforeClose1 = await bep20Mintable.balanceOf(trader2.address)
            await closeMarketPosition({
                trader: trader2,
                quantity: toWei(6),
                _positionManager: positionManager
            })
            const trader2BalanceAfterClose1 = await bep20Mintable.balanceOf(trader2.address)

            // total trader 2 received = margin + pnl - fee = 3000 + (-200) * 6 - 4800 * 6 * 0.05% = 1785.6
            await expect(trader2BalanceAfterClose1.sub(trader2BalanceBeforeClose1)).eq(toWei(1785.6))

            const trader1ClaimableAmountAfterClose1 = await userGateway.getClaimAmount(positionManager.address, trader1.address)

            // total trader 1 claimable = margin + pnl - fee = 5000 + 200 * 6 - 4800 * 6 * 0.02% = 6194.24
            await expect(trader1ClaimableAmountAfterClose1).eq(toWei(6194.24))

            await closeLimitPosition({
                trader: trader2,
                price: 5100,
                quantity: toWei(4),
                _positionManager: positionManager
            })

            const trader1BalanceBeforeClose2 = await bep20Mintable.balanceOf(trader1.address)
            await closeMarketPosition({
                trader: trader1,
                quantity: toWei(4),
                _positionManager: positionManager
            })
            const trader1BalanceAfterClose2 = await bep20Mintable.balanceOf(trader1.address)

            // total trader 1 received = margin + pnl - fee = 5000 + 200 * 6 - 100 * 4 - 4800 * 6 * 0.02% - 5100 * 4 * 0.05% = 5784.04
            await expect(trader1BalanceAfterClose2.sub(trader1BalanceBeforeClose2)).eq(toWei(5784.04))

            const trader2ClaimableAmountAfterClose2 = await userGateway.getClaimAmount(positionManager.address, trader2.address)

            // total trader 2 claimable = margin + pnl - fee = 2000 + 100 * 4 - 5100 * 4 * 0.02% = 2395.92
            await expect(trader2ClaimableAmountAfterClose2).eq(toWei(2395.92))
        })
    })

    describe("should refund margin and commission fee when cancel limit order", async () => {
        beforeEach(async () => {
            await positionManager.updateTollsRatio(10000, 10000, 5000, 5000)
        })
        it("should refund fee when cancel a not filled order", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(10)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            const balanceBeforeClose = await bep20Mintable.balanceOf(trader1.address)
            await userGateway.connect(trader1).cancelLimitOrder(positionManager.address, 0, 0)
            const balanceAfterClose = await bep20Mintable.balanceOf(trader1.address)

            console.log("refund amount", balanceAfterClose.sub(balanceBeforeClose).toString())
            // refund amount = 5000 + 5000 * 10 * 0.01% = 5005
            await expect(balanceAfterClose.sub(balanceBeforeClose)).eq(toWei(5005))
        })

        it("should refund fee when cancel a partial filled order", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(10)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            await openMarketPosition({
                quantity: toWei(3),
                leverage: 10,
                side: SIDE.LONG,
                trader: trader2.address,
                instanceTrader: trader2,
                _positionManager: positionManager
            })

            const balanceBeforeCancel = await bep20Mintable.balanceOf(trader1.address)
            await userGateway.connect(trader1).cancelLimitOrder(positionManager.address, 0, 0)
            const balanceAfterCancel = await bep20Mintable.balanceOf(trader1.address)

            console.log("refund amount", balanceAfterCancel.sub(balanceBeforeCancel).toString())
            // refund amount = 3500 + 3500 * 10 * 0.01% = 3503.5
            await expect(balanceAfterCancel.sub(balanceBeforeCancel)).eq(toWei(3503.5))
        })

        it("should not refund fee when cancel a limit order close position", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(10)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            await openMarketPosition({
                quantity: toWei(3),
                leverage: 10,
                side: SIDE.LONG,
                trader: trader2.address,
                instanceTrader: trader2,
                _positionManager: positionManager
            })

            const balanceBeforeCancel = await bep20Mintable.balanceOf(trader1.address)
            await userGateway.connect(trader1).cancelLimitOrder(positionManager.address, 0, 0)
            const balanceAfterCancel = await bep20Mintable.balanceOf(trader1.address)

            console.log("refund amount", balanceAfterCancel.sub(balanceBeforeCancel).toString())
            // refund amount = 3500 + 3500 * 10 * 0.01% = 3503.5
            await expect(balanceAfterCancel.sub(balanceBeforeCancel)).eq(toWei(3503.5))

            await closeLimitPosition({
                trader: trader1,
                _positionManager: positionManager,
                price: 4800,
                quantity: toWei(1)
            })

            const balanceBeforeCancel2 = await bep20Mintable.balanceOf(trader1.address)
            await userGateway.connect(trader1).cancelLimitOrder(positionManager.address, 0, 1)
            const balanceAfterCancel2 = await bep20Mintable.balanceOf(trader1.address)

            // refund amount = 0
            await expect(balanceAfterCancel2.sub(balanceBeforeCancel2)).eq(toWei(0))

        })
    })

    describe("should receive correct amount when close position by limit order instantly matched", async () => {
        it("should claim correct amount included margin and pnl when close position by limit order instantly matched", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(10)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            await openMarketPosition({
                quantity: toWei(10),
                leverage: 10,
                side: SIDE.LONG,
                trader: trader2.address,
                instanceTrader: trader2,
                _positionManager: positionManager
            })

            await openLimitPositionAndExpect({
                limitPrice: 4500,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from(toWei(4)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            await openMarketPosition({
                quantity: toWei(4),
                leverage: 10,
                side: SIDE.SHORT,
                trader: trader2.address,
                instanceTrader: trader2,
                _positionManager: positionManager
            })

            await openLimitPositionAndExpect({
                limitPrice: 4800,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(6)),
                _trader: trader2,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            const balanceBeforeClose = await bep20Mintable.balanceOf(trader1.address)
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from(toWei(6)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })
            const balanceAfterClose = await bep20Mintable.balanceOf(trader1.address)

            await expect(balanceAfterClose.sub(balanceBeforeClose)).eq(toWei(8200))
            expect((await userGateway.getPosition(positionManager.address, trader1.address)).quantity).eq(0)
        })
    })

    it("should deposit enough margin", async () => {
        await positionHouseConfigurationProxy.updateInitialMarginSlippage(5)

        await userGateway.connect(trader1).openLimitOrderWithDeposit(positionManager.address, 0, toWei(1), 490000, 10, toWei(490))

        await expect(userGateway.connect(trader2).openMarketPositionWithDeposit(positionManager.address, 1, toWei(1), 10, 1)).to.be.revertedWith('10')
    })
})