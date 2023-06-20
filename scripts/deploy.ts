import { task } from "hardhat/config";
import path = require("path");
import {readdir} from "fs/promises";
import {ExecOptions} from "child_process";
import {FutureType, MigrationContext, Network, Stage} from "../deploy/types";
import {ContractWrapperFactory} from "../deploy/ContractWrapperFactory";
import {DeployDataStore} from "../deploy/DataStore";
import {BUSD, BUSD_ADDRESS, POSI, POSI_ADDRESS} from "../constants";
import {TransactionResponse} from "@ethersproject/abstract-provider";
import {verifyContract} from "./utils";
import {readFileSync} from "fs";
import {
    CrossChainGateway, InsuranceFund,
    LiquidatorGateway,
    MarketMakerGateway,
    PositionHouse,
    PositionManager,
    UserGateway
} from "../typeChain";

const DATA_STORE_FILE = {
    'usd-m': './deployData_mainnet.db',
    'coin-m': './deployData_mainnet_coin_m.db',
    'dev': './deployData_future_v2_posi_devnet.db',
    'test': './deployData_future_v2_posi_testnet.db',
    'production': './deployData_future_v2_posi_mainnet.db',
    'prod-futurX': './deployData_futurX_posi_mainnet.db',

}


task('deploy', 'deploy contracts', async (taskArgs: {stage: Stage, task: string, type: FutureType}, hre, runSuper) => {
    const basePath = path.join(__dirname, "../deploy/migrations")
    const filenames = await readdir(basePath)
    let dataStoreFileName
    if (taskArgs.stage == 'production') {
        dataStoreFileName = DATA_STORE_FILE['production']
    } else if (taskArgs.stage == 'test') {
        dataStoreFileName = DATA_STORE_FILE['test']
    } else if (taskArgs.stage == 'dev') {
        dataStoreFileName = DATA_STORE_FILE['dev']
    } else if (taskArgs.stage == 'prod-futurX') {
        dataStoreFileName = DATA_STORE_FILE['prod-futurX']


    }
    // TODO update db file when deploy coin-m
    const db = new DeployDataStore(dataStoreFileName)
    const context: MigrationContext = {
        stage: taskArgs.stage,
        network: hre.network.name as Network,
        factory: new ContractWrapperFactory(db, hre),
        db,
        hre,
        futureType: taskArgs.type
    }

    // if (taskArgs.stage == 'production') {
    //     // save address posi by key
    //     if (taskArgs.type == 'coin-m') {
    //         await db.saveAddressByKey(POSI, POSI_ADDRESS)
    //     }
    //     await db.saveAddressByKey(BUSD, BUSD_ADDRESS)
    // }
    for (const filename of filenames) {
        console.info(`Start migration: ${filename}`)
        const module = await import(path.join(basePath, filename))
        const tasks = module.default.getTasks(context)
        for(const key of Object.keys(tasks)){
            if(!taskArgs.task || taskArgs.task == key){
                console.group(`-- Start run task ${key}`)
                await tasks[key]()
                console.groupEnd()
            }
        }

    }
}).addParam('stage', 'Stage').addOptionalParam('task', 'Task Name').addOptionalParam('type', 'Type of Perpetual Future Contract', 'usd-m')

task('listDeployedContract', 'list all deployed contracts', async (taskArgs: {stage: Stage, type: string}) => {
    let dataStoreFileName;
    if (taskArgs.stage == 'dev') {
        dataStoreFileName = DATA_STORE_FILE['dev']
    } else if (taskArgs.stage == 'test') {
        dataStoreFileName = DATA_STORE_FILE['test']
    } else {
        dataStoreFileName = DATA_STORE_FILE[taskArgs.type || 'usd-m']
    }
    const db = new DeployDataStore(dataStoreFileName)
    const data = await db.listAllContracts()
    for(const obj of data){
        if (obj.address != 'yes') {
            console.log(obj.key, obj.address)
        }
    }
}).addParam('type', 'Type of Perpetual Future Contract', 'usd-m').addOptionalParam('stage', 'Stage')

