import {MigrationContext, MigrationDefinition} from "../types";
import {ContractWrapperFactory} from "../ContractWrapperFactory";
import {BNBBUSD, BTCBUSD, CAKEBUSD, LINKBUSD, ETHBUSD} from "../config_production";
import {BUSD} from "../../constants";

const migrations: MigrationDefinition = {
    getTasks: (context: MigrationContext) => {

        if(context.stage != 'test' && context.stage != 'dev') return {}

        return {
            'deploy BTCBUSD position manager': async () => {
                /**
                 quoteAsset: string;
                 initialPrice: number;
                 priceFeedKey: string;
                 basisPoint: number;
                 baseBasisPoint: number;
                 tollRatio: number;
                 maxMarketFindingWordsIndex: number;
                 fundingPeriod: number;
                 priceFeed: string;
                 */
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
                    leverage: BTCBUSD.leverage
                })
            },

            // 'deploy BNBBUSD position manager': async () => {
            //     /**
            //      quoteAsset: string;
            //      initialPrice: number;
            //      priceFeedKey: string;
            //      basisPoint: number;
            //      baseBasisPoint: number;
            //      tollRatio: number;
            //      maxMarketFindingWordsIndex: number;
            //      fundingPeriod: number;
            //      priceFeed: string;
            //      */
            //     const positionHouseFunctionContractAddress = await context.db.findAddressByKey('PositionHouse');
            //     const chainLinkPriceFeedContractAddress = await context.db.findAddressByKey('ChainLinkPriceFeed')
            //     await context.factory.createPositionManager({
            //         quoteAsset: await context.db.getMockContract(`BUSD`),
            //         initialPrice: BNBBUSD.initialPrice,
            //         priceFeedKey: BNBBUSD.priceFeedKey,
            //         basisPoint: BNBBUSD.basisPoint,
            //         baseBasisPoint: BNBBUSD.baseBasisPoint,
            //         tollRatio: BNBBUSD.tollRatio,
            //         maxMarketFindingWordsIndex: BNBBUSD.maxMarketFindingWordsIndex,
            //         maxLimitFindingWordsIndex: BNBBUSD.maxLimitFindingWordsIndex,
            //         fundingPeriod: BNBBUSD.fundingPeriod,
            //         priceFeed: chainLinkPriceFeedContractAddress,
            //         quote: BNBBUSD.quote,
            //         leverage: BNBBUSD.leverage
            //     })
            // },

            'deploy ETHBUSD position manager': async () => {
                /**
                 quoteAsset: string;
                 initialPrice: number;
                 priceFeedKey: string;
                 basisPoint: number;
                 baseBasisPoint: number;
                 tollRatio: number;
                 maxMarketFindingWordsIndex: number;
                 fundingPeriod: number;
                 priceFeed: string;
                 */
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
                    leverage: ETHBUSD.leverage
                })
            },

            'deploy LINKBUSD position manager': async () => {
                /**
                 quoteAsset: string;
                 initialPrice: number;
                 priceFeedKey: string;
                 basisPoint: number;
                 baseBasisPoint: number;
                 tollRatio: number;
                 maxMarketFindingWordsIndex: number;
                 fundingPeriod: number;
                 priceFeed: string;
                 */
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

            // 'deploy CAKEBUSD position manager': async () => {
            //     /**
            //      quoteAsset: string;
            //      initialPrice: number;
            //      priceFeedKey: string;
            //      basisPoint: number;
            //      baseBasisPoint: number;
            //      tollRatio: number;
            //      maxMarketFindingWordsIndex: number;
            //      fundingPeriod: number;
            //      priceFeed: string;
            //      */
            //     const positionHouseFunctionContractAddress = await context.db.findAddressByKey('PositionHouse');
            //     const chainLinkPriceFeedContractAddress = await context.db.findAddressByKey('ChainLinkPriceFeed')
            //     await context.factory.createPositionManager({
            //         quoteAsset: await context.db.getMockContract(`BUSD`),
            //         initialPrice: CAKEBUSD.initialPrice,
            //         priceFeedKey: CAKEBUSD.priceFeedKey,
            //         basisPoint: CAKEBUSD.basisPoint,
            //         baseBasisPoint: CAKEBUSD.baseBasisPoint,
            //         tollRatio: CAKEBUSD.tollRatio,
            //         maxMarketFindingWordsIndex: CAKEBUSD.maxMarketFindingWordsIndex,
            //         maxLimitFindingWordsIndex: CAKEBUSD.maxLimitFindingWordsIndex,
            //         fundingPeriod: CAKEBUSD.fundingPeriod,
            //         priceFeed: chainLinkPriceFeedContractAddress,
            //         quote: CAKEBUSD.quote,
            //         leverage: CAKEBUSD.leverage
            //     })
            // },
        }
    }
}


export default migrations;
