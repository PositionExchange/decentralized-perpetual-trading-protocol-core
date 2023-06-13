import {
    CreateChainLinkPriceFeed, CreateCrossChainGateway, CreateDptpCrossChainGateway, CreateDptpValidator,
    CreateInsuranceFund, CreateLiquidatorGateway, CreateMarketMakerGateway,
    CreatePositionHouseConfigurationProxyInput,
    CreatePositionHouseFunction,
    CreatePositionHouseInput,
    CreatePositionHouseViewerInput,
    CreatePositionManagerInput, CreatePositionMathLibrary,
    CreatePositionNotionalConfigProxy,
    CreatePositionStrategyOrderInput, CreatePriceAggregator, CreateUserGateway
} from "./types";
import {DeployDataStore} from "./DataStore";
import {verifyContract} from "../scripts/utils";
import {TransactionResponse} from "@ethersproject/abstract-provider";
import {HardhatRuntimeEnvironment} from "hardhat/types";
// @ts-ignore
import {HardhatDefenderUpgrades} from "@openzeppelin/hardhat-defender";
// @ts-ignore
import {
    AccessController, ChainLinkPriceFeed,
    CrossChainGateway, DptpCrossChainGateway, DPTPValidator,
    InsuranceFund, LiquidatorGateway,
    PositionHouse,
    PositionManager,
    ValidatorGateway
} from "../typeChain";
import {BigNumber, ContractTransaction, ethers as ethersE} from "ethers";


export class ContractWrapperFactory {
    defender: HardhatDefenderUpgrades

    constructor(readonly db: DeployDataStore, readonly hre: HardhatRuntimeEnvironment) {
        this.defender = hre.defender
    }

    async updateValidatedStatusInAccessController(contractAddress : string) {
        const accessControllerContractAddress = await this.db.findAddressByKey('AccessController')
        const accessController = await this.hre.ethers.getContractAt('AccessController', accessControllerContractAddress) as AccessController
        const isValidatedContract = await accessController.isGatewayOrCoreContract(contractAddress)
        if (!isValidatedContract) {
            const tx = accessController.updateValidatedContractStatus(contractAddress, true)
            await this.waitTx(tx, "accessController.updateValidatedContractStatus")
        }
    }

    async verifyContractUsingDefender(proposal){
        console.log("Upgrade proposal created at:", proposal.url);
        const receipt = await proposal.txResponse.wait()
        console.log(`Contract address ${receipt.contractAddress}`)
        await verifyContract(this.hre, receipt.contractAddress)
    }

    async verifyImplContract(deployTransaction: TransactionResponse) {
        const {data} = deployTransaction
        const decodedData = this.hre.ethers.utils.defaultAbiCoder.decode(
            ['address', 'address'],
            this.hre.ethers.utils.hexDataSlice(data, 4)
        );
        const implContractAddress = decodedData[1]
        const isVerified = await this.db.findAddressByKey(`${implContractAddress}:verified`)
        console.log("Upgraded to impl contract", implContractAddress)
        if (isVerified) return console.log(`Implement contract already verified`)
        try {
            await verifyContract(this.hre, implContractAddress)
            await this.db.saveAddressByKey(`${implContractAddress}:verified`, 'yes')
        } catch (err) {
            if (err.message == 'Contract source code already verified') {
                await this.db.saveAddressByKey(`${implContractAddress}:verified`, 'yes')
            }
            console.error(`-- verify contract error`, err)
        }
    }

    async verifyProxy(proxyAddress){
        // Ref: https://docs.openzeppelin.com/upgrades-plugins/1.x/api-hardhat-upgrades#verify
        // return this.hre.run('verify', {address: proxyAddress}).catch(e => {
        //     console.error(`Verify ${proxyAddress} Error`, e)
        // })
    }

