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

    describe("should emit event with each order filled", async () => {
        it("", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5100,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(10)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            console.log((await positionManager.getTickPositionIndexes(510000)).toString())

            await openMarketPosition({
                quantity: toWei(6),
                leverage: 10,
                side: SIDE.LONG,
                trader: trader2.address,
                instanceTrader: trader2,
                _positionManager: positionManager
            })
            console.log("after first market order")
            console.log((await positionManager.getTickPositionIndexes(510000)).toString())

            await openLimitPositionAndExpect({
                limitPrice: 5100,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(10)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            console.log((await positionManager.getTickPositionIndexes(510000)).toString())


            await openMarketPosition({
                quantity: toWei(6),
                leverage: 10,
                side: SIDE.LONG,
                trader: trader2.address,
                instanceTrader: trader2,
                _positionManager: positionManager
            })

            console.log((await positionManager.getTickPositionIndexes(510000)).toString())

            await openLimitPositionAndExpect({
                limitPrice: 5100,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei(3)),
                _trader: trader1,
                _positionManager: positionManager,
                skipCheckBalance: true
            })

            console.log((await positionManager.getTickPositionIndexes(510000)).toString())
        })
    })
})