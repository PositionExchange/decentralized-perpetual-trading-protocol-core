import {MigrationContext, MigrationDefinition} from "../types";
import {ContractWrapperFactory} from "../ContractWrapperFactory";
import {DptpCrossChainGateway, LiquidatorGateway} from "../../typeChain";


const migrations: MigrationDefinition = {
    getTasks: (context: MigrationContext) => ({
        'deploy contract user gateway': async () => {
            const positionHouseContractAddress = await context.db.findAddressByKey('PositionHouse');
            const positionStrategyOrderContractAddress = await context.db.findAddressByKey('PositionStrategyOrder');
            const positionHouseConfigurationProxyContractAddress = await context.db.findAddressByKey('PositionHouseConfigurationProxy');
            const insuranceFundContractAddress = await  context.db.findAddressByKey("InsuranceFund");
            await context.factory.createUserGateway({
                positionHouse: positionHouseContractAddress,
                positionHouseConfigurationProxy: positionHouseConfigurationProxyContractAddress,
                positionStrategyOrder: positionStrategyOrderContractAddress,
                insuranceFund: insuranceFundContractAddress
            })
        },

        'deploy contract validator gateway': async () => {

            await context.factory.createValidatorGateway()
        },

        'deploy contract liquidator gateway': async () => {
            let myBlockchainId;
            let destBlockchainId;
            if (context.stage == "prod-futurX") {
                myBlockchainId = 900000;
                destBlockchainId = 56
            } else if (context.stage == "test") {
                myBlockchainId = 910000;
                destBlockchainId = 97;
            } else if (context.stage == "dev") {
                myBlockchainId = 920000;
                destBlockchainId = 930000;
            }

            const positionHouseContractAddress = await context.db.findAddressByKey('PositionHouse');
            const positionHouseConfigurationProxyContractAddress = await context.db.findAddressByKey('PositionHouseConfigurationProxy');
            const insuranceFundInterfaceContractAddress = await context.db.findAddressByKey('InsuranceFund');

            await context.factory.createLiquidatorGateway({
                positionHouse: positionHouseContractAddress,
                positionHouseConfigurationProxy: positionHouseConfigurationProxyContractAddress,
                insuranceFund: insuranceFundInterfaceContractAddress,
                myBlockchainId: myBlockchainId,
                destBlockchainId: destBlockchainId
            })
        },

        're-config liquidator gateway': async () => {
            const dptpCrossChainGateway = await context.db.findAddressByKey('DptpCrossChainGateway');
            const liquidatorGateway = await context.factory.getDeployedContract<LiquidatorGateway>(
                "LiquidatorGateway"
            );
            
            let tx;

            tx = liquidatorGateway.setCrossChainGateway(dptpCrossChainGateway);
            await context.factory.waitTx(tx, `liquidatorGateway.setCrossChainGateway(${dptpCrossChainGateway})`)

            tx = liquidatorGateway.setDestinationChainID(421613);
            await context.factory.waitTx(tx, `liquidatorGateway.setDestinationChainID(421613)`)

            tx = liquidatorGateway.setDestinationFuturesGateway("0xEC03E9563A26ba0D27b43b3269b0c364D2CDfb3a");
            await context.factory.waitTx(tx, `liquidatorGateway.setDestinationFuturesGateway("0xEC03E9563A26ba0D27b43b3269b0c364D2CDfb3a")`)
        },

        'deploy contract market maker gateway': async () => {
            /**
             * Currently no param
             */
            await context.factory.createMarketMakerGateway({})

        },

        'deploy contract cross chain gateway': async () => {
            let myBlockchainId;
            let destBlockchainId;
            let timeHorizon = 86400;
            if (context.stage == "production") {
                myBlockchainId = 900000;
                destBlockchainId = 56
            } else if (context.stage == "test") {
                myBlockchainId = 910000;
                destBlockchainId = 97;
            } else if (context.stage == "dev") {
                myBlockchainId = 920000;
                destBlockchainId = 930000;
            }

            const positionHouseAddress = await context.db.findAddressByKey('PositionHouse')
            const positionStrategyOrderContractAddress = await context.db.findAddressByKey('PositionStrategyOrder');
            await context.factory.createCrossChainGateway({
                positionHouse: positionHouseAddress,
                positionStrategyOrder: positionStrategyOrderContractAddress,
                myBlockchainId: myBlockchainId,
                destBlockchainId: destBlockchainId,
                timeHorizon: timeHorizon
            });
        }
    })
}


export default migrations;