    async createPositionManager(args: CreatePositionManagerInput) {
        const positionMathContractAddress = await this.db.findAddressByKey(`PositionMath`);
        console.log(`positionHouseMathContractAddress ${positionMathContractAddress}`);

        const insuranceFundContractAddress = await this.db.findAddressByKey(`InsuranceFund`);
        console.log(`insuranceFundContractAddress ${insuranceFundContractAddress}`);

        const insuranceFundAdapterContractAddress = await this.db.findAddressByKey(`InsuranceFundAdapter`);
        console.log(`insuranceFundAdapterContractAddress ${insuranceFundAdapterContractAddress}`);

        const accessControllerAdapterContractAddress = await this.db.findAddressByKey(`AccessControllerAdapter`);
        console.log(`accessControllerAdapterContractAddress ${accessControllerAdapterContractAddress}`);

        const orderTrackerContractAddress = await this.db.findAddressByKey(`OrderTracker`);
        console.log(`orderTrackerContractAddress ${orderTrackerContractAddress}`);

        const symbol = `${args.priceFeedKey}_${args.quote}`;
        const saveKey = `PositionManager:${symbol}`

        const PositionManagerFactory = await this.hre.ethers.getContractFactory("PositionManager", {
            libraries: {
                // InsuranceFundAdapter: insuranceFundAdapterContractAddress,
                AccessControllerAdapter: accessControllerAdapterContractAddress,
                PositionMath: positionMathContractAddress
            }
        })
        let contractAddress = await this.db.findAddressByKey(saveKey);
        console.log("contractAddress", contractAddress)
        if (contractAddress) {
            const upgraded = await this.hre.upgrades.upgradeProxy(contractAddress, PositionManagerFactory, {unsafeAllowLinkedLibraries: true});
            console.log(`Starting verify upgrade Position Manager ${symbol}`)
            await this.verifyImplContract(upgraded.deployTransaction)
            console.log(`Upgrade Position Manager ${symbol}`)

            const positionManager = await this.hre.ethers.getContractAt('PositionManager', contractAddress) as PositionManager
            const currentAccessControllerAddress = await positionManager.accessControllerInterface()
            if (currentAccessControllerAddress === this.hre.ethers.constants.AddressZero) {
                const accessControllerContractAddress = await this.db.findAddressByKey('AccessController')
                const tx = positionManager.updateAccessControllerInterface(accessControllerContractAddress)
                await this.waitTx(tx, "positionManager.updateAccessControllerInterface")
            }

            let tx: Promise<ContractTransaction>;

            // tx = positionManager.updateLeverage(args.leverage)
            // await this.waitTx(tx, "positionManager.updateLeverage")
            //
            // tx = positionManager.updateMaxWordRangeForLimitOrder(args.maxLimitFindingWordsIndex)
            // await this.waitTx(tx, "positionManager.updateMaxWordRangeForLimitOrder")
            //
            // tx = positionManager.updateMaxWordRangeForMarketOrder(args.maxMarketFindingWordsIndex)
            // await this.waitTx(tx, "positionManager.updateMaxWordRangeForMarketOrder")

            // tx = positionManager.initializePip()
            // await this.waitTx(tx, "positionManager.initializePip")

            // tx = positionManager.updateStepBaseSize(BigNumber.from(args.stepBaseSize))
            // await this.waitTx(tx, "positionManager.updateStepBaseSize")

            tx = positionManager.setInsuranceFund(insuranceFundContractAddress)
            await this.waitTx(tx, "positionManager.setInsuranceFund")

            tx = positionManager.setOrderTracker(orderTrackerContractAddress)
            await this.waitTx(tx, "positionManager.setOrderTracker")

        } else {
            const contractArgs = [
                args.initialPrice,
                args.quoteAsset,
                this.hre.ethers.utils.formatBytes32String(args.priceFeedKey),
                args.basisPoint,
                args.baseBasisPoint,
                args.tollRatio,
                args.maxMarketFindingWordsIndex,
                args.fundingPeriod,
                args.priceFeed
            ];

            //@ts-ignore
            const instance = await upgrades.deployProxy(PositionManagerFactory, contractArgs, {unsafeAllowLinkedLibraries: true});
            console.log("wait for deploy")
            await instance.deployed();
            const address = instance.address.toString().toLowerCase();
            console.log(`${symbol} positionManager address : ${address}`)
            await this.db.saveAddressByKey(saveKey, address);
            contractAddress = address;
            await this.verifyProxy(address)
        }
        // Set WhiteList Pair manager to insurance fund
        const insuranceFund = await this.hre.ethers.getContractAt('InsuranceFund', insuranceFundContractAddress) as InsuranceFund
        const isWhitelistManager = await insuranceFund.isWhitelistManager(contractAddress)
        if (!isWhitelistManager) {
            const tx = insuranceFund.updateWhitelistManager(contractAddress, true)
            await this.waitTx(tx, "insuranceFund.updateWhitelistManager")
        }

        // Update isValidatedContract in AccessController
        await this.updateValidatedStatusInAccessController(contractAddress)

        if(args.isCoinM){
            // updateInsuranceFundAddress
            // updateIsRFIToken
        }
    }

    async createPositionHouse(args: CreatePositionHouseInput) {
        console.log(`into create PositionHouse`);
        const positionManagerAdapterContractAddress = await this.db.findAddressByKey(`PositionManagerAdapter`);
        console.log(`positionManagerAdapterContractAddress ${positionManagerAdapterContractAddress}`);

        const positionMathContractAddress = await this.db.findAddressByKey(`PositionMath`);
        console.log(`positionHouseMathContractAddress ${positionMathContractAddress}`);

        const accessControllerAdapterContractAddress = await this.db.findAddressByKey(`AccessControllerAdapter`);
        console.log(`accessControllerAdapterContractAddress ${accessControllerAdapterContractAddress}`);

        let PositionHouseContractFactory = args.futureType == "usd-m" ? "PositionHouse" : "PositionHouseCoinMargin";
        const PositionHouse = await this.hre.ethers.getContractFactory(PositionHouseContractFactory, {
            libraries: {
                PositionManagerAdapter: positionManagerAdapterContractAddress,
                AccessControllerAdapter: accessControllerAdapterContractAddress,
                PositionMath: positionMathContractAddress
            }
        })
        let positionHouseContractAddress = await this.db.findAddressByKey(`PositionHouse`);

        if (positionHouseContractAddress) {
            const upgraded = await this.hre.upgrades.upgradeProxy(positionHouseContractAddress, PositionHouse, {unsafeAllowLinkedLibraries: true});
            console.log(`Starting verify upgrade Position House`)
            await this.verifyImplContract(upgraded.deployTransaction)
            console.log(`Upgrade Position House`)
        } else {
            const contractArgs = [
                args.insuranceFund,
                args.positionHouseConfigurationProxy,
                args.positionNotionalConfigProxy,
                args.accessController
            ];

            //@ts-ignore
            const instance = await upgrades.deployProxy(PositionHouse, contractArgs, {unsafeAllowLinkedLibraries: true});
            console.log("wait for deploy")
            await instance.deployed();

            const address = instance.address.toString().toLowerCase();
            console.log(`PositionHouse address : ${address}`)
            positionHouseContractAddress = address
            await this.db.saveAddressByKey('PositionHouse', address);
            await this.verifyProxy(address)
        }

        // Update isValidatedContract in AccessController
        await this.updateValidatedStatusInAccessController(positionHouseContractAddress)
    }

