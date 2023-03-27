import {MigrationContext, MigrationDefinition} from "../types";
import {ContractWrapperFactory} from "../ContractWrapperFactory";


const migrations: MigrationDefinition = {
    getTasks: (context: MigrationContext) => {
        return {
            'deploy position house adapter': async () => {
                /**
                 no param
                 */
                const positionHouseAdapterContractAddress = await context.db.findAddressByKey('PositionHouseAdapter');
                console.log(`PositionHouseAdapter  ${positionHouseAdapterContractAddress}`);
                if(!positionHouseAdapterContractAddress)
                    await context.factory.createPositionHouseAdapter()
            },
            'deploy position manager adapter': async () => {
                /**
                 no param
                 */
                const positionManagerAdapterContractAddress = await context.db.findAddressByKey('PositionManagerAdapter');
                console.log(`PositionManagerAdapter  ${positionManagerAdapterContractAddress}`);
                if (!positionManagerAdapterContractAddress)
                    await context.factory.createPositionManagerAdapter()

            },
            'deploy insurance fund adapter': async () => {
                /**
                 no param
                 */
                const insuranceFundAdapterContractAddress = await context.db.findAddressByKey('InsuranceFundAdapter');
                console.log(`InsuranceFundAdapter  ${insuranceFundAdapterContractAddress}`);
                if(!insuranceFundAdapterContractAddress)
                    await context.factory.createInsuranceFundAdapter()
            },
            'deploy access controller adapter': async () => {
                /**
                 no param
                 */
                const accessControllerAdapterContractAddress = await context.db.findAddressByKey('AccessControllerAdapter');
                console.log(`AccessControllerAdapter  ${accessControllerAdapterContractAddress}`);
                if(!accessControllerAdapterContractAddress)
                    await context.factory.createAccessControllerAdapter()
            },

        }
    }
}


export default migrations;
