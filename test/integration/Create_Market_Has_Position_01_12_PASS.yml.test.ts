
  
  
// @notice this code is generated from "yaml" file using the script/auto-gen-test-case.ts

import { deployAndCreateHelper, TestFutureHelper } from "./utils";  
  
describe("Create_Market_Has_Position_01_12.yml", async function(){
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
- S3: OpenLimit
  Input:
    Quantity: 5
    Price: 5000
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 3000
- S4: OpenLimit
  Input:
    Quantity: 5
    Price: 4950
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 3000
- S5: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 1
    Side: 0
    Deposit: 5200
  Expect:
    Position:
      Quantity: 20
      MarginDeposit: 10000
      MarginAbsolute: 9875
      Notional: 98750
      Pnl: 1250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 296.25
      MarginBalance: 11250
      MarginRatio: 2
      LiquidationPrice: 4452.3125
    BalanceChanged: -5200
    ClaimableAmount: 10000

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
    Deposit: 5000
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 5000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 5000
      MarginRatio: 2
      LiquidationPrice: 4414.7
    BalanceChanged: -5000
    ClaimableAmount: 5000
- S3: OpenLimit
  Input:
    Quantity: 5
    Price: 5000
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 3000
- S4: OpenLimit
  Input:
    Quantity: 5
    Price: 4950
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 3000
- S5: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 1
    Side: 0
    Deposit: 4000
  Expect:
    Position:
      Quantity: 20
      MarginDeposit: 9000
      MarginAbsolute: 9875
      Notional: 98750
      Pnl: 1250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 296.25
      MarginBalance: 10250
      MarginRatio: 2
      LiquidationPrice: 4502.3125
    BalanceChanged: -4000
    ClaimableAmount: 9000

      `)
    })
    
    it("test case ## case03. File index 3", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 10
    Price: 5000
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
      MarginAbsolute: 5000
      Notional: 50000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 150
      MarginBalance: 4000
      MarginRatio: 3
      LiquidationPrice: 5385
    BalanceChanged: -4000
    ClaimableAmount: 4000
- S3: OpenLimit
  Input:
    Quantity: 5
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 3000
- S4: OpenLimit
  Input:
    Quantity: 5
    Price: 4950
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 3000
- S5: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 5000
  Expect:
    Position:
      Quantity: -20
      MarginDeposit: 9000
      MarginAbsolute: 9925
      Notional: 99250
      Pnl: 1250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 297.75
      MarginBalance: 10250
      MarginRatio: 2
      LiquidationPrice: 5397.6125
    BalanceChanged: -5000
    ClaimableAmount: 9000

      `)
    })
    
    it("test case ## case04. File index 4", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 10
    Price: 5000
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
    Deposit: 5100
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 5100
      MarginAbsolute: 5000
      Notional: 50000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 150
      MarginBalance: 5100
      MarginRatio: 2
      LiquidationPrice: 5495
    BalanceChanged: -5100
    ClaimableAmount: 5100
- S3: OpenLimit
  Input:
    Quantity: 5
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 3000
- S4: OpenLimit
  Input:
    Quantity: 5
    Price: 4950
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 3000
- S5: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 4000
  Expect:
    Position:
      Quantity: -20
      MarginDeposit: 9100
      MarginAbsolute: 9925
      Notional: 99250
      Pnl: 1250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 297.75
      MarginBalance: 10350
      MarginRatio: 2
      LiquidationPrice: 5402.6125
    BalanceChanged: -4000
    ClaimableAmount: 9100

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
- S3: OpenLimit
  Input:
    Quantity: 5
    Price: 5000
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 3000
- S4: OpenLimit
  Input:
    Quantity: 5
    Price: 4950
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 3000
- S5: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 1
    Side: 0
    Deposit: 5200
  Expect:
    Position:
      Quantity: 20
      MarginDeposit: 9200
      MarginAbsolute: 9875
      Notional: 98750
      Pnl: 1250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 296.25
      MarginBalance: 10450
      MarginRatio: 2
      LiquidationPrice: 4492.3125
    BalanceChanged: -5200
    ClaimableAmount: 9200
- S6: ChangePrice
  Input:
    Price: 4496
- S7: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: 20
      MarginDeposit: 9200
      MarginAbsolute: 9875
      Notional: 98750
      Pnl: -8830
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 296.25
      MarginBalance: 370
      MarginRatio: 80
      LiquidationPrice: 4492.3125
    BalanceChanged: 0
    ClaimableAmount: 9200
- S8: Liquidate
  Input:
    Trader: 1
    Liquidator: 2
  Expect:
    Position:
      Quantity: 16
      MarginDeposit: 8924
      MarginAbsolute: 9578.75
      Notional: 79000
      Pnl: -7063.84
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 287.3625
      MarginBalance: 1860.16
      MarginRatio: 15
      LiquidationPrice: 4397.710156
    BalanceChanged: 138
    ClaimableAmount: 8924

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
- S3: OpenLimit
  Input:
    Quantity: 5
    Price: 5000
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 3000
- S4: OpenLimit
  Input:
    Quantity: 5
    Price: 4950
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 3000
- S5: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 1
    Side: 0
    Deposit: 5200
  Expect:
    Position:
      Quantity: 20
      MarginDeposit: 9200
      MarginAbsolute: 9875
      Notional: 98750
      Pnl: 1250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 296.25
      MarginBalance: 10450
      MarginRatio: 2
      LiquidationPrice: 4492.3125
    BalanceChanged: -5200
    ClaimableAmount: 9200
- S6: ChangePrice
  Input:
    Price: 4490
- S7: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: 20
      MarginDeposit: 9200
      MarginAbsolute: 9875
      Notional: 98750
      Pnl: -8950
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 296.25
      MarginBalance: 250
      MarginRatio: 100
      LiquidationPrice: 4492.3125
    BalanceChanged: 0
    ClaimableAmount: 9200
- S8: Liquidate
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
    BalanceChanged: 138
    ClaimableAmount: 0

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
      LiquidationPrice: 5375.3
    BalanceChanged: -4000
    ClaimableAmount: 4000
- S3: OpenLimit
  Input:
    Quantity: 5
    Price: 5000
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 3000
- S4: OpenLimit
  Input:
    Quantity: 5
    Price: 4950
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 3000
- S5: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 5200
  Expect:
    Position:
      Quantity: -20
      MarginDeposit: 9200
      MarginAbsolute: 9875
      Notional: 98750
      Pnl: -250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 296.25
      MarginBalance: 8950
      MarginRatio: 3
      LiquidationPrice: 5382.6875
    BalanceChanged: -5200
    ClaimableAmount: 9200
- S6: ChangePrice
  Input:
    Price: 5379
- S7: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -20
      MarginDeposit: 9200
      MarginAbsolute: 9875
      Notional: 98750
      Pnl: -8830
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 296.25
      MarginBalance: 370
      MarginRatio: 80
      LiquidationPrice: 4492.3125
    BalanceChanged: 0
    ClaimableAmount: 9200
- S8: Liquidate
  Input:
    Trader: 1
    Liquidator: 2
  Expect:
    Position:
      Quantity: -16
      MarginDeposit: 8924
      MarginAbsolute: 9578.75
      Notional: 79000
      Pnl: -7063.84
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 287.3625
      MarginBalance: 1860.16
      MarginRatio: 15
      LiquidationPrice: 5477.289844
    BalanceChanged: 138
    ClaimableAmount: 8924

      `)
    })
    
    it("test case ## case08. File index 8", async function() {
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
      LiquidationPrice: 5375.3
    BalanceChanged: -4000
    ClaimableAmount: 4000
- S3: OpenLimit
  Input:
    Quantity: 5
    Price: 5000
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 3000
- S4: OpenLimit
  Input:
    Quantity: 5
    Price: 4950
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 3000
- S5: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 5200
  Expect:
    Position:
      Quantity: -20
      MarginDeposit: 9200
      MarginAbsolute: 9875
      Notional: 98750
      Pnl: -250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 296.25
      MarginBalance: 8950
      MarginRatio: 3
      LiquidationPrice: 5382.6875
    BalanceChanged: -5200
    ClaimableAmount: 9200
- S6: ChangePrice
  Input:
    Price: 5385
- S7: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -20
      MarginDeposit: 9200
      MarginAbsolute: 9875
      Notional: 98750
      Pnl: -8950
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 296.25
      MarginBalance: 250
      MarginRatio: 100
      LiquidationPrice: 4492.3125
    BalanceChanged: 0
    ClaimableAmount: 9200
- S8: Liquidate
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
    BalanceChanged: 138
    ClaimableAmount: 0

      `)
    })
    
    it("test case ## case09. File index 9", async function() {
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
    Deposit: 5200
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 5200
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 5200
      MarginRatio: 2
      LiquidationPrice: 4394.7
    BalanceChanged: -5200
    ClaimableAmount: 5200
- S3: OpenLimit
  Input:
    Quantity: 5
    Price: 5000
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 3000
- S4: OpenLimit
  Input:
    Quantity: 5
    Price: 4950
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 3000
- S5: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 1
    Side: 0
    Deposit: 4000
  Expect:
    Position:
      Quantity: 20
      MarginDeposit: 9200
      MarginAbsolute: 9875
      Notional: 98750
      Pnl: 1250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 296.25
      MarginBalance: 10450
      MarginRatio: 2
      LiquidationPrice: 4492.3125
    BalanceChanged: -4000
    ClaimableAmount: 9200
- S6: ChangePrice
  Input:
    Price: 4496
- S7: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: 20
      MarginDeposit: 9200
      MarginAbsolute: 9875
      Notional: 98750
      Pnl: -8830
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 296.25
      MarginBalance: 370
      MarginRatio: 80
      LiquidationPrice: 4492.3125
    BalanceChanged: 0
    ClaimableAmount: 9200
- S8: Liquidate
  Input:
    Trader: 1
    Liquidator: 2
  Expect:
    Position:
      Quantity: 16
      MarginDeposit: 8924
      MarginAbsolute: 9578.75
      Notional: 79000
      Pnl: -7063.84
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 287.3625
      MarginBalance: 1860.16
      MarginRatio: 15
      LiquidationPrice: 4397.710156
    BalanceChanged: 138
    ClaimableAmount: 8924

      `)
    })
    
    it("test case ## case10. File index 10", async function() {
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
    Deposit: 5200
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 5200
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 5200
      MarginRatio: 2
      LiquidationPrice: 4394.7
    BalanceChanged: -5200
    ClaimableAmount: 5200
- S3: OpenLimit
  Input:
    Quantity: 5
    Price: 5000
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 3000
- S4: OpenLimit
  Input:
    Quantity: 5
    Price: 4950
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 3000
- S5: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 1
    Side: 0
    Deposit: 4000
  Expect:
    Position:
      Quantity: 20
      MarginDeposit: 9200
      MarginAbsolute: 9875
      Notional: 98750
      Pnl: 1250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 296.25
      MarginBalance: 10450
      MarginRatio: 2
      LiquidationPrice: 4492.3125
    BalanceChanged: -4000
    ClaimableAmount: 9200
- S6: ChangePrice
  Input:
    Price: 4490
- S7: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: 20
      MarginDeposit: 9200
      MarginAbsolute: 9875
      Notional: 98750
      Pnl: -8950
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 296.25
      MarginBalance: 250
      MarginRatio: 100
      LiquidationPrice: 4492.3125
    BalanceChanged: 0
    ClaimableAmount: 9200
- S8: Liquidate
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
    BalanceChanged: 138
    ClaimableAmount: 0

      `)
    })
    
    it("test case ## case11. File index 11", async function() {
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
    Deposit: 5200
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 5200
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 5200
      MarginRatio: 2
      LiquidationPrice: 5405.3
    BalanceChanged: -5200
    ClaimableAmount: 5200
- S3: OpenLimit
  Input:
    Quantity: 5
    Price: 5000
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 3000
- S4: OpenLimit
  Input:
    Quantity: 5
    Price: 4950
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 3000
- S5: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 4000
  Expect:
    Position:
      Quantity: -20
      MarginDeposit: 9200
      MarginAbsolute: 9875
      Notional: 98750
      Pnl: -250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 296.25
      MarginBalance: 8950
      MarginRatio: 3
      LiquidationPrice: 5382.6875
    BalanceChanged: -4000
    ClaimableAmount: 9200
- S6: ChangePrice
  Input:
    Price: 5379
- S7: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -20
      MarginDeposit: 9200
      MarginAbsolute: 9875
      Notional: 98750
      Pnl: -8830
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 296.25
      MarginBalance: 370
      MarginRatio: 80
      LiquidationPrice: 5382.6875
    BalanceChanged: 0
    ClaimableAmount: 9200
- S8: Liquidate
  Input:
    Trader: 1
    Liquidator: 2
  Expect:
    Position:
      Quantity: -16
      MarginDeposit: 8924
      MarginAbsolute: 9578.75
      Notional: 79000
      Pnl: -7063.84
      Leverage: 0
    MaintenanceDetail:
      MaintenanceMargin: 287.3625
      MarginBalance: 1860.16
      MarginRatio: 15
      LiquidationPrice: 5477.289844
    BalanceChanged: 138
    ClaimableAmount: 8924

      `)
    })
    
    it("test case ## case12. File index 12", async function() {
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
    Deposit: 5200
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 5200
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 5200
      MarginRatio: 2
      LiquidationPrice: 5405.3
    BalanceChanged: -5200
    ClaimableAmount: 5200
- S3: OpenLimit
  Input:
    Quantity: 5
    Price: 5000
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 3000
- S4: OpenLimit
  Input:
    Quantity: 5
    Price: 4950
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 3000
- S5: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 4000
  Expect:
    Position:
      Quantity: -20
      MarginDeposit: 9200
      MarginAbsolute: 9875
      Notional: 98750
      Pnl: -250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 296.25
      MarginBalance: 8950
      MarginRatio: 3
      LiquidationPrice: 5382.6875
    BalanceChanged: -4000
    ClaimableAmount: 9200
- S6: ChangePrice
  Input:
    Price: 5385
- S7: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -20
      MarginDeposit: 9200
      MarginAbsolute: 9875
      Notional: 98750
      Pnl: -8950
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 296.25
      MarginBalance: 250
      MarginRatio: 100
      LiquidationPrice: 5382.6875
    BalanceChanged: 0
    ClaimableAmount: 9200
- S8: Liquidate
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
    BalanceChanged: 138
    ClaimableAmount: 0

      `)
    })
    })