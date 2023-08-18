import { MigrationContext, MigrationDefinition } from "../types";
import {DptpCrossChainGateway, OrderTracker} from "../../typeChain";
import {ContractTransaction} from "ethers";

const migrations: MigrationDefinition = {
    getTasks: (context: MigrationContext) => ({
        "deploy current trading chain": async () => {
            /**
             * Currently no param
             */
            const positionHouse = await context.db.findAddressByKey("PositionHouse");
            const accessController = await context.db.findAddressByKey(
                "AccessController"
            );

            await context.factory.createCurrentTradingChain(positionHouse, accessController);
        },

    }),
};

export default migrations;
