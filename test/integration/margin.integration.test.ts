import {ethers} from "hardhat";
import {deployPositionHouse} from "../shared/deploy";
import {
    BEP20Mintable,
    FundingRateTest,
    InsuranceFund, LiquidatorGateway,
    PositionHouse,
    PositionHouseConfigurationProxy,
    PositionManager,
    UserGatewayTest
} from "../../typeChain";
import {BigNumber, ContractFactory} from "ethers";
import PositionHouseTestingTool from "../shared/positionHouseTestingTool";
import {SIDE, toWei} from "../shared/utilities";
import {expect} from "chai";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

describe('Test Margin Intergration', function () {
    let positionHouse: PositionHouse;
    let positionManager: PositionManager;
    let positionManagerFactory: ContractFactory;
    let bep20Mintable: BEP20Mintable
    let insuranceFund: InsuranceFund
    let userGateway: UserGatewayTest;
    let liquidatorGateway: LiquidatorGateway
    let positionHouseConfigurationProxy: PositionHouseConfigurationProxy;
    let fundingRateTest : FundingRateTest
    let phTT: PositionHouseTestingTool
    let _;
    let trader0, trader1, trader2, trader3, trader4, tradercp1, tradercp2;
    beforeEach( async function () {
        [trader0, trader1, trader2, trader3, trader4, tradercp1, tradercp2] = await ethers.getSigners();
        [
            positionHouse,
            positionManager,
            positionHouseConfigurationProxy,
            _,
            phTT,
            bep20Mintable,
            insuranceFund,
            userGateway,
            _,
            fundingRateTest,
            _,
            _,
            liquidatorGateway
        ] = await deployPositionHouse() as any

        await positionHouseConfigurationProxy.updateInitialMarginSlippage(100)
    })

    describe('margin without funding rate', function () {
        async function expectManualAddedMargin(trader: SignerWithAddress, amount: number, _positionManager? : any){
            _positionManager = _positionManager || positionManager
            const addedMargin = await userGateway.getAddedMargin(_positionManager.address, trader.address)
            expect(addedMargin.toString()).eq(amount.toString())
        }
        it("should reduce manual margin when open reverse position without PnL", async () => {
            await phTT.openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 1,
                quantity: BigNumber.from('10'),
                _trader: trader1
            })

            await phTT.openMarketPosition({
                    quantity: BigNumber.from('10'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader4.address,
                    instanceTrader: trader4,
                    _positionManager: positionManager,
                }
            );

            // Trader1's margin = price / leverage * quantity = 5000 / 1 * 10 = 50000, pnl = 0 cause price hasn't changed
            await phTT.expectPositionMargin(positionManager, trader1, 50000, 0)
            await userGateway.connect(trader1).addMargin(positionManager.address, BigNumber.from("1000"))
            // Trader1's margin += 1000 = 50000 + 1000
            await phTT.expectPositionMargin(positionManager, trader1, 51000, 0)
            await expectManualAddedMargin(trader1,1000)

            await phTT.openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 1,
                quantity: BigNumber.from('10'),
                _trader: trader2
            })

            // closing 3/10 position, should get back 3/10 position's margin
            await phTT.closePosition({
                    quantity: BigNumber.from('3'),
                    trader: trader1,
                    positionManager
                }
            );
            // Trader's margin -= 3*51000/10 = 35700
            await phTT.expectPositionMargin(positionManager, trader1, 35700, 0)
            await expectManualAddedMargin(trader1,700)

            // closing 2/7 position, should get back 2/7 position's margin
            await phTT.closePosition({
                    quantity: BigNumber.from('2'),
                    trader: trader1,
                    positionManager
                }
            );
            // Trader1's margin = 35700 - (2*35700)/7 = 25500
            await phTT.expectPositionMargin(positionManager, trader1, 25500, 0)
            await expectManualAddedMargin(trader1,500)


            // now trader1 adds 2000 margin
            await userGateway.connect(trader1).addMargin(positionManager.address, BigNumber.from("2000"))
            // Trader1's margin = 25500 + 2000 = 27500
            await phTT.expectPositionMargin(positionManager, trader1, 27500, 0)
            await expectManualAddedMargin(trader1,2500)

            // now trader1 closes 3/5 position should get 16500
            await phTT.closePosition({
                    quantity: BigNumber.from('3'),
                    trader: trader1,
                    positionManager
                }
            );
            await phTT.expectPositionMargin(positionManager, trader1, 27500 - 16500, 0) // 11000
            await expectManualAddedMargin(trader1,1000)

            await userGateway.connect(trader1).removeMargin(positionManager.address, BigNumber.from('800'))
            await expectManualAddedMargin(trader1, 200)
            await phTT.expectPositionMargin(positionManager, trader1, 10200, 0)

            // close 1/2
            await phTT.closePosition({
                    quantity: BigNumber.from('1'),
                    trader: trader1,
                    positionManager
                }
            );
            await expectManualAddedMargin(trader1, 100)
            await phTT.expectPositionMargin(positionManager, trader1, 5100, 0)

            // close all
            await phTT.closePosition({
                    quantity: BigNumber.from('1'),
                    trader: trader1,
                    positionManager
                }
            );
            await expectManualAddedMargin(trader1, 0)
            await phTT.expectPositionMargin(positionManager, trader1, 0, 0)


        })

        it('should count margin correctly when open reverse position with PnL > 0', async function () {
            await phTT.openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 1,
                quantity: BigNumber.from('10'),
                _trader: trader1
            })

            await phTT.openMarketPosition({
                    quantity: BigNumber.from('10'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader4.address,
                    instanceTrader: trader4,
                    _positionManager: positionManager,
                }
            );

            await phTT.pumpPrice({
                toPrice: 5100,
                pumper: tradercp1,
                pumper2: tradercp2
            })

            // Trader1's margin = price / leverage * quantity = 5000 / 1 * 10 = 50000
            // Trader1's total pnl with full quantity = positionNotional - openNotional
            // = quantity * (currentPrice - entryPrice) = 10 * (5100 - 5000) = 1000
            await phTT.expectPositionMargin(positionManager, trader1, 50000, 1000)
            await userGateway.connect(trader1).addMargin(positionManager.address, BigNumber.from("1000"))
            // Trader1's margin += 1000 = 50000 + 1000
            // Trader1's total pnl with full quantity = 1000
            await phTT.expectPositionMargin(positionManager, trader1, 51000, 1000)
            await expectManualAddedMargin(trader1,1000)

            await phTT.openLimitPositionAndExpect({
                limitPrice: 5100,
                side: SIDE.LONG,
                leverage: 1,
                quantity: BigNumber.from('10'),
                _trader: trader2
            })

            // closing 3/10 position, should get back 3/10 position's margin + pnl 300
            await phTT.closePosition({
                    quantity: BigNumber.from('3'),
                    trader: trader1,
                    positionManager,
                    pnl: 300
                }
            );
            // Trader's margin -= 3*51000/10 = 35700
            // Trader1's pnl with quantity 7/10 = 7/10 * 1000 = 700
            await phTT.expectPositionMargin(positionManager, trader1, 35700, 700)
            await expectManualAddedMargin(trader1,700)

            // closing 2/7 position, should get back 2/7 position's margin + pnl = 2/7 * 700 = 200
            await phTT.closePosition({
                    quantity: BigNumber.from('2'),
                    trader: trader1,
                    positionManager,
                    pnl: 200
                }
            );
            // Trader1's margin = 35700 - (2*35700)/7 = 25500
            // Trader1's pnl with quantity 5/7 = 5/7 * 700 = 500
            await phTT.expectPositionMargin(positionManager, trader1, 25500, 500)
            await expectManualAddedMargin(trader1,500)


            // now trader1 adds 2000 margin
            await userGateway.connect(trader1).addMargin(positionManager.address, BigNumber.from("2000"))
            // Trader1's margin = 25500 + 2000 = 27500
            // Trader1's pnl hasn't changed = 500
            await phTT.expectPositionMargin(positionManager, trader1, 27500, 500)
            await expectManualAddedMargin(trader1,2500)

            // now trader1 closes 3/5 position should get 16500 + pnl = 3/5 * 500 = 300
            await phTT.closePosition({
                    quantity: BigNumber.from('3'),
                    trader: trader1,
                    positionManager,
                    pnl: 300
                }
            );
            // Trader1's margin = 27500 - 16500 = 11000
            // Trader1's pnl = 500 - 300 = 200
            await phTT.expectPositionMargin(positionManager, trader1, 27500 - 16500, 200)
            await expectManualAddedMargin(trader1,1000)

            await userGateway.connect(trader1).removeMargin(positionManager.address, BigNumber.from('800'))
            await expectManualAddedMargin(trader1, 200)
            // Trader1's margin = 11000 - 800 = 10200
            // Trader1's pnl hasn't changed = 200
            await phTT.expectPositionMargin(positionManager, trader1, 10200, 200)

            // close 1/2 should get margin = 10200/2 = 5100 and pnl = 200 / 2 = 100
            await phTT.closePosition({
                    quantity: BigNumber.from('1'),
                    trader: trader1,
                    positionManager,
                    pnl: 100
                }
            );
            await expectManualAddedMargin(trader1, 100)
            // Trader1's margin = 10200 - 5100 = 5100
            // Trader1's pnl = 200 - 100 = 100
            await phTT.expectPositionMargin(positionManager, trader1, 5100, 100)

            // close all should get margin = 5100 and pnl = 100
            await phTT.closePosition({
                    quantity: BigNumber.from('1'),
                    trader: trader1,
                    positionManager,
                    pnl: 100
                }
            );
            await expectManualAddedMargin(trader1, 0)
            await phTT.expectPositionMargin(positionManager, trader1, 0)
        });

        it('should count margin correctly when open reverse position with PnL < 0', async function () {
            await phTT.openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 1,
                quantity: BigNumber.from('10'),
                _trader: trader1
            })

            await phTT.openMarketPosition({
                    quantity: BigNumber.from('10'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader4.address,
                    instanceTrader: trader4,
                    _positionManager: positionManager,
                }
            );

            await phTT.dumpPrice({
                toPrice: 4800,
                pumper: tradercp1,
                pumper2: tradercp2,
            })

            // Trader1's margin = price / leverage * quantity = 5000 / 1 * 10 = 50000
            // Trader1's total pnl with full quantity = positionNotional - openNotional
            // = quantity * (currentPrice - entryPrice) = 10 * (4800 - 5000) = -2000
            await phTT.expectPositionMargin(positionManager, trader1, 50000, -2000)
            await userGateway.connect(trader1).addMargin(positionManager.address, BigNumber.from("1000"))
            // Trader1's margin += 1000 = 50000 + 1000
            // Trader1's total pnl with full quantity = -2000
            await phTT.expectPositionMargin(positionManager, trader1, 51000, -2000)
            await expectManualAddedMargin(trader1,1000)

            await phTT.openLimitPositionAndExpect({
                limitPrice: 4800,
                side: SIDE.LONG,
                leverage: 1,
                quantity: BigNumber.from('10'),
                _trader: trader2
            })

            // closing 3/10 position, should get back 3/10 position's margin + pnl = 3/10 * -2000 = -600
            await phTT.closePosition({
                    quantity: BigNumber.from('3'),
                    trader: trader1,
                    positionManager,
                    pnl: -600
                }
            );
            // Trader's margin -= 3*51000/10 = 35700
            // Trader1's pnl with quantity 7/10 = 7/10 * -2000 = -1400
            await phTT.expectPositionMargin(positionManager, trader1, 35700, -1400)
            await expectManualAddedMargin(trader1,700)

            // closing 2/7 position, should get back 2/7 position's margin + pnl = 2/7 * -1400 = -400
            await phTT.closePosition({
                    quantity: BigNumber.from('2'),
                    trader: trader1,
                    positionManager,
                    pnl: -400
                }
            );
            // Trader1's margin = 35700 - (2*35700)/7 = 25500
            // Trader1's pnl with quantity 5/7 = 5/7 * 700 = -1000
            await phTT.expectPositionMargin(positionManager, trader1, 25500, -1000)
            await expectManualAddedMargin(trader1,500)


            // now trader1 adds 2000 margin
            await userGateway.connect(trader1).addMargin(positionManager.address, BigNumber.from("2000"))
            // Trader1's margin = 25500 + 2000 = 27500
            // Trader1's pnl hasn't changed = -1000
            await phTT.expectPositionMargin(positionManager, trader1, 27500, -1000)
            await expectManualAddedMargin(trader1,2500)

            // now trader1 closes 3/5 position should get 16500 + pnl = 3/5 * -1000 = -600
            await phTT.closePosition({
                    quantity: BigNumber.from('3'),
                    trader: trader1,
                    positionManager,
                    pnl: -600
                }
            );
            // Trader1's margin = 27500 - 16500 = 11000
            // Trader1's pnl = -1000 - (-600) = -400
            await phTT.expectPositionMargin(positionManager, trader1, 27500 - 16500, -400)
            await expectManualAddedMargin(trader1,1000)

            await userGateway.connect(trader1).removeMargin(positionManager.address, BigNumber.from('800'))
            await expectManualAddedMargin(trader1, 200)
            // Trader1's margin = 11000 - 800 = 10200
            // Trader1's pnl hasn't changed = -400
            await phTT.expectPositionMargin(positionManager, trader1, 10200, -400)

            // close 1/2 should get margin = 10200/2 = 5100 and pnl = -400 / 2 = -200
            await phTT.closePosition({
                    quantity: BigNumber.from('1'),
                    trader: trader1,
                    positionManager,
                    pnl: -200
                }
            );
            await expectManualAddedMargin(trader1, 100)
            // Trader1's margin = 10200 - 5100 = 5100
            // Trader1's pnl = -400 - (-200) = -200
            await phTT.expectPositionMargin(positionManager, trader1, 5100, -200)

            // close all should get margin = 5100 and pnl = -200
            await phTT.closePosition({
                    quantity: BigNumber.from('1'),
                    trader: trader1,
                    positionManager,
                    pnl: -200
                }
            );
            await expectManualAddedMargin(trader1, 0)
            await phTT.expectPositionMargin(positionManager, trader1, 0)
        });

        it("should be partial liquidated when losing almost added margin + position margin", async () => {
            await phTT.openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from('10'),
                _trader: trader1,
                _positionManager: fundingRateTest
            })

            await phTT.openMarketPosition({
                    quantity: BigNumber.from('10'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader4.address,
                    instanceTrader: trader4,
                    _positionManager: fundingRateTest,
                }
            );

            // Trader1's margin = price / leverage * quantity = 5000 / 1 * 10 = 50000
            // Trader1's pnl = 0 cause price hasn't changed
            await phTT.expectPositionMargin(fundingRateTest, trader1, 5000, 0)

            await userGateway.connect(trader1).addMargin(fundingRateTest.address, BigNumber.from("1000"))
            // Trader1's margin += 1000 = 50000 + 1000
            await phTT.expectPositionMargin(fundingRateTest, trader1, 6000, 0)
            await expectManualAddedMargin(trader1,1000, fundingRateTest)

            await phTT.dumpPrice({
                toPrice: 4417,
                pumper: tradercp1,
                pumper2: tradercp2,
                positionManager: fundingRateTest
            })

            await fundingRateTest.setMockPrice(BigNumber.from("4417"), BigNumber.from("4417"))

            await phTT.openLimitPositionAndExpect({
                limitPrice: 4417,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from('2'),
                _trader: trader3,
                _positionManager: fundingRateTest
            })
            // partial liquidate trader1's position
            await liquidatorGateway.liquidate(fundingRateTest.address, trader1.address)
            // position after liquidated loss 3% margin and 20% quantity
            // Trader1's margin = 97% * oldMargin = 97% * 6000 = 5820
            // Trader1's total pnl with partial liquidated quantity = positionNotional - openNotional
            // = 80% * oldQuantity * (currentPrice - entryPrice) = 80% * 10 * (4417 - 5000) = -4664
            await phTT.expectPositionMargin(fundingRateTest, trader1, 5820, -4664)
            // Trader1's manual added margin = 97% * oldManualMargin = 97% * 1000 = 970
            await expectManualAddedMargin(trader1,970, fundingRateTest)

            await phTT.pumpPrice({
                toPrice: 4800,
                pumper: tradercp1,
                pumper2: tradercp2,
                positionManager: fundingRateTest
            })

            await phTT.openLimitPositionAndExpect({
                limitPrice: 4800,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from('8'),
                _trader: trader2,
                _positionManager: fundingRateTest
            })

            // Trader1's new pnl = positionNotional - openNotional
            // = quantity * (currentPrice - entryPrice) = 8 * (4800 - 5000) = -1600
            // close 5/8 position, should get back 5/8 margin = 5/8 * 5820 = 3638
            // and 5/8 pnl = 5/8 * -1600 = -1000
            await phTT.closePosition({
                    quantity: BigNumber.from('5'),
                    trader: trader1,
                    positionManager: fundingRateTest,
                    pnl: -1000
                }
            );
            // Trader1's margin = 5820 - 3638 = 2182
            // Trader1's pnl = -1600 - (-1000) = -600
            await phTT.expectPositionMargin(fundingRateTest, trader1, 2182, -600)
            // Trader1's manualMargin = 3/8 * 970 = 363
            await expectManualAddedMargin(trader1, 364, fundingRateTest)

            // close all should get back margin = 2182 and pnl = -600
            await phTT.closePosition({
                    quantity: BigNumber.from('3'),
                    trader: trader1,
                    positionManager: fundingRateTest,
                    pnl: -600
                }
            );

            await phTT.expectPositionMargin(fundingRateTest, trader1, 0)
            await expectManualAddedMargin(trader1, 0, fundingRateTest)
        })

        it("should be full liquidated when losing more than added margin + position margin", async () => {
            await phTT.openLimitPositionAndExpect({
                limitPrice: 5000,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from('10'),
                _trader: trader1,
                _positionManager: fundingRateTest
            })

            await phTT.openMarketPosition({
                    quantity: BigNumber.from('10'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader4.address,
                    instanceTrader: trader4,
                    _positionManager: fundingRateTest,
                }
            );

            // Trader1's margin = price / leverage * quantity = 5000 / 1 * 10 = 50000
            await phTT.expectPositionMargin(fundingRateTest, trader1, 5000)

            await userGateway.connect(trader1).addMargin(fundingRateTest.address, BigNumber.from("1000"))
            // Trader1's margin += 1000 = 50000 + 1000
            await phTT.expectPositionMargin(fundingRateTest, trader1, 6000)
            await expectManualAddedMargin(trader1,1000, fundingRateTest)

            await phTT.dumpPrice({
                toPrice: 4410,
                pumper: tradercp1,
                pumper2: tradercp2,
                positionManager: fundingRateTest
            })

            await fundingRateTest.setMockPrice(BigNumber.from("4410"), BigNumber.from("4410"))

            // full liquidate trader1's position
            await liquidatorGateway.liquidate(fundingRateTest.address, trader1.address)

            // position is clear after fully liquidated
            await phTT.expectPositionMargin(fundingRateTest, trader1, 0)
            await expectManualAddedMargin(trader1,0, fundingRateTest)
        })

        it("should get correct amount of claimable fund when add and remove margin then close position by limit order", async () => {
            await phTT.dumpPrice({
                toPrice: 3900,
                pumper: tradercp1,
                pumper2: tradercp2,
                positionManager: fundingRateTest
            })
            console.log("step 1")
            const balanceOfTrader1BeforeTestcase = await bep20Mintable.balanceOf(trader1.address)
            // STEP 1
            await phTT.openLimitPositionAndExpect({
                limitPrice: 4000,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from('10'),
                _trader: trader1,
                _positionManager: fundingRateTest
            })
            console.log("step 2")
            // STEP 2
            await phTT.openMarketPosition({
                    quantity: BigNumber.from('10'),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: trader2.address,
                    instanceTrader: trader2,
                    _positionManager: fundingRateTest,
                }
            );

            // after market fill, trader1 should have a position created by limit order
            // margin = quantity * price / leverage = 10 * 4000 / 10
            await phTT.expectPositionMargin(positionManager, trader1, 4000, 0)

            console.log("step 3")
            // STEP 3
            await userGateway.connect(trader1).addMargin(fundingRateTest.address, BigNumber.from("2000"))
            // after added margin, trader1 have position with margin = positionMargin + manualMargin = 4000 + 2000 = 6000
            await phTT.expectPositionMargin(fundingRateTest, trader1, 6000, 0)
            // manualMargin = 2000
            await expectManualAddedMargin(trader1,2000, fundingRateTest)

            await phTT.pumpPrice({
                toPrice: 4100,
                pumper: tradercp1,
                pumper2: tradercp2,
                positionManager: fundingRateTest
            })
            // after price pump, trader

            console.log("step 4")
            // STEP 4
            await phTT.openLimitPositionAndExpect({
                limitPrice: 4200,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from('2'),
                _trader: trader2,
                _positionManager: fundingRateTest,
                // can skip check balance cause this is close order, no need to deposit fund
                skipCheckBalance: true
            })
            console.log("step 5")
            // STEP 5
            // reduce position by limit 2/10 at price 4200
            // claimablePnl = (4000 - 4200) * 2 = -400
            // claimableMargin = 2/10 * margin = 2/10 * 6000 = 1200
            const balanceBeforeMarketReverse = await bep20Mintable.balanceOf(trader1.address)
            await phTT.openMarketPosition({
                    quantity: BigNumber.from('2'),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: fundingRateTest,
                }
            );
            const balanceAfterMarketReverse =  await bep20Mintable.balanceOf(trader1.address)
            const claimedQuoteAmount = balanceAfterMarketReverse.sub(balanceBeforeMarketReverse)
            expect(claimedQuoteAmount).eq(800)
            await fundingRateTest.setMockPrice(BigNumber.from("4100"), BigNumber.from("4100"))
            await userGateway.connect(trader1).removeMargin(fundingRateTest.address, BigNumber.from("800"))
            console.log("step 6")
            // STEP 6
            await phTT.openLimitPositionAndExpect({
                limitPrice: 4200,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from('2'),
                _trader: trader1,
                _positionManager: fundingRateTest
            })
            console.log("before open market")
            await phTT.openMarketPosition({
                    quantity: BigNumber.from('2'),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: trader2.address,
                    instanceTrader: trader2,
                    _positionManager: fundingRateTest,
                }
            );
            console.log("step 7")
            // STEP 7
            await userGateway.connect(trader1).closeLimitPosition(fundingRateTest.address, 420000, BigNumber.from("10"))

            await phTT.openMarketPosition({
                    quantity: BigNumber.from('10'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader2.address,
                    instanceTrader: trader2,
                    _positionManager: fundingRateTest,
                }
            );
            console.log("##################################################")
            await userGateway.connect(trader1).claimFund(fundingRateTest.address)

            console.log("##################################################")
            const balanceOfTrader1AfterTestcase = await bep20Mintable.balanceOf(trader1.address)
            const exchangedQuoteAmount = BigNumber.from(balanceOfTrader1AfterTestcase).sub(BigNumber.from(balanceOfTrader1BeforeTestcase))
            console.log("exchangedQuoteAmount", exchangedQuoteAmount.toString())
            expect(exchangedQuoteAmount).eq("-2004")
        })

        it("should get correct amount of claimable fund when add and remove margin then close position by limit order 2", async () => {
            await phTT.dumpPrice({
                toPrice: 3900,
                pumper: tradercp1,
                pumper2: tradercp2,
                positionManager: fundingRateTest
            })

            console.log("step 1")
            const balanceOfTrader1BeforeTestcase = await bep20Mintable.balanceOf(trader1.address)
            // STEP 1
            await phTT.openLimitPositionAndExpect({
                limitPrice: 4000,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from('10'),
                _trader: trader1,
                _positionManager: fundingRateTest
            })
            console.log("step 2")
            // STEP 2
            await phTT.openMarketPosition({
                    quantity: BigNumber.from('10'),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: trader2.address,
                    instanceTrader: trader2,
                    _positionManager: fundingRateTest,
                }
            );
            console.log("step 3")
            // STEP 3
            await userGateway.connect(trader1).addMargin(fundingRateTest.address, BigNumber.from("2000"))
            console.log("step 4")
            // STEP 4
            await phTT.dumpPrice({
                toPrice: 3900,
                pumper: tradercp1,
                pumper2: tradercp2,
                positionManager: fundingRateTest
            })

            console.log("step 5")
            // STEP 5
            await phTT.openLimitPositionAndExpect({
                limitPrice: 3900,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from('5'),
                _trader: trader2,
                _positionManager: fundingRateTest
            })
            console.log("step 6")
            // STEP 6
            await phTT.openMarketPosition({
                    quantity: BigNumber.from('5'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: fundingRateTest,
                }
            );
            console.log("step 7")
            // STEP 7
            await fundingRateTest.setMockPrice(BigNumber.from("3900"), BigNumber.from("3900"))
            await userGateway.connect(trader1).removeMargin(fundingRateTest.address, BigNumber.from("1000"))
            console.log("step 8")
            // STEP 8
            await phTT.pumpPrice({
                toPrice: 4000,
                pumper: tradercp1,
                pumper2: tradercp2,
                positionManager: fundingRateTest
            })
            console.log("step 9")
            // STEP 9
            await phTT.openLimitPositionAndExpect({
                limitPrice: 3900,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from('3'),
                _trader: trader1,
                _positionManager: fundingRateTest,
                // can skip check balance cause this is close order, no need to deposit fund
                skipCheckBalance: true
            })
            console.log("step 10")
            // STEP 10
            await phTT.openMarketPosition({
                    quantity: BigNumber.from('3'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader3.address,
                    instanceTrader: trader3,
                    _positionManager: fundingRateTest,
                }
            );
            console.log("step 11")
            // STEP 11
            await userGateway.connect(trader1).closeLimitPosition(fundingRateTest.address, 370000, BigNumber.from("12"))
            console.log("step 12")
            // STEP 12
            await phTT.openMarketPosition({
                    quantity: BigNumber.from('12'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader4.address,
                    instanceTrader: trader4,
                    _positionManager: fundingRateTest,
                }
            );
            console.log("get claim amount line 782", (await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).toString())
            const balanceOfTrader1BeforeClaimFund = await bep20Mintable.balanceOf(trader1.address)
            console.log("exchanged balance before claimFund", (BigNumber.from(balanceOfTrader1BeforeClaimFund).sub(BigNumber.from(balanceOfTrader1BeforeTestcase))).toString())
            await userGateway.connect(trader1).claimFund(fundingRateTest.address)
            const balanceOfTrader1AfterTestcase = await bep20Mintable.balanceOf(trader1.address)
            const exchangedQuoteAmount = BigNumber.from(balanceOfTrader1AfterTestcase).sub(BigNumber.from(balanceOfTrader1BeforeTestcase))
            console.log("exchangedQuoteAmount", exchangedQuoteAmount.toString())
            expect(exchangedQuoteAmount).eq("3395")
        })

        it("should get correct amount of claimable fund when add and remove margin then close position by limit order 3", async () => {
            await phTT.dumpPrice({
                toPrice: 3700,
                pumper: tradercp1,
                pumper2: tradercp2,
                positionManager: fundingRateTest
            })

            console.log("step 1")
            const balanceOfTrader1BeforeTestcase = await bep20Mintable.balanceOf(trader1.address)
            // STEP 1
            await phTT.openLimitPositionAndExpect({
                limitPrice: 3700,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from('5'),
                _trader: trader4,
                _positionManager: fundingRateTest
            })


            await phTT.openLimitPositionAndExpect({
                limitPrice: 3600,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from('5'),
                _trader: trader4,
                _positionManager: fundingRateTest
            })

            // open market
            await phTT.openMarketPosition({
                    quantity: BigNumber.from('10'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: fundingRateTest,
                }
            );

            await phTT.openLimitPositionAndExpect({
                limitPrice: 3700,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from('5'),
                _trader: trader1,
                _positionManager: fundingRateTest
            })

            await phTT.openMarketPosition({
                    quantity: BigNumber.from('5'),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: trader4.address,
                    instanceTrader: trader4,
                    _positionManager: fundingRateTest,
                }
            );

            await phTT.debugPosition(trader1, fundingRateTest)
            // now position quantity should be -15
            // open notional = 55000
            // margin = 5500

            console.log("step 2")
            // STEP 2
            // close limit 5/15 at the price of 3500
            // should claimable (55000-3500*15)/3 = 833.3 (pnl) + 1833.33 (margin of the position) + 1750 (margin of limit order) = 4416.63
            await phTT.openLimitPositionAndExpect({
                limitPrice: 3500,
                side: SIDE.LONG,
                leverage: 10,
                quantity: BigNumber.from('5'),
                _trader: trader1,
                _positionManager: fundingRateTest,
                // can skip check balance cause this is close order, no need to deposit fund
                skipCheckBalance: true
            })

            await phTT.openMarketPosition({
                    quantity: BigNumber.from('5'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader4.address,
                    instanceTrader: trader4,
                    _positionManager: fundingRateTest,
                }
            );
            await phTT.debugPosition(trader1, fundingRateTest)
            // const [positionData, positionDataWithoutLimit, limitOrders, reduceLimitOrders] = await userGateway.getClaimableAmountParams(fundingRateTest.address, trader1.address)
            // printStruct(positionData)
            // printStruct(positionDataWithoutLimit)
            // printStruct(reduceLimitOrders[0])
            // console.log(positionData.map(elm => elm.toString()), positionDataWithoutLimit, limitOrders, reduceLimitOrders)

            // after this order the trader1's position should have
            // open notional = 36667
            // margin = 3667
            // quantity = -10
            // expect(await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).eq('4416')

            console.log("step 3")
            // STEP 3
            // await userGateway.connect(trader1).addMargin(fundingRateTest.address, BigNumber.from("2000"))

            console.log("step 4")
            // STEP 4
            await userGateway.connect(trader1).closeLimitPosition(fundingRateTest.address, BigNumber.from("350000"), BigNumber.from("2"))

            await phTT.openMarketPosition({
                    quantity: BigNumber.from('2'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader4.address,
                    instanceTrader: trader4,
                    _positionManager: fundingRateTest,
                }
            );
            // after this order
            // trader1's claimable amount should be
            // 4416 + 1/5*3667 + 700 + 333 (pnl) = 5849
            // expect(await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).eq('6182')

            console.log("step 5")
            // STEP 5
            await phTT.openLimitPositionAndExpect({
                limitPrice: 3500,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: BigNumber.from('2'),
                _trader: trader3,
                _positionManager: fundingRateTest
            })

            // close market
            // trader1's should claim able 6182
            // TODO verify debt margin -1466 is it correct?
            await phTT.openMarketPosition({
                    quantity: BigNumber.from('2'),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: fundingRateTest,
                }
            );
            console.log("step 6")
            // expect(await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).eq('4716')// TODO verify??
            // STEP 6
            await fundingRateTest.setMockPrice(BigNumber.from("3500"), BigNumber.from("3500"))
            // await userGateway.connect(trader1).removeMargin(fundingRateTest.address, BigNumber.from("750"))

            console.log("step 7")
            // STEP 7
            await phTT.debugPosition(trader1, fundingRateTest)

            await userGateway.connect(trader1).closeLimitPosition(fundingRateTest.address, BigNumber.from("340000"), BigNumber.from("6"))
            await phTT.openMarketPosition({
                    quantity: BigNumber.from('6'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader3.address,
                    instanceTrader: trader3,
                    _positionManager: fundingRateTest,
                }
            );
            // after this order trader's should receive all the profit + margin
            // = 4716 + (3400*6/10 | margin) + (22001 - 20400 | pnl) = 8357
            // the claimable amount should be 8357

            // expect(await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).eq('8357')
            console.log("before claim fund")
            await userGateway.connect(trader1).claimFund(fundingRateTest.address)
            const balanceOfTrader1AfterTestcase = await bep20Mintable.balanceOf(trader1.address)
            const exchangedQuoteAmount = BigNumber.from(balanceOfTrader1AfterTestcase).sub(BigNumber.from(balanceOfTrader1BeforeTestcase))
            console.log("exchangedQuoteAmount", exchangedQuoteAmount.toString())
            expect(exchangedQuoteAmount).eq("3095")
        })

        it("should get correct claimableAmount when create position by both limit and market order, reduce by market > created market order then close by limit", async () => {
            await phTT.dumpPrice({
                toPrice: 3700,
                pumper: tradercp1,
                pumper2: tradercp2,
                positionManager: fundingRateTest
            })

            console.log("step 1")
            const balanceOfTrader1BeforeTestcase = await bep20Mintable.balanceOf(trader1.address)
            // STEP 1
            await phTT.openLimitPositionAndExpect({
                limitPrice: 3700,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: toWei(10),
                _trader: trader1,
                _positionManager: fundingRateTest
            })

            // open market
            await phTT.openMarketPosition({
                    quantity: toWei(10),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: trader3.address,
                    instanceTrader: trader3,
                    _positionManager: fundingRateTest,
                }
            );
            console.log("first time expect getClaimAmount")
            // claimableAmount = positionMargin = price * quantity / leverage = 3700 * 10 / 10 = 3700
            expect(await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).eq(toWei('3700'))


            await phTT.dumpPrice({
                toPrice: 3600,
                pumper: tradercp1,
                pumper2: tradercp2,
                positionManager: fundingRateTest
            })

            await phTT.openLimitPositionAndExpect({
                limitPrice: 3600,
                side: SIDE.LONG,
                leverage: 10,
                quantity: toWei('5'),
                _trader: trader4,
                _positionManager: fundingRateTest
            })

            await phTT.openMarketPosition({
                    quantity: toWei('5'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: fundingRateTest,
                }
            );
            console.log("second time expect getClaimAmount")
            // claimableAmount += newOrderMargin = 3700 + (price * quantity / leverage) = 3700 + 3600 * 5 / 10 = 5500
            expect(await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).eq(toWei('5500'))

            await phTT.debugPosition(trader1, fundingRateTest)
            // now position quantity should be -15
            // open notional = 55000
            // margin = 5500

            console.log("step 2")
            // STEP 2
            // close limit 1/15 at the price of 3500
            // should claimable (55000-3500*15)/15 = 166.6 (pnl) + 366.66 (margin of the position) + 350 (margin of limit order) = 4416.63
            await phTT.openLimitPositionAndExpect({
                limitPrice: 3500,
                side: SIDE.LONG,
                leverage: 10,
                quantity: toWei('1'),
                _trader: trader1,
                _positionManager: fundingRateTest,
                // can skip check balance cause this is close order, no need to deposit fund
                skipCheckBalance: true
            })

            await phTT.openMarketPosition({
                    quantity: toWei('1'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader4.address,
                    instanceTrader: trader4,
                    _positionManager: fundingRateTest,
                }
            );

            console.log("third time expect getClaimAmount")
            // claimableAmount +=  pnl = 5500 + pnl = 5500 + 166.67 = 5666.6666
            expect(await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).eq(BigNumber.from("5666666600000000000000"))

            await phTT.debugPosition(trader1, fundingRateTest)
            // after this order the trader1's position should have
            // open notional = 51333.33
            // margin = 5133.33
            // quantity = -14
            // expect(await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).eq('4416')

            console.log("step 3")
            // STEP 3
            await userGateway.connect(trader1).addMargin(fundingRateTest.address,toWei("2000"));

            console.log("step 4")
            // STEP 4
            // close limit 2/14 at the price of 3500
            // pnl = (entryPrice - closePrice) * closeQuantity = (3666.67 - 3500) * 2 = 333.34
            await userGateway.connect(trader1).closeLimitPosition(fundingRateTest.address, BigNumber.from("350000"), toWei("2"))

            await phTT.openMarketPosition({
                    quantity: toWei('2'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader4.address,
                    instanceTrader: trader4,
                    _positionManager: fundingRateTest,
                }
            );
            console.log("fourth time expect getClaimAmount")
            // claimableAmount +=  pnl + manualMargin = 5666.6666 + pnl + manual =  5666.6666 + 333.333 + 2000 = 7999.9998
            expect(await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).eq(BigNumber.from("7999999800000000000000"))

            console.log("step 5")
            // STEP 5
            await phTT.openLimitPositionAndExpect({
                limitPrice: 3500,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: toWei('7'),
                _trader: trader3,
                _positionManager: fundingRateTest,
                // can skip check balance cause this is close order, no need to deposit fund
                skipCheckBalance: true
            })

            console.log("debug margin")
            await phTT.debugPosition(trader1, fundingRateTest)
            console.log("position map", (await positionHouse.positionMap(fundingRateTest.address, trader1.address)).toString())
            const balanceBeforeReverseMarket = await bep20Mintable.balanceOf(trader1.address)
            console.log("position map before", (await positionHouse.positionMap(fundingRateTest.address, trader1.address)))
            // close market
            // trader1's should claim able 6182
            await phTT.openMarketPosition({
                    quantity: toWei('6'),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: fundingRateTest,
                }
            );
            console.log("debtPosition", (await positionHouse.debtPosition(fundingRateTest.address, trader1.address)));
            console.log("position map", (await positionHouse.positionMap(fundingRateTest.address, trader1.address)))

            const balanceAfterReverseMarket = await bep20Mintable.balanceOf(trader1.address)
            console.log("exchanged quote after reverse market", balanceAfterReverseMarket.sub(balanceBeforeReverseMarket).toString())
            console.log("--------- claim amount after market")
            console.log("debug margin after")
            await phTT.debugPosition(trader1, fundingRateTest)
            expect(await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).eq(BigNumber.from("4799999790000000000000"))

            console.log("position map after close market", (await positionHouse.positionMap(fundingRateTest.address, trader1.address)).toString())

            console.log("fifth time expect getClaimAmount")
            // claimableAmount = 9050 - pnl - claimedManualMargin -
            // expect(await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).eq(BigNumber.from("5630"))




            console.log("step 6")
            // expect(await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).eq('4716')// TODO verify??
            // STEP 6
            await fundingRateTest.setMockPrice(BigNumber.from("3500"), BigNumber.from("3500"))
            await userGateway.connect(trader1).removeMargin(fundingRateTest.address, BigNumber.from("750"))

            console.log("step 7")
            // STEP 7
            await phTT.debugPosition(trader1, fundingRateTest)

            await userGateway.connect(trader1).closeLimitPosition(fundingRateTest.address, BigNumber.from("340000"), toWei(6))
            await phTT.openMarketPosition({
                    quantity: toWei('6'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader2.address,
                    instanceTrader: trader2,
                    _positionManager: fundingRateTest,
                }
            );
            // after this order trader's should receive all the profit + margin
            // = 4716 + (3400*6/10 | margin) + (22001 - 20400 | pnl) = 8357
            // the claimable amount should be 8357

            // expect(await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).eq('8357')
            console.log("before claim fund")
            await userGateway.connect(trader1).claimFund(fundingRateTest.address)
            const balanceOfTrader1AfterTestcase = await bep20Mintable.balanceOf(trader1.address)
            const exchangedQuoteAmount = BigNumber.from(balanceOfTrader1AfterTestcase).sub(BigNumber.from(balanceOfTrader1BeforeTestcase))
            console.log("exchangedQuoteAmount", exchangedQuoteAmount.toString())
            console.log((await insuranceFund.totalFee()).toString())
            expect(exchangedQuoteAmount).eq(BigNumber.from("3094499500000000000000"))
        })

        it("should get profit after open position by 8 market + 10 limit and close by 9 market + 9 limit", async () => {
            const balanceOfTrader1BeforeTestcase = await bep20Mintable.balanceOf(trader1.address)

            await phTT.openLimitPositionAndExpect({
                limitPrice: 4900,
                side: SIDE.LONG,
                leverage: 10,
                quantity: toWei('2'),
                _trader: trader3,
                _positionManager: fundingRateTest
            })

            await phTT.openLimitPositionAndExpect({
                limitPrice: 4800,
                side: SIDE.LONG,
                leverage: 10,
                quantity: toWei('3'),
                _trader: trader3,
                _positionManager: fundingRateTest
            })

            await phTT.openLimitPositionAndExpect({
                limitPrice: 4700,
                side: SIDE.LONG,
                leverage: 10,
                quantity: toWei('3'),
                _trader: trader3,
                _positionManager: fundingRateTest
            })

            await phTT.openMarketPosition({
                    quantity: toWei('8'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: fundingRateTest,
                }
            );

            await userGateway.connect(trader1).addMargin(fundingRateTest.address, toWei(2000))

            await phTT.dumpPrice({
                toPrice: 4500,
                pumper: tradercp1,
                pumper2: tradercp2,
                positionManager: fundingRateTest
            })

            await phTT.openLimitPositionAndExpect({
                limitPrice: 4600,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: toWei('10'),
                _trader: trader1,
                _positionManager: fundingRateTest
            })

            await phTT.openMarketPosition({
                    quantity: toWei('10'),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: trader2.address,
                    instanceTrader: trader2,
                    _positionManager: fundingRateTest,
                }
            );

            await fundingRateTest.setMockPrice(BigNumber.from("4600"), BigNumber.from("4600"))

            await userGateway.connect(trader1).removeMargin(fundingRateTest.address, toWei("1000"))

            await phTT.dumpPrice({
                toPrice: 4500,
                pumper: tradercp1,
                pumper2: tradercp2,
                positionManager: fundingRateTest
            })

            await phTT.openLimitPositionAndExpect({
                limitPrice: 4500,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: toWei('9'),
                _trader: trader4,
                _positionManager: fundingRateTest
            })

            await phTT.openMarketPosition({
                    quantity: toWei('9'),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: fundingRateTest,
                }
            );

            await phTT.openLimitPositionAndExpect({
                limitPrice: 4500,
                side: SIDE.LONG,
                leverage: 10,
                quantity: toWei('9'),
                _trader: trader1,
                _positionManager: fundingRateTest,
                // can skip check balance cause this is close order, no need to deposit fund
                skipCheckBalance: true
            })

            await phTT.openMarketPosition({
                    quantity: toWei('9'),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader2.address,
                    instanceTrader: trader2,
                    _positionManager: fundingRateTest,
                }
            );

            await userGateway.connect(trader1).claimFund(fundingRateTest.address)
            const balanceOfTrader1AfterTestcase = await bep20Mintable.balanceOf(trader1.address)
            const exchangedQuoteAmount = BigNumber.from(balanceOfTrader1AfterTestcase).sub(BigNumber.from(balanceOfTrader1BeforeTestcase))
            console.log("exchangedQuoteAmount", exchangedQuoteAmount.toString())
            expect(exchangedQuoteAmount).eq(BigNumber.from("3291569700000000000000"))
        })

        it("should get correct claimableAmount when create position by both limit and market, reverse market with quantity > created market then increase by market again", async () => {
            {
                await phTT.dumpPrice({
                    toPrice: 3700,
                    pumper: tradercp1,
                    pumper2: tradercp2,
                    positionManager: fundingRateTest
                })

                console.log("step 1")
                const balanceOfTrader1BeforeTestcase = await bep20Mintable.balanceOf(trader1.address)
                // STEP 1
                await phTT.openLimitPositionAndExpect({
                    limitPrice: 3700,
                    side: SIDE.SHORT,
                    leverage: 10,
                    quantity: toWei(10),
                    _trader: trader1,
                    _positionManager: fundingRateTest
                })

                // open market
                await phTT.openMarketPosition({
                        quantity: toWei(10),
                        leverage: 10,
                        side: SIDE.LONG,
                        trader: trader3.address,
                        instanceTrader: trader3,
                        _positionManager: fundingRateTest,
                    }
                );
                console.log("first time expect getClaimAmount")
                // claimableAmount = positionMargin = price * quantity / leverage = 3700 * 10 / 10 = 3700
                // expect(await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).eq(toWei('3700'))


                await phTT.dumpPrice({
                    toPrice: 3600,
                    pumper: tradercp1,
                    pumper2: tradercp2,
                    positionManager: fundingRateTest
                })

                await phTT.openLimitPositionAndExpect({
                    limitPrice: 3600,
                    side: SIDE.LONG,
                    leverage: 10,
                    quantity: toWei('5'),
                    _trader: trader4,
                    _positionManager: fundingRateTest
                })

                await phTT.openMarketPosition({
                        quantity: toWei('5'),
                        leverage: 10,
                        side: SIDE.SHORT,
                        trader: trader1.address,
                        instanceTrader: trader1,
                        _positionManager: fundingRateTest,
                    }
                );
                console.log("second time expect getClaimAmount")
                // claimableAmount += newOrderMargin = 3700 + (price * quantity / leverage) = 3700 + 3600 * 5 / 10 = 5500
                // expect(await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).eq(toWei('5500'))

                await phTT.debugPosition(trader1, fundingRateTest)
                // now position quantity should be -15
                // open notional = 55000
                // margin = 5500

                console.log("step 2")
                // STEP 2
                // close limit 1/15 at the price of 3500
                // should claimable (55000-3500*15)/15 = 166.6 (pnl) + 366.66 (margin of the position) + 350 (margin of limit order) = 4416.63
                await phTT.openLimitPositionAndExpect({
                    limitPrice: 3500,
                    side: SIDE.LONG,
                    leverage: 10,
                    quantity: toWei('1'),
                    _trader: trader1,
                    _positionManager: fundingRateTest,
                    // can skip check balance cause this is close order, no need to deposit fund
                    skipCheckBalance: true
                })

                await phTT.openMarketPosition({
                        quantity: toWei('1'),
                        leverage: 10,
                        side: SIDE.SHORT,
                        trader: trader4.address,
                        instanceTrader: trader4,
                        _positionManager: fundingRateTest,
                    }
                );

                console.log("third time expect getClaimAmount")
                // claimableAmount += (newOrderMargin + pnl) = 5500 + (price * quantity / leverage + pnl) = 5500 + 3500 * 1 / 10 + 166.67 = 6016.666
                // expect(await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).eq(BigNumber.from("6016666600000000000000"))

                await phTT.debugPosition(trader1, fundingRateTest)
                // after this order the trader1's position should have
                // open notional = 51333.33
                // margin = 5133.33
                // quantity = -14
                // expect(await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).eq('4416')

                console.log("step 3")
                // STEP 3
                // await userGateway.connect(trader1).addMargin(fundingRateTest.address,toWei("2000"));

                console.log("step 4")
                // STEP 4
                // close limit 2/14 at the price of 3500
                // pnl = (entryPrice - closePrice) * closeQuantity = (3666.67 - 3500) * 2 = 333.34
                await userGateway.connect(trader1).closeLimitPosition(fundingRateTest.address, BigNumber.from("350000"), toWei("2"))

                await phTT.openMarketPosition({
                        quantity: toWei('2'),
                        leverage: 10,
                        side: SIDE.SHORT,
                        trader: trader4.address,
                        instanceTrader: trader4,
                        _positionManager: fundingRateTest,
                    }
                );
                console.log("fourth time expect getClaimAmount")
                // claimableAmount += (newOrderMargin + pnl + manualMargin) = 6016.666 + (price * quantity / leverage + pnl + manual) =  6016.666 + 3500 * 2 / 10 + 333.34 + 2000 = 9050
                // expect(await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).eq(BigNumber.from("9050095000000000000000"))

                console.log("step 5")
                // STEP 5
                await phTT.openLimitPositionAndExpect({
                    limitPrice: 3500,
                    side: SIDE.SHORT,
                    leverage: 10,
                    quantity: toWei('6'),
                    _trader: trader2,
                    _positionManager: fundingRateTest
                })

                console.log("debug margin")
                await phTT.debugPosition(trader1, fundingRateTest)
                console.log("position map", (await positionHouse.positionMap(fundingRateTest.address, trader1.address)).toString())
                const balanceBeforeReverseMarket = await bep20Mintable.balanceOf(trader1.address)
                // close market
                // trader1's should claim able 6182
                await phTT.openMarketPosition({
                        quantity: toWei('6'),
                        leverage: 10,
                        side: SIDE.LONG,
                        trader: trader1.address,
                        instanceTrader: trader1,
                        _positionManager: fundingRateTest,
                    }
                );
                const balanceAfterReverseMarket = await bep20Mintable.balanceOf(trader1.address)
                console.log("exchanged quote after reverse market", balanceAfterReverseMarket.sub(balanceBeforeReverseMarket).toString())
                console.log("position map after close market", (await positionHouse.positionMap(fundingRateTest.address, trader1.address)).toString())

                console.log("debug margin after")
                await phTT.debugPosition(trader1, fundingRateTest)

                console.log("fifth time expect getClaimAmount")
                // claimableAmount = 9050 - pnl - claimedManualMargin -
                // expect(await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).eq(BigNumber.from("5630"))




                console.log("step 6")
                // STEP 6
                await fundingRateTest.setMockPrice(BigNumber.from("3500"), BigNumber.from("3500"))
                // await userGateway.connect(trader1).removeMargin(fundingRateTest.address, BigNumber.from("750"))

                console.log("step 6.5")
                await phTT.openLimitPositionAndExpect({
                    limitPrice: 3400,
                    side: SIDE.LONG,
                    leverage: 10,
                    quantity: toWei('3'),
                    _trader: trader2,
                    _positionManager: fundingRateTest,
                    // can skip check balance cause this is close order, no need to deposit fund
                    skipCheckBalance: true
                })

                await phTT.openMarketPosition({
                        quantity: toWei('3'),
                        leverage: 10,
                        side: SIDE.SHORT,
                        trader: trader1.address,
                        instanceTrader: trader1,
                        _positionManager: fundingRateTest,
                    }
                );

                console.log("step 7")
                // STEP 7
                await phTT.debugPosition(trader1, fundingRateTest)

                await userGateway.connect(trader1).closeLimitPosition(fundingRateTest.address, BigNumber.from("340000"), toWei(9))
                await phTT.openMarketPosition({
                        quantity: toWei('9'),
                        leverage: 10,
                        side: SIDE.SHORT,
                        trader: trader2.address,
                        instanceTrader: trader2,
                        _positionManager: fundingRateTest,
                    }
                );

                await userGateway.connect(trader1).claimFund(fundingRateTest.address)
                const balanceOfTrader1AfterTestcase = await bep20Mintable.balanceOf(trader1.address)
                const exchangedQuoteAmount = BigNumber.from(balanceOfTrader1AfterTestcase).sub(BigNumber.from(balanceOfTrader1BeforeTestcase))
                console.log("exchangedQuoteAmount", exchangedQuoteAmount.toString())
                console.log((await insuranceFund.totalFee()).toString())
                expect(exchangedQuoteAmount).eq("3093479200000000000000")
            }
        })

        it("should claim back correct amount when create position by limit order, partial reverse by market then increase by market again", async () => {
            await phTT.dumpPrice({
                toPrice: 3700,
                pumper: tradercp1,
                pumper2: tradercp2,
                positionManager: fundingRateTest
            })
            console.log("STEP 1")
            // STEP 1
            const balanceOfTrader1BeforeTestcase = await bep20Mintable.balanceOf(trader1.address)

            await phTT.openLimitPositionAndExpect({
                limitPrice: 3700,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: toWei(10),
                _trader: trader1,
                _positionManager: fundingRateTest
            })

            // open market
            await phTT.openMarketPosition({
                    quantity: toWei(10),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: trader3.address,
                    instanceTrader: trader3,
                    _positionManager: fundingRateTest,
                }
            );

            await phTT.dumpPrice({
                toPrice: 3600,
                pumper: tradercp1,
                pumper2: tradercp2,
                positionManager: fundingRateTest
            })

            console.log("STEP 2")
            // STEP 2
            await phTT.openLimitPositionAndExpect({
                limitPrice: 3600,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: toWei(5),
                _trader: trader2,
                _positionManager: fundingRateTest
            })

            // open market
            await phTT.openMarketPosition({
                    quantity: toWei(5),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: fundingRateTest,
                }
            );
            console.log("before get claimable amount")
            console.log((await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).toString())
            expect((await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).toString()).eq(toWei(1850))

            console.log("STEP 3")
            // STEP 3
            await phTT.openLimitPositionAndExpect({
                limitPrice: 3500,
                side: SIDE.LONG,
                leverage: 10,
                quantity: toWei(3),
                _trader: trader1,
                _positionManager: fundingRateTest,
                // can skip check balance cause this is close order, no need to deposit fund
                skipCheckBalance: true
            })

            // open market
            await phTT.openMarketPosition({
                    quantity: toWei(3),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader4.address,
                    instanceTrader: trader4,
                    _positionManager: fundingRateTest,
                }
            );
            console.log("before get claimable amount")
            console.log((await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).toString())
            // not included margin of close order so: claimAmount = before - closeOrderMargin = 3500 - 3500*3/10 = 2450
            expect((await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).toString()).eq(toWei(2450))


            console.log("STEP 4")
            // STEP 4
            await phTT.openLimitPositionAndExpect({
                limitPrice: 3500,
                side: SIDE.LONG,
                leverage: 10,
                quantity: toWei(6),
                _trader: trader3,
                _positionManager: fundingRateTest
            })

            // open market
            await phTT.openMarketPosition({
                    quantity: toWei(6),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: fundingRateTest,
                }
            );
            console.log("before get claimable amount")
            console.log((await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).toString())
            expect((await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).toString()).eq(toWei(4550))

            await phTT.dumpPrice({
                toPrice: 3400,
                pumper: tradercp1,
                pumper2: tradercp2,
                positionManager: fundingRateTest
            })


            console.log("STEP 5")
            // STEP 5
            await phTT.openLimitPositionAndExpect({
                limitPrice: 3400,
                side: SIDE.SHORT,
                leverage: 10,
                quantity: toWei(3),
                _trader: trader4,
                _positionManager: fundingRateTest
            })

            // open market
            await phTT.openMarketPosition({
                    quantity: toWei(3),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: trader1.address,
                    instanceTrader: trader1,
                    _positionManager: fundingRateTest,
                }
            );
            console.log("before get claimable amount")
            console.log((await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).toString())
            expect((await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).toString()).eq(toWei(3485))

            console.log("STEP 6")
            // STEP 6
            await userGateway.connect(trader1).closeLimitPosition(fundingRateTest.address, BigNumber.from("340000"), toWei("5"))
            await phTT.openMarketPosition({
                    quantity: toWei(5),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader3.address,
                    instanceTrader: trader3,
                    _positionManager: fundingRateTest,
                }
            );
            console.log("before get claimable amount")
            console.log((await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).toString())
            expect((await userGateway.getClaimAmount(fundingRateTest.address, trader1.address)).toString()).eq(toWei(4235))
            await userGateway.connect(trader1).claimFund(fundingRateTest.address)
            const balanceOfTrader1AfterTestcase = await bep20Mintable.balanceOf(trader1.address)
            const exchangedQuoteAmount = BigNumber.from(balanceOfTrader1AfterTestcase).sub(BigNumber.from(balanceOfTrader1BeforeTestcase))
            console.log("exchangedQuoteAmount", exchangedQuoteAmount.toString())
            expect(exchangedQuoteAmount).eq(BigNumber.from("2294200000000000000000"))
        })
    });


    describe('margin with funding rate', function () {

    });


});


function printStruct(result){
    const keys = Object.keys(result)
    const data = {}
    for(const key of keys){
        if(isNaN(Number(key))){
            data[key] = result[key]._isBigNumber ? result[key].toString() : result[key]
        }
    }
    console.table(data)
}