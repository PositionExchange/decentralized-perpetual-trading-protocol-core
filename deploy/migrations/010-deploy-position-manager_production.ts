import {MigrationContext, MigrationDefinition} from "../types";
import {ContractWrapperFactory} from "../ContractWrapperFactory";
import {
    AAVEBUSD,
    ADABUSD,
    BNBBUSD,
    BTCBUSD, CAKEBUSD,
    DOGEBUSD, DOTBUSD,
    ETHBUSD,
    LINKBUSD, LTCBUSD,
    MATICBUSD,
    SOLBUSD, TRXBUSD, UNIBUSD,
    XRPBUSD
} from "../config_production";
import {BUSD, POSI} from "../../constants";

const migrations: MigrationDefinition = {


    getTasks: (context: MigrationContext) => {


        if(context.stage != 'production') return {}

        return {
            'deploy BTCBUSD position manager production': async () => {

                const positionHouseFunctionContractAddress = await context.db.findAddressByKey('PositionHouse');
                const chainLinkPriceFeedContractAddress = await context.db.findAddressByKey('ChainLinkPriceFeed')
                await context.factory.createPositionManager({
                    quoteAsset: await context.db.getMockContract(`BUSD`),
                    initialPrice: BTCBUSD.initialPrice,
                    priceFeedKey: BTCBUSD.priceFeedKey,
                    basisPoint: BTCBUSD.basisPoint,
                    baseBasisPoint: BTCBUSD.baseBasisPoint,
                    tollRatio: BTCBUSD.tollRatio,
                    maxMarketFindingWordsIndex: BTCBUSD.maxMarketFindingWordsIndex,
                    maxLimitFindingWordsIndex: BTCBUSD.maxLimitFindingWordsIndex,
                    fundingPeriod: BTCBUSD.fundingPeriod,
                    priceFeed: chainLinkPriceFeedContractAddress,
                    quote: BUSD,
                    leverage: BTCBUSD.leverage,
                    stepBaseSize: BTCBUSD.stepBaseSize
                })
            },

            'deploy BNBBUSD position manager production': async () => {
                const positionHouseFunctionContractAddress = await context.db.findAddressByKey('PositionHouse');
                const chainLinkPriceFeedContractAddress = await context.db.findAddressByKey('ChainLinkPriceFeed')
                await context.factory.createPositionManager({
                    quoteAsset: await context.db.getMockContract(`BUSD`),
                    initialPrice: BNBBUSD.initialPrice,
                    priceFeedKey: BNBBUSD.priceFeedKey,
                    basisPoint: BNBBUSD.basisPoint,
                    baseBasisPoint: BNBBUSD.baseBasisPoint,
                    tollRatio: BNBBUSD.tollRatio,
                    maxMarketFindingWordsIndex: BNBBUSD.maxMarketFindingWordsIndex,
                    maxLimitFindingWordsIndex: BNBBUSD.maxLimitFindingWordsIndex,
                    fundingPeriod: BNBBUSD.fundingPeriod,
                    priceFeed: chainLinkPriceFeedContractAddress,
                    quote: BNBBUSD.quote,
                    leverage: BNBBUSD.leverage,
                    stepBaseSize: BNBBUSD.stepBaseSize
                })
            },

            'deploy ETHBUSD position manager production': async () => {
                const positionHouseFunctionContractAddress = await context.db.findAddressByKey('PositionHouse');
                const chainLinkPriceFeedContractAddress = await context.db.findAddressByKey('ChainLinkPriceFeed')
                await context.factory.createPositionManager({
                    quoteAsset: await context.db.getMockContract(`BUSD`),
                    initialPrice: ETHBUSD.initialPrice,
                    priceFeedKey: ETHBUSD.priceFeedKey,
                    basisPoint: ETHBUSD.basisPoint,
                    baseBasisPoint: ETHBUSD.baseBasisPoint,
                    tollRatio: ETHBUSD.tollRatio,
                    maxMarketFindingWordsIndex: ETHBUSD.maxMarketFindingWordsIndex,
                    maxLimitFindingWordsIndex: ETHBUSD.maxLimitFindingWordsIndex,
                    fundingPeriod: ETHBUSD.fundingPeriod,
                    priceFeed: chainLinkPriceFeedContractAddress,
                    quote: ETHBUSD.quote,
                    leverage: ETHBUSD.leverage,
                    stepBaseSize: ETHBUSD.stepBaseSize
                })
            },

            'deploy SOLBUSD position manager production': async () => {
                const positionHouseFunctionContractAddress = await context.db.findAddressByKey('PositionHouse');
                const chainLinkPriceFeedContractAddress = await context.db.findAddressByKey('ChainLinkPriceFeed')
                await context.factory.createPositionManager({
                    quoteAsset: await context.db.getMockContract(`BUSD`),
                    initialPrice: SOLBUSD.initialPrice,
                    priceFeedKey: SOLBUSD.priceFeedKey,
                    basisPoint: SOLBUSD.basisPoint,
                    baseBasisPoint: SOLBUSD.baseBasisPoint,
                    tollRatio: SOLBUSD.tollRatio,
                    maxMarketFindingWordsIndex: SOLBUSD.maxMarketFindingWordsIndex,
                    maxLimitFindingWordsIndex: SOLBUSD.maxLimitFindingWordsIndex,
                    fundingPeriod: SOLBUSD.fundingPeriod,
                    priceFeed: chainLinkPriceFeedContractAddress,
                    quote: SOLBUSD.quote,
                    leverage: SOLBUSD.leverage,
                    stepBaseSize: SOLBUSD.stepBaseSize
                })
            },

            'deploy DOGEBUSD position manager production': async () => {
                const positionHouseFunctionContractAddress = await context.db.findAddressByKey('PositionHouse');
                const chainLinkPriceFeedContractAddress = await context.db.findAddressByKey('ChainLinkPriceFeed')
                await context.factory.createPositionManager({
                    quoteAsset: await context.db.getMockContract(`BUSD`),
                    initialPrice: DOGEBUSD.initialPrice,
                    priceFeedKey: DOGEBUSD.priceFeedKey,
                    basisPoint: DOGEBUSD.basisPoint,
                    baseBasisPoint: DOGEBUSD.baseBasisPoint,
                    tollRatio: DOGEBUSD.tollRatio,
                    maxMarketFindingWordsIndex: DOGEBUSD.maxMarketFindingWordsIndex,
                    maxLimitFindingWordsIndex: DOGEBUSD.maxLimitFindingWordsIndex,
                    fundingPeriod: DOGEBUSD.fundingPeriod,
                    priceFeed: chainLinkPriceFeedContractAddress,
                    quote: DOGEBUSD.quote,
                    leverage: DOGEBUSD.leverage
                })
            },

            'deploy LINKBUSD position manager production': async () => {
                const positionHouseFunctionContractAddress = await context.db.findAddressByKey('PositionHouse');
                const chainLinkPriceFeedContractAddress = await context.db.findAddressByKey('ChainLinkPriceFeed')
                await context.factory.createPositionManager({
                    quoteAsset: await context.db.getMockContract(`BUSD`),
                    initialPrice: LINKBUSD.initialPrice,
                    priceFeedKey: LINKBUSD.priceFeedKey,
                    basisPoint: LINKBUSD.basisPoint,
                    baseBasisPoint: LINKBUSD.baseBasisPoint,
                    tollRatio: LINKBUSD.tollRatio,
                    maxMarketFindingWordsIndex: LINKBUSD.maxMarketFindingWordsIndex,
                    maxLimitFindingWordsIndex: LINKBUSD.maxLimitFindingWordsIndex,
                    fundingPeriod: LINKBUSD.fundingPeriod,
                    priceFeed: chainLinkPriceFeedContractAddress,
                    quote: LINKBUSD.quote,
                    leverage: LINKBUSD.leverage
                })
            },

            'deploy MATICBUSD position manager production': async () => {
                const positionHouseFunctionContractAddress = await context.db.findAddressByKey('PositionHouse');
                const chainLinkPriceFeedContractAddress = await context.db.findAddressByKey('ChainLinkPriceFeed')
                await context.factory.createPositionManager({
                    quoteAsset: await context.db.getMockContract(`BUSD`),
                    initialPrice: MATICBUSD.initialPrice,
                    priceFeedKey: MATICBUSD.priceFeedKey,
                    basisPoint: MATICBUSD.basisPoint,
                    baseBasisPoint: MATICBUSD.baseBasisPoint,
                    tollRatio: MATICBUSD.tollRatio,
                    maxMarketFindingWordsIndex: MATICBUSD.maxMarketFindingWordsIndex,
                    maxLimitFindingWordsIndex: MATICBUSD.maxLimitFindingWordsIndex,
                    fundingPeriod: MATICBUSD.fundingPeriod,
                    priceFeed: chainLinkPriceFeedContractAddress,
                    quote: MATICBUSD.quote,
                    leverage: MATICBUSD.leverage
                })
            },

            'deploy XRPBUSD position manager production': async () => {
                const positionHouseFunctionContractAddress = await context.db.findAddressByKey('PositionHouse');
                const chainLinkPriceFeedContractAddress = await context.db.findAddressByKey('ChainLinkPriceFeed')
                await context.factory.createPositionManager({
                    quoteAsset: await context.db.getMockContract(`BUSD`),
                    initialPrice: XRPBUSD.initialPrice,
                    priceFeedKey: XRPBUSD.priceFeedKey,
                    basisPoint: XRPBUSD.basisPoint,
                    baseBasisPoint: XRPBUSD.baseBasisPoint,
                    tollRatio: XRPBUSD.tollRatio,
                    maxMarketFindingWordsIndex: XRPBUSD.maxMarketFindingWordsIndex,
                    maxLimitFindingWordsIndex: XRPBUSD.maxLimitFindingWordsIndex,
                    fundingPeriod: XRPBUSD.fundingPeriod,
                    priceFeed: chainLinkPriceFeedContractAddress,
                    quote: XRPBUSD.quote,
                    leverage: XRPBUSD.leverage
                })
            },

            'deploy ADABUSD position manager production': async () => {
                const positionHouseFunctionContractAddress = await context.db.findAddressByKey('PositionHouse');
                const chainLinkPriceFeedContractAddress = await context.db.findAddressByKey('ChainLinkPriceFeed')
                await context.factory.createPositionManager({
                    quoteAsset: await context.db.getMockContract(`BUSD`),
                    initialPrice: ADABUSD.initialPrice,
                    priceFeedKey: ADABUSD.priceFeedKey,
                    basisPoint: ADABUSD.basisPoint,
                    baseBasisPoint: ADABUSD.baseBasisPoint,
                    tollRatio: ADABUSD.tollRatio,
                    maxMarketFindingWordsIndex: ADABUSD.maxMarketFindingWordsIndex,
                    maxLimitFindingWordsIndex: ADABUSD.maxLimitFindingWordsIndex,
                    fundingPeriod: ADABUSD.fundingPeriod,
                    priceFeed: chainLinkPriceFeedContractAddress,
                    quote: ADABUSD.quote,
                    leverage: ADABUSD.leverage
                })
            },

            'deploy LTCBUSD position manager production': async () => {
                const positionHouseFunctionContractAddress = await context.db.findAddressByKey('PositionHouse');
                const chainLinkPriceFeedContractAddress = await context.db.findAddressByKey('ChainLinkPriceFeed')
                await context.factory.createPositionManager({
                    quoteAsset: await context.db.getMockContract(`BUSD`),
                    initialPrice: LTCBUSD.initialPrice,
                    priceFeedKey: LTCBUSD.priceFeedKey,
                    basisPoint: LTCBUSD.basisPoint,
                    baseBasisPoint: LTCBUSD.baseBasisPoint,
                    tollRatio: LTCBUSD.tollRatio,
                    maxMarketFindingWordsIndex: LTCBUSD.maxMarketFindingWordsIndex,
                    maxLimitFindingWordsIndex: LTCBUSD.maxLimitFindingWordsIndex,
                    fundingPeriod: LTCBUSD.fundingPeriod,
                    priceFeed: chainLinkPriceFeedContractAddress,
                    quote: LTCBUSD.quote,
                    leverage: LTCBUSD.leverage
                })
            },

            'deploy TRXBUSD position manager production': async () => {
                const positionHouseFunctionContractAddress = await context.db.findAddressByKey('PositionHouse');
                const chainLinkPriceFeedContractAddress = await context.db.findAddressByKey('ChainLinkPriceFeed')
                await context.factory.createPositionManager({
                    quoteAsset: await context.db.getMockContract(`BUSD`),
                    initialPrice: TRXBUSD.initialPrice,
                    priceFeedKey: TRXBUSD.priceFeedKey,
                    basisPoint: TRXBUSD.basisPoint,
                    baseBasisPoint: TRXBUSD.baseBasisPoint,
                    tollRatio: TRXBUSD.tollRatio,
                    maxMarketFindingWordsIndex: TRXBUSD.maxMarketFindingWordsIndex,
                    maxLimitFindingWordsIndex: TRXBUSD.maxLimitFindingWordsIndex,
                    fundingPeriod: TRXBUSD.fundingPeriod,
                    priceFeed: chainLinkPriceFeedContractAddress,
                    quote: TRXBUSD.quote,
                    leverage: TRXBUSD.leverage
                })
            },

            'deploy AAVEBUSD position manager production': async () => {
                const positionHouseFunctionContractAddress = await context.db.findAddressByKey('PositionHouse');
                const chainLinkPriceFeedContractAddress = await context.db.findAddressByKey('ChainLinkPriceFeed')
                await context.factory.createPositionManager({
                    quoteAsset: await context.db.getMockContract(`BUSD`),
                    initialPrice: AAVEBUSD.initialPrice,
                    priceFeedKey: AAVEBUSD.priceFeedKey,
                    basisPoint: AAVEBUSD.basisPoint,
                    baseBasisPoint: AAVEBUSD.baseBasisPoint,
                    tollRatio: AAVEBUSD.tollRatio,
                    maxMarketFindingWordsIndex: AAVEBUSD.maxMarketFindingWordsIndex,
                    maxLimitFindingWordsIndex: AAVEBUSD.maxLimitFindingWordsIndex,
                    fundingPeriod: AAVEBUSD.fundingPeriod,
                    priceFeed: chainLinkPriceFeedContractAddress,
                    quote: AAVEBUSD.quote,
                    leverage: AAVEBUSD.leverage,
                    stepBaseSize: AAVEBUSD.stepBaseSize
                })
            },

            'deploy DOTBUSD position manager production': async () => {
                const positionHouseFunctionContractAddress = await context.db.findAddressByKey('PositionHouse');
                const chainLinkPriceFeedContractAddress = await context.db.findAddressByKey('ChainLinkPriceFeed')
                await context.factory.createPositionManager({
                    quoteAsset: await context.db.getMockContract(`BUSD`),
                    initialPrice: DOTBUSD.initialPrice,
                    priceFeedKey: DOTBUSD.priceFeedKey,
                    basisPoint: DOTBUSD.basisPoint,
                    baseBasisPoint: DOTBUSD.baseBasisPoint,
                    tollRatio: DOTBUSD.tollRatio,
                    maxMarketFindingWordsIndex: DOTBUSD.maxMarketFindingWordsIndex,
                    maxLimitFindingWordsIndex: DOTBUSD.maxLimitFindingWordsIndex,
                    fundingPeriod: DOTBUSD.fundingPeriod,
                    priceFeed: chainLinkPriceFeedContractAddress,
                    quote: DOTBUSD.quote,
                    leverage: DOTBUSD.leverage
                })
            },

            'deploy CAKEBUSD position manager production': async () => {
                const positionHouseFunctionContractAddress = await context.db.findAddressByKey('PositionHouse');
                const chainLinkPriceFeedContractAddress = await context.db.findAddressByKey('ChainLinkPriceFeed')
                await context.factory.createPositionManager({
                    quoteAsset: await context.db.getMockContract(`BUSD`),
                    initialPrice: CAKEBUSD.initialPrice,
                    priceFeedKey: CAKEBUSD.priceFeedKey,
                    basisPoint: CAKEBUSD.basisPoint,
                    baseBasisPoint: CAKEBUSD.baseBasisPoint,
                    tollRatio: CAKEBUSD.tollRatio,
                    maxMarketFindingWordsIndex: CAKEBUSD.maxMarketFindingWordsIndex,
                    maxLimitFindingWordsIndex: CAKEBUSD.maxLimitFindingWordsIndex,
                    fundingPeriod: CAKEBUSD.fundingPeriod,
                    priceFeed: chainLinkPriceFeedContractAddress,
                    quote: CAKEBUSD.quote,
                    leverage: CAKEBUSD.leverage
                })
            },

            'deploy UNIBUSD position manager production': async () => {
                const positionHouseFunctionContractAddress = await context.db.findAddressByKey('PositionHouse');
                const chainLinkPriceFeedContractAddress = await context.db.findAddressByKey('ChainLinkPriceFeed')
                await context.factory.createPositionManager({
                    quoteAsset: await context.db.getMockContract(`BUSD`),
                    initialPrice: UNIBUSD.initialPrice,
                    priceFeedKey: UNIBUSD.priceFeedKey,
                    basisPoint: UNIBUSD.basisPoint,
                    baseBasisPoint: UNIBUSD.baseBasisPoint,
                    tollRatio: UNIBUSD.tollRatio,
                    maxMarketFindingWordsIndex: UNIBUSD.maxMarketFindingWordsIndex,
                    maxLimitFindingWordsIndex: UNIBUSD.maxLimitFindingWordsIndex,
                    fundingPeriod: UNIBUSD.fundingPeriod,
                    priceFeed: chainLinkPriceFeedContractAddress,
                    quote: UNIBUSD.quote,
                    leverage: UNIBUSD.leverage
                })
            },
        }

    }
}


export default migrations;
