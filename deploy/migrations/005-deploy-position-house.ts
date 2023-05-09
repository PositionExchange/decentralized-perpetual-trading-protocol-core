import {MigrationContext, MigrationDefinition} from "../types";
import {ContractWrapperFactory} from "../ContractWrapperFactory";
import {PositionHouse} from "../../typeChain";


const migrations: MigrationDefinition = {
    getTasks: (context: MigrationContext) => ({
        'deploy position house configuration proxy': async () => {
            /**
             maintenanceMarginRatio: number,
             partialLiquidationRatio: number,
             liquidationFeeRatio: number,
             liquidationPenaltyRatio: number
             */
            await context.factory.createPositionHouseConfigurationProxy({
                maintenanceMarginRatio: 3,
                partialLiquidationRatio: 80,
                liquidationFeeRatio: 3,
                liquidationPenaltyRatio: 20,
                initialMarginSlippagePercent: 5
            })
        },

        'deploy position notional configuration proxy': async () => {
            /**
                no param
             */
            await context.factory.createPositionNotionConfigProxy({})
        },

        'deploy position house': async () => {
            /**
             insuranceFund: string,
             positionHouseConfigurationProxy: string
             */
            const insuranceFundContactAddress = await context.db.findAddressByKey('InsuranceFund');
            const positionHouseConfigurationProxyContactAddress = await context.db.findAddressByKey('PositionHouseConfigurationProxy');
            const positionNotionalConfigProxyContractAddress = await context.db.findAddressByKey('PositionNotionalConfigProxy');
            const accessControllerContractAddress = await context.db.findAddressByKey('AccessController');
            console.log(`InsuranceFund  ${insuranceFundContactAddress}`);
            console.log(`PositionHouseConfigurationProxy  ${positionHouseConfigurationProxyContactAddress}`);
            await context.factory.createPositionHouse({
                insuranceFund: insuranceFundContactAddress,
                positionHouseConfigurationProxy: positionHouseConfigurationProxyContactAddress,
                positionNotionalConfigProxy: positionNotionalConfigProxyContractAddress,
                accessController: accessControllerContractAddress,
                futureType: context.futureType
            })
        },
        'deploy position house strategy order': async () => {
            /**
             positionHouse: string,
             accessController: string
             */
            const positionHouseContractAddress = await context.db.findAddressByKey('PositionHouse');
            const accessControllerContractAddress = await context.db.findAddressByKey('AccessController');
            console.log(`PositionHouse  ${positionHouseContractAddress}`);
            await context.factory.createPositionStrategyOrder({
                positionHouse: positionHouseContractAddress,
                accessController: accessControllerContractAddress
            })
            const positionStrategyOrderAddress = await context.db.findAddressByKey('PositionStrategyOrder')
            const positionHouse = await context.hre.ethers.getContractAt('PositionHouse', positionHouseContractAddress) as PositionHouse
            const currentStrategyOrderAddress = await positionHouse.positionStrategyOrder()
            if(currentStrategyOrderAddress === context.hre.ethers.constants.AddressZero){
                console.log("Set Position Strategy Order to PositionHouse")
                // const tx = positionHouse.setPositionStrategyOrder(positionStrategyOrderAddress)
                // await this.waitTx(tx, "positionHouse.setPositionStrategyOrder")
                console.log("Set Position Strategy Order to PositionHouse Done.")
            }
        },

        'deploy contract validator core': async () => {
            const positionHouseContractAddress = await context.db.findAddressByKey('PositionHouse');
            const positionStrategyOrderContractAddress = await context.db.findAddressByKey('PositionStrategyOrder');
            const positionHouseConfigurationProxyContractAddress = await context.db.findAddressByKey('PositionHouseConfigurationProxy');
            const insuranceFundContractAddress = await  context.db.findAddressByKey("InsuranceFund");
            await context.factory.createValidatorCore({
                positionHouse: positionHouseContractAddress,
                positionHouseConfigurationProxy: positionHouseConfigurationProxyContractAddress,
                positionStrategyOrder: positionStrategyOrderContractAddress,
                insuranceFund: insuranceFundContractAddress
            })
        },
    })
}


export default migrations;
