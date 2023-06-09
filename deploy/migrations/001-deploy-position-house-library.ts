import {MigrationContext, MigrationDefinition} from "../types";
import {ContractWrapperFactory} from "../ContractWrapperFactory";


const migrations: MigrationDefinition = {
    getTasks: (context: MigrationContext) => ({
        'deploy position house math': async () => {
            /**
             no param
             */
            if (context.futureType == 'coin-m') {
                const coinMarginAddress = await context.db.findAddressByKey('CoinMargin');
                console.log(`CoinMargin  ${coinMarginAddress}`);
                if (!coinMarginAddress)
                    await context.factory.createCoinMarginLibrary({})
            } else {
                const usdMarginAddress = await context.db.findAddressByKey('USDMargin');
                console.log(`USDMargin  ${usdMarginAddress}`);
                if (!usdMarginAddress)
                    await context.factory.createUSDMarginLibrary({})
            }

            const positionHouseMathContractAddress = await context.db.findAddressByKey('PositionMath');
            console.log(`PositionMath  ${positionHouseMathContractAddress}`);
            if(!positionHouseMathContractAddress)
                await context.factory.createPositionMathLibrary({futureType: context.futureType})
        }
    })
}


export default migrations;
