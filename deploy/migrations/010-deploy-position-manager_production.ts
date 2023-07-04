import {MigrationContext, MigrationDefinition} from "../types";
import {ContractWrapperFactory} from "../ContractWrapperFactory";
import {
    AAVEBUSD, AAVEUSD,
    ADABUSD,
    BNBBUSD,
    BTCBUSD, BTCUSD, CAKEBUSD,
    DOGEBUSD, DOTBUSD,
    ETHBUSD, ETHUSD,
    LINKBUSD, LINKUSD, LTCBUSD,
    MATICBUSD,
    SOLBUSD, TRXBUSD, UNIBUSD,
    XRPBUSD
} from "../config_production";
import {BUSD, POSI, USD} from "../../constants";

const migrations: MigrationDefinition = {


    getTasks: (context: MigrationContext) => {


        if(context.stage != 'prod-futurX') return {}

        return {
            'force import position manager': async () => {

                const positionMathContractAddress = await context.db.findAddressByKey(`PositionMath`);
                console.log(`positionHouseMathContractAddress ${positionMathContractAddress}`);

                const accessControllerAdapterContractAddress = await context.db.findAddressByKey(`AccessControllerAdapter`);
                console.log(`accessControllerAdapterContractAddress ${accessControllerAdapterContractAddress}`);


                const symbol = `${BTCUSD.priceFeedKey}_${BTCUSD.quote}`;

                const positionManager = await context.db.findAddressByKey(`PositionManager:${symbol}`);
                const positionManagerFactory = await context.hre.ethers.getContractFactory("PositionManager", {
                    libraries: {
                        // InsuranceFundAdapter: insuranceFundAdapterContractAddress,
                        AccessControllerAdapter: accessControllerAdapterContractAddress,
                        PositionMath: positionMathContractAddress
                    }
                })
                if (positionManager) {
                    await context.hre.upgrades.forceImport(positionManager, positionManagerFactory);
                    return;
                }
            },
            'deploy BTCBUSD position manager production': async () => {



                const positionHouseFunctionContractAddress = await context.db.findAddressByKey('PositionHouse');
                const chainLinkPriceFeedContractAddress = await context.db.findAddressByKey('ChainLinkPriceFeed')
                await context.factory.createPositionManager({
                    quoteAsset: await context.db.getMockContract(`USD`),
                    initialPrice: BTCUSD.initialPrice,
                    priceFeedKey: BTCUSD.priceFeedKey,
                    basisPoint: BTCUSD.basisPoint,
                    baseBasisPoint: BTCUSD.baseBasisPoint,
                    tollRatio: BTCUSD.tollRatio,
                    maxMarketFindingWordsIndex: BTCUSD.maxMarketFindingWordsIndex,
                    maxLimitFindingWordsIndex: BTCUSD.maxLimitFindingWordsIndex,
                    fundingPeriod: BTCUSD.fundingPeriod,
                    priceFeed: chainLinkPriceFeedContractAddress,
                    quote: USD,
                    leverage: BTCUSD.leverage,
                    stepBaseSize: BTCUSD.stepBaseSize,
                    marketMaker: BTCUSD.marketMaker,
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
                    quoteAsset: await context.db.getMockContract(`USD`),
                    initialPrice: ETHUSD.initialPrice,
                    priceFeedKey: ETHUSD.priceFeedKey,
                    basisPoint: ETHUSD.basisPoint,
                    baseBasisPoint: ETHUSD.baseBasisPoint,
                    tollRatio: ETHUSD.tollRatio,
                    maxMarketFindingWordsIndex: ETHUSD.maxMarketFindingWordsIndex,
                    maxLimitFindingWordsIndex: ETHUSD.maxLimitFindingWordsIndex,
                    fundingPeriod: ETHUSD.fundingPeriod,
                    priceFeed: chainLinkPriceFeedContractAddress,
                    quote: ETHUSD.quote,
                    leverage: ETHUSD.leverage,
                    stepBaseSize: ETHUSD.stepBaseSize,
                    marketMaker: ETHUSD.marketMaker,
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
                    quoteAsset: await context.db.getMockContract(`USD`),
                    initialPrice: LINKUSD.initialPrice,
                    priceFeedKey: LINKUSD.priceFeedKey,
                    basisPoint: LINKUSD.basisPoint,
                    baseBasisPoint: LINKUSD.baseBasisPoint,
                    tollRatio: LINKUSD.tollRatio,
                    maxMarketFindingWordsIndex: LINKUSD.maxMarketFindingWordsIndex,
                    maxLimitFindingWordsIndex: LINKUSD.maxLimitFindingWordsIndex,
                    fundingPeriod: LINKUSD.fundingPeriod,
                    priceFeed: chainLinkPriceFeedContractAddress,
                    quote: LINKUSD.quote,
                    leverage: LINKUSD.leverage,
                    marketMaker: LINKUSD.marketMaker,
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
                    quoteAsset: await context.db.getMockContract(`USD`),
                    initialPrice: AAVEUSD.initialPrice,
                    priceFeedKey: AAVEUSD.priceFeedKey,
                    basisPoint: AAVEUSD.basisPoint,
                    baseBasisPoint: AAVEUSD.baseBasisPoint,
                    tollRatio: AAVEUSD.tollRatio,
                    maxMarketFindingWordsIndex: AAVEUSD.maxMarketFindingWordsIndex,
                    maxLimitFindingWordsIndex: AAVEUSD.maxLimitFindingWordsIndex,
                    fundingPeriod: AAVEUSD.fundingPeriod,
                    priceFeed: chainLinkPriceFeedContractAddress,
                    quote: AAVEUSD.quote,
                    leverage: AAVEUSD.leverage,
                    stepBaseSize: AAVEUSD.stepBaseSize,
                    marketMaker: AAVEUSD.marketMaker,
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
