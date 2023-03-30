import {ethers} from 'hardhat'
import {
    BEP20Mintable,
    CrossChainGateway, DPTPValidator,
    InsuranceFund,
    PositionHouse, PositionHouseConfigurationProxy,
    PositionManager,
    UserGateway, UserGatewayTest
} from "../../typeChain";
import {deployPositionHouse} from "../shared/deploy";
import {BigNumber} from "ethers";
import PositionHouseTestingTool from "../shared/positionHouseTestingTool";
import Web3 from "web3";
import {OpenLimitOrderParam, SIDE, toWei} from "../shared/utilities";
import {expect} from "chai";

describe("CrossChainGateway", () => {
    const web3 = new Web3("http://localhost:8545");

    let deployer: any;
    let trader: any;
    let trader2: any;
    let tradercp: any;
    let tradercp2: any;

    let positionHouse: PositionHouse;
    let positionManager: PositionManager;
    let positionHouseConfiguration: PositionHouseConfigurationProxy;
    let bep20Mintable: BEP20Mintable
    let phTT: PositionHouseTestingTool
    let insuranceFund: InsuranceFund
    let userGateway: UserGatewayTest
    let crossChainGateway: CrossChainGateway;
    let _;
    let dptpValidator: DPTPValidator;

    beforeEach(async () => {
        [deployer, trader, trader2, tradercp, tradercp2] = await ethers.getSigners();
        [
            positionHouse,
            positionManager,
            positionHouseConfiguration,
            _,
            phTT,
            bep20Mintable,
            insuranceFund,
            userGateway,
            crossChainGateway,
            _,
            _,
            _,
            _,
            _,
            dptpValidator,
        ] = await deployPositionHouse() as any

        await bep20Mintable.connect(trader).increaseAllowance(insuranceFund.address, BigNumber.from('100000000000000000000000000'))
        await bep20Mintable.connect(tradercp).increaseAllowance(insuranceFund.address, BigNumber.from('100000000000000000000000000'))
        await bep20Mintable.connect(tradercp2).increaseAllowance(insuranceFund.address, BigNumber.from('100000000000000000000000000'))

        // Reset trader balance
        const traderBalance = await bep20Mintable.balanceOf(trader.getAddress())
        if (traderBalance.gt(BigNumber.from('0'))) {
            await bep20Mintable.connect(trader).burn(traderBalance)
        }

        // Set InsuranceFund BUSD balance
        await bep20Mintable.connect(deployer).transfer(insuranceFund.address, BigNumber.from('10000000000'))

        // Set tradercp BUSD balance
        await bep20Mintable.mint(tradercp.getAddress(), BigNumber.from('100000000000000000000000000'))
        await bep20Mintable.mint(tradercp2.getAddress(), BigNumber.from('100000000000000000000000000'))

        // Set Trader BUSD balance
        await bep20Mintable.mint(trader.getAddress(), BigNumber.from('100000000000000000000000000'))

        await positionHouseConfiguration.updateInitialMarginSlippage(100)

        await crossChainGateway.updateRelayerStatus(deployer.address)

    })

    describe("Open market", async () => {
        it("should open market successful", async () => {

            await phTT.openLimitPositionAndExpect({
                limitPrice: 4700,
                side: SIDE.LONG,
                leverage: 10,
                quantity: toWei('3'),
                _trader: tradercp,
                _positionManager: positionManager
            })

            const destFunctionCall = web3.eth.abi.encodeParameters([{
                type: 'address',
                name: '_positionManager'
            }, {
                type: 'uint8',
                name: '_side'
            }, {
                type: 'uint256',
                name: '_quantity'
            }, {
                type: 'uint16',
                name: '_leverage'
            }, {
                type: 'address',
                name: '_trader'
            }, {
                type: 'uint256',
                name: '_initialMargin'
            }, {
                type: 'uint256',
                name: '_busdBonusAmount'
            }], [positionManager.address, '1', '3000000000000000000', '10', trader.address, toWei('1410'), toWei('0')]);

            const inputs = encodeCrossCallHandlerParams('0', destFunctionCall)

            await crossChainGateway.crossCallHandler(
                BigNumber.from("97"),
                crossChainGateway.address,
                inputs,
                inputs,
                "0x47dc760a25a8fe88fca9b11fe604d79fc1484b164e7e62b3d550a6c679a407a8"
            )

            const currentPip = await positionManager.getCurrentPip()
            expect(currentPip.toString()).eq(BigNumber.from('470000'));

            const position = await userGateway.getPosition(positionManager.address, trader.address)
            expect(position.quantity.toString()).eq(toWei(-3));
            expect(position.margin.toString()).eq(toWei(1410));
        })

        it("should open market with deposit successful", async () => {
            await phTT.openLimitPositionAndExpect({
                limitPrice: 4700,
                side: SIDE.LONG,
                leverage: 10,
                quantity: toWei('3'),
                _trader: tradercp,
                _positionManager: positionManager
            })

            const destFunctionCall = web3.eth.abi.encodeParameters([{
                type: 'address',
                name: '_positionManager'
            }, {
                type: 'uint8',
                name: '_side'
            }, {
                type: 'uint256',
                name: '_quantity'
            }, {
                type: 'uint16',
                name: '_leverage'
            }, {
                type: 'address',
                name: '_trader'
            }, {
                type: 'uint256',
                name: '_initialMargin'
            }, {
                type: 'uint256',
                name: '_busdBonusAmount'
            }], [positionManager.address, '1', '3000000000000000000', '10', trader.address, toWei('1410'), toWei('0')]);

            const inputs = encodeCrossCallHandlerParams('0', destFunctionCall)

            await crossChainGateway.crossCallHandler(
                BigNumber.from("97"),
                crossChainGateway.address,
                inputs,
                inputs,
                "0x47dc760a25a8fe88fca9b11fe604d79fc1484b164e7e62b3d550a6c679a407a8"
            )

            const currentPip = await positionManager.getCurrentPip()
            expect(currentPip.toString()).eq(BigNumber.from('470000'));

            const position = await userGateway.getPosition(positionManager.address, trader.address)
            expect(position.quantity.toString()).eq(toWei(-3));
            expect(position.margin.toString()).eq(toWei(1410));
        })

        it("when already having positions, should not open market on another chain", async () => {
            await phTT.openLimitPositionAndExpect({
                limitPrice: 4700,
                side: SIDE.LONG,
                leverage: 10,
                quantity: toWei('3'),
                _trader: tradercp,
                _positionManager: positionManager
            })

            const destFunctionCall = web3.eth.abi.encodeParameters([{
                type: 'address',
                name: '_positionManager'
            }, {
                type: 'uint8',
                name: '_side'
            }, {
                type: 'uint256',
                name: '_quantity'
            }, {
                type: 'uint16',
                name: '_leverage'
            }, {
                type: 'address',
                name: '_trader'
            }, {
                type: 'uint256',
                name: '_initialMargin'
            }, {
                type: 'uint256',
                name: '_busdBonusAmount'
            }], [positionManager.address, '1', '3000000000000000000', '10', trader.address, toWei('1410'), toWei('0')]);

            const inputs = encodeCrossCallHandlerParams('0', destFunctionCall)

            await crossChainGateway.crossCallHandler(
                BigNumber.from("97"),
                crossChainGateway.address,
                inputs,
                inputs,
                "0x47dc760a25a8fe88fca9b11fe604d79fc1484b164e7e62b3d550a6c679a407a8"
            )

            const currentPip = await positionManager.getCurrentPip()
            expect(currentPip.toString()).eq(BigNumber.from('470000'));

            const position = await userGateway.getPosition(positionManager.address, trader.address)
            expect(position.quantity.toString()).eq(toWei(-3));
            expect(position.margin.toString()).eq(toWei(1410));

            const chainID = await dptpValidator.traderData(trader.address,positionManager.address)
            expect(chainID.toString()).eq('97')

            const anotherInputs = encodeCrossCallHandlerParams('0', destFunctionCall,"0x47dc760a25a8fe88fca9b11fe604d79fc1484b164e7e62b3d550a6c679a407a8")
            expect(crossChainGateway.crossCallHandler(
                BigNumber.from("56"),
                crossChainGateway.address,
                anotherInputs,
                anotherInputs,
                "0x47dc760a25a8fe88fca9b11fe604d79fc1484b164e7e62b3d550a6c679a407a8"
            )).to.be.revertedWith("Cannot have positions on different chains")
        })

        it("when already having positions, should open market on same chain", async () => {
            await phTT.openLimitPositionAndExpect({
                limitPrice: 4700,
                side: SIDE.LONG,
                leverage: 10,
                quantity: toWei('3'),
                _trader: tradercp,
                _positionManager: positionManager
            })

            const destFunctionCall = web3.eth.abi.encodeParameters([{
                type: 'address',
                name: '_positionManager'
            }, {
                type: 'uint8',
                name: '_side'
            }, {
                type: 'uint256',
                name: '_quantity'
            }, {
                type: 'uint16',
                name: '_leverage'
            }, {
                type: 'address',
                name: '_trader'
            }, {
                type: 'uint256',
                name: '_initialMargin'
            }, {
                type: 'uint256',
                name: '_busdBonusAmount'
            }], [positionManager.address, '1', '1000000000000000000', '10', trader.address, toWei('470'), toWei('0')]);

            const inputs = encodeCrossCallHandlerParams('0', destFunctionCall)

            await crossChainGateway.crossCallHandler(
                BigNumber.from("97"),
                crossChainGateway.address,
                inputs,
                inputs,
                "0x47dc760a25a8fe88fca9b11fe604d79fc1484b164e7e62b3d550a6c679a407a8"
            )

            const positionBefore = await userGateway.getPosition(positionManager.address, trader.address)
            expect(positionBefore.quantity.toString()).eq(toWei(-1));
            expect(positionBefore.margin.toString()).eq(toWei(470));

            const chainID = await dptpValidator.traderData(trader.address,positionManager.address)
            expect(chainID.toString()).eq('97')

            const anotherInputs = encodeCrossCallHandlerParams('0', destFunctionCall, "0x47dc760a25a8fe88fca9b11fe604d79fc1484b164e7e62b3d550a6c679a407a8")
            await crossChainGateway.crossCallHandler(
                BigNumber.from("97"),
                crossChainGateway.address,
                anotherInputs,
                anotherInputs,
                "0x47dc760a25a8fe88fca9b11fe604d79fc1484b164e7e62b3d550a6c679a407a8"
            )

            const positionAfter = await userGateway.getPosition(positionManager.address, trader.address)
            expect(positionAfter.quantity.toString()).eq(toWei(-2));
            expect(positionAfter.margin.toString()).eq(toWei(940));
        })
    })

    describe("Open limit", async () => {
        it("should open limit successful", async () => {

            const destFunctionCall = web3.eth.abi.encodeParameters([{
                type: 'address',
                name: '_positionManager'
            }, {
                type: 'uint8',
                name: '_side'
            }, {
                type: 'uint256',
                name: '_uQuantity'
            }, {
                type: 'uint128',
                name: '_pip'
            }, {
                type: 'uint16',
                name: '_leverage'
            }, {
                type: 'address',
                name: '_trader'
            }, {
                type: 'uint256',
                name: '_initialMargin'
            }, {
                type: 'uint256',
                name: '_busdBonusAmount'
            }], [positionManager.address, '0', '4500000000000000000', '330000', '10', trader.address, toWei('1485'), toWei(0)]);

            const inputs = encodeCrossCallHandlerParams('1', destFunctionCall)

            await crossChainGateway.crossCallHandler(
                BigNumber.from("97"),
                crossChainGateway.address,
                inputs,
                inputs,
                "0x47dc760a25a8fe88fca9b11fe604d79fc1484b164e7e62b3d550a6c679a407a8"
            )

            const liquidity = await positionManager.getLiquidityInPip(BigNumber.from('330000'))
            expect(liquidity.toString()).eq(toWei('4.5'));

            const orders = await positionHouse.getLimitOrders(positionManager.address, trader.address)
            expect(orders.length).eq(1)
            expect(orders[0].pip).eq(BigNumber.from('330000'))
            expect(orders[0].isBuy).eq(1)
            expect(orders[0].leverage).eq(10)
        })

        it("when already having orders, should not open limit on another chain", async () => {
            const destFunctionCall = web3.eth.abi.encodeParameters([{
                type: 'address',
                name: '_positionManager'
            }, {
                type: 'uint8',
                name: '_side'
            }, {
                type: 'uint256',
                name: '_uQuantity'
            }, {
                type: 'uint128',
                name: '_pip'
            }, {
                type: 'uint16',
                name: '_leverage'
            }, {
                type: 'address',
                name: '_trader'
            }, {
                type: 'uint256',
                name: '_initialMargin'
            }, {
                type: 'uint256',
                name: '_busdBonusAmount'
            }], [positionManager.address, '0', '4500000000000000000', '330000', '10', trader2.address, toWei('1485'), toWei(0)]);

            const inputs = encodeCrossCallHandlerParams('1', destFunctionCall)

            await crossChainGateway.crossCallHandler(
                BigNumber.from("97"),
                crossChainGateway.address,
                inputs,
                inputs,
                "0x47dc760a25a8fe88fca9b11fe604d79fc1484b164e7e62b3d550a6c679a407a8"
            )

            const chainID = await dptpValidator.traderData(trader2.address,positionManager.address)
            expect(chainID.toString()).eq('97')

            const destFunctionMarketCall = web3.eth.abi.encodeParameters([{
                type: 'address',
                name: '_positionManager'
            }, {
                type: 'uint8',
                name: '_side'
            }, {
                type: 'uint256',
                name: '_uQuantity'
            }, {
                type: 'uint16',
                name: '_leverage'
            }, {
                type: 'address',
                name: '_trader'
            }, {
                type: 'uint256',
                name: '_initialMargin'
            }, {
                type: 'uint256',
                name: '_busdBonusAmount'
            }], [positionManager.address, '0', '4500000000000000000', '10', trader2.address, toWei('1485'), toWei(0)]);


            const anotherInputs = encodeCrossCallHandlerParams('0', destFunctionMarketCall,"0x47dc760a25a8fe88fca9b11fe604d79fc1484b164e7e62b3d550a6c679a407a8")
            await expect(crossChainGateway.crossCallHandler(
                BigNumber.from("56"),
                crossChainGateway.address,
                anotherInputs,
                anotherInputs,
                "0x47dc760a25a8fe88fca9b11fe604d79fc1484b164e7e62b3d550a6c679a407a8"
            )).to.be.revertedWith("Cannot have positions on different chains")
        })
    })

    describe("Cancel limit", async () => {
        it("should cancel limit successful", async () => {
            const openLimitOrderParam : OpenLimitOrderParam = {
                positionManager: positionManager.address,
                trader: trader.address,
                side: 0,
                pip: BigNumber.from('410000'),
                quantity: BigNumber.from(toWei('1.3')),
                leverage: BigNumber.from('10'),
                initialMargin: BigNumber.from(toWei('533')),
                busdBonusAmount: BigNumber.from(toWei('0'))
            }

            await positionHouse.connect(deployer).openLimitOrder(
                openLimitOrderParam
            )

            expect((await positionManager.getLiquidityInPip(BigNumber.from('410000'))).toString()).eq(toWei('1.3'));

            const orders = await userGateway.getListOrderPending(positionManager.address, trader.address);
            const destFunctionCall = web3.eth.abi.encodeParameters([{
                type: 'address',
                name: '_positionManager'
            }, {
                type: 'uint64',
                name: '_orderIdx'
            }, {
                type: 'uint8',
                name: '_isReduce'
            }, {
                type: 'address',
                name: '_trader'
            }], [positionManager.address, orders[0].orderIdx.toString(), orders[0].isReduce.toString(), trader.address]);

            const inputs = encodeCrossCallHandlerParams('2', destFunctionCall)

            await crossChainGateway.crossCallHandler(
                BigNumber.from("97"),
                crossChainGateway.address,
                inputs,
                inputs,
                "0x47dc760a25a8fe88fca9b11fe604d79fc1484b164e7e62b3d550a6c679a407a8"
            )

            expect((await positionManager.getLiquidityInPip(BigNumber.from('410000'))).toString()).eq("0");
        })
    })

    describe("Add margin", async () => {
        it("should add margin successful", async () => {

            await phTT.openLimitPositionAndExpect({
                quantity: toWei(10),
                leverage: 10,
                side: SIDE.LONG,
                limitPrice: 5000,
                _trader: tradercp,
                _positionManager: positionManager
            })
            await phTT.openMarketPosition({
                    quantity: toWei(10),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader.address,
                    instanceTrader: trader,
                    _positionManager: positionManager,
                }
            );
            const position = await userGateway.getPosition(positionManager.address, trader.address)
            expect(position.margin.toString()).eq(toWei(5000))
            expect(position.quantity.toString()).eq(toWei(-10))
            expect(position.leverage).eq(10)
            expect((await userGateway.getAddedMargin(positionManager.address, trader.address)).toString()).eq('0')

            const destFunctionCall = web3.eth.abi.encodeParameters([{
                type: 'address',
                name: '_positionManager'
            }, {
                type: 'uint256',
                name: '_amount'
            }, {
                type: 'uint256',
                name: '_busdBonusAmount'
            }, {
                type: 'address',
                name: '_trader'
            }], [positionManager.address, toWei(3000), toWei(0), trader.address]);

            const inputs = encodeCrossCallHandlerParams('3', destFunctionCall)

            await crossChainGateway.crossCallHandler(
                BigNumber.from("97"),
                crossChainGateway.address,
                inputs,
                inputs,
                "0x47dc760a25a8fe88fca9b11fe604d79fc1484b164e7e62b3d550a6c679a407a8"
            )

            expect((await userGateway.getAddedMargin(positionManager.address, trader.address)).toString()).eq('3000000000000000000000')
        })

        it("should not add margin successful", async () => {

            await phTT.openLimitPositionAndExpect({
                quantity: toWei(10),
                leverage: 10,
                side: SIDE.LONG,
                limitPrice: 5000,
                _trader: tradercp,
                _positionManager: positionManager
            })
            await phTT.openMarketPosition({
                    quantity: toWei(10),
                    leverage: 10,
                    side: SIDE.SHORT,
                    trader: trader.address,
                    instanceTrader: trader,
                    _positionManager: positionManager,
                }
            );
            const position = await userGateway.getPosition(positionManager.address, trader.address)
            expect(position.margin.toString()).eq(toWei(5000))
            expect(position.quantity.toString()).eq(toWei(-10))
            expect(position.leverage).eq(10)
            expect((await userGateway.getAddedMargin(positionManager.address, trader.address)).toString()).eq('0')

            const destFunctionCall = web3.eth.abi.encodeParameters([{
                type: 'address',
                name: '_positionManager'
            }, {
                type: 'uint256',
                name: '_amount'
            }, {
                type: 'uint256',
                name: '_busdBonusAmount'
            }, {
                type: 'address',
                name: '_trader'
            }], [positionManager.address, toWei(100000), toWei(0), trader.address]);

            const inputs = encodeCrossCallHandlerParams('3', destFunctionCall)

            expect(crossChainGateway.crossCallHandler(
                BigNumber.from("97"),
                crossChainGateway.address,
                inputs,
                inputs,
                "0x47dc760a25a8fe88fca9b11fe604d79fc1484b164e7e62b3d550a6c679a407a8"
            )).to.be.revertedWith("Invalid added margin amount")
        })
    })

    describe("Remove margin", async () => {
        it("should remove margin successful", async () => {

            await phTT.openLimitPositionAndExpect({
                quantity: toWei(1.2),
                leverage: 10,
                side: SIDE.SHORT,
                limitPrice: 3000,
                _trader: tradercp,
                _positionManager: positionManager
            })
            await phTT.openMarketPosition({
                    quantity: toWei(1.2),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: trader.address,
                    instanceTrader: trader,
                    _positionManager: positionManager,
                }
            );
            await positionHouse.connect(deployer).addMargin(positionManager.address, BigNumber.from('5000'), BigNumber.from('0'), trader.address)

            // get position without manual margin, access directly to positionHouse
            const position = await positionHouse.getPosition(positionManager.address, trader.address)
            expect(position.margin.toString()).eq(toWei(360))
            expect(position.quantity.toString()).eq(toWei(1.2))
            expect(position.leverage).eq(10)
            expect((await userGateway.getAddedMargin(positionManager.address, trader.address)).toString()).eq('5000')

            const destFunctionCall = web3.eth.abi.encodeParameters([{
                type: 'address',
                name: '_positionManager'
            }, {
                type: 'uint256',
                name: '_amount'
            }, {
                type: 'address',
                name: '_trader'
            }], [positionManager.address, '3000', trader.address]);

            const inputs = encodeCrossCallHandlerParams('4', destFunctionCall)

            await crossChainGateway.crossCallHandler(
                BigNumber.from("97"),
                crossChainGateway.address,
                inputs,
                inputs,
                "0x47dc760a25a8fe88fca9b11fe604d79fc1484b164e7e62b3d550a6c679a407a8"
            )

            expect((await userGateway.getAddedMargin(positionManager.address, trader.address)).toString()).eq('2000')
        })
    })

    describe("Close position", async () => {
        it("should close position successful", async () => {

            await phTT.openLimitPositionAndExpect({
                quantity: toWei(2.3),
                leverage: 10,
                side: SIDE.SHORT,
                limitPrice: 3000,
                _trader: tradercp,
                _positionManager: positionManager
            })
            await phTT.openMarketPosition({
                    quantity: toWei(2.3),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: trader.address,
                    instanceTrader: trader,
                    _positionManager: positionManager,
                }
            );

            const position = await userGateway.getPosition(positionManager.address, trader.address)
            expect(position.margin.toString()).eq(toWei(690))
            expect(position.quantity.toString()).eq(toWei(2.3))

            await phTT.openLimitPositionAndExpect({
                quantity: toWei(5),
                leverage: 10,
                side: SIDE.LONG,
                limitPrice: 3100,
                _trader: tradercp2,
                _positionManager: positionManager
            })

            const destFunctionCall = web3.eth.abi.encodeParameters([{
                type: 'address',
                name: '_positionManager'
            }, {
                type: 'uint256',
                name: '_quantity'
            }, {
                type: 'address',
                name: '_trader'
            }], [positionManager.address, toWei(2.3), trader.address]);

            const inputs = encodeCrossCallHandlerParams('5', destFunctionCall)

            await crossChainGateway.crossCallHandler(
                BigNumber.from("97"),
                crossChainGateway.address,
                inputs,
                inputs,
                "0x47dc760a25a8fe88fca9b11fe604d79fc1484b164e7e62b3d550a6c679a407a8"
            )

            const newPosition = await userGateway.getPosition(positionManager.address, trader.address)
            expect(newPosition.quantity.toString()).eq(toWei(0))
            expect(newPosition.margin.toString()).eq(toWei(0))
            const chainID = await dptpValidator.traderData(trader.address,positionManager.address)
            expect(chainID.toString()).eq('0')
        })
    })

    describe("Instantly close position", async () => {
        it("should instantly close position successful", async () => {

            await phTT.openLimitPositionAndExpect({
                quantity: toWei(2.7),
                leverage: 10,
                side: SIDE.SHORT,
                limitPrice: 3100,
                _trader: tradercp,
                _positionManager: positionManager
            })
            await phTT.openMarketPosition({
                    quantity: toWei(2.7),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: trader.address,
                    instanceTrader: trader,
                    _positionManager: positionManager,
                }
            );

            const position = await userGateway.getPosition(positionManager.address, trader.address)
            expect(position.margin.toString()).eq(toWei(837))
            expect(position.quantity.toString()).eq(toWei(2.7))

            await phTT.openLimitPositionAndExpect({
                quantity: toWei(8),
                leverage: 10,
                side: SIDE.LONG,
                limitPrice: 3200,
                _trader: tradercp2,
                _positionManager: positionManager
            })

            const destFunctionCall = web3.eth.abi.encodeParameters([{
                type: 'address',
                name: '_positionManager'
            }, {
                type: 'uint256',
                name: '_quantity'
            }, {
                type: 'address',
                name: '_trader'
            }], [positionManager.address, toWei('1.2'), trader.address]);

            const inputs = encodeCrossCallHandlerParams('5', destFunctionCall)

            await crossChainGateway.crossCallHandler(
                BigNumber.from("97"),
                crossChainGateway.address,
                inputs,
                inputs,
                "0x47dc760a25a8fe88fca9b11fe604d79fc1484b164e7e62b3d550a6c679a407a8"
            )

            const newPosition = await userGateway.getPosition(positionManager.address, trader.address)
            expect(newPosition.quantity.toString()).eq(toWei(1.5))
            expect(newPosition.margin.toString()).eq(toWei(465))
            const chainID = await dptpValidator.traderData(trader.address,positionManager.address)
            expect(chainID.toString()).eq('0')
        })
    })

    describe("Close limit position", async () => {
        it("should close limit position successful", async () => {

            await phTT.openLimitPositionAndExpect({
                quantity: toWei(1.9),
                leverage: 10,
                side: SIDE.SHORT,
                limitPrice: 3300,
                _trader: tradercp,
                _positionManager: positionManager
            })
            await phTT.openMarketPosition({
                    quantity: toWei(1.9),
                    leverage: 10,
                    side: SIDE.LONG,
                    trader: trader.address,
                    instanceTrader: trader,
                    _positionManager: positionManager,
                }
            );

            const position = await userGateway.getPosition(positionManager.address, trader.address)
            expect(position.margin.toString()).eq(toWei(627))
            expect(position.quantity.toString()).eq(toWei(1.9))

            await phTT.openLimitPositionAndExpect({
                quantity: toWei(12),
                leverage: 10,
                side: SIDE.LONG,
                limitPrice: 3500,
                _trader: tradercp2,
                _positionManager: positionManager
            })

            const destFunctionCall = web3.eth.abi.encodeParameters([{
                type: 'address',
                name: '_positionManager'
            }, {
                type: 'uint128',
                name: '_pip'
            }, {
                type: 'uint256',
                name: '_quantity'
            }, {
                type: 'address',
                name: '_trader'
            }], [positionManager.address, '340000', toWei('1.2'), trader.address]);

            const inputs = encodeCrossCallHandlerParams('7', destFunctionCall)

            await crossChainGateway.crossCallHandler(
                BigNumber.from("97"),
                crossChainGateway.address,
                inputs,
                inputs,
                "0x47dc760a25a8fe88fca9b11fe604d79fc1484b164e7e62b3d550a6c679a407a8"
            )

            const newPosition = await userGateway.getPosition(positionManager.address, trader.address)
            expect(newPosition.quantity.toString()).eq(toWei(0.7))
            expect(newPosition.margin.toString()).eq(toWei(231))
        })
    })

    describe("Claim fund", async () => {
        it("should claim fund successful", async () => {

            await userGateway.connect(tradercp).openLimitOrder(
                positionManager.address,
                BigNumber.from('1'),
                toWei(0.5),
                BigNumber.from('350000'),
                BigNumber.from('10')
            )
            await userGateway.connect(trader).openMarketPosition(
                positionManager.address,
                BigNumber.from('0'),
                toWei(0.5),
                BigNumber.from('10')
            )

            const position = await userGateway.getPosition(positionManager.address, trader.address)
            expect(position.margin.toString()).eq(toWei(175))
            expect(position.quantity.toString()).eq(toWei(0.5))

            await userGateway.connect(trader).openLimitOrder(
                positionManager.address,
                BigNumber.from('1'),
                toWei(0.5),
                BigNumber.from('370000'),
                BigNumber.from('10')
            )
            await userGateway.connect(tradercp2).openMarketPosition(
                positionManager.address,
                BigNumber.from('0'),
                toWei(0.5),
                BigNumber.from('10')
            )
            expect((await userGateway.getClaimAmount(positionManager.address, trader.address)), toWei(275))

            const destFunctionCall = web3.eth.abi.encodeParameters([{
                type: 'address',
                name: '_positionManager'
            }, {
                type: 'address',
                name: '_trader'
            }], [positionManager.address, trader.address]);

            const inputs = encodeCrossCallHandlerParams('8', destFunctionCall)

            await crossChainGateway.crossCallHandler(
                BigNumber.from("97"),
                crossChainGateway.address,
                inputs,
                inputs,
                "0x47dc760a25a8fe88fca9b11fe604d79fc1484b164e7e62b3d550a6c679a407a8"
            )

            const newPosition = await userGateway.getPosition(positionManager.address, trader.address)
            expect(newPosition.quantity.toString()).eq(toWei(0))
            expect(newPosition.margin.toString()).eq(toWei(0))
            expect((await userGateway.getClaimAmount(positionManager.address, trader.address)), toWei(0))
            const chainID = await dptpValidator.traderData(trader.address,positionManager.address)
            expect(chainID.toString()).eq('0')
        })

        it("decode", async () => {
            decodeLimitOrderCancelled()
        })
    })

    function encodeCrossCallHandlerParams(destMethodID: string, destFunctionCall: string, txID: string = undefined): string {
        txID = txID || '0x4a089e0b456621a097fcaef4bf3a439d4e8b5ce4999e6c1382ad5749460d85a0';
        const time = Math.round(Date.now() / 1000).toString();
        const tokenAddress = '0x0000000000000000000000000000000000001001';
        const destChainID = '920000';
        const destContractAddress = '0xcBd10403A63CC46B7cF35c39dc4966349cB416d5';

        return web3.eth.abi.encodeParameters([{
            type: 'bytes32',
            name: '_txId'
        }, {
            type: 'uint256',
            name: '_timestamp'
        }, {
            type: 'address',
            name: '_caller'
        }, {
            type: 'uint256',
            name: '_destBcId'
        }, {
            type: 'address',
            name: '_destContract'
        }, {
            type: 'uint8',
            name: '_destFunctionMethodID'
        }, {
            type: 'bytes',
            name: '_destFunctionCall'
        }], [txID, time, tokenAddress, destChainID, destContractAddress, destMethodID, destFunctionCall]);
    }

    function decode() {
        const result = web3.eth.abi.decodeParameters([{
            type: 'bytes32',
            name: '_txId'
        }, {
            type: 'uint256',
            name: '_timestamp'
        }, {
            type: 'address',
            name: '_caller'
        }, {
            type: 'uint256',
            name: '_destBcId'
        }, {
            type: 'address',
            name: '_destContract'
        },
        {
            type: 'uint8',
            name: '_destFunctionMethodID'
        },
            {
            type: 'bytes',
            name: '_destFunctionCall'
        }], "0xae50ee0521caa020e649a4db4d3c3a0f7c47e698280e446ca2a734b5cab6a05a0000000000000000000000000000000000000000000000000000000063f0439b0000000000000000000000008256f0d3f4bc597c5e76d177deeee973b5c0aa2a00000000000000000000000000000000000000000000000000000000000de2b0000000000000000000000000adf94555e5f2eae345692b8b39f062640e42b06f000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000060000000000000000000000000a1b3e9ca3a0bf63129174e171b9bc880f6a046c100000000000000000000000000000000000000000000000000d529ae9e860000000000000000000000000000d227ed60eee10c535ac2878e0e29c1f8541529fa");

        console.log(JSON.stringify(result))
    }
    function decode2() {
        const result = web3.eth.abi.decodeParameters([{
            type: 'address',
            name: '_pmAddress'
        }, {
            type: 'address',
            name: '_trader'
        }, {
            type: 'uint128',
            name: '_higherPip'
        }, {
            type: 'uint128',
            name: '_lowerPip'
        }, {
            type: 'uint8',
            name: '_option'
        }], "0x0000000000000000000000009087e6269689ec0983d5096ce296c86b333f23c900000000000000000000000027b469268de104f5deec912e66599c6e826336d200000000000000000000000000000000000000000000000000000000000075300000000000000000000000000000000000000000000000000000000000004e200000000000000000000000000000000000000000000000000000000000000000");

        console.log(JSON.stringify(result))
    }
    function decode3() {
        const result = web3.eth.abi.decodeParameters([{
            type: 'bool',
            name: 'isBuy'
        }, {
            type: 'uint256',
            name: 'amount'
        }, {
            type: 'uint128',
            name: 'toPip'
        }, {
            type: 'uint256',
            name: 'passedPipCount'
        }, {
            type: 'uint128',
            name: 'remainingLiquidity'
        }], "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000120a871cc0020000000000000000000000000000000000000000000000000000000000000000233600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");

        console.log(JSON.stringify(result))
    }
    function decodeMarketFilled() {
        const result = web3.eth.abi.decodeParameters([{
            type: 'bool',
            name: 'isBuy'
        }, {
            type: 'uint256',
            name: 'amount'
        }, {
            type: 'uint128',
            name: 'toPip'
        }, {
            type: 'uint256',
            name: 'passedPipCount'
        }, {
            type: 'uint128',
            name: 'remainingLiquidity'
        }
        ], "0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000246b601a8b8aee00000000000000000000000000000000000000000000000000000000000000246df400000000000000000000000000000000000000000000000000000000000004e80000000000000000000000000000000000000000000000000000000000000000");
        console.log(JSON.stringify(result))
    }

    function decodeMarketOrderCreated() {
        const result = web3.eth.abi.decodeParameters([{
            type: 'address',
            name: 'trader'
        }, {
            type: 'bool',
            name: 'isBuy'
        }, {
            type: 'uint256',
            name: 'size'
        }, {
            type: 'uint256',
            name: 'requestId'
        }
        ], "0x0000000000000000000000008a9e355b33a4ed0fd724801377a017805430c7ce00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000246b601a8b8aee000000000000000000000000000000000000000000000000000000000000000297ea");
        console.log(JSON.stringify(result))
    }
    function decodeLimitOrderCancelled() {
        const result = web3.eth.abi.decodeParameters([{
            type: 'bool',
            name: 'isBuy'
        }, {
            type: 'uint64',
            name: 'orderId'
        }, {
            type: 'uint128',
            name: 'pip'
        }, {
            type: 'uint256',
            name: 'remainingSize'
        }, {
            type: 'uint256',
            name: 'requestId'
        }
        ], "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000360000000000000000000000000000000000000000000000000000000000214c9c00000000000000000000000000000000000000000000000005848f17eab200000000000000000000000000000000000000000000000000000000000000b25fa4");
        console.log(JSON.stringify(result))
    }
})