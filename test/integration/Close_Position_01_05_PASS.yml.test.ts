
  
  
// @notice this code is generated from "yaml" file using the script/auto-gen-test-case.ts

import { deployAndCreateHelper, TestFutureHelper } from "./utils";  
  
describe("Close_Position_01_05.yml", async function(){
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
    Trader: 1
    Side: 1
    Deposit: 4000
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4900
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: 0
      MarginDeposit: 0
      MarginAbsolute: 0
      Notional: 0
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPip: 0
    BalanceChanged: -4000
    ClaimableAmount: 0
- S2: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 5000
- S3: ChangePrice
  Input:
    Price: 5200
- S4: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 4000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: -3000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 1000
      MarginRatio: 14
      LiquidationPip: 5285.3
    BalanceChanged: 0
- S5: CloseLimit
  Input:
    Quantity: 6
    Price: 4950
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4950
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: -10
      MarginDeposit: 0
      MarginAbsolute: 0
      Notional: 0
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPip: 0
    BalanceChanged: 0
    ClaimableAmount: 0
- S6: CloseMarket
  Input:
    Quantity: 6
    Trader: 2
  Expect:
    Position:
      Quantity: 4
      MarginDeposit: 2000
      MarginBalance: 2200
      Notional: 19600
      Pnl: 200
      Leverage: 10
    MaintenanceDetail: 0
    BalanceChanged: 3300
    ClaimableAmount: 2000
- S7: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -4
      MarginDeposit: 1600
      MarginAbsolute: 1960
      Notional: 19600
      Pnl: -200
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 58.8
      MarginBalance: 1400
      MarginRatio: 4
      LiquidationPip: 5285.3
    BalanceChanged: 0
    ClaimableAmount: 3700

      `)
    })
    
    it("test case ## case02. File index 2", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 10
    Price: 4900
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 4000
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4900
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: 0
      MarginDeposit: 0
      MarginAbsolute: 0
      Notional: 0
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPip: 0
    BalanceChanged: -4000
    ClaimableAmount: 0
- S2: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 5000
- S3: ChangePrice
  Input:
    Price: 5200
- S4: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 4000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: -3000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 1000
      MarginRatio: 14
      LiquidationPip: 5285.3
    BalanceChanged: 0
- S5: CloseLimit
  Input:
    Quantity: 6
    Price: 4950
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4950
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: -10
      MarginDeposit: 0
      MarginAbsolute: 0
      Notional: 0
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPip: 0
    BalanceChanged: 0
    ClaimableAmount: 0
- S6: CloseMarket
  Input:
    Quantity: 6
    Trader: 2
  Expect:
    Position:
      Quantity: 4
      MarginDeposit: 2000
      MarginBalance: 2200
      Notional: 19600
      Pnl: 200
      Leverage: 10
    MaintenanceDetail: 0
    BalanceChanged: 3300
    ClaimableAmount: 2000
- S7: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -4
      MarginDeposit: 1600
      MarginAbsolute: 1960
      Notional: 19600
      Pnl: -200
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 58.8
      MarginBalance: 1400
      MarginRatio: 4
      LiquidationPip: 5285.3
    BalanceChanged: 0
    ClaimableAmount: 3700
- S8: CloseLimit
  Input:
    Quantity: 4
    Price: 4800
    Trader: 2
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4800
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: 4
      MarginDeposit: 0
      MarginAbsolute: 0
      Notional: 0
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPip: 0
    BalanceChanged: 0
    ClaimableAmount: 0
- S9: CloseMarket
  Input:
    Quantity: 4
    Trader: 1
  Expect:
    Position:
      Quantity: 0
      MarginDeposit: 0
      MarginBalance: 0
      Notional: 0
      Pnl: 0
      Leverage: 0
    MaintenanceDetail: 0
    BalanceChanged: 4100
    ClaimableAmount: 0
- S10: ExpectData
  Input:
    Trader: 2
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
      LiquidationPip: 0
    BalanceChanged: 0
    ClaimableAmount: 1600

      `)
    })
    
    it("test case ## case03. File index 3", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 10
    Price: 4900
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 4000
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4900
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: 0
      MarginDeposit: 0
      MarginAbsolute: 0
      Notional: 0
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPip: 0
    BalanceChanged: -4000
    ClaimableAmount: 0
- S2: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 5000
- S3: ChangePrice
  Input:
    Price: 5200
- S4: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 4000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: -3000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 1000
      MarginRatio: 14
      LiquidationPip: 5285.3
    BalanceChanged: 0
- S5: CloseLimit
  Input:
    Quantity: 6
    Price: 4950
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4950
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: -10
      MarginDeposit: 0
      MarginAbsolute: 0
      Notional: 0
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPip: 0
    BalanceChanged: 0
    ClaimableAmount: 0
- S6: CloseMarket
  Input:
    Quantity: 6
    Trader: 2
  Expect:
    Position:
      Quantity: 4
      MarginDeposit: 2000
      MarginBalance: 2200
      Notional: 19600
      Pnl: 200
      Leverage: 10
    MaintenanceDetail: 0
    BalanceChanged: 3300
    ClaimableAmount: 2000
- S7: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -4
      MarginDeposit: 1600
      MarginAbsolute: 1960
      Notional: 19600
      Pnl: -200
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 58.8
      MarginBalance: 1400
      MarginRatio: 4
      LiquidationPip: 5285.3
    BalanceChanged: 0
    ClaimableAmount: 3700
- S8: CloseLimit
  Input:
    Quantity: 4
    Price: 4700
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4700
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: -4
      MarginDeposit: 0
      MarginAbsolute: 0
      Notional: 0
      Pnl: 0
      Leverage: 0
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPip: 0
    BalanceChanged: 0
    ClaimableAmount: 0
- S9: CloseLimit
  Input:
    Quantity: 4
    Price: 4700
    Trader: 2
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4700
      Id: 0
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
      LiquidationPip: 0
    BalanceChanged: 1200
    ClaimableAmount: 0
- S10: ExpectData
  Input:
    Trader: 1
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
      LiquidationPip: 0
    BalanceChanged: 0
    ClaimableAmount: 4500

      `)
    })
    
    it("test case ## case04. File index 4", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 10
    Price: 4900
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 4000
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4900
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: 0
      MarginDeposit: 0
      MarginAbsolute: 0
      Notional: 0
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPip: 0
    BalanceChanged: -4000
    ClaimableAmount: 0
- S2: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 5000
- S3: ChangePrice
  Input:
    Price: 5200
- S4: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 4000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: -3000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 1000
      MarginRatio: 14
      LiquidationPip: 5285.3
    BalanceChanged: 0
    ClaimableAmount: 0
- S5: CloseLimit
  Input:
    Quantity: 4
    Price: 4800
    Trader: 2
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4800
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: 10
      MarginDeposit: 0
      MarginAbsolute: 0
      Notional: 0
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPip: 0
    BalanceChanged: 0
    ClaimableAmount: 0
- S6: CloseMarket
  Input:
    Quantity: 4
    Trader: 1
  Expect:
    Position:
      Quantity: -6
      MarginDeposit: 2400
      MarginBalance: 3000
      Notional: 29400
      Pnl: 600
      Leverage: 10
    MaintenanceDetail: 0
    BalanceChanged: 2000
    ClaimableAmount: 2400
- S7: ExpectData
  Input:
    Trader: 2
  Expect:
    Position:
      Quantity: 6
      MarginDeposit: 3000
      MarginAbsolute: 2940
      Notional: 29400
      Pnl: -600
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 88.2
      MarginBalance: 2400
      MarginRatio: 3
      LiquidationPip: 4414.7
    BalanceChanged: 0
    ClaimableAmount: 4600

      `)
    })
    
    it("test case ## case05. File index 5", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 10
    Price: 4900
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 4000
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4900
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: 0
      MarginDeposit: 0
      MarginAbsolute: 0
      Notional: 0
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPip: 0
    BalanceChanged: -4000
    ClaimableAmount: 0
- S2: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 5000
- S3: ChangePrice
  Input:
    Price: 5200
- S4: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 4000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: -3000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 1000
      MarginRatio: 14
      LiquidationPip: 5285.3
    BalanceChanged: 0
- S5: CloseLimit
  Input:
    Quantity: 4
    Price: 4800
    Trader: 2
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4800
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: 10
      MarginDeposit: 0
      MarginAbsolute: 0
      Notional: 0
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPip: 0
    BalanceChanged: 0
    ClaimableAmount: 0
- S6: CloseMarket
  Input:
    Quantity: 4
    Trader: 1
  Expect:
    Position:
      Quantity: -6
      MarginDeposit: 2400
      MarginBalance: 3000
      Notional: 29400
      Pnl: 600
      Leverage: 10
    MaintenanceDetail: 0
    BalanceChanged: 2000
    ClaimableAmount: 2400
- S7: CloseLimit
  Input:
    Quantity: 6
    Price: 4950
    Trader: 2
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4950
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: 6
      MarginDeposit: 0
      MarginAbsolute: 0
      Notional: 0
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPip: 0
    BalanceChanged: 0
    ClaimableAmount: 0
- S8: CloseMarket
  Input:
    Quantity: 6
    Trader: 1
  Expect:
    Position:
      Quantity: 0
      MarginDeposit: 0
      MarginBalance: 0
      Notional: 0
      Pnl: 0
      Leverage: 0
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPip: 0
    BalanceChanged: 2100
    ClaimableAmount: 0
- S9: ExpectData
  Input:
    Trader: 2
  Expect:
    Position:
      Quantity: 0
      MarginDeposit: 0
      MarginAbsolute: 0
      Notional: 0
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPip: 0
    BalanceChanged: 0
    ClaimableAmount: 4900

      `)
    })
    })