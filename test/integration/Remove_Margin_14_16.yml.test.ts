

  
// @notice this code is generated from "yaml" file using the script/auto-gen-test-case.ts

import { deployAndCreateHelper, TestFutureHelper } from "./utils";

describe("Remove_Margin_14_16.yml", async function(){
  let testHelper: TestFutureHelper

  beforeEach(async () => {
    testHelper = await deployAndCreateHelper()
  })

  
    it("test case ## case14. File index 1", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 10
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 4900
- S2: OpenMarket
  Input:
    Quantity: 10
    Leverage: 5
    Trader: 1
    Side: 1
    Deposit: 10000
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 10000
      MarginAbsolute: 9800
      Notional: 49000
      Pnl: 0
      Leverage: 5
    MaintenanceDetail:
      MaintenanceMargin: 294
      MarginBalance: 10000
      MarginRatio: 2
      LiquidationPip: 587060
    BalanceChanged: -10000
    ClaimableAmount: 10000
- S3: OpenLimit
  Input:
    Quantity: 5
    Price: 4850
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 2400
- S4: OpenMarket
  Input:
    Quantity: 5
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 2400
- S4.5: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -15
      MarginDeposit: 12400
      MarginAbsolute: 12225
      Notional: 73250
      Pnl: 500
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 366.75
      MarginBalance: 12900
      MarginRatio: 2
      LiquidationPip: 568555
    BalanceChanged: 0
    ClaimableAmount: 12400
- S5: AddMargin
  Input:
    Margin: 500
    Trader: 1
  Expect:
    Position:
      Quantity: -15
      MarginDeposit: 12900
      MarginAbsolute: 12225
      Notional: 73250
      Pnl: 500
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 366.75
      MarginBalance: 13400
      MarginRatio: 2
      LiquidationPip: 571888
    BalanceChanged: -500
    ClaimableAmount: 12900
- S6: CloseLimit
  Input:
    Quantity: 7
    Price: 4950
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4950
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: -15
      MarginDeposit: 12900
      MarginAbsolute: 12225
      Notional: 73250
      Pnl: -1000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 366.75
      MarginBalance: 11900
      MarginRatio: 3
      LiquidationPip: 571888
    BalanceChanged: 0
    ClaimableAmount: 12900
- S7: CloseMarket
  Input:
    Quantity: 7
    Trader: 2
- S7.5: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -8
      MarginDeposit: 7113.33
      MarginAbsolute: 6520
      Notional: 39066.66667
      Pnl: -533.3333333
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 195.6
      MarginBalance: 6580
      MarginRatio: 2
      LiquidationPip: 571888
    BalanceChanged: 0
    ClaimableAmount: 12433.333
- S8: RemoveMargin
  Input:
    Margin: 200
    Trader: 1
  Expect:
    Position:
      Quantity: -8
      MarginDeposit: 6913.33
      MarginAbsolute: 6520
      Notional: 39066.66667
      Pnl: -533.3333333
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 195.6
      MarginBalance: 6380
      MarginRatio: 3
      LiquidationPip: 569388
    BalanceChanged: 200
    ClaimableAmount: 12233.33
- S9: CloseLimit
  Input:
    Quantity: 8
    Price: 4800
    Trader: 1
- S10: CloseMarket
  Input:
    Quantity: 8
    Trader: 2
- S10.5: ExpectData
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
    ClaimableAmount: 12900

      `)
    })
    
    it("test case ## case15. File index 2", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 5
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 2400
- S2: OpenMarket
  Input:
    Quantity: 5
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 2400
  Expect:
    Position:
      Quantity: -5
      MarginDeposit: 2400
      MarginAbsolute: 2450
      Notional: 24500
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 73.5
      MarginBalance: 2400
      MarginRatio: 3
      LiquidationPip: 536530
    BalanceChanged: -2400
    ClaimableAmount: 2400
- S3: OpenLimit
  Input:
    Quantity: 10
    Price: 4950
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 4900
- S4: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 4900
- S4.5: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -15
      MarginDeposit: 7300
      MarginAbsolute: 7400
      Notional: 74000
      Pnl: -250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 222
      MarginBalance: 7050
      MarginRatio: 3
      LiquidationPip: 540520
    BalanceChanged: 0
    ClaimableAmount: 7300
- S5: AddMargin
  Input:
    Margin: 500
    Trader: 1
  Expect:
    Position:
      Quantity: -15
      MarginDeposit: 7800
      MarginAbsolute: 7400
      Notional: 74000
      Pnl: -250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 222
      MarginBalance: 7550
      MarginRatio: 2
      LiquidationPip: 543853
    BalanceChanged: -500
    ClaimableAmount: 7800
- S6: CloseLimit
  Input:
    Quantity: 7
    Price: 4900
    Trader: 1
- S7: CloseMarket
  Input:
    Quantity: 7
    Trader: 2
- S7.5: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -8
      MarginDeposit: 4393.33
      MarginAbsolute: 3946.666667
      Notional: 39466.66667
      Pnl: 266.6666667
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 118.4
      MarginBalance: 4660
      MarginRatio: 2
      LiquidationPip: 543853
    BalanceChanged: 0
    ClaimableAmount: 8033.333
- S8: RemoveMargin
  Input:
    Margin: 100
    Trader: 1
  Expect:
    Position:
      Quantity: -8
      MarginDeposit: 4293.33
      MarginAbsolute: 3946.66666667
      Notional: 39466.66667
      Pnl: 266.6666667
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 118.4
      MarginBalance: 4560
      MarginRatio: 2
      LiquidationPip: 542603
    BalanceChanged: 100
    ClaimableAmount: 7933.33
- S9: CloseLimit
  Input:
    Quantity: 6
    Price: 4800
    Trader: 2
- S10: CloseMarket
  Input:
    Quantity: 6
    Trader: 1
  Expect:
    Position:
      Quantity: -2
      MarginDeposit: 1073.333
      MarginAbsolute: 986.666
      Notional: 9866.666667
      Pnl: 266.6666667
      Leverage: 10
    MaintenanceDetail: 55.5
    BalanceChanged: 4020
    ClaimableAmount: 4713.33
- S11: CloseLimit
  Input:
    Quantity: 2
    Price: 4850
    Trader: 1
- S12: CloseMarket
  Input:
    Quantity: 2
    Trader: 2
- S12.5: ExpectData
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
    ClaimableAmount: 4879.99

      `)
    })
    
