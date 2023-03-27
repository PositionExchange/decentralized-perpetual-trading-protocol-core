

  
// @notice this code is generated from "yaml" file using the script/auto-gen-test-case.ts

import { deployAndCreateHelper, TestFutureHelper } from "./utils";

describe("Remove_Margin_11_13.yml", async function(){
  let testHelper: TestFutureHelper

  beforeEach(async () => {
    testHelper = await deployAndCreateHelper()
  })

  
//     it("test case ## case011. File index 1", async function() {
//       return testHelper.process(`
// - S1: OpenLimit
//   Input:
//     Quantity: 10
//     Price: 4900
//     Leverage: 10
//     Trader: 2
//     Side: 1
//     Deposit: 4500
// - S2: OpenLimit
//   Input:
//     Quantity: 10
//     Price: 5000
//     Leverage: 10
//     Trader: 1
//     Side: 0
//     Deposit: 6000
//   Expect:
//     Position:
//       Quantity: 10
//       MarginDeposit: 6000
//       MarginAbsolute: 4900
//       Notional: 49000
//       Pnl: 0
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 147
//       MarginBalance: 6000
//       MarginRatio: 2
//       LiquidationPip: 431470
//     BalanceChanged: -6000
//     ClaimableAmount: 6000
// - S3: AddMargin
//   Input:
//     Margin: 100
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: 10
//       MarginDeposit: 6100
//       MarginAbsolute: 4900
//       Notional: 49000
//       Pnl: 0
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 147
//       MarginBalance: 6100
//       MarginRatio: 2
//       LiquidationPip: 430500
//     BalanceChanged: -100
//     ClaimableAmount: 6100
// - S4: CloseLimit
//   Input:
//     Quantity: 6
//     Price: 5100
//     Trader: 1
//   Expect:
//     PendingOrder:
//       Orders: 1
//       Price: 5100
//       Id: 0
//       PartialFilled: 0
// - S5: CloseMarket
//   Input:
//     Quantity: 6
//     Trader: 2
// - S5.5: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: 4
//       MarginDeposit: 2440
//       MarginAbsolute: 1960
//       Notional: 19600
//       Pnl: 800
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 58.8
//       MarginBalance: 3240
//       MarginRatio: 1
//       LiquidationPip: 430500
//     BalanceChanged: 0
//     ClaimableAmount: 7300
// - S6: RemoveMargin
//   Input:
//     Margin: 20
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: 4
//       MarginDeposit: 2420
//       MarginAbsolute: 1960
//       Notional: 19600
//       Pnl: 800
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 58.8
//       MarginBalance: 3220
//       MarginRatio: 1
//       LiquidationPip: 430985
//     BalanceChanged: 20
//     ClaimableAmount: 7220
//
//       `)
//     })
    
    it("test case ## case012. File index 2", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 10
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 4500
- S2: OpenLimit
  Input:
    Quantity: 10
    Price: 4800
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 4500
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 4500
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 4500
      MarginRatio: 3
      LiquidationPip: 533530
    BalanceChanged: -4500
    ClaimableAmount: 4500
- S3: AddMargin
  Input:
    Margin: 100
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 4600
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 4600
      MarginRatio: 3
      LiquidationPip: 534500
    BalanceChanged: -100
    ClaimableAmount: 4600
- S4: CloseLimit
  Input:
    Quantity: 8
    Price: 5000
    Trader: 2
- S5: CloseLimit
  Input:
    Quantity: 8
    Price: 5100
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 0
    Position:
      Quantity: -2
      MarginDeposit: 920
      MarginAbsolute: 980
      Notional: 9800
      Pnl: -200
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 29.4
      MarginBalance: 720
      MarginRatio: 4
      LiquidationPip: 534500
    BalanceChanged: 2880
    ClaimableAmount: 920
- S6: RemoveMargin
  Input:
    Margin: 21
    Trader: 1
  Expect:
    Revert: 12
- S7: RemoveMargin
  Input:
    Margin: 20
    Trader: 1
  Expect:
    Position:
      Quantity: -2
      MarginDeposit: 900
      MarginAbsolute: 980
      Notional: 9800
      Pnl: -200
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 29.4
      MarginBalance: 700
      MarginRatio: 4
      LiquidationPip: 533530
    BalanceChanged: 20
    ClaimableAmount: 900

      `)
    })
    
//     it("test case ## case013. File index 3", async function() {
//       return testHelper.process(`
// - S1: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5000
//     Leverage: 10
//     Trader: 2
//     Side: 1
//     Deposit: 2500
// - S2: OpenLimit
//   Input:
//     Quantity: 10
//     Price: 5100
//     Leverage: 10
//     Trader: 1
//     Side: 0
//     Deposit: 4500
//   Expect:
//     PendingOrder:
//       Orders: 1
//       Price: 5100
//       Id: 1
//       Quantity: 5
//       PartialFilled: 0
//     Position:
//       Quantity: 5
//       MarginDeposit: 2250
//       MarginAbsolute: 2500
//       Notional: 25000
//       Pnl: 500
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 75
//       MarginBalance: 2750
//       MarginRatio: 2
//       LiquidationPip: 456500
//     BalanceChanged: -4500
//     ClaimableAmount: 2250
// - S3: AddMargin
//   Input:
//     Margin: 1000
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: 5
//       MarginDeposit: 3250
//       MarginAbsolute: 2500
//       Notional: 25000
//       Pnl: 500
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 75
//       MarginBalance: 3750
//       MarginRatio: 2
//       LiquidationPip: 437100
//     BalanceChanged: -1000
//     ClaimableAmount: 3250
// - S4: OpenMarket
//   Input:
//     Quantity: 5
//     Leverage: 10
//     Trader: 2
//     Side: 1
//     Deposit: 2500
// - S4.5: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: 10
//       MarginDeposit: 5500
//       MarginAbsolute: 5050
//       Notional: 50500
//       Pnl: 500
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 151.5
//       MarginBalance: 6000
//       MarginRatio: 2
//       LiquidationPip: 451815
//     BalanceChanged: null
//     ClaimableAmount: 5500
// - S5: CloseLimit
//   Input:
//     Quantity: 2
//     Price: 4900
//     Trader: 1
//   Expect:
//     PendingOrder:
//       Orders: 1
//       Price: 4900
//       Id: 1
//       PartialFilled: 0
// - S6: CloseMarket
//   Input:
//     Quantity: 2
//     Trader: 2
// - S6.5: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: 8
//       MarginDeposit: 4400
//       MarginAbsolute: 4040
//       Notional: 40400
//       Pnl: -1200
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 121.2
//       MarginBalance: 3200
//       MarginRatio: 3
//       LiquidationPip: 451815
//     BalanceChanged: 0
//     ClaimableAmount: 5200
// - S7: RemoveMargin
//   Input:
//     Margin: 801
//     Trader: 1
//   Expect:
//     Revert: 12
// - S8: RemoveMargin
//   Input:
//     Margin: 800
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: 8
//       MarginDeposit: 3600
//       MarginAbsolute: 4040
//       Notional: 40400
//       Pnl: -1200
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 121.2
//       MarginBalance: 2400
//       MarginRatio: 5
//       LiquidationPip: 461515
//     BalanceChanged: 800
//     ClaimableAmount: 4400
//
//       `)
//     })
    })