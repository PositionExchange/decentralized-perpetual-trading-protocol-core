import { MigrationContext, MigrationDefinition } from "../types";
import {DptpCrossChainGateway, OrderTracker} from "../../typeChain";
import {ContractTransaction} from "ethers";

const migrations: MigrationDefinition = {
  getTasks: (context: MigrationContext) => ({
    'deploy dptp cross chain gateway': async () => {
      const myBlockchainId = context.stage === "prod-futurX" ? 900000 : 910000;
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
            chainId: 421613,
            address: "0x2F17eed46c4D0e78697F152259323fE7C32bDA56",
          },
        ],
      });
    },

    "re-config cross chain gateway" : async () => {

      const dptpCrossChainGateway = await context.factory.getDeployedContract<DptpCrossChainGateway>(
          "DptpCrossChainGateway"
      );
      const destChainId = 421613;
      const destChainTPSLGateway = "0x1A85FF339e798b743AE7439e4A23e2C8f486cBb8"

      const orderTracker = await context.db.findAddressByKey("OrderTracker")

      let tx: Promise<ContractTransaction>

      tx = dptpCrossChainGateway.setOrderTracker(orderTracker);
      await context.factory.waitTx(tx, "dptpCrossChainGateway.setOrderTracker")

      tx = dptpCrossChainGateway.addDestChainTPSLGateway(destChainId, destChainTPSLGateway);
      await context.factory.waitTx(tx, "dptpCrossChainGateway.addDestChainTPSLGateway")
    },

    "force import dptp cross chain gateway": async () => {
      const dptpCrossChainGateway = await context.db.findAddressByKey("DptpCrossChainGateway");
      const factory = await context.hre.ethers.getContractFactory("DptpCrossChainGateway");
      if (dptpCrossChainGateway) {
        await context.hre.upgrades.forceImport(dptpCrossChainGateway, factory);
        return;
      }
    },
  }),
};

export default migrations;
