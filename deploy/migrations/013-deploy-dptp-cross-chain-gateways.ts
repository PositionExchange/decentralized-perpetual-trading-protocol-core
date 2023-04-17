import { MigrationContext, MigrationDefinition } from "../types";

const migrations: MigrationDefinition = {
  getTasks: (context: MigrationContext) => ({
    'deploy dptp cross chain gateway': async () => {
      const myBlockchainId = context.stage === "production" ? 900000 : 910000;
      const timeHorizon = 86400;
      const positionHouseAddress = await context.db.findAddressByKey(
        "PositionHouse"
      );
      const positionStrategyOrderAddress = await context.db.findAddressByKey(
        "PositionStrategyOrder"
      );

      await context.factory.createDptpCrossChainGateway({
        myBlockchainId: myBlockchainId,
        timeHorizon: timeHorizon,
        positionHouse: positionHouseAddress,
        positionStrategyOrder: positionStrategyOrderAddress,
        whitelistRelayers: [
          {
            chainId: 97,
            address: "0x9AC215Dcbd4447cE0aa830Ed17f3d99997a10F5F",
          },
        ],
        destChainFuturesGateways: [
          {
            chainId: 97,
            address: "0x7f8cd121aedd5249a03328ce792c6fc5a7f224ce",
          },
        ],
      });
    },
  }),
};

export default migrations;
