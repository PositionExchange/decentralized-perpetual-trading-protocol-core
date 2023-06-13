import {ethers} from "hardhat";
import {
    BEP20Mintable,
    InsuranceFund,
    PositionHouse,
    PositionHouseConfigurationProxy,
    PositionManager,
    FundingRateTest,
    PositionNotionalConfigProxy,
    PositionStrategyOrder,
    PositionHouseCoinMargin,
    UserGateway,
    MarketMakerGateway,
    AccessController, LiquidatorGateway,
    CrossChainGateway, UserGatewayTest, OrderTracker, DPTPValidator
} from "../../typeChain";
import {BigNumber} from "ethers";
import PositionManagerTestingTool from "./positionManagerTestingTool";
import PositionHouseTestingTool from "./positionHouseTestingTool";
import {toWei} from "./utilities";

export async function deployPositionHouse(isCoinMargin? : boolean){
    const [trader] = await ethers.getSigners();

    // deploy access control address
    let accessControllerFactory = await ethers.getContractFactory("AccessController")
    let accessController = (await accessControllerFactory.deploy()) as unknown as AccessController

    //◥◤◥◤◥◤◥◤◥◤◥◤◥◤◥◤ deploy position math below ◥◤◥◤◥◤◥◤◥◤◥◤◥◤◥◤//
    let USDMarginFactory = await ethers.getContractFactory('USDMargin')
    if (isCoinMargin) {
        USDMarginFactory = await ethers.getContractFactory('CoinMargin')
    }
    let USDMargin = await USDMarginFactory.deploy();

    const PositionMathFactory = await ethers.getContractFactory('PositionMath', {
        libraries: {
            USDMargin: USDMargin.address
        }
    })
    const positionMath = await PositionMathFactory.deploy()
    //◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣ deploy position math above ◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣//


    //◥◤◥◤◥◤◥◤◥◤◥◤◥◤◥◤ deploy adapter library below ◥◤◥◤◥◤◥◤◥◤◥◤◥◤◥◤//
    const PositionManagerAdapterFactory = await ethers.getContractFactory('PositionManagerAdapter', {
        libraries: {
            PositionMath: positionMath.address
        }
    })
    const positionManagerAdapter = (await PositionManagerAdapterFactory.deploy())

    const PositionHouseAdapterFactory = await ethers.getContractFactory('PositionHouseAdapter', {
        libraries: {
            PositionMath: positionMath.address
        }
    })
    const positionHouseAdapter = (await PositionHouseAdapterFactory.deploy())

    const InsuranceFundAdapterFactory = await ethers.getContractFactory('InsuranceFundAdapter')
    const insuranceFundAdapter = (await InsuranceFundAdapterFactory.deploy())

    const AccessControllerAdapterFactory = await ethers.getContractFactory('AccessControllerAdapter')
    const accessControllerAdapter = (await AccessControllerAdapterFactory.deploy())
    //◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣ deploy adapter library above ◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣//

    //◥◤◥◤◥◤◥◤◥◤◥◤◥◤◥◤ deploy notional config and configuration below ◥◤◥◤◥◤◥◤◥◤◥◤◥◤◥◤//
    const PositionNotionalConfigProxyFactory = await ethers.getContractFactory('PositionNotionalConfigProxyTest')
    let positionNotionalConfigProxy = (await PositionNotionalConfigProxyFactory.deploy()) as unknown as PositionNotionalConfigProxy

    const positionHouseConfigurationProxyFactory = await ethers.getContractFactory('PositionHouseConfigurationProxy')
    let positionHouseConfiguration = (await positionHouseConfigurationProxyFactory.deploy()) as unknown as PositionHouseConfigurationProxy
    //◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣ deploy notional config and configuration above ◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣//

    // Deploy mock busd contract
    const bep20MintableFactory = await ethers.getContractFactory('BEP20Mintable')
    let bep20Mintable = (await bep20MintableFactory.deploy('BUSD Mock', 'BUSD')) as unknown as BEP20Mintable

    // Deploy insurance fund contract
    const insuranceFundFactory = await ethers.getContractFactory('InsuranceFund', {
        libraries: {
            AccessControllerAdapter: accessControllerAdapter.address
        }
    })
    let insuranceFund = (await insuranceFundFactory.deploy()) as unknown as InsuranceFund

    let orderTrackerFactory = await ethers.getContractFactory("OrderTracker", {
        libraries: {
            AccessControllerAdapter: accessControllerAdapter.address
        }
    })

    let orderTracker = (await orderTrackerFactory.deploy()) as unknown as OrderTracker

    //◥◤◥◤◥◤◥◤◥◤◥◤◥◤◥◤ deploy position manager below ◥◤◥◤◥◤◥◤◥◤◥◤◥◤◥◤//
    let positionManagerFactory = await ethers.getContractFactory("PositionManagerTest", {
        libraries: {
            PositionMath: positionMath.address,
            AccessControllerAdapter: accessControllerAdapter.address
        }
    })
    let positionManager = (await positionManagerFactory.deploy()) as unknown as PositionManager;

    // Deploy funding rate test contract
    let fundingRateTestFactory = await ethers.getContractFactory("FundingRateTest", {
        libraries: {
            PositionMath: positionMath.address,
            AccessControllerAdapter: accessControllerAdapter.address
        }
    })
    let fundingRateTest = (await fundingRateTestFactory.deploy()) as unknown as FundingRateTest
    //◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣ deploy position manager above ◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣//

    //◥◤◥◤◥◤◥◤◥◤◥◤◥◤◥◤ deploy position house below ◥◤◥◤◥◤◥◤◥◤◥◤◥◤◥◤//
    let PositionHouseFactory = await ethers.getContractFactory("PositionHouse", {
        libraries: {
            PositionManagerAdapter: positionManagerAdapter.address,
            AccessControllerAdapter: accessControllerAdapter.address,
            PositionMath: positionMath.address
        }
    })
    if (isCoinMargin) {
        PositionHouseFactory = await ethers.getContractFactory("PositionHouseCoinMargin", {
            libraries: {
                PositionManagerAdapter: positionManagerAdapter.address,
                AccessControllerAdapter: accessControllerAdapter.address,
                PositionMath: positionMath.address
            }
        })
    }
    let positionHouse
    if (isCoinMargin) {
        positionHouse = (await PositionHouseFactory.deploy()) as unknown as PositionHouseCoinMargin;
    } else {
        positionHouse = (await PositionHouseFactory.deploy()) as unknown as PositionHouse;
    }
    //◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣ deploy position house above ◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣//

    // Deploy position strategy order contract
    let positionStrategyOrderFactory = await ethers.getContractFactory("PositionStrategyOrder",{
        libraries: {
            PositionHouseAdapter: positionHouseAdapter.address,
            AccessControllerAdapter: accessControllerAdapter.address
        }
    })
    let positionStrategyOrder = (await positionStrategyOrderFactory.deploy()) as unknown as PositionStrategyOrder

    // Deploy user gateway contract
    let userGatewayFactory = await ethers.getContractFactory("UserGatewayTest", {
        libraries: {
            PositionManagerAdapter: positionManagerAdapter.address,
            PositionHouseAdapter: positionHouseAdapter.address,
            PositionMath: positionMath.address
        }
    })
    let userGateway = (await userGatewayFactory.deploy()) as unknown as UserGatewayTest

    // Deploy user gateway contract
    let crossChainGatewayFactory = await ethers.getContractFactory("CrossChainGateway")
    let crossChainGateway = (await crossChainGatewayFactory.deploy()) as unknown as CrossChainGateway

    // Deploy market maker gateway contract
    let marketMakerGatewayFactory = await ethers.getContractFactory("MarketMakerGateway")
    let marketMakerGateway = (await marketMakerGatewayFactory.deploy()) as unknown as MarketMakerGateway

    // Deploy liquidator gateway contract
    let liquidatorGatewayFactory = await ethers.getContractFactory("LiquidatorGateway", {
        libraries: {
            PositionManagerAdapter: positionManagerAdapter.address,
            PositionHouseAdapter: positionHouseAdapter.address,
            PositionMath: positionMath.address
        }
    })
    let liquidatorGateway = (await liquidatorGatewayFactory.deploy()) as unknown as LiquidatorGateway

    await insuranceFund.connect(trader).initialize(accessController.address)
    await insuranceFund.connect(trader).setCounterParty(positionHouse.address);

    // Deploy dptp validator contract
    let dptpValidatorFactory = await ethers.getContractFactory("DPTPValidator", {
            libraries: {
                PositionManagerAdapter: positionManagerAdapter.address,
                AccessControllerAdapter: accessControllerAdapter.address
            }
    })
    let dptpValidator = (await dptpValidatorFactory.deploy()) as unknown as DPTPValidator
    await dptpValidator.initialize(positionHouse.address, accessController.address);

    await bep20Mintable.mint(insuranceFund.address, BigNumber.from('10000000000000000000000000000000'));

    (await ethers.getSigners()).forEach(element => {
        bep20Mintable.mint(element.address, BigNumber.from('10000000000000000000000000000000'))
        bep20Mintable.connect(element).approve(insuranceFund.address, BigNumber.from('1000000000000000000000000000000000000'))
    })
    let positionManagerTestingTool = new PositionManagerTestingTool(positionManager)
    let positionHouseTestingTool = new PositionHouseTestingTool(positionHouse, positionManager, userGateway, liquidatorGateway)

    await positionStrategyOrder.initialize(positionHouse.address, accessController.address)

    await accessController.initialize()
    await marketMakerGateway.initialize()
    await positionManager.initialize(BigNumber.from(500000), bep20Mintable.address, ethers.utils.formatBytes32String('BTC'), BigNumber.from(100), BigNumber.from(10000), BigNumber.from(10000), BigNumber.from(2000), BigNumber.from(3600), '0x5741306c21795FdCBb9b265Ea0255F499DFe515C'.toLowerCase());
    await fundingRateTest.initialize(BigNumber.from(500000), bep20Mintable.address, ethers.utils.formatBytes32String('BTC'), BigNumber.from(100), BigNumber.from(10000), BigNumber.from(10000), BigNumber.from(2000), BigNumber.from(3600), '0x5741306c21795FdCBb9b265Ea0255F499DFe515C'.toLowerCase());
    await positionHouseConfiguration.initialize(BigNumber.from(3), BigNumber.from(80), BigNumber.from(3), BigNumber.from(20), BigNumber.from(5))
    await positionHouse.initialize(insuranceFund.address, positionHouseConfiguration.address, positionNotionalConfigProxy.address, accessController.address)
    await userGateway.initialize(positionHouse.address, positionStrategyOrder.address, positionHouseConfiguration.address, insuranceFund.address)
    await liquidatorGateway.initialize(positionHouse.address, positionHouseConfiguration.address, insuranceFund.address, 920000, 97)
    await crossChainGateway.initialize(positionHouse.address, positionStrategyOrder.address, 920000, 97, 86400)
    await orderTracker.initialize(accessController.address,crossChainGateway.address,positionHouse.address )
    await crossChainGateway.setInsuranceFund(insuranceFund.address)
    await crossChainGateway.setDPTPValidator(dptpValidator.address)
    await liquidatorGateway.setDPTPValidator(dptpValidator.address)

    await crossChainGateway.updateDestChainFuturesGateway(97, crossChainGateway.address)
    await crossChainGateway.updateDestChainFuturesGateway(56, crossChainGateway.address)
    // await positionManager.updateInsuranceFundInterface(insuranceFund.address)
    await positionManager.updateAccessControllerInterface(accessController.address)
    await positionManager.updateTollsRatio(10000, 0,10000,0)
    await positionManager.updateOrderTrackerInterface(orderTracker.address)
    await positionManager.updateStepBaseSize(toWei(1))
    // await fundingRateTest.updateInsuranceFundInterface(insuranceFund.address)
    await fundingRateTest.updateAccessControllerInterface(accessController.address)
    await fundingRateTest.updateTollsRatio(10000, 0,10000,0)
    await fundingRateTest.updateOrderTrackerInterface(orderTracker.address)
    await fundingRateTest.updateStepBaseSize(toWei(1))

    await orderTracker.updateAccessControllerInterface(accessController.address)

    if (isCoinMargin) {
        await positionHouse.setContractPrice(positionManager.address, 100);
        await positionHouse.setContractPrice(fundingRateTest.address, 100);
        await insuranceFund.connect(trader).setCounterParty(positionManager.address);
    }

    // await positionHouse.setPositionStrategyOrder(positionStrategyOrder.address)

    await positionHouse.updateConfigNotionalKey(positionManager.address, ethers.utils.formatBytes32String("TEST"))
    await positionHouse.updateConfigNotionalKey(fundingRateTest.address, ethers.utils.formatBytes32String("TEST"))
    await insuranceFund.updateWhitelistManager(positionManager.address, true);
    await insuranceFund.updateWhitelistManager(fundingRateTest.address, true);

    await insuranceFund.updateMaximumBUSDBonusAcceptedPerPosition(toWei(100))

    await accessController.updateValidatedContractStatus(marketMakerGateway.address, true)
    await accessController.updateValidatedContractStatus(userGateway.address, true)
    await accessController.updateValidatedContractStatus(liquidatorGateway.address, true)
    await accessController.updateValidatedContractStatus(positionHouse.address, true)
    await accessController.updateValidatedContractStatus(positionManager.address, true)
    await accessController.updateValidatedContractStatus(fundingRateTest.address, true)
    await accessController.updateValidatedContractStatus(insuranceFund.address, true)
    await accessController.updateValidatedContractStatus(positionStrategyOrder.address, true)
    await accessController.updateValidatedContractStatus(crossChainGateway.address, true)
    await accessController.updateValidatedContractStatus(trader.address, true)
    await accessController.updateValidatedContractStatus(orderTracker.address, true)

    return [
        positionHouse,
        positionManager,
        positionHouseConfiguration,
        positionManagerTestingTool,
        positionHouseTestingTool,
        bep20Mintable,
        insuranceFund,
        userGateway,
        crossChainGateway,
        fundingRateTest,
        positionStrategyOrder,
        marketMakerGateway,
        liquidatorGateway,
        accessController,
        dptpValidator,
        orderTracker
    ]

}
