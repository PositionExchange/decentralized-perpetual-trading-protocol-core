
  
  
// @notice this code is generated from "yaml" file using the script/auto-gen-test-case.ts

import { deployAndCreateHelper, TestFutureHelper } from "./utils";  
  
describe("Create_Market_No_Position_01_07.yml", async function(){
  let testHelper: TestFutureHelper

  beforeEach(async () => {
    testHelper = await deployAndCreateHelper()
  })

  
    it("test case ## case01. File index 1", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 10
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 5000
- S2: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 1
    Side: 0
    Deposit: 4800
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 4800
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 4800
      MarginRatio: 3
      LiquidationPrice: 4434.7
    BalanceChanged: -4800
    ClaimableAmount: 4800
- S3: ChangePrice
  Input:
    Price: 4950
- S4: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 4800
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 500
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 5300
      MarginRatio: 2
      LiquidationPrice: 4434.7
    BalanceChanged: 0
    ClaimableAmount: 4800

      `)
    })
    
    it("test case ## case02. File index 2", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 10
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 5000
- S2: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 1
    Side: 0
    Deposit: 4000
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 4000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 4000
      MarginRatio: 3
      LiquidationPrice: 4514.7
    BalanceChanged: -4000
    ClaimableAmount: 4000
- S3: ChangePrice
  Input:
    Price: 4518
- S4: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 4000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: -3820
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 180
      MarginRatio: 81
      LiquidationPrice: 4514.7
    BalanceChanged: 0
    ClaimableAmount: 4000
- S5: Liquidate
  Input:
    Trader: 1
    Liquidator: 2
  Expect:
    Position:
      Quantity: 8
      MarginDeposit: 3880
      MarginAbsolute: 4753
      Notional: 39200
      Pnl: -3055.92
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 142.59
      MarginBalance: 824.08
      MarginRatio: 17
      LiquidationPrice: 4432.82375
    BalanceChanged: 60
    ClaimableAmount: 3880

      `)
    })
    
    it("test case ## case03. File index 3", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 10
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 5000
- S2: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 1
    Side: 0
    Deposit: 4000
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 4000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 4000
      MarginRatio: 3
      LiquidationPrice: 4514.7
    BalanceChanged: -4000
    ClaimableAmount: 4000
- S3: ChangePrice
  Input:
    Price: 4510
- S4: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 4000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: -3900
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 100
      MarginRatio: 100
      LiquidationPrice: 4514.7
    BalanceChanged: 0
    ClaimableAmount: 4000
- S5: Liquidate
  Input:
    Trader: 1
    Liquidator: 2
  Expect:
    Position:
      Quantity: 0
      MarginDeposit: 0
      MarginAbsolute: 0
      Notional: 0
      Pnl: 0
      Leverage: 0
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPrice: 0
    BalanceChanged: 60
    ClaimableAmount: 0

      `)
    })
    
    it("test case ## case04. File index 4", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 10
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 5000
- S2: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 4800
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 4800
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 4800
      MarginRatio: 3
      LiquidationPrice: 5365.37
    BalanceChanged: -4800
    ClaimableAmount: 4800

      `)
    })
    
    it("test case ## case05. File index 5", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 10
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 5000
- S2: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 1
    Side: 0
    Deposit: 4000
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 4000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 4000
      MarginRatio: 3
      LiquidationPrice: 4514.7
    BalanceChanged: -4000
    ClaimableAmount: 4000
- S3: ChangePrice
  Input:
    Price: 4514
- S4: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 4000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: -3860
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 140
      MarginRatio: 100
      LiquidationPrice: 4514.7
    BalanceChanged: 0
    ClaimableAmount: 4000
- S5: Liquidate
  Input:
    Trader: 1
    Liquidator: 2
  Expect:
    Position:
      Quantity: 0
      MarginDeposit: 0
      MarginAbsolute: 0
      Notional: 0
      Pnl: 0
      Leverage: 0
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPrice: 0
    BalanceChanged: 60
    ClaimableAmount: 0

      `)
    })
    
    it("test case ## case06. File index 6", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 10
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 5000
- S2: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 4000
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 4000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 4000
      MarginRatio: 3
      LiquidationPrice: 5285.3
    BalanceChanged: -4000
    ClaimableAmount: 4000
- S3: ChangePrice
  Input:
    Price: 5282
- S4: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 4000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: -3820
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 180
      MarginRatio: 81
      LiquidationPrice: 5285.3
    BalanceChanged: 0
    ClaimableAmount: 4000
- S5: Liquidate
  Input:
    Trader: 1
    Liquidator: 2
  Expect:
    Position:
      Quantity: -8
      MarginDeposit: 3880
      MarginAbsolute: 4753
      Notional: 39200
      Pnl: -3055.92
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 142.59
      MarginBalance: 824.08
      MarginRatio: 17
      LiquidationPrice: 5372.17625
    BalanceChanged: 0
    ClaimableAmount: 3880

      `)
    })
    
    it("test case ## case07. File index 7", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 10
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 5000
- S2: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 4000
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 4000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 4000
      MarginRatio: 3
      LiquidationPrice: 5285.3
    BalanceChanged: -4000
    ClaimableAmount: 4000
- S3: ChangePrice
  Input:
    Price: 5290
- S4: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 4000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: -3900
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 100
      MarginRatio: 100
      LiquidationPrice: 5285.3
    BalanceChanged: 0
    ClaimableAmount: 4000
- S5: Liquidate
  Input:
    Trader: 1
    Liquidator: 2
  Expect:
    Position:
      Quantity: 0
      MarginDeposit: 0
      MarginAbsolute: 0
      Notional: 0
      Pnl: 0
      Leverage: 0
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPrice: 0
    BalanceChanged: 60
    ClaimableAmount: 0

      `)
    })
    })