//     it("test case ## case16. File index 3", async function() {
//       return testHelper.process(`
// - S1: OpenLimit
//   Input:
//     Quantity: 10
//     Price: 4900
//     Leverage: 10
//     Trader: 2
//     Side: 0
//     Deposit: 4900
// - S2: OpenMarket
//   Input:
//     Quantity: 10
//     Leverage: 10
//     Trader: 1
//     Side: 1
//     Deposit: 5000
//   Expect:
//     Position:
//       Quantity: -10
//       MarginDeposit: 5000
//       MarginAbsolute: 4900
//       Notional: 49000
//       Pnl: 0
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 147
//       MarginBalance: 5000
//       MarginRatio: 2
//       LiquidationPip: 538530
//     BalanceChanged: -5000
//     ClaimableAmount: 5000
// - S3: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 4850
//     Leverage: 10
//     Trader: 1
//     Side: 1
//     Deposit: 2400
// - S4: OpenMarket
//   Input:
//     Quantity: 5
//     Leverage: 10
//     Trader: 2
//     Side: 0
//     Deposit: 2400
// - S4.5: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: -15
//       MarginDeposit: 7400
//       MarginAbsolute: 7325
//       Notional: 73250
//       Pnl: 500
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 219.75
//       MarginBalance: 7900
//       MarginRatio: 2
//       LiquidationPip: 536201
//     BalanceChanged: 0
//     ClaimableAmount: 7400
// - S5: AddMargin
//   Input:
//     Margin: 500
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: -15
//       MarginDeposit: 7900
//       MarginAbsolute: 7325
//       Notional: 73250
//       Pnl: 500
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 219.75
//       MarginBalance: 8400
//       MarginRatio: 2
//       LiquidationPip: 539535
//     BalanceChanged: -500
//     ClaimableAmount: 7900
// - S6: CloseLimit
//   Input:
//     Quantity: 2
//     Price: 4950
//     Trader: 1
// - S7: CloseMarket
//   Input:
//     Quantity: 2
//     Trader: 2
// - S7.5: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: -13
//       MarginDeposit: 6846.667
//       MarginAbsolute: 6348.333333
//       Notional: 63483.33333
//       Pnl: -866.6666667
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 190.45
//       MarginBalance: 5980
//       MarginRatio: 3
//       LiquidationPip: 539535
//     BalanceChanged: 0
//     ClaimableAmount: 7766.667
// - S8: RemoveMargin
//   Input:
//     Margin: 200
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: -13
//       MarginDeposit: 6646.67
//       MarginAbsolute: 6348.333333
//       Notional: 63483.33333
//       Pnl: -866.6666667
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 190.45
//       MarginBalance: 5780
//       MarginRatio: 3
//       LiquidationPip: 537996
//     BalanceChanged: 200
//     ClaimableAmount: 7566.67
// - S9: CloseLimit
//   Input:
//     Quantity: 11
//     Price: 4800
//     Trader: 1
// - S10: CloseMarket
//   Input:
//     Quantity: 11
//     Trader: 2
// - S10.5: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: -2
//       MarginDeposit: 1022.564
//       MarginAbsolute: 976.6666667
//       Notional: 9766.666667
//       Pnl: 166.6666667
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 29.3
//       MarginBalance: 1189.231
//       MarginRatio: 2
//       LiquidationPip: 537996
//     BalanceChanged: 0
//     ClaimableAmount: 8483.333
// - S11: AddMargin
//   Input:
//     Margin: 500
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: -2
//       MarginDeposit: 1522.56
//       MarginAbsolute: 976.6666667
//       Notional: 9766.666667
//       Pnl: 166.6666667
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 29.3
//       MarginBalance: 1689.2308
//       MarginRatio: 1
//       LiquidationPip: 562996
//     BalanceChanged: -500
//     ClaimableAmount: 8983.33
// - S12: CloseLimit
//   Input:
//     Quantity: 2
//     Price: 5000
//     Trader: 1
// - S13: CloseMarket
//   Input:
//     Quantity: 2
//     Trader: 2
// - S13.5: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: 0
//       MarginDeposit: 0
//       MarginAbsolute: 0
//       Notional: 0
//       Pnl: 0
//       Leverage: 0
//     MaintenanceDetail:
//       MaintenanceMargin: 0
//       MarginBalance: 0
//       MarginRatio: 0
//       LiquidationPip: 0
//     BalanceChanged: 0
//     ClaimableAmount: 8750
//
//       `)
//     })
    })