    async createPositionHouseConfigurationProxy(args: CreatePositionHouseConfigurationProxyInput) {
        console.log(`into create PositionHouseConfigurationProxy`);

        const PositionHouseConfiguration = await this.hre.ethers.getContractFactory("PositionHouseConfigurationProxy")
        const positionHouseConfigurationContractAddress = await this.db.findAddressByKey(`PositionHouseConfigurationProxy`);

        if (positionHouseConfigurationContractAddress) {
            const upgraded = await this.hre.upgrades.upgradeProxy(positionHouseConfigurationContractAddress, PositionHouseConfiguration, {unsafeAllowLinkedLibraries: true});
            console.log(`Starting verify upgrade PositionHouseConfigurationProxy`)
            await this.verifyImplContract(upgraded.deployTransaction)
            console.log(`Upgrade PositionHouseConfigurationProxy`)
        } else {
            const contractArgs = [
                args.maintenanceMarginRatio,
                args.partialLiquidationRatio,
                args.liquidationFeeRatio,
                args.liquidationPenaltyRatio,
                args.initialMarginSlippagePercent
            ];

            //@ts-ignore
            const instance = await upgrades.deployProxy(PositionHouseConfiguration, contractArgs, {unsafeAllowLinkedLibraries: true});
            console.log("wait for deploy")
            await instance.deployed();

            const address = instance.address.toString().toLowerCase();
            console.log(`PositionHouseConfiguration address : ${address}`)
            await this.db.saveAddressByKey('PositionHouseConfigurationProxy', address);
            await this.verifyProxy(address)
        }
    }

    async createPositionStrategyOrder(args: CreatePositionStrategyOrderInput) {
        console.log(`into create PositionStrategyOrder`);

        const positionHouseAdapterContractAddress = await this.db.findAddressByKey(`PositionHouseAdapter`);
        console.log(`positionHouseAdapterContractAddress ${positionHouseAdapterContractAddress}`);

        const accessControllerAdapterContractAddress = await this.db.findAddressByKey(`AccessControllerAdapter`);
        console.log(`accessControllerAdapterContractAddress ${accessControllerAdapterContractAddress}`);

        const PositionStrategyOrder = await this.hre.ethers.getContractFactory("PositionStrategyOrder", {
            libraries: {
                AccessControllerAdapter: accessControllerAdapterContractAddress,
                PositionHouseAdapter: positionHouseAdapterContractAddress
            }
        })
        let positionStrategyOrderAddress = await this.db.findAddressByKey(`PositionStrategyOrder`);

        if (positionStrategyOrderAddress) {
            const upgraded = await this.hre.upgrades.upgradeProxy(positionStrategyOrderAddress, PositionStrategyOrder, {unsafeAllowLinkedLibraries: true});
            console.log(`Starting verify upgrade PositionStrategyOrder`)
            await this.verifyImplContract(upgraded.deployTransaction)
            console.log(`Upgrade PositionStrategyOrder`)
        } else {
            const contractArgs = [
                args.positionHouse,
                args.accessController,
            ];

            //@ts-ignore
            const instance = await upgrades.deployProxy(PositionStrategyOrder, contractArgs, {unsafeAllowLinkedLibraries: true});
            console.log("wait for deploy")
            await instance.deployed();

            const address = instance.address.toString().toLowerCase();
            console.log(`PositionStrategyOrder address : ${address}`)
            positionStrategyOrderAddress = address
            await this.db.saveAddressByKey('PositionStrategyOrder', address);
            await this.verifyProxy(address)
        }
        await this.updateValidatedStatusInAccessController(positionStrategyOrderAddress)
    }

