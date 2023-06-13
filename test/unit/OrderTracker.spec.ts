import {BigNumber, BigNumberish, ContractFactory, Signer, Wallet} from 'ethers'
import {ethers, waffle} from 'hardhat'
import {expect} from 'chai'
import {
    PositionManager,
    PositionHouse,
    InsuranceFund,
    BEP20Mintable,
    PositionHouseConfigurationProxy,
    FundingRateTest, UserGateway, UserGatewayTest, OrderTracker, MarketMakerGateway
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

describe("OrderTracker", () => {
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
    let orderTracker: OrderTracker
    let marketMakerGateway: MarketMakerGateway
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
            fundingRateTest,
            _,
            marketMakerGateway,
            _,
            _,
            _,
            orderTracker
        ] = await deployPositionHouse() as any

        await userGateway.setPositionHouse(positionHouse.address)


        await positionHouseConfigurationProxy.updateInitialMarginSlippage(100)
        await positionManager.updateMaxPercentMarketMarket(2**16 - 1)
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

    describe("limit over price", () => {
        it("should", async()=>{

            await openLimitPositionAndExpect({
                limitPrice: 5100,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(10)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })


            await openLimitPositionAndExpect({
                limitPrice: 5100,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from(toWei(10)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

        })
    })

    describe("should fill and accumulated filled order correctly", async () => {
        it("should get correct total pnl and position info", async () => {
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
                quantity: toWei(6),
                leverage: 10,
                side: SIDE.LONG,
                trader: trader2.address,
                instanceTrader: trader2,
                _positionManager: positionManager
            })

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
                quantity: toWei(14),
                leverage: 10,
                side: SIDE.LONG,
                trader: trader2.address,
                instanceTrader: trader2,
                _positionManager: positionManager
            })

            await changePrice({
                limitPrice: 5200,
                toHigherPrice: true,
                _positionManager: positionManager
            })

            console.log((await orderTracker.getTotalPnl(positionManager.address)).toString())
            console.log((await orderTracker.positionManagerInfos(positionManager.address)).toString())

        })

        it("should exclude limit order created by MM when accumulate position size", async () => {
            await marketMakerGateway.setMMWhitelist(trader5.address, true)
            await positionManager.setValidatedMarketMaker(trader5.address)
            await marketMakerGateway.connect(trader5).supply(
                positionManager.address,
                [
                    {
                        pip: 490000,
                        quantity: toWei(2)
                    },
                    {
                        pip: 480000,
                        quantity: toWei(3)
                    }
                ],
                1
            )

            await openMarketPosition({
                quantity: toWei(4),
                leverage: 10,
                side: SIDE.SHORT,
                trader: trader1.address,
                instanceTrader: trader1,
                _positionManager: positionManager
            })
            const totalPnl = (await orderTracker.getTotalPnl(positionManager.address)).toString()
            const positionInfos = (await orderTracker.positionManagerInfos(positionManager.address))

            // there aren't any long order from user, only market maker
            await expect(positionInfos.totalLongBaseSize.toString()).eq('0')

            await expect(positionInfos.totalShortQuoteSize.toString()).eq(toWei(19400))
            await expect(positionInfos.totalShortBaseSize.toString()).eq(toWei(4))

            // totalPnl = totalShortQuoteSize - totalShortBaseSize * currentPrice
            // = 19400 - 4 * 4800 = 200
            await expect(totalPnl.toString()).eq(toWei('200'))
        })

        it("should exclude market order created by MM when accumulate position size", async () => {
            await marketMakerGateway.setMMWhitelist(trader5.address, true)
            await positionManager.setValidatedMarketMaker(trader5.address)

            await openLimitPositionAndExpect({
                limitPrice: 5100,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(10)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            await openLimitPositionAndExpect({
                limitPrice: 5200,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(3)),
                _trader: trader2,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            await openLimitPositionAndExpect({
                limitPrice: 5500,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(5)),
                _trader: trader3,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            await marketMakerGateway.connect(trader5).fillToPip(
                positionManager.address,
                520000,
                [],
                []
            )

            await marketMakerGateway.connect(trader5).fillToPip(
                positionManager.address,
                540000,
                [],
                []
            )

            await marketMakerGateway.connect(trader5).fillToPip(
                positionManager.address,
                560000,
                [],
                []
            )

            const totalPnl = (await orderTracker.getTotalPnl(positionManager.address)).toString()
            const positionInfos = (await orderTracker.positionManagerInfos(positionManager.address))

            await expect(positionInfos.totalLongBaseSize.toString()).eq('0')

            await expect(positionInfos.totalShortQuoteSize.toString()).eq(toWei(94100))
            await expect(positionInfos.totalShortBaseSize.toString()).eq(toWei(18))

            // totalPnl = totalShortQuoteSize - totalShortBaseSize * currentPrice
            // = 94100 - 5600 * 18 = -6700
            await expect(totalPnl.toString()).eq(toWei('-6700'))
        })


    })
})
