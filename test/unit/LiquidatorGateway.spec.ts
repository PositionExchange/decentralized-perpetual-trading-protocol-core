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
    priceToPip, SIDE,
    toWeiBN,
    toWeiWithString, ExpectTestCaseParams, ExpectMaintenanceDetail, toWei
} from "../shared/utilities";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {CHAINLINK_ABI_TESTNET} from "../../constants";
import PositionManagerTestingTool from "../shared/positionManagerTestingTool";

import PositionHouseTestingTool from "../shared/positionHouseTestingTool";
import {deployPositionHouse} from "../shared/deploy";
import Web3 from "web3";

describe("Liquidator Gateway", () => {
    const web3 = new Web3("http://localhost:8545")
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

        await positionHouseConfigurationProxy.updateInitialMarginSlippage(100)
    })

    const openMarketPosition = async (input) => {
        return positionHouseTestingTool.openMarketPosition(input)
    }

    async function openLimitPositionAndExpect(input): Promise<LimitOrderReturns> {
        return positionHouseTestingTool.openLimitPositionAndExpect(input)
    }

    async function closeMarketPosition(input) {
        return positionHouseTestingTool.closeMarketPosition(input)
    }

    async function closeLimitPosition(input) {
        return positionHouseTestingTool.closeLimitPosition(input)
    }

    async function liquidateAndExpectBalanceChange(input) {
        const traderBalanceBeforeLiquidate = await bep20Mintable.balanceOf(input.trader)
        await liquidatorGateway.liquidate(input.positionManagerAddress, input.trader)
        const traderBalanceAfterLiquidate = await bep20Mintable.balanceOf(input.trader)
        console.log("receive amount and balance changed", input.receiveAmount.toString(), traderBalanceAfterLiquidate.sub(traderBalanceBeforeLiquidate).toString())
        await expect(input.receiveAmount).eq(traderBalanceAfterLiquidate.sub(traderBalanceBeforeLiquidate))

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
            expect(maintenanceDetail.marginRatio).eq(expectedMarginRatio, "wrong expect margin ratio")

        if (expectedMarginBalance != undefined)
            expect(maintenanceDetail.marginBalance).eq(expectedMarginBalance, "wrong expect margin balance")

        if (expectedMaintenanceMargin != undefined)
            expect(maintenanceDetail.maintenanceMargin).eq(expectedMaintenanceMargin, "wrong expect maintenance margin")

        if (expectedAbsoluteMargin != undefined)
            expect(traderPosition.absoluteMargin).eq(expectedAbsoluteMargin, "wrong expect absolute margin")

        console.log("expect all: quantity, openNotional, positionNotional, margin, unrealizedPnl", Number(traderPosition.quantity), Number(traderPosition.openNotional), Number(positionNotionalAndPnLTrader.positionNotional), Number(traderPosition.margin), Number(positionNotionalAndPnLTrader.unrealizedPnl))
        if (expectedQuantity != undefined) {
            expect(traderPosition.quantity).eq(expectedQuantity);
        }
        if (expectedOpenNotional != undefined) expect(positionNotionalAndPnLTrader.unrealizedPnl).eq(expectedPnl)
        expect(traderPosition.openNotional).eq(expectedOpenNotional);
        expect(traderPosition.margin).eq(expectedMargin);
        return true;
    }

    describe("Liquidate", async () => {
        it("should liquidate position success", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 20,
                quantity: BigNumber.from(toWei('10')),
                _trader: trader1,
                _positionManager: fundingRateTest,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from(toWei('10')),
                    leverage: 20,
                    side: SIDE.SHORT,
                    trader: trader2.address,
                    instanceTrader: trader2,
                    _positionManager: fundingRateTest,
                }
            );

            await changePrice({
                limitPrice: 5500,
                toHigherPrice: true,
                _positionManager: fundingRateTest
            })

            await fundingRateTest.setMockPrice(5500, 5500)

            await liquidateAndExpectBalanceChange({
                positionManagerAddress: fundingRateTest.address,
                trader: trader2.address,
                receiveAmount: 0
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: fundingRateTest.address,
                traderAddress: trader2.address,
                expectedOpenNotional: 0,
                expectedMargin: 0,
                expectedQuantity: 0,
                expectedPnl: 0,
                expectedAbsoluteMargin: 0
            })
        })
    })

    describe("Liquidate after trader partial close position", async () => {
        it("should liquidate success and return profit to trader (create position by limit)", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 20,
                quantity: BigNumber.from(toWei('10')),
                _trader: trader1,
                _positionManager: fundingRateTest,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from(toWei('10')),
                    leverage: 20,
                    side: SIDE.SHORT,
                    trader: trader2.address,
                    instanceTrader: trader2,
                    _positionManager: fundingRateTest,
                }
            );

            await openLimitPositionAndExpect({
                limitPrice: 5500,
                side: SIDE.SHORT,
                leverage: 20,
                quantity: BigNumber.from(toWei('2')),
                _trader: trader1,
                _positionManager: fundingRateTest,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from(toWei('2')),
                    leverage: 20,
                    side: SIDE.LONG,
                    trader: trader2.address,
                    instanceTrader: trader2,
                    _positionManager: fundingRateTest,
                }
            );

            await changePrice({
                limitPrice: 4500,
                toHigherPrice: true,
                _positionManager: fundingRateTest
            })

            await fundingRateTest.setMockPrice(4500, 4500)

            await liquidateAndExpectBalanceChange({
                positionManagerAddress: fundingRateTest.address,
                trader: trader1.address,
                receiveAmount: toWei(1500)
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: fundingRateTest.address,
                traderAddress: trader1.address,
                expectedOpenNotional: 0,
                expectedMargin: 0,
                expectedQuantity: 0,
                expectedPnl: 0
            })
        })

        it("should liquidate success and return profit to trader (create position by market)", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 20,
                quantity: BigNumber.from(toWei('10')),
                _trader: trader1,
                _positionManager: fundingRateTest,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from(toWei('10')),
                    leverage: 20,
                    side: SIDE.SHORT,
                    trader: trader2.address,
                    instanceTrader: trader2,
                    _positionManager: fundingRateTest,
                }
            );

            await openLimitPositionAndExpect({
                limitPrice: 4500,
                side: SIDE.LONG,
                leverage: 20,
                quantity: BigNumber.from(toWei('2')),
                _trader: trader2,
                _positionManager: fundingRateTest,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from(toWei('2')),
                    leverage: 20,
                    side: SIDE.SHORT,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: fundingRateTest,
                }
            );

            await changePrice({
                limitPrice: 5500,
                toHigherPrice: true,
                _positionManager: fundingRateTest
            })

            await fundingRateTest.setMockPrice(5500, 5500)

            await liquidateAndExpectBalanceChange({
                positionManagerAddress: fundingRateTest.address,
                trader: trader2.address,
                receiveAmount: toWei(1500)
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: fundingRateTest.address,
                traderAddress: trader2.address,
                expectedOpenNotional: 0,
                expectedMargin: 0,
                expectedQuantity: 0,
                expectedPnl: 0
            })
        })

        it("should liquidate success and return profit to trader (create position by both limit and market)", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 20,
                quantity: BigNumber.from(toWei('10')),
                _trader: trader1,
                _positionManager: fundingRateTest,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from(toWei('10')),
                    leverage: 20,
                    side: SIDE.SHORT,
                    trader: trader2.address,
                    instanceTrader: trader2,
                    _positionManager: fundingRateTest,
                }
            );

            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.SHORT,
                leverage: 20,
                quantity: BigNumber.from(toWei('10')),
                _trader: trader2,
                _positionManager: fundingRateTest,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from(toWei('10')),
                    leverage: 20,
                    side: SIDE.LONG,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: fundingRateTest,
                }
            );

            await openLimitPositionAndExpect({
                limitPrice: 4500,
                side: SIDE.LONG,
                leverage: 20,
                quantity: BigNumber.from(toWei('3')),
                _trader: trader2,
                _positionManager: fundingRateTest,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from(toWei('3')),
                    leverage: 20,
                    side: SIDE.SHORT,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: fundingRateTest,
                }
            );

            await changePrice({
                limitPrice: 5500,
                toHigherPrice: true,
                _positionManager: fundingRateTest
            })

            await fundingRateTest.setMockPrice(5500, 5500)

            await liquidateAndExpectBalanceChange({
                positionManagerAddress: fundingRateTest.address,
                trader: trader2.address,
                receiveAmount: toWei(2250)
            })

            await expectMarginPnlAndOP({
                positionManagerAddress: fundingRateTest.address,
                traderAddress: trader2.address,
                expectedOpenNotional: 0,
                expectedMargin: 0,
                expectedQuantity: 0,
                expectedPnl: 0
            })
        })
    })

    describe("partial liquidate", async () => {
        it("should cancel all reduce limit order when partial liquidate", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from(toWei('10')),
                _trader: trader1,
                _positionManager: fundingRateTest,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from(toWei('10')),
                    leverage: 20,
                    side: SIDE.SHORT,
                    trader: trader2.address,
                    instanceTrader: trader2,
                    _positionManager: fundingRateTest,
                }
            );

            await changePrice({
                limitPrice: 4600,
                toHigherPrice: false,
                _positionManager: fundingRateTest
            })

            await fundingRateTest.setMockPrice(4518, 4518)

            await openLimitPositionAndExpect({
                limitPrice: 5200,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei('2')),
                _trader: trader1,
                _positionManager: fundingRateTest,
                skipCheckBalance: true
            })

            await openLimitPositionAndExpect({
                limitPrice: 5300,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from(toWei('3')),
                _trader: trader1,
                _positionManager: fundingRateTest,
                skipCheckBalance: true
            })

            expect((await userGateway.getListOrderPending(fundingRateTest.address, trader1.address)).length).eq(4)

            await liquidatorGateway.liquidate(fundingRateTest.address, trader1.address)

            // 2 limit order close position have been cancelled after partial liquidated
            expect((await userGateway.getListOrderPending(fundingRateTest.address, trader1.address)).length).eq(0)
        })

        it("should partial liquidate only 20% quantity success", async () => {
            await openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from(toWei('10')),
                _trader: trader1,
                _positionManager: fundingRateTest,
                skipCheckBalance: true
            })

            await openMarketPosition({
                    quantity: BigNumber.from(toWei('10')),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader2.address,
                    instanceTrader: trader2,
                    _positionManager: fundingRateTest,
                }
            );


        })

        it("should decode event logs data", async () => {
            const typesArray = [
                {type: 'address', name: 'trader'},
                {type: 'int256', name: 'quantity'},
                {type: 'uint16', name: 'leverage'},
                {type: 'uint256', name: 'entryPrice'},
                {type: 'address', name: 'positionManager'},
                {type: 'uint256', name: 'margin'}
            ];

            const data = '0x00000000000000000000000009c0ba0525e423d9f147bb8ed5ddf5183af5139100000000000000000000000000000000000000000000000000038d7ea4c6800000000000000000000000000000000000000000000000000107ad8f556c6c0000000000000000000000000000000000000000000000000000000000000000001900000000000000000000000000000000000000000000000000000000001cfde00000000000000000000000000aa7f1ff56c673bc5bfe8597aa0cd7da6bc1806c0000000000000000000000000000000000000000000000000000000000000000';

            const decodedParameters = web3.eth.abi.decodeParameters(typesArray, data);

            console.log(JSON.stringify(decodedParameters, null, 4));

            const typesArray2 = [
                {type: 'address', name: 'trader'},
                {type: 'bool', name: 'isBuy'},
                {type: 'uint256', name: 'size'},
                {type: 'uint256', name: 'requestId'},
            ];

            const data2 = '0x00000000000000000000000009c0ba0525e423d9f147bb8ed5ddf5183af513910000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000044d575b885f00000000000000000000000000000000000000000000000000000000000000000061';

            const decodedParameters2 = web3.eth.abi.decodeParameters(typesArray2, data2);

            console.log(JSON.stringify(decodedParameters2, null, 4));
        })
    })
})