    async createInsuranceFund(args: CreateInsuranceFund) {
        const accessControllerAdapterContractAddress = await this.db.findAddressByKey(`AccessControllerAdapter`);
        console.log(`accessControllerAdapterContractAddress ${accessControllerAdapterContractAddress}`);


        const InsuranceFund = await this.hre.ethers.getContractFactory("InsuranceFund", {
            libraries: {
                AccessControllerAdapter: accessControllerAdapterContractAddress
            }
        });
        let insuranceFundContractAddress = await this.db.findAddressByKey(`InsuranceFund`);
        console.log("insurance fund contract address", insuranceFundContractAddress)
        if (insuranceFundContractAddress) {
            const upgraded = await this.hre.upgrades.upgradeProxy(insuranceFundContractAddress, InsuranceFund, {unsafeAllowLinkedLibraries: true});
            console.log(`Starting verify upgrade InsuranceFund`)
            await this.verifyImplContract(upgraded.deployTransaction)
            console.log(`Upgrade InsuranceFund`)
        } else {
            const contractArgs = [args.accessController];
            const instance = await this.hre.upgrades.deployProxy(InsuranceFund, contractArgs, {unsafeAllowLinkedLibraries: true});
            console.log("wait for deploy insurance fund");
            await instance.deployed();
            const address = instance.address.toString().toLowerCase();
            console.log(`InsuranceFund address : ${address}`)
            await this.db.saveAddressByKey('InsuranceFund', address);
            insuranceFundContractAddress = address
            await this.verifyProxy(address)
        }

        // Update isValidatedContract in AccessController
        await this.updateValidatedStatusInAccessController(insuranceFundContractAddress)
    }

    async createAccessController() {
        const AccessController = await this.hre.ethers.getContractFactory("AccessController");
        const accessControllerContractAddress = await this.db.findAddressByKey(`AccessController`);
        if (accessControllerContractAddress) {
            const upgraded = await this.hre.upgrades.upgradeProxy(accessControllerContractAddress, AccessController, {unsafeAllowLinkedLibraries: true});
            console.log(`Starting verify upgrade AccessController`)
            await this.verifyImplContract(upgraded.deployTransaction)
            console.log(`Upgrade AccessController`)
        } else {
            const contractArgs = [];
            const instance = await this.hre.upgrades.deployProxy(AccessController, contractArgs, {unsafeAllowLinkedLibraries: true});
            console.log("wait for deploy access controller");
            await instance.deployed();
            const address = instance.address.toString().toLowerCase();
            console.log(`AccessController address : ${address}`)
            await this.db.saveAddressByKey('AccessController', address);
            await this.verifyProxy(address)

        }
    }

    async createPositionNotionConfigProxy(args: CreatePositionNotionalConfigProxy) {
        const PositionNotionalConfigProxy = await this.hre.ethers.getContractFactory("PositionNotionalConfigProxy");
        const positionNotionalConfigProxyContractAddress = await this.db.findAddressByKey('PositionNotionalConfigProxy');
        if(positionNotionalConfigProxyContractAddress){
            const upgraded = await this.hre.upgrades.upgradeProxy(positionNotionalConfigProxyContractAddress, PositionNotionalConfigProxy, {unsafeAllowLinkedLibraries: true});
            console.log(`Starting verify upgrade PositionNotionalConfigProxy`)
            await this.verifyImplContract(upgraded.deployTransaction)
            console.log(`Upgrade PositionNotionalConfigProxy`)
        }else{
            const instance = await this.hre.upgrades.deployProxy(PositionNotionalConfigProxy, [], {unsafeAllowLinkedLibraries: true});
            await instance.deployed();
            const address = instance.address.toString().toLowerCase();
            console.log(`PositionNotionConfigProxy address : ${address}`)
            await this.db.saveAddressByKey('PositionNotionalConfigProxy', address);
            await this.verifyProxy(address)
        }
    }

    async createUSDMarginLibrary(args: CreatePositionHouseFunction) {
        const USDMargin = await this.hre.ethers.getContractFactory("USDMargin");

        const deployTx = await USDMargin.deploy();
        await deployTx.deployTransaction.wait(3)
        console.log("wait for deploy USDMargin library");
        await this.db.saveAddressByKey('USDMargin', deployTx.address.toLowerCase());
        // await verifyContract(this.hre, deployTx.address);
    }

    async createCoinMarginLibrary(args: CreatePositionHouseFunction) {
        const CoinMargin = await this.hre.ethers.getContractFactory("CoinMargin");

        const deployTx = await CoinMargin.deploy();
        await deployTx.deployTransaction.wait(3)
        console.log("wait for deploy CoinMargin library");
        await this.db.saveAddressByKey('CoinMargin', deployTx.address.toLowerCase());
        // await verifyContract(this.hre, deployTx.address);
    }

    async createPositionMathLibrary(args: CreatePositionMathLibrary) {
        let mathLibraryAddress
        if (args.futureType == 'coin-m') {
            mathLibraryAddress = await this.db.findAddressByKey('CoinMargin');
        } else {
            mathLibraryAddress = await this.db.findAddressByKey('USDMargin');
        }
        const PositionHouseMath = await this.hre.ethers.getContractFactory("PositionMath", {
            libraries: {
                USDMargin: mathLibraryAddress
            }
        });
        const deployTx = await PositionHouseMath.deploy();
        await deployTx.deployTransaction.wait(3)
        console.log("wait for deploy position house math fund");
        await this.db.saveAddressByKey('PositionMath', deployTx.address.toLowerCase());
        // await verifyContract(this.hre, deployTx.address);
    }

    async createPositionHouseAdapter() {
        const PositionMathAddress = await this.db.findAddressByKey('PositionMath');
        const PositionHouseAdapter = await this.hre.ethers.getContractFactory("PositionHouseAdapter", {
            libraries: {
                PositionMath: PositionMathAddress
            }
        });

        const deployTx = await PositionHouseAdapter.deploy();
        await deployTx.deployTransaction.wait(3)
        console.log("wait for deploy position house adapter");
        await this.db.saveAddressByKey('PositionHouseAdapter', deployTx.address.toLowerCase());
        // await verifyContract(this.hre, deployTx.address);
    }

