import { MigrationContext, MigrationDefinition } from "../types";

const migrations: MigrationDefinition = {
  getTasks: (context: MigrationContext) => ({
    "deploy dptp validator contract": async () => {
      /**
       * Currently no param
       */
      const positionHouse = await context.db.findAddressByKey("PositionHouse");
      const accessController = await context.db.findAddressByKey(
        "AccessController"
      );
      await context.factory.createDptpValidator({
        positionHouse: positionHouse,
        accessController: accessController,
      });
    },

    "deploy order tracker": async () => {
      await context.factory.createOrderTracker();
    },
  }),
};

export default migrations;
