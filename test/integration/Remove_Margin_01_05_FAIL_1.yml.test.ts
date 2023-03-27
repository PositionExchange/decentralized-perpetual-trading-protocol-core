
  
  
// @notice this code is generated from "yaml" file using the script/auto-gen-test-case.ts

import { deployAndCreateHelper, TestFutureHelper } from "./utils";  
  
describe("Remove_Margin_01_05.yml", async function(){
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
- S2: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 5000
- S2.5: ChangePrice
  Input:
    Price: 5000
- S2.6: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 4000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: -1000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 3000
      MarginRatio: 4
      LiquidationPip: 528530
    BalanceChanged: 0
    ClaimableAmount: 4000
- S3: AddMargin
  Input:
    Margin: 100
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 4100
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: -1000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 3100
      MarginRatio: 4
      LiquidationPip: 529500
    BalanceChanged: -100
    ClaimableAmount: 4100
- S4: RemoveMargin
  Input:
    Margin: 40
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 4060
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: -1000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 3060
      MarginRatio: 4
      LiquidationPip: 529112
    BalanceChanged: 40
    ClaimableAmount: 4060
- S5: ChangePrice
  Input:
    Price: 4850
- S6: RemoveMargin
  Input:
    Margin: 60
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 4000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 500
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 4500
      MarginRatio: 3
      LiquidationPip: 528530
    BalanceChanged: 60
    ClaimableAmount: 4000

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
    Deposit: 4000
- S2: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 1
    Side: 0
    Deposit: 4000
- S2.5: ChangePrice
  Input:
    Price: 5000
- S2.6: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 4000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 1000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 5000
      MarginRatio: 2
      LiquidationPip: 451470
    BalanceChanged: 0
    ClaimableAmount: 4000
- S3: AddMargin
  Input:
    Margin: 500
    Trader: 1
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 4500
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 1000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 5500
      MarginRatio: 2
      LiquidationPip: 446620
    BalanceChanged: -500
    ClaimableAmount: 4500
- S4: RemoveMargin
  Input:
    Margin: 100
    Trader: 1
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 4400
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 1000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 5400
      MarginRatio: 2
      LiquidationPip: 446620
    BalanceChanged: 100
    ClaimableAmount: 4400
- S4.5: ChangePrice
  Input:
    Price: 4700
- S5: AddMargin
  Input:
    Margin: 600
    Trader: 1
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 5000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: -2000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 3000
      MarginRatio: 4
      LiquidationPip: 441770
    BalanceChanged: -600
    ClaimableAmount: 5000

      `)
    })
    
//     it("test case ## case03. File index 3", async function() {
//       return testHelper.process(`
// - S1: OpenLimit
//   Input:
//     Quantity: 10
//     Price: 4900
//     Leverage: 10
//     Trader: 1
//     Side: 1
//     Deposit: 4000
// - S2: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5000
//     Leverage: 10
//     Trader: 2
//     Side: 0
//     Deposit: 2500
// - S3: OpenMarket
//   Input:
//     Quantity: 5
//     Leverage: 10
//     Trader: 2
//     Side: 0
//     Deposit: 2500
// - S3.5: ChangePrice
//   Input:
//     Price: 5000
// - S3.6: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: -10
//       MarginDeposit: 4000
//       MarginAbsolute: 4900
//       Notional: 49000
//       Pnl: -1000
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 147
//       MarginBalance: 3000
//       MarginRatio: 4
//       LiquidationPip: 528530
//     BalanceChanged: 0
//     ClaimableAmount: 4000
// - S4: AddMargin
//   Input:
//     Margin: 1200
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: -10
//       MarginDeposit: 5200
//       MarginAbsolute: 4900
//       Notional: 49000
//       Pnl: -1000
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 147
//       MarginBalance: 4200
//       MarginRatio: 3
//       LiquidationPip: 540530
//     BalanceChanged: -1200
//     ClaimableAmount: 5200
// - S5: CloseLimit
//   Input:
//     Quantity: 4
//     Price: 5100
//     Trader: 1
//   Expect:
//     PendingOrder:
//       Orders: 1
//       Price: 5100
//       Id: 0
//       PartialFilled: 0
//     Position:
//       Quantity: -10
//       MarginDeposit: 5200
//       MarginAbsolute: 4900
//       Notional: 49000
//       Pnl: -2000
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 147
//       MarginBalance: 3200
//       MarginRatio: 4
//       LiquidationPip: 540530
//     ClaimableAmount: 5200
// - S6: CloseMarket
//   Input:
//     Quantity: 4
//     Trader: 2
//   Expect:
//     ClaimableAmount: null
// - S6.5: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: -6
//       MarginDeposit: 3120
//       MarginAbsolute: 2940
//       Notional: 29400
//       Pnl: -1200
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 88.2
//       MarginBalance: 1920
//       MarginRatio: 4
//       LiquidationPip: 540530
//     BalanceChanged: null
//     ClaimableAmount: 4400
// - S7: RemoveMargin
//   Input:
//     Margin: 721
//     Trader: 1
//   Expect:
//     Revert: 12
// - S8: RemoveMargin
//   Input:
//     Margin: 500
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: -6
//       MarginDeposit: 3100
//       MarginAbsolute: 2940
//       Notional: 29400
//       Pnl: -1200
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 88.2
//       MarginBalance: 1900
//       MarginRatio: 4
//       LiquidationPip: 540196
//     BalanceChanged: 500
//     ClaimableAmount: 3900
//
//       `)
//     })
    
    it("test case ## case04. File index 4", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 10
    Price: 4900
    Leverage: 10
    Trader: 1
    Side: 0
    Deposit: 4000
- S2: OpenLimit
  Input:
    Quantity: 10
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 4000
- S2.5: ChangePrice
  Input:
    Price: 5000
- S2.6: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 4000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 1000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 5000
      MarginRatio: 2
      LiquidationPip: 451470
    BalanceChanged: 0
    ClaimableAmount: 4000
- S3: AddMargin
  Input:
    Margin: 1200
    Trader: 1
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 5200
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 1000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 6200
      MarginRatio: 2
      LiquidationPip: 439830
    BalanceChanged: -1200
    ClaimableAmount: 5200
- S4: CloseLimit
  Input:
    Quantity: 4
    Price: 5100
    Trader: 2
- S5: CloseMarket
  Input:
    Quantity: 4
    Trader: 1
  Expect:
    Position:
      Quantity: 6
      MarginDeposit: 3120
      MarginAbsolute: 2940
      Notional: 29400
      Pnl: 1200
      Leverage: 10
    BalanceChanged: 2880
    ClaimableAmount: 3120
- S6: AddMargin
  Input:
    Margin: 500
    Trader: 1
  Expect:
    Position:
      Quantity: 6
      MarginDeposit: 3620
      MarginAbsolute: 2940
      Notional: 29400
      Pnl: 1200
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 88.2
      MarginBalance: 4820
      MarginRatio: null
      LiquidationPip: 431746
    BalanceChanged: -500
    ClaimableAmount: 3620
- S7: RemoveMargin
  Input:
    Margin: 1220
    Trader: 1
  Expect:
    Position:
      Quantity: 6
      MarginDeposit: 2400
      MarginAbsolute: 2940
      Notional: 29400
      Pnl: 1200
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 88.2
      MarginBalance: 3600
      MarginRatio: 2
      LiquidationPip: 451470
    BalanceChanged: 1220
    ClaimableAmount: 2400

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
    Deposit: 4800
- S2: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 4900
- S2.5: ChangePrice
  Input:
    Price: 5000
- S2.6: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 4800
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: -1000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 3800
      MarginRatio: 3
      LiquidationPip: 536530
    BalanceChanged: 0
    ClaimableAmount: 4800
- S3: AddMargin
  Input:
    Margin: 100
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 4900
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: -1000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 3900
      MarginRatio: 3
      LiquidationPip: 5375
    BalanceChanged: -100
    ClaimableAmount: 4900
- S4: OpenLimit
  Input:
    Quantity: 5
    Price: 5000
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 2100
- S5: OpenMarket
  Input:
    Quantity: 5
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 2800
  Expect:
    Position:
      Quantity: -15
      MarginDeposit: 7700
      MarginAbsolute: 7400
      Notional: 74000
      Pnl: -1000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 222
      MarginBalance: 6700
      MarginRatio: 3
      LiquidationPip: 543166
    BalanceChanged: -2800
    ClaimableAmount: 7700
- S6: RemoveMargin
  Input:
    Margin: 110
    Trader: 1
  Expect:
    Revert: 12
- S7: RemoveMargin
  Input:
    Margin: 100
    Trader: 1
  Expect:
    Position:
      Quantity: -15
      MarginDeposit: 7600
      MarginAbsolute: 7400
      Notional: 74000
      Pnl: -1000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 222
      MarginBalance: 6600
      MarginRatio: 3
      LiquidationPip: 542520
    BalanceChanged: 100
    ClaimableAmount: 7600

      `)
    })
    })