    async createPositionManagerAdapter() {
        const PositionMathAddress = await this.db.findAddressByKey('PositionMath');
        const PositionManagerAdapter = await this.hre.ethers.getContractFactory("PositionManagerAdapter", {
            libraries: {
                PositionMath: PositionMathAddress
            }
        });

        const deployTx = await PositionManagerAdapter.deploy();
        await deployTx.deployTransaction.wait(3)
        console.log("wait for deploy position manager adapter");
        await this.db.saveAddressByKey('PositionManagerAdapter', deployTx.address.toLowerCase());
        // await verifyContract(this.hre, deployTx.address);
    }

    async createAccessControllerAdapter() {
        const AccessControllerAdapter = await this.hre.ethers.getContractFactory("AccessControllerAdapter");

        const deployTx = await AccessControllerAdapter.deploy();
        await deployTx.deployTransaction.wait(3)
        console.log("wait for deploy access controller adapter");
        await this.db.saveAddressByKey('AccessControllerAdapter', deployTx.address.toLowerCase());
        // await verifyContract(this.hre, deployTx.address);
    }

    async createInsuranceFundAdapter() {
        const InsuranceFundAdapter = await this.hre.ethers.getContractFactory("InsuranceFundAdapter");

        const deployTx = await InsuranceFundAdapter.deploy();
        await deployTx.deployTransaction.wait(3)
        console.log("wait for deploy insurance fund adapter");
        await this.db.saveAddressByKey('InsuranceFundAdapter', deployTx.address.toLowerCase());
        // await verifyContract(this.hre, deployTx.address);
    }

    async createUserGateway(args: CreateUserGateway) {
        const positionManagerAdapterContractAddress = await this.db.findAddressByKey(`PositionManagerAdapter`);
        console.log(`positionManagerAdapterContractAddress ${positionManagerAdapterContractAddress}`);

        const positionMathContractAddress = await this.db.findAddressByKey(`PositionMath`);
        console.log(`positionHouseMathContractAddress ${positionMathContractAddress}`);

        const positionHouseAdapterContractAddress = await this.db.findAddressByKey(`PositionHouseAdapter`);
        console.log(`positionHouseAdapterContractAddress ${positionHouseAdapterContractAddress}`);

        const UserGateway = await this.hre.ethers.getContractFactory("UserGateway", {
            libraries: {
                PositionMath: positionMathContractAddress,
                PositionManagerAdapter: positionManagerAdapterContractAddress,
                PositionHouseAdapter: positionHouseAdapterContractAddress
            }
        });

        let userGatewayContractAddress = await this.db.findAddressByKey(`UserGateway`);
        if (userGatewayContractAddress) {
            const upgraded = await this.hre.upgrades.upgradeProxy(userGatewayContractAddress, UserGateway, {unsafeAllowLinkedLibraries: true});
            console.log(`Starting verify upgrade UserGateway`)
            await this.verifyImplContract(upgraded.deployTransaction)
            console.log(`Upgrade UserGateway`)
        } else {
            const contractArgs = [
                args.positionHouse,
                args.positionStrategyOrder,
                args.positionHouseConfigurationProxy,
                args.insuranceFund
            ];
            const instance = await this.hre.upgrades.deployProxy(UserGateway, contractArgs, {unsafeAllowLinkedLibraries: true});
            console.log("wait for deploy user gateway");
            await instance.deployed();
            const address = instance.address.toString().toLowerCase();
            console.log(`User gateway address : ${address}`)
            userGatewayContractAddress = address
            await this.db.saveAddressByKey('UserGateway', address);
            await this.verifyProxy(address)
        }
        // Update isValidatedContract in AccessController
        await this.updateValidatedStatusInAccessController(userGatewayContractAddress)
    }

    async createLiquidatorGateway(args: CreateLiquidatorGateway) {
        const positionManagerAdapterContractAddress = await this.db.findAddressByKey(`PositionManagerAdapter`);
        console.log(`positionManagerAdapterContractAddress ${positionManagerAdapterContractAddress}`);

        const positionMathContractAddress = await this.db.findAddressByKey(`PositionMath`);
        console.log(`positionHouseMathContractAddress ${positionMathContractAddress}`);

        const positionHouseAdapterContractAddress = await this.db.findAddressByKey(`PositionHouseAdapter`);
        console.log(`positionHouseAdapterContractAddress ${positionHouseAdapterContractAddress}`);

        const LiquidatorGateway = await this.hre.ethers.getContractFactory("LiquidatorGateway", {
            libraries: {
                PositionMath: positionMathContractAddress,
                PositionManagerAdapter: positionManagerAdapterContractAddress,
                PositionHouseAdapter: positionHouseAdapterContractAddress
            }
        });
        let liquidatorGatewayContractAddress = await this.db.findAddressByKey(`LiquidatorGateway`);
        if (liquidatorGatewayContractAddress) {
            const upgraded = await this.hre.upgrades.upgradeProxy(liquidatorGatewayContractAddress, LiquidatorGateway, {unsafeAllowLinkedLibraries: true});
            console.log(`Starting verify upgrade LiquidatorGateway`)
            await this.verifyImplContract(upgraded.deployTransaction)
            console.log(`Upgrade LiquidatorGateway`)
        } else {
            const contractArgs = [
                args.positionHouse,
                args.positionHouseConfigurationProxy,
                args.insuranceFund,
                args.myBlockchainId,
                args.destBlockchainId
            ];
            const instance = await this.hre.upgrades.deployProxy(LiquidatorGateway, contractArgs, {unsafeAllowLinkedLibraries: true});
            console.log("wait for deploy liquidator gateway");
            await instance.deployed();
            const address = instance.address.toString().toLowerCase();
            console.log(`Liquidator gateway address : ${address}`)
            liquidatorGatewayContractAddress = address
            await this.db.saveAddressByKey('LiquidatorGateway', address);
            await this.verifyProxy(address)
        }
        // Update isValidatedContract in AccessController
        await this.updateValidatedStatusInAccessController(liquidatorGatewayContractAddress)
    }

