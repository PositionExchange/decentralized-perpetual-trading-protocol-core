import {ConfigPositionManagerInput, CreatePositionManagerInput} from "./types";
import {BUSD, USD} from "../constants";


export const BTCBUSD : ConfigPositionManagerInput = {
    initialPrice: 2800000,
    priceFeedKey: 'BTC',
    basisPoint: 100,
    baseBasisPoint: 10000,
    // fee for maker: 0.01%, fee for taker: 0.02%
    tollRatio: 5000,
    maxLimitFindingWordsIndex: 3200, // find in big range ~ 8000 price (50% of current), word = price * basisPoint / 256
    maxMarketFindingWordsIndex: 650, // find in small range ~ 1600 price (10% of current), word = price * basisPoint / 256
    fundingPeriod: 3600,
    quote: USD,
    leverage: 100,
    stepBaseSize: '1000000000000000' // = 0.001
}

export const BTCUSD : ConfigPositionManagerInput = {
    initialPrice: 3000000,
    priceFeedKey: 'BTC',
    basisPoint: 100,
    baseBasisPoint: 10000,
    // fee for maker: 0.01%, fee for taker: 0.02%
    tollRatio: 5000,
    maxLimitFindingWordsIndex: 3200, // find in big range ~ 8000 price (50% of current), word = price * basisPoint / 256
    maxMarketFindingWordsIndex: 650, // find in small range ~ 1600 price (10% of current), word = price * basisPoint / 256
    fundingPeriod: 3600,
    quote: USD,
    leverage: 100,
    stepBaseSize: '1000000000000000' // = 0.001
}

export const BNBBUSD : ConfigPositionManagerInput = {
    initialPrice: 0,
    priceFeedKey: 'BNB',
    basisPoint: 100,
    baseBasisPoint: 10000,
    // fee for maker: 0.01%, fee for taker: 0.02%
    tollRatio: 5000,
    maxLimitFindingWordsIndex: 50, // find in big range ~ 125 price (50% of current)
    maxMarketFindingWordsIndex: 12, // find in small range ~ 25 price (10% of current)
    fundingPeriod: 3600,
    quote: BUSD,
    leverage: 20,
    stepBaseSize: '10000000000000000' // = 0.01
}

export const ETHBUSD : ConfigPositionManagerInput = {
    initialPrice: 0,
    priceFeedKey: 'ETH',
    basisPoint: 100,
    baseBasisPoint: 10000,
    // fee for maker: 0.01%, fee for taker: 0.02%
    tollRatio: 5000,
    maxLimitFindingWordsIndex: 250, // find in big range ~ 600 price (50% of current)
    maxMarketFindingWordsIndex: 50, // find in small range ~ 120 price (10% of current)
    fundingPeriod: 3600,
    quote: BUSD,
    leverage: 50,
    stepBaseSize: '1000000000000000' // = 0.001
}

export const ETHUSD : ConfigPositionManagerInput = {
    initialPrice: 180000,
    priceFeedKey: 'ETH',
    basisPoint: 100,
    baseBasisPoint: 10000,
    // fee for maker: 0.01%, fee for taker: 0.02%
    tollRatio: 5000,
    maxLimitFindingWordsIndex: 250, // find in big range ~ 600 price (50% of current)
    maxMarketFindingWordsIndex: 50, // find in small range ~ 120 price (10% of current)
    fundingPeriod: 3600,
    quote: USD,
    leverage: 50,
    stepBaseSize: '1000000000000000' // = 0.001
}

export const SOLBUSD : ConfigPositionManagerInput = {
    initialPrice: 9850,
    priceFeedKey: 'SOL',
    basisPoint: 1000,
    baseBasisPoint: 1000000,
    // fee for maker: 0.01%, fee for taker: 0.02%
    tollRatio: 5000,
    maxLimitFindingWordsIndex: 20, // find in big range ~ 4.8 price (50% of current)
    maxMarketFindingWordsIndex: 5, // find in small range ~ 1 price (10% of current)
    fundingPeriod: 3600,
    quote: BUSD,
    leverage: 10,
    stepBaseSize: '100000000000000000' // = 0.1
}

