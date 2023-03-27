import {BigNumber, BigNumberish, ContractFactory, Signer, Wallet} from 'ethers'
import {ethers, waffle} from 'hardhat'
import {expect} from 'chai'
import {
    PositionManager,
    PositionHouse,
    InsuranceFund,
    BEP20Mintable,
    PositionHouseConfigurationProxy,
    FundingRateTest,
    UserGateway,
    ValidatorGateway,
    PositionStrategyOrder,
    AccessController,
    UserGatewayTest,
    ValidatorCore
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
    let validatorGateway: ValidatorGateway
    let validatorCore: ValidatorCore
    let positionStrategyOrder: PositionStrategyOrder
    let accessController: AccessController
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
            positionStrategyOrder,
            _,
            _,
            accessController
        ] = await deployPositionHouse() as any

        await positionHouseConfigurationProxy.updateInitialMarginSlippage(100)

        const ValidatorCoreFactory = await ethers.getContractFactory('ValidatorCore')
        validatorCore = (await ValidatorCoreFactory.deploy()) as unknown as ValidatorCore
        await validatorCore.initialize(positionHouse.address, positionStrategyOrder.address, positionHouseConfigurationProxy.address, insuranceFund.address)
        await accessController.updateValidatedContractStatus(validatorCore.address, true)

        const ValidatorGatewayFactory = await ethers.getContractFactory('ValidatorGateway')
        validatorGateway = (await ValidatorGatewayFactory.deploy()) as unknown as ValidatorGateway
        await validatorGateway.initialize(validatorCore.address)
        await accessController.updateValidatedContractStatus(validatorGateway.address, true)
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

    describe("Verify validator gateway", async () => {
        // it("should be reverted by error 22", async () => {
        //     await openLimitPositionAndExpect({
        //         limitPrice: 5000,
        //         side: SIDE.SHORT,
        //         leverage: 10,
        //         quantity: toWei(2),
        //         _trader: trader1
        //     })
        //
        //     // @ts-ignore
        //     await expect(validatorGateway.connect(trader1).openLimitOrder(positionManager.address, 0, toWei(1), 510000, 10, toWei(510), toWei(0), trader1.address)).to.be.revertedWith("22.2")
        // })
        //
        // it("should be reverted by error 11", async () => {
        //     // @ts-ignore
        //     await expect(validatorGateway.connect(trader1).openMarketOrder(positionManager.address, 0, toWei(1), 10, toWei(510), toWei(0), trader1.address)).to.be.revertedWith("11")
        // })
        //
        // it("should success but not change any storage", async () => {
        //     // @ts-ignore
        //     await validatorGateway.connect(trader1).openLimitOrder(positionManager.address, 0, toWei(1), 510000, 10, toWei(510), toWei(0), trader1.address)
        //
        //     const trader1PendingOrders = await userGateway.getListOrderPending(positionManager.address, trader1.address)
        //     await expect(trader1PendingOrders.length).eq(0)
        // })
    })
})