    async createMarketMakerGateway(args: CreateMarketMakerGateway){
        const MarketMakerGateway = await this.hre.ethers.getContractFactory("MarketMakerGateway");
        let marketMakerGatewayContractAddress = await this.db.findAddressByKey(`MarketMakerGateway`);
        if (marketMakerGatewayContractAddress) {
            const upgraded = await this.hre.upgrades.upgradeProxy(marketMakerGatewayContractAddress, MarketMakerGateway, {unsafeAllowLinkedLibraries: true});
            console.log(`Starting verify upgrade MarketMakerGateway`)
            await this.verifyImplContract(upgraded.deployTransaction)
            console.log(`Upgrade MarketMakerGateway`)
        } else {
            const contractArgs = [];
            const instance = await this.hre.upgrades.deployProxy(MarketMakerGateway, contractArgs, {unsafeAllowLinkedLibraries: true});
            console.log("wait for deploy market maker gateway");
            await instance.deployed();
            const address = instance.address.toString().toLowerCase();
            console.log(`Market maker gateway address : ${address}`)
            marketMakerGatewayContractAddress = address
            await this.db.saveAddressByKey('MarketMakerGateway', address);
            await this.verifyProxy(address)
        }
        // Update isValidatedContract in AccessController
        await this.updateValidatedStatusInAccessController(marketMakerGatewayContractAddress)
    }

    async createValidatorCore(args: CreateUserGateway){
        const ValidatorCore = await this.hre.ethers.getContractFactory("ValidatorCore");
        let validatorCoreContractAddress = await this.db.findAddressByKey(`ValidatorCore`);
        if (validatorCoreContractAddress) {
            const upgraded = await this.hre.upgrades.upgradeProxy(validatorCoreContractAddress, ValidatorCore, {unsafeAllowLinkedLibraries: true});
            console.log(`Starting verify upgrade ValidatorCore`)
            await this.verifyImplContract(upgraded.deployTransaction)
            console.log(`Upgrade ValidatorCore`)
        } else {
            const contractArgs = [
                args.positionHouse,
                args.positionStrategyOrder,
                args.positionHouseConfigurationProxy,
                args.insuranceFund
            ]
            const instance = await this.hre.upgrades.deployProxy(ValidatorCore, contractArgs, {unsafeAllowLinkedLibraries: true});
            console.log("wait for deploy validator core");
            await instance.deployed();
            const address = instance.address.toString().toLowerCase();
            console.log(`Validator Core address : ${address}`)
            validatorCoreContractAddress = address
            await this.db.saveAddressByKey('ValidatorCore', address);
            await this.verifyProxy(address)
        }
        // Update isValidatedContract in AccessController
        await this.updateValidatedStatusInAccessController(validatorCoreContractAddress)
    }

    async createValidatorGateway(){
        const ValidatorGateway = await this.hre.ethers.getContractFactory("ValidatorGateway");
        let validatorGatewayAddress = await this.db.findAddressByKey('ValidatorGateway')
        const validatorCoreAddress = await this.db.findAddressByKey('ValidatorCore')
        if (validatorGatewayAddress) {
            const upgraded = await this.hre.upgrades.upgradeProxy(validatorGatewayAddress, ValidatorGateway, {unsafeAllowLinkedLibraries: true});
            console.log(`Starting verify upgrade ValidatorGateway`)
            await this.verifyImplContract(upgraded.deployTransaction)
            console.log(`Upgrade ValidatorGateway`)
        } else {
            // Update isValidatedContract in AccessController
            const contractArgs = [validatorCoreAddress]
            const instance = await this.hre.upgrades.deployProxy(ValidatorGateway, contractArgs, {unsafeAllowLinkedLibraries: true});
            console.log("wait for deploy Validator Gateway");
            await instance.deployed();
            const address = instance.address.toString().toLowerCase();
            console.log(`Validator Gateway address : ${address}`)
            validatorGatewayAddress = address
            await this.db.saveAddressByKey('ValidatorGateway', address);
            await this.verifyProxy(address)
        }
        // Update isValidatedContract in AccessController
        await this.updateValidatedStatusInAccessController(validatorGatewayAddress)
    }

    async createDptpValidator(args: CreateDptpValidator){
        const positionManagerAdapterContractAddress = await this.db.findAddressByKey(`PositionManagerAdapter`);
        console.log(`positionManagerAdapterContractAddress ${positionManagerAdapterContractAddress}`);

        const accessControllerAdapterContractAddress = await this.db.findAddressByKey(`AccessControllerAdapter`);
        console.log(`accessControllerAdapterContractAddress ${accessControllerAdapterContractAddress}`);

        const contractName = "DPTPValidator"
        let dptpValidatorAddress = await this.db.findAddressByKey(contractName)

        let dptpValidatorFactory = await this.hre.ethers.getContractFactory(contractName, {
            libraries: {
                PositionManagerAdapter: positionManagerAdapterContractAddress,
                AccessControllerAdapter: accessControllerAdapterContractAddress
            }
        })

        if (dptpValidatorAddress) {
            const upgraded = await this.hre.upgrades.upgradeProxy(dptpValidatorAddress, dptpValidatorFactory, {unsafeAllowLinkedLibraries: true})
            console.log(`Starting verify upgrade ${contractName}`)
            await this.verifyImplContract(upgraded.deployTransaction)
            console.log(`Upgrade ${contractName}`)
        } else {
            const contractArgs = [
                args.positionHouse,
                args.accessController
            ];

            const instance = await this.hre.upgrades.deployProxy(dptpValidatorFactory, contractArgs, {unsafeAllowLinkedLibraries: true})
            console.log("wait for deploy")
            await instance.deployed()

            const address = instance.address.toString().toLowerCase()
            console.log(`${contractName} : ${address}`)
            dptpValidatorAddress = address
            await this.db.saveAddressByKey(contractName, address)
            await this.verifyProxy(address)
        }
        await this.updateValidatedStatusInAccessController(dptpValidatorAddress)
    }

    async createOrderTracker() {
        const accessControllerAdapterContractAddress = await this.db.findAddressByKey(`AccessControllerAdapter`);
        console.log(`accessControllerAdapterContractAddress ${accessControllerAdapterContractAddress}`);

        let orderTrackerAddress = await this.db.findAddressByKey("OrderTracker")

        let orderTrackerFactory = await this.hre.ethers.getContractFactory("OrderTracker", {
            libraries: {
                AccessControllerAdapter: accessControllerAdapterContractAddress
            }
        })


        if (orderTrackerAddress) {
            console.log(`Starting verify upgrade order tracker`)

            const upgraded = await this.hre.upgrades.upgradeProxy(orderTrackerAddress, orderTrackerFactory, {unsafeAllowLinkedLibraries: true})
            await this.verifyImplContract(upgraded.deployTransaction)
            console.log(`Upgrade Order Tracker`)
        } else {
            console.log("wait for deploy")

            const accessController = await this.db.findAddressByKey("AccessController")
            const crossChainGateway = await this.db.findAddressByKey("DptpCrossChainGateway")
            const positionHouse = await this.db.findAddressByKey("PositionHouse")

            const contractArgs = [
                accessController,
                crossChainGateway,
                positionHouse
            ];

            const instance = await this.hre.upgrades.deployProxy(orderTrackerFactory, contractArgs, {unsafeAllowLinkedLibraries: true})
            console.log("wait for deploy")
            await instance.deployed()

            const address = instance.address.toString().toLowerCase()
            console.log(`Order Tracker : ${address}`)
            orderTrackerAddress = address
            await this.db.saveAddressByKey('OrderTracker', address)
            await this.verifyProxy(address)
        }
        await this.updateValidatedStatusInAccessController(orderTrackerAddress)

    }

    async createChainlinkPriceFeed( args: CreateChainLinkPriceFeed){
        const ChainLinkPriceFeed = await this.hre.ethers.getContractFactory("ChainLinkPriceFeed");
        const chainlinkContractAddress = await this.db.findAddressByKey(`ChainLinkPriceFeed`);
        console.log(chainlinkContractAddress)
        if (chainlinkContractAddress) {
            const upgraded = await this.hre.upgrades.upgradeProxy(chainlinkContractAddress, ChainLinkPriceFeed);
            console.log(`Starting verify upgrade ChainLinkPriceFeed`)
            await this.verifyImplContract(upgraded.deployTransaction)
            console.log(`Upgrade ChainLinkPriceFeed`)

            const chainlink = await this.hre.ethers.getContractAt('ChainLinkPriceFeed', chainlinkContractAddress) as ChainLinkPriceFeed
            await chainlink.updateContributorStatus('0x2EdDd1e3273aDafd43A2734A5E819BE2fdD1302c', true)
        } else {
            const contractArgs = [];
            const instance = await this.hre.upgrades.deployProxy(ChainLinkPriceFeed, contractArgs);
            console.log("wait for deploy chainlink price feed");
            await instance.deployed();
            const address = instance.address.toString().toLowerCase();
            console.log(`Chain link price feed address : ${address}`)
            await this.db.saveAddressByKey('ChainLinkPriceFeed', address);
            await this.verifyProxy(address)
        }
    }

    async createInsuranceReserveFund() {
        const Contract = await this.hre.ethers.getContractFactory('PositionInsuranceReserveFunds')
        const deployTx = await Contract.deploy()
        const contract = await deployTx.deployed()
        console.log(`Deployed PositionInsuranceReserveFunds: ${contract.address}`)
        await verifyContract(this.hre, contract.address)
    }

    async createPriceAggregator() {
        // const Contract = await this.hre.ethers.getContractFactory('PriceAggregator')
        // const deployTx = await Contract.deploy()
        // const contract = await deployTx.deployed()
        // console.log(`Deployed PriceAggregator: ${contract.address}`)
        // await verifyContract(this.hre, contract.address)
    }

    async createCrossChainGateway(args : CreateCrossChainGateway) {
        const CrossChainGateway = await this.hre.ethers.getContractFactory("CrossChainGateway");
        const crosschainGatewayContractAddress = await this.db.findAddressByKey(`CrossChainGateway`);
        if (crosschainGatewayContractAddress) {
            const proposal = await this.hre.upgrades.upgradeProxy(crosschainGatewayContractAddress, CrossChainGateway, {unsafeAllowLinkedLibraries: true});
            await this.verifyImplContract(proposal.deployTransaction)
        } else {
            const contractArgs = [
                args.positionHouse,
                args.positionStrategyOrder,
                args.myBlockchainId,
                args.destBlockchainId,
                args.timeHorizon
            ];
            const instance = await this.hre.upgrades.deployProxy(CrossChainGateway, contractArgs);
            console.log("wait for deploy CrossChainGateway");
            await instance.deployed();
            const address = instance.address.toString().toLowerCase();
            console.log(`CrossChainGateway address : ${address}`)
            await this.db.saveAddressByKey('CrossChainGateway', address);
            await this.verifyProxy(address)
        }
        await this.updateValidatedStatusInAccessController(crosschainGatewayContractAddress)
    }

    async createDptpCrossChainGateway(args : CreateDptpCrossChainGateway) {
        const contractName = 'DptpCrossChainGateway';
        const contractFactory = await this.hre.ethers.getContractFactory(contractName);
        let contractAddress = await this.db.findAddressByKey(contractName);
        if (contractAddress) {
            const proposal = await this.hre.upgrades.upgradeProxy(contractAddress, contractFactory, {
              unsafeAllowLinkedLibraries: true,
              useDeployedImplementation: false,
            });
            console.log(`Starting verify upgrade ${contractName}`, proposal.deployTransaction)
            await this.verifyImplContract(proposal.deployTransaction)
        } else {
            const contractArgs = [
                args.myBlockchainId,
                args.timeHorizon,
                args.positionHouse,
                args.positionHouse,
                args.positionStrategyOrder,
            ];
            const instance = await this.hre.upgrades.deployProxy(contractFactory, contractArgs);
            console.log(`wait for deploy ${contractName}`);
            await instance.deployed();
            contractAddress = instance.address.toString();
            console.log(`${contractName} address : ${contractAddress}`)
            await this.db.saveAddressByKey(`${contractName}`, contractAddress);
            await this.verifyProxy(contractAddress)
            await this.updateValidatedStatusInAccessController(contractAddress)
            const contract = await this.hre.ethers.getContractAt(contractName, contractAddress) as DptpCrossChainGateway

            if (args.whitelistRelayers && args.whitelistRelayers.length > 0) {
                for (let i = 0; i < args.whitelistRelayers.length; i++) {
                    await contract.setRelayer(args.whitelistRelayers[i].chainId, args.whitelistRelayers[i].address, true);
                }
            }

            if (args.destChainFuturesGateways && args.destChainFuturesGateways.length > 0) {
                for (let i = 0; i < args.destChainFuturesGateways.length; i++) {
                    await contract.addDestChainFuturesGateway(args.destChainFuturesGateways[i].chainId, args.destChainFuturesGateways[i].address);
                }
            }
        }
    }

    async waitTx(tx: Promise<ethersE.ContractTransaction>, name = '', skipOnFail = false): Promise<ethersE.ContractReceipt> {
        // name match initialize, auto skipping
        if(name.match(/initialize/i) && !skipOnFail){
            skipOnFail = true;
        }
        try{
            console.log(`Waiting for tx ${name}...`)
            const txResponse = await tx
            console.log(`Tx ${name} hash ${txResponse.hash}`)
            const receipt = await txResponse.wait()
            console.log(`Tx [${name}] tx ${txResponse.hash} mined at block ${receipt.blockNumber}`)
            return receipt

        }catch(err){
            console.log(`Tx ${name} failed with the following error:`)
            if(skipOnFail){
                console.error(`-- tx ${name} failed, skipping...`, err)
                return null
            }

            // prompt to ask for continue

            const prompt = require('prompt-sync')();
            console.log(`-- tx ${name} failed, error:`, err.message)
            const continueDeploy = prompt(`Tx ${name} failed, continue? [y/n]`);
            if(continueDeploy == 'y'){
                return null
            }else{
                throw err
            }
        }
    }

    async getDeployedContract<T>(contractId: string, contractName?: string): Promise<T> {
        if(!contractName){
            contractName = contractId
        }
        const address = await this.db.findAddressByKey(contractId)
        console.log(`ID: ${contractId} Address: ${address}`)
        if (!address) throw new Error(`Contract ${contractId} not found`)
        const contract = await this.hre.ethers.getContractAt(contractName, address)
        return contract as unknown as T;
    }
}
