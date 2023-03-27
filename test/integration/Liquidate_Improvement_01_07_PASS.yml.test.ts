
  
  
// @notice this code is generated from "yaml" file using the script/auto-gen-test-case.ts

import { deployAndCreateHelper, TestFutureHelper } from "./utils";  
  
describe("Liquidate_Improvement_01_07.yml", async function(){
  let testHelper: TestFutureHelper

  beforeEach(async () => {
    testHelper = await deployAndCreateHelper()
  })

  
    it("test case ## case01. File index 1", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 5
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 2500
- S2: OpenMarket
  Input:
    Quantity: 5
    Leverage: 10
    Trader: 1
    Side: 0
    Deposit: 2500
  Expect:
    Position:
      Quantity: 5
      MarginDeposit: 2500
      MarginAbsolute: 2450
      Notional: 24500
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 73.5
      MarginBalance: 2500
      MarginRatio: 2
      LiquidationPrice: 4414.7
    ClaimedProfit: 0
    BalanceChanged: -2500
    ClaimableAmount: 2500
- S3: OpenLimit
  Input:
    Quantity: 5
    Price: 5000
    Leverage: 10
    Trader: 1
    Side: 0
    Deposit: 2500
- S4: OpenMarket
  Input:
    Quantity: 5
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 2500
- S5: ExpectData
  Input:
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 0
    Position:
      Quantity: 10
      MarginDeposit: 5000
      MarginAbsolute: 4950
      Notional: 49500
      Pnl: 500
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 148.5
      MarginBalance: 5500
      MarginRatio: 2
      LiquidationPrice: 4464.85
    ClaimedProfit: 0
    BalanceChanged: 0
    ClaimableAmount: 5000
- S6: ChangePrice
  Input:
    Price: 4460
- S7: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 5000
      MarginAbsolute: 4950
      Notional: 49500
      Pnl: -4900
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 148.5
      MarginBalance: 100
      MarginRatio: 100
      LiquidationPrice: 4464.85
    ClaimedProfit: 0
    BalanceChanged: 0
    ClaimableAmount: 5000
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
    ClaimedProfit: 0
    BalanceChanged: 75
    ClaimableAmount: 0

      `)
    })
    
    it("test case ## case02. File index 2", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 5
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 2500
- S2: OpenMarket
  Input:
    Quantity: 5
    Leverage: 10
    Trader: 1
    Side: 0
    Deposit: 2500
  Expect:
    Position:
      Quantity: 5
      MarginDeposit: 2500
      MarginAbsolute: 2450
      Notional: 24500
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 73.5
      MarginBalance: 2500
      MarginRatio: 2
      LiquidationPrice: 4414.7
    ClaimedProfit: 0
    BalanceChanged: -2500
    ClaimableAmount: 2500
- S3: OpenLimit
  Input:
    Quantity: 5
    Price: 4300
    Leverage: 10
    Trader: 1
    Side: 0
    Deposit: 2500
- S4: ChangePrice
  Input:
    Price: 4414
- S5: ExpectData
  Input:
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4300
      Id: 1
      Quantity: 5
      PartialFilled: 0
    Position:
      Quantity: 5
      MarginDeposit: 2500
      MarginAbsolute: 2450
      Notional: 24500
      Pnl: -2430
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 73.5
      MarginBalance: 70
      MarginRatio: 100
      LiquidationPrice: 4414.7
    ClaimedProfit: 0
    BalanceChanged: 0
    ClaimableAmount: 2500
- S6: Liquidate
  Input:
    Trader: 1
    Liquidator: 2
  Expect:
    Position:
      Quantity: 5
      MarginDeposit: 2500
      MarginAbsolute: 2150
      Notional: 21500
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 64.5
      MarginBalance: 2500
      MarginRatio: 2
      LiquidationPrice: 3812.9
    ClaimedProfit: 0
    BalanceChanged: 37.5
    ClaimableAmount: 2500

      `)
    })
    
    it("test case ## case03. File index 3", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 5
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 2500
- S2: OpenMarket
  Input:
    Quantity: 5
    Leverage: 10
    Trader: 1
    Side: 0
    Deposit: 2500
  Expect:
    Position:
      Quantity: 5
      MarginDeposit: 2500
      MarginAbsolute: 2450
      Notional: 24500
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 73.5
      MarginBalance: 2500
      MarginRatio: 2
      LiquidationPrice: 4414.7
    ClaimedProfit: 0
    BalanceChanged: -2500
    ClaimableAmount: 2500
- S3: OpenLimit
  Input:
    Quantity: 5
    Price: 4300
    Leverage: 10
    Trader: 1
    Side: 0
    Deposit: 2500
- S4: OpenLimit
  Input:
    Quantity: 5
    Price: 4400
    Leverage: 10
    Trader: 3
    Side: 0
    Deposit: 2500
- S5: ChangePrice
  Input:
    Price: 4414
- S6: ExpectData
  Input:
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4300
      Id: 1
      Quantity: 5
      PartialFilled: 0
    Position:
      Quantity: 5
      MarginDeposit: 2500
      MarginAbsolute: 2450
      Notional: 24500
      Pnl: -2430
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 73.5
      MarginBalance: 70
      MarginRatio: 100
      LiquidationPrice: 4414.7
    ClaimedProfit: 0
    BalanceChanged: 0
    ClaimableAmount: 2500
- S7: Liquidate
  Input:
    Trader: 1
    Liquidator: 2
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4300
      Id: 1
      Quantity: 5
      PartialFilled: 0
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
    ClaimedProfit: 0
    BalanceChanged: 37.5
    ClaimableAmount: 0

      `)
    })
    
    it("test case ## case04. File index 4", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 5
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 2500
- S2: OpenMarket
  Input:
    Quantity: 5
    Leverage: 10
    Trader: 1
    Side: 0
    Deposit: 2500
  Expect:
    Position:
      Quantity: 5
      MarginDeposit: 2500
      MarginAbsolute: 2450
      Notional: 24500
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 73.5
      MarginBalance: 2500
      MarginRatio: 2
      LiquidationPrice: 4414.7
    ClaimedProfit: 0
    BalanceChanged: -2500
    ClaimableAmount: 2500
- S3: CloseLimit
  Input:
    Quantity: 1
    Price: 5100
    Trader: 1
- S4: CloseLimit
  Input:
    Quantity: 2
    Price: 5200
    Trader: 1
- S5: CloseLimit
  Input:
    Quantity: 1
    Price: 5300
    Trader: 1
- S6: OpenMarket
  Input:
    Quantity: 2
    Leverage: 10
    Trader: 3
    Side: 0
    Deposit: 1000
- S7: ChangePrice
  Input:
    Price: 4414
- S8: ExpectData
  Input:
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 2
      Price: 5200,5300
      ID: 0,0
      Quantity: 1,1
      PartialFilled: 1,0
    Position:
      Quantity: 3
      MarginDeposit: 1500
      MarginAbsolute: 1470
      Notional: 14700
      Pnl: -1458
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 44.1
      MarginBalance: 42
      MarginRatio: 100
      LiquidationPrice: 4414.7
    ClaimedProfit: 0
    BalanceChanged: 0
    ClaimableAmount: 3000
- S9: Liquidate
  Input:
    Trader: 1
    Liquidator: 2
  Expect:
    PendingOrder:
      Orders: 0
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
    ClaimedProfit: 1500
    BalanceChanged: 22.5
    ClaimableAmount: 0

      `)
    })
    
    it("test case ## case05. File index 5", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 6
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 3000
- S2: OpenMarket
  Input:
    Quantity: 6
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 3000
  Expect:
    Position:
      Quantity: -6
      MarginDeposit: 3000
      MarginAbsolute: 2940
      Notional: 29400
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 88.2
      MarginBalance: 3000
      MarginRatio: 2
      LiquidationPrice: 5385.3
    ClaimedProfit: 0
    BalanceChanged: -3000
    ClaimableAmount: 3000
- S3: CloseLimit
  Input:
    Quantity: 1
    Price: 4700
    Trader: 1
- S4: OpenMarket
  Input:
    Quantity: 1
    Leverage: 10
    Trader: 3
    Side: 1
    Deposit: 600
- S5: OpenLimit
  Input:
    Quantity: 1
    Price: 5000
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 500
- S6: OpenMarket
  Input:
    Quantity: 1
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 500
- S7: ChangePrice
  Input:
    Price: 5403
- S8: ExpectData
  Input:
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 0
    Position:
      Quantity: -6
      MarginDeposit: 3000
      MarginAbsolute: 2950
      Notional: 29500
      Pnl: -2918
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 88.5
      MarginBalance: 83.45
      MarginRatio: 100
      LiquidationPrice: 5401.917
    ClaimedProfit: 0
    BalanceChanged: 0
    ClaimableAmount: 3700
- S9: Liquidate
  Input:
    Trader: 1
    Liquidator: 2
  Expect:
    PendingOrder:
      Orders: 0
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
    ClaimedProfit: 700
    BalanceChanged: 45.021
    ClaimableAmount: 0

      `)
    })
    
    it("test case ## case06. File index 6", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 5
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 2500
- S2: OpenMarket
  Input:
    Quantity: 5
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 2500
  Expect:
    Position:
      Quantity: -5
      MarginDeposit: 2500
      MarginAbsolute: 2450
      Notional: 24500
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 73.5
      MarginBalance: 2500
      MarginRatio: 2
      LiquidationPrice: 5385.3
    ClaimedProfit: 0
    BalanceChanged: -2500
    ClaimableAmount: 2500
- S3: OpenLimit
  Input:
    Quantity: 3
    Price: 5400
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 1500
- S4: OpenLimit
  Input:
    Quantity: 3
    Price: 5399
    Leverage: 10
    Trader: 3
    Side: 1
    Deposit: 1500
- S5: ChangePrice
  Input:
    Price: 5390
- S6: ExpectData
  Input:
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 1
      Price: 5400
      ID: 1
      Quantity: 3
      PartialFilled: 0
    Position:
      Quantity: -5
      MarginDeposit: 2500
      MarginAbsolute: 2450
      Notional: 24500
      Pnl: -2450
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 73.5
      MarginBalance: 50
      MarginRatio: 100
      LiquidationPrice: 5385.3
    ClaimedProfit: 0
    BalanceChanged: 0
    ClaimableAmount: 2500
- S7: Liquidate
  Input:
    Trader: 1
    Liquidator: 2
  Expect:
    PendingOrder:
      Orders: 1
      Price: 5400
      Id: 1
      Quantity: 3
      PartialFilled: 2
    Position:
      Quantity: -2
      MarginDeposit: 1000
      MarginAbsolute: 1080
      Notional: 10800
      Pnl: 0
      Leverage: 0
    MaintenanceDetail:
      MaintenanceMargin: 32.4
      MarginBalance: 1000
      MarginRatio: 3
      LiquidationPrice: 5883.8
    ClaimedProfit: 0
    BalanceChanged: 37.5
    ClaimableAmount: 1000

      `)
    })
    
    it("test case ## case07. File index 7", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 5
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 2500
- S2: OpenMarket
  Input:
    Quantity: 5
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 2500
  Expect:
    Position:
      Quantity: -5
      MarginDeposit: 2500
      MarginAbsolute: 2450
      Notional: 24500
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 73.5
      MarginBalance: 2500
      MarginRatio: 2
      LiquidationPrice: 5385.3
    ClaimedProfit: 0
    BalanceChanged: -2500
    ClaimableAmount: 2500
- S3: CloseLimit
  Input:
    Quantity: 1
    Price: 4700
    Trader: 1
- S4: CloseLimit
  Input:
    Quantity: 2
    Price: 4600
    Trader: 1
- S5: CloseLimit
  Input:
    Quantity: 1
    Price: 4500
    Trader: 1
- S6: OpenMarket
  Input:
    Quantity: 2
    Leverage: 10
    Trader: 3
    Side: 1
    Deposit: 1000
- S7: ChangePrice
  Input:
    Price: 5390
- S8: ExpectData
  Input:
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 2
      Price: 4600,4500
      ID: 0,0
      Quantity: 1,1
      PartialFilled: 1,0
    Position:
      Quantity: -3
      MarginDeposit: 1500
      MarginAbsolute: 1470
      Notional: 14700
      Pnl: -1470
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 44.1
      MarginBalance: 30
      MarginRatio: 100
      LiquidationPrice: 5385.3
    ClaimedProfit: 0
    BalanceChanged: 0
    ClaimableAmount: 3000
- S9: Liquidate
  Input:
    Trader: 1
    Liquidator: 2
  Expect:
    PendingOrder:
      Orders: 0
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
    ClaimedProfit: 1500
    BalanceChanged: 22.5
    ClaimableAmount: 0

      `)
    })
    })