task('verifyImp', 'Verify all implemented contracts', async (taskArgs: {stage: Stage, type: string}, hre) => {
    const db = new DeployDataStore(DATA_STORE_FILE[taskArgs.type || 'usd-m'])
    const data = await db.listAllContracts()
    for(const obj of data){
        console.log(`Verify ${obj.key}: ${obj.address}`)
        await hre.run('verify', {address: obj.address}).catch(e => {
            console.error(`Verify ${obj.address} Error`, e)
        })
    }
}).addParam('type', 'Type of Perpetual Future Contract', 'usd-m')

task('hotFixPremiumFraction', 'Update new premium fraction', async (taskArgs: {stage: Stage, type: string}, hre) => {
    const db = new DeployDataStore(DATA_STORE_FILE[taskArgs.type || 'usd-m'])
    const positionHouseAddress = await db.findAddressByKey(`PositionHouse`)
    const positionHouse = await hre.ethers.getContractAt('PositionHouse', positionHouseAddress) as any
    const positionManagerAddresses = ['0x25a91e02d37df8d1d47ad92cfcf2b6d1f6528a92', '0x8f887d4b9957b82b2476864d55ecd32a1c3d8c15']
    const arrayTrader = readFileSync('./listTraders.txt', 'utf8').split(/\r?\n/)
    for (const managerAddress of positionManagerAddresses) {
        const tx = await positionHouse.hotFixUpdateFundingRate(managerAddress, arrayTrader)
        await tx.wait()
        console.log("Update new funding rate success")
    }
})

task('setFuturesGateway', 'Set Destination Futures Gateway in LiquidatorGateway and CrossChainGateway', async (taskArgs: {stage: Stage, type: string}, hre) => {
    let dataStoreFileName
    if (taskArgs.stage == "production") {
        dataStoreFileName = DATA_STORE_FILE['production']
    } else if (taskArgs.stage == 'test') {
        dataStoreFileName = DATA_STORE_FILE['test']
    } else if (taskArgs.stage == 'dev') {
        dataStoreFileName = DATA_STORE_FILE['dev']
    }

    const db = new DeployDataStore(dataStoreFileName)

    const liquidatorGatewayAddress = await db.findAddressByKey("LiquidatorGateway")
    const liquidatorGateway = await hre.ethers.getContractAt('LiquidatorGateway', liquidatorGatewayAddress) as LiquidatorGateway

    const crossChainGatewayAddress = await db.findAddressByKey("CrossChainGateway")
    const crossChainGateway = await hre.ethers.getContractAt('CrossChainGateway', crossChainGatewayAddress) as CrossChainGateway

    // TODO add futures gateway address
    const futuresGateway = '0xa85cb4efb7062cf355aecf4c09caf8287d317a8b'
    let res = null;
    try {
        res = []
        res.push(await liquidatorGateway.setDestinationFuturesGateway(futuresGateway))
        res.push(await crossChainGateway.setDestinationFuturesGateway(futuresGateway))
        console.log("success")
    } catch (err) {
        console.log("fail", err)
    }
}).addParam('stage', 'Stage')

task('whitelistRelayer', 'Update whitelist relayer', async (taskArgs: {stage: Stage, type: string}, hre) => {
    let dataStoreFileName
    if (taskArgs.stage == "production") {
        dataStoreFileName = DATA_STORE_FILE['production']
    } else if (taskArgs.stage == 'test') {
        dataStoreFileName = DATA_STORE_FILE['test']
    } else if (taskArgs.stage == 'dev') {
        dataStoreFileName = DATA_STORE_FILE['dev']
    }

    const db = new DeployDataStore(dataStoreFileName)

    const crossChainGatewayAddress = await db.findAddressByKey("CrossChainGateway")
    const crossChainGateway = await hre.ethers.getContractAt('CrossChainGateway', crossChainGatewayAddress) as CrossChainGateway

    // TODO add futures gateway address
    const whitelistRelayerAddress = '0xC7dfdd8b5751a2d5D5b33c42E99A350a6ef7d8Ed'
    let res = null;
    try {
        res = []
        res.push(await crossChainGateway.updateRelayerStatus(whitelistRelayerAddress))
        console.log("success")
    } catch (err) {
        console.log("fail", err)
    }
}).addParam('stage', 'Stage')

