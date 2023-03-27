import {MigrationContext, MigrationDefinition} from "../types";
import {ContractWrapperFactory} from "../ContractWrapperFactory";


const migrations: MigrationDefinition = {
    getTasks: (context: MigrationContext) => ({
        'deploy access controller': async () => {
            /**
             * Currently no param
             */

            await context.factory.createAccessController()

        }
    })
}


export default migrations;
