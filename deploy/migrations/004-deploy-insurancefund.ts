import {MigrationContext, MigrationDefinition} from "../types";
import {ContractWrapperFactory} from "../ContractWrapperFactory";


const migrations: MigrationDefinition = {
    getTasks: (context: MigrationContext) => ({
        'deploy insurance fund of position manager': async () => {
            /**
             * Currently no param
             */

            const accessControllerContractAddress = await context.db.findAddressByKey('AccessController');
            await context.factory.createInsuranceFund({
                accessController: accessControllerContractAddress
            })

        }
    })
}


export default migrations;
