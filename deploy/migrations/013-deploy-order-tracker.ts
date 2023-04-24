import {MigrationContext, MigrationDefinition} from "../types";
import {ContractWrapperFactory} from "../ContractWrapperFactory";


const migrations: MigrationDefinition = {
    getTasks: (context: MigrationContext) => ({
        'deploy order tracker': async () => {
            /**
             * Currently no param
             */

            await context.factory.createOrderTracker()

        }
    })
}


export default migrations;
