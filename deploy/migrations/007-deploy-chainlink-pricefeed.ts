import {MigrationContext, MigrationDefinition} from "../types";
import {ContractWrapperFactory} from "../ContractWrapperFactory";


const migrations: MigrationDefinition = {
    getTasks: (context: MigrationContext) => ({
        'deploy chain link price feed': async () => {
            /**
             * Currently no param
             */
             await context.factory.createChainlinkPriceFeed({})

        }
    })
}


export default migrations;