export const DOGEBUSD : ConfigPositionManagerInput = {
    initialPrice: 0,
    priceFeedKey: 'DOGE',
    basisPoint: 100000,
    baseBasisPoint: 10000000000,
    // fee for maker: 0.01%, fee for taker: 0.02%
    tollRatio: 5000,
    maxLimitFindingWordsIndex: 15, // find in big range ~ 0.035 price (50% of current)
    maxMarketFindingWordsIndex: 3, // find in small range ~ 0.007 price (10% of current)
    fundingPeriod: 3600,
    quote: BUSD,
    leverage: 20,
    stepBaseSize: '1000000000000000000' // = 1
}

export const LINKBUSD : ConfigPositionManagerInput = {
    initialPrice: 0,
    priceFeedKey: 'LINK',
    basisPoint: 1000,
    baseBasisPoint: 1000000,
    // fee for maker: 0.01%, fee for taker: 0.02%
    tollRatio: 10000,
    maxLimitFindingWordsIndex: 12, // find in big range ~ 2.7 price (50% of current)
    maxMarketFindingWordsIndex: 3, // find in small range ~ 0.6 price (10% of current)
    fundingPeriod: 3600,
    quote: USD,
    leverage: 20,
    stepBaseSize: '100000000000000000' // = 0.1
}

export const LINKUSD : ConfigPositionManagerInput = {
    initialPrice: 50000,
    priceFeedKey: 'LINK',
    basisPoint: 1000,
    baseBasisPoint: 1000000,
    // fee for maker: 0.01%, fee for taker: 0.02%
    tollRatio: 10000,
    maxLimitFindingWordsIndex: 12, // find in big range ~ 2.7 price (50% of current)
    maxMarketFindingWordsIndex: 3, // find in small range ~ 0.6 price (10% of current)
    fundingPeriod: 3600,
    quote: USD,
    leverage: 20,
    stepBaseSize: '100000000000000000' // = 0.1
}

export const MATICBUSD : ConfigPositionManagerInput = {
    initialPrice: 7604,
    priceFeedKey: 'MATIC',
    basisPoint: 10000,
    baseBasisPoint: 100000000,
    // fee for maker: 0.01%, fee for taker: 0.02%
    tollRatio: 10000,
    maxLimitFindingWordsIndex: 16, // find in big range ~ 0.38 price (50% of current)
    maxMarketFindingWordsIndex: 4, // find in small range ~ 0.08 price (10% of current)
    fundingPeriod: 3600,
    quote: BUSD,
    leverage: 20,
    stepBaseSize: '100000000000000000' // = 0.1
}

export const XRPBUSD : ConfigPositionManagerInput = {
    initialPrice: 3456,
    priceFeedKey: 'XRP',
    basisPoint: 10000,
    baseBasisPoint: 100000000,
    // fee for maker: 0.01%, fee for taker: 0.02%
    tollRatio: 10000,
    maxLimitFindingWordsIndex: 7, // find in big range ~ 0.175 price (50% of current)
    maxMarketFindingWordsIndex: 2, // find in small range ~ 0.035 price (10% of current)
    fundingPeriod: 3600,
    quote: BUSD,
    leverage: 20,
    stepBaseSize: '100000000000000000' // = 0.1
}

export const ADABUSD : ConfigPositionManagerInput = {
    initialPrice: 0,
    priceFeedKey: 'ADA',
    basisPoint: 10000,
    baseBasisPoint: 100000000,
    // fee for maker: 0.01%, fee for taker: 0.02%
    tollRatio: 10000,
    maxLimitFindingWordsIndex: 5, // find in big range ~ 0.12 price (50% of current)
    maxMarketFindingWordsIndex: 2, // find in small range ~ 0.024 price (10% of current)
    fundingPeriod: 3600,
    quote: BUSD,
    leverage: 20,
    stepBaseSize: '100000000000000000' // = 0.1
}

export const LTCBUSD : ConfigPositionManagerInput = {
    initialPrice: 0,
    priceFeedKey: 'LTC',
    basisPoint: 100,
    baseBasisPoint: 10000,
    // fee for maker: 0.01%, fee for taker: 0.02%
    tollRatio: 10000,
    maxLimitFindingWordsIndex: 16, // find in big range ~ 34 price (50% of current)
    maxMarketFindingWordsIndex: 3, // find in small range ~ 6.8 price (10% of current)
    fundingPeriod: 3600,
    quote: BUSD,
    leverage: 20,
    stepBaseSize: '10000000000000000' // = 0.01
}

