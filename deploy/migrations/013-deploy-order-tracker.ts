import { MigrationContext, MigrationDefinition } from "../types";
import {DptpCrossChainGateway, OrderTracker} from "../../typeChain";
import {ContractTransaction} from "ethers";

const migrations: MigrationDefinition = {
  getTasks: (context: MigrationContext) => ({
    "deploy order tracker": async () => {
      /**
       * Currently no param
       */

      await context.factory.createOrderTracker();
    },
    "re-config order tracker": async () => {

      const orderTracker = await context.factory.getDeployedContract<OrderTracker>(
          "OrderTracker"
      );

      const dptpCrossChainGateway = await context.factory.getDeployedContract<DptpCrossChainGateway>("DptpCrossChainGateway")
      const positionHouse = await context.db.findAddressByKey("PositionHouse")

      let tx: Promise<ContractTransaction>

      // tx = orderTracker.setCrossChainGateway(dptpCrossChainGateway.address);
      // await context.factory.waitTx(tx, "orderTracker.setCrossChainGateway")

      tx = orderTracker.setPositionHouse(positionHouse);
      await context.factory.waitTx(tx, "orderTracker.setPositionHouse")

      // tx = dptpCrossChainGateway.setOrderTracker(orderTracker.address);
      // await context.factory.waitTx(tx, "orderTracker.setOrderTracker")
    },
  }),
};

export default migrations;
