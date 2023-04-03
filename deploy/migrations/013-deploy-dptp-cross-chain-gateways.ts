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
            address: "0x148eC2C7D014FA41D6072129977E3040C9Ab9125",
          },
        ],
      });
    },
  }),
};

export default migrations;