export const TRXBUSD : ConfigPositionManagerInput = {
    initialPrice: 0,
    priceFeedKey: 'TRX',
    basisPoint: 100000,
    baseBasisPoint: 10000000000,
    // fee for maker: 0.01%, fee for taker: 0.02%
    tollRatio: 10000,
    maxLimitFindingWordsIndex: 11, // find in big range ~ 0.027 price (50% of current)
    maxMarketFindingWordsIndex: 3, // find in small range ~ 0.0054 price (10% of current)
    fundingPeriod: 3600,
    quote: BUSD,
    leverage: 20,
    stepBaseSize: '1000000000000000000' // = 1
}

export const AAVEBUSD : ConfigPositionManagerInput = {
    initialPrice: 0,
    priceFeedKey: 'AAVE',
    basisPoint: 100,
    baseBasisPoint: 10000,
    // fee for maker: 0.01%, fee for taker: 0.02%
    tollRatio: 10000,
    maxLimitFindingWordsIndex: 11, // find in big range ~ 26 price (50% of current)
    maxMarketFindingWordsIndex: 3, // find in small range ~ 5.2 price (10% of current)
    fundingPeriod: 3600,
    quote: BUSD,
    leverage: 20,
    stepBaseSize: '10000000000000000' // = 0.01
}

export const AAVEUSD : ConfigPositionManagerInput = {
    initialPrice: 5378,
    priceFeedKey: 'AAVE',
    basisPoint: 100,
    baseBasisPoint: 10000,
    // fee for maker: 0.01%, fee for taker: 0.02%
    tollRatio: 10000,
    maxLimitFindingWordsIndex: 11, // find in big range ~ 26 price (50% of current)
    maxMarketFindingWordsIndex: 3, // find in small range ~ 5.2 price (10% of current)
    fundingPeriod: 3600,
    quote: USD,
    leverage: 20,
    stepBaseSize: '10000000000000000' // = 0.01
}

export const DOTBUSD : ConfigPositionManagerInput = {
    initialPrice: 0,
    priceFeedKey: 'DOT',
    basisPoint: 1000,
    baseBasisPoint: 1000000,
    // fee for maker: 0.01%, fee for taker: 0.02%
    tollRatio: 10000,
    maxLimitFindingWordsIndex: 9, // find in big range ~ 2.2 price (50% of current)
    maxMarketFindingWordsIndex: 2, // find in small range ~ 0.43 price (10% of current)
    fundingPeriod: 3600,
    quote: BUSD,
    leverage: 20,
    stepBaseSize: '100000000000000000' // = 0.1
}

export const CAKEBUSD : ConfigPositionManagerInput = {
    initialPrice: 0,
    priceFeedKey: 'CAKE',
    basisPoint: 1000,
    baseBasisPoint: 1000000,
    // fee for maker: 0.01%, fee for taker: 0.02%
    tollRatio: 10000,
    maxLimitFindingWordsIndex: 7, // find in big range ~ 1.6 price (50% of current)
    maxMarketFindingWordsIndex: 2, // find in small range ~ 0.32 price (10% of current)
    fundingPeriod: 3600,
    quote: BUSD,
    leverage: 20,
    stepBaseSize: '100000000000000000' // = 0.1
}

export const UNIBUSD : ConfigPositionManagerInput = {
    initialPrice: 0,
    priceFeedKey: 'UNI',
    basisPoint: 1000,
    baseBasisPoint: 1000000,
    // fee for maker: 0.01%, fee for taker: 0.02%
    tollRatio: 10000,
    maxLimitFindingWordsIndex: 11, // find in big range ~ 2.5 price (50% of current)
    maxMarketFindingWordsIndex: 3, // find in small range ~ 0.5 price (10% of current)
    fundingPeriod: 3600,
    quote: BUSD,
    leverage: 20,
    stepBaseSize: '100000000000000000' // = 0.1
}