task('configNotionalKey', 'Config notional key', async (taskArgs: {stage: Stage, type: string}, hre) => {
    let dataStoreFileName
    if (taskArgs.stage == "production") {
        dataStoreFileName = DATA_STORE_FILE['production']
    } else if (taskArgs.stage == 'test') {
        dataStoreFileName = DATA_STORE_FILE['test']
    } else if (taskArgs.stage == 'dev') {
        dataStoreFileName = DATA_STORE_FILE['dev']
    }

    const db = new DeployDataStore(dataStoreFileName)

    const positionHouseAddress = await db.findAddressByKey("PositionHouse")
    const positionHouse = await hre.ethers.getContractAt('PositionHouse', positionHouseAddress) as PositionHouse

    const managerAddressBTC = '0xdc7c2689fdf2e0ebd8901a193b65cc9a1c98662c'
    const managerAddressBNB = '0xf5dce12d864b9db570a7e55e44c34d7dd7813bab'
    const managerAddressETH = '0x0a01d61ea726c08276bc8c3bc0935005a9661ac2'
    const managerAddressSOL = '0xa5c348fd9af4702076a36cbd6fbd77a4ddce6282'
    let res = null;
    try {
        res = []
        // res.push(await positionHouse.updateConfigNotionalKey(managerAddressBTC, hre.ethers.utils.formatBytes32String('BTC_BUSD')))
        // res.push(await positionHouse.updateConfigNotionalKey(managerAddressBNB, hre.ethers.utils.formatBytes32String('BNB_BUSD')))
        // res.push(await positionHouse.updateConfigNotionalKey(managerAddressETH, hre.ethers.utils.formatBytes32String('ETH_BUSD')))
        // res.push(await positionHouse.updateConfigNotionalKey(managerAddressSOL, hre.ethers.utils.formatBytes32String('SOL_BUSD')))
        console.log("success")
    } catch (err) {
        console.log("fail", err)
    }
}).addParam('stage', 'Stage')

task('addMarketMaker', 'Add market maker', async (taskArgs: {stage: Stage, type: string}, hre) => {
    let dataStoreFileName
    if (taskArgs.stage == "production") {
        dataStoreFileName = DATA_STORE_FILE['production']
    } else if (taskArgs.stage == 'test') {
        dataStoreFileName = DATA_STORE_FILE['test']
    } else if (taskArgs.stage == 'dev') {
        dataStoreFileName = DATA_STORE_FILE['dev']
    }

    // 0xb204a62830a4657aa02C581b41527E525D793083
    // 0x3491EdD6618929d8a13e711d5cf4774ECc0bAFD2
    // 0xE9acdc9a83c2115387004E273d9C9db2D530fE5e
    // 0x60d639d533cC84bc8bA9E1491171C3349be86673
    // 0xBf477b76E434EF68E65b6F034E57caF2a2573690
    // 0xf9c7106Bee1577261b8a55A4D8C0e1C785615620
    // 0xdefC00d08f68Fb1e1A0d2AB78E916cDdEEd20d38
    // 0x4C5892FF1931504f45bf97e89A3751c7857dB46c
    // 0x9EC1B7E47E26eb9a375B448C7B6ac5Ee21B8fAe8
    // 0xFDB11FAE9F5165bBA37e34F84e3f940b3CCfa23C
    // 0x79c97f97dbd41f4BF33Ee8112C0C55Fe1a934f32
    // 0xC79c52561aDc0E9D8387AEAC157765466dE4a114
    // 0x9494d4CEfb1699c51B056570A079106CDfDeAfe3
    // 0xaE20a834390321d8652bd0109c8A10F6D48bEA2E
    // 0x097d8D873a557502e1c6a72E77790Ba62a3D3F54
    const db = new DeployDataStore(dataStoreFileName)

    const marketMakerGateway = await db.findAddressByKey("MarketMakerGateway")
    const marketMaker = await hre.ethers.getContractAt('MarketMakerGateway', marketMakerGateway) as MarketMakerGateway

    let res = null;
    try {
        res = []
        res.push(await marketMaker.setMMWhitelist('0x2d4a08084A7c28B9803d78635195Cc789C7DC368',true))
        console.log("success")
    } catch (err) {
        console.log("fail", err)
    }
}).addParam('stage', 'Stage')

