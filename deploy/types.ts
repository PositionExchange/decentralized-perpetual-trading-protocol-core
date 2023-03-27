import {ContractWrapperFactory} from './ContractWrapperFactory'
import {DeployDataStore} from "./DataStore";
import {HardhatRuntimeEnvironment} from "hardhat/types";

export type MigrationTask = () => Promise<void>

export interface MigrationDefinition {
    configPath?: string
    getTasks: (context: MigrationContext) => {
        [taskName: string]: MigrationTask
    }
}

export type Stage = "production" | "staging" | "test" | "dev"
export type Network = "bsc_testnet" | "bsc_mainnet"
export type FutureType = "usd-m" | "coin-m"

export interface MigrationContext {
    stage: Stage
    network: Network
    // layer: Layer
    // settingsDao: SettingsDao
    // systemMetadataDao: SystemMetadataDao
    // externalContract: ExternalContracts
    // deployConfig: DeployConfig
    factory: ContractWrapperFactory
    db: DeployDataStore
    hre: HardhatRuntimeEnvironment
    futureType: FutureType
}


export interface CreatePositionManagerInput {
    quoteAsset: string;
    initialPrice: number;
    priceFeedKey: string;
    basisPoint: number;
    baseBasisPoint: number;
    tollRatio: number;
    maxLimitFindingWordsIndex?: number;
    maxMarketFindingWordsIndex?: number;
    fundingPeriod: number;
    priceFeed: string;
    quote: string
    leverage?: number
    stepBaseSize?: string
    isCoinM?: boolean
}


export interface ConfigPositionManagerInput {
    initialPrice: number;
    priceFeedKey: string;
    basisPoint: number;
    baseBasisPoint: number;
    tollRatio: number;
    maxLimitFindingWordsIndex: number;
    maxMarketFindingWordsIndex: number;
    fundingPeriod: number;
    quote: string;
    leverage?: number;
    stepBaseSize?: string
}

export interface CreatePositionHouseInput {
    insuranceFund: string,
    positionHouseConfigurationProxy: string
    positionNotionalConfigProxy: string
    accessController: string
    futureType: FutureType
    // feePool: string
}

export interface CreatePositionHouseConfigurationProxyInput {
    maintenanceMarginRatio: number,
    partialLiquidationRatio: number,
    liquidationFeeRatio: number,
    liquidationPenaltyRatio: number,
    initialMarginSlippagePercent: number
}

export interface CreatePositionHouseViewerInput {
    positionHouse: string,
    positionHouseConfigurationProxy: string
}

export interface CreatePositionStrategyOrderInput {
    positionHouse: string,
    accessController: string
}

export interface CreatePriceAggregator {
    liquidityPoolAddress: string,
    decimal: number,
    version: string,
    description: string
    quoteTokenIs1: boolean
}

export interface CreateInsuranceFund {
    accessController: string
}

export interface CreatePositionHouseFunction {

}

export interface CreatePositionMathLibrary {
    futureType: FutureType
}

export interface CreateChainLinkPriceFeed {

}

export interface CreatePositionNotionalConfigProxy {

}

export interface CreateUserGateway {
    positionHouse: string,
    positionStrategyOrder: string,
    positionHouseConfigurationProxy: string,
    insuranceFund: string
}

export interface CreateLiquidatorGateway {
    positionHouse: string,
    positionHouseConfigurationProxy: string,
    insuranceFund: string,
    myBlockchainId: number,
    destBlockchainId: number
}

export interface CreateMarketMakerGateway {

}

export interface CreateCrossChainGateway {
    positionHouse: string,
    positionStrategyOrder: string,
    myBlockchainId: number,
    timeHorizon: number,
    destBlockchainId: number
}