task('updateStepBaseSize', 'Update all step base size', async (taskArgs: {stage: Stage, type: string}, hre) => {
    let dataStoreFileName
    if (taskArgs.stage == "production") {
        dataStoreFileName = DATA_STORE_FILE['production']
    } else if (taskArgs.stage == 'test') {
        dataStoreFileName = DATA_STORE_FILE['test']
    } else if (taskArgs.stage == 'dev') {
        dataStoreFileName = DATA_STORE_FILE['dev']
    }

    const db = new DeployDataStore(dataStoreFileName)

    const positionManager = await hre.ethers.getContractAt('PositionManager', '0xe3517d3412e7c7260eb83801fb1b600a81394a3c') as PositionManager

    // Position Manager BTC_BUSD: 0xdc7c2689fdf2e0ebd8901a193b65cc9a1c98662c
    // Position Manager BNB_BUSD: 0xf5dce12d864b9db570a7e55e44c34d7dd7813bab
    // Position Manager ETH_BUSD: 0x0a01d61ea726c08276bc8c3bc0935005a9661ac2
    // Position Manager SOL_BUSD: 0xa5c348fd9af4702076a36cbd6fbd77a4ddce6282
    // Position Manager DOGE_BUSD: 0x0985522391e9ecb2c51d3e48b694be5c98be5ed4
    // Position Manager LINK_BUSD: 0x4ae63a157415e60b00ae01506dcc59dbde463c30
    // Position Manager MATIC_BUSD: 0x35b5277e3c4e7509e5fec674de8f1f514726befb
    // Position Manager XRP_BUSD: 0x77a46b898f7336d9921969ee15e86a2db44ab510
    // Position Manager ADA_BUSD: 0x7c3a92d5abecfc29b5a22afdc9bc49322e672065
    // Position Manager LTC_BUSD: 0x9e3144e2be4a5b07722c22d7b9b19d93bca22932
    // Position Manager TRX_BUSD: 0x12688bd3f2f08a55c0b2ab49cfbf672026432d40
    // Position Manager AAVE_BUSD: 0x1791113b29deee6c96a353ecde560835647ac967
    // Position Manager DOT_BUSD: 0x81f7de169e808c556a0c7426bdeb9d6d3d5e0f25
    // Position Manager CAKE_BUSD: 0x82b388600c962952efed34d3f671e9ebc9125a72
    // Position Manager UNI_BUSD: 0xe3517d3412e7c7260eb83801fb1b600a81394a3c
    let res = null;
    try {
        res = []
        res.push(await positionManager.updateMaxPercentMarketMarket(50000))
        console.log("success")
    } catch (err) {
        console.log("fail", err)
    }
}).addParam('stage', 'Stage')

task('migrateBonus', 'Migrate all trader busd bonus balance', async (taskArgs: {stage: Stage, type: string}, hre) => {
    let dataStoreFileName
    if (taskArgs.stage == "production") {
        dataStoreFileName = DATA_STORE_FILE['production']
    } else if (taskArgs.stage == 'test') {
        dataStoreFileName = DATA_STORE_FILE['test']
    } else if (taskArgs.stage == 'dev') {
        dataStoreFileName = DATA_STORE_FILE['dev']
    }

    const db = new DeployDataStore(dataStoreFileName)
    const insuranceFundAddress = await db.findAddressByKey("InsuranceFund")
    const insuranceFund = await hre.ethers.getContractAt('InsuranceFund', insuranceFundAddress) as InsuranceFund


})

export default {}
