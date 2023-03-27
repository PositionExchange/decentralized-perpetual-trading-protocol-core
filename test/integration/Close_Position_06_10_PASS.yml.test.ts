
  
  
// @notice this code is generated from "yaml" file using the script/auto-gen-test-case.ts

import { deployAndCreateHelper, TestFutureHelper } from "./utils";  
  
describe("Close_Position_06_10.yml", async function(){
  let testHelper: TestFutureHelper

  beforeEach(async () => {
    testHelper = await deployAndCreateHelper()
  })

  
//     it("test case ## case06. File index 1", async function() {
//       return testHelper.process(`
// - S1: OpenLimit
//   Input:
//     Quantity: 10
//     Price: 4900
//     Leverage: 10
//     Trader: 1
//     Side: 1
//     Deposit: 4000
//   Expect:
//     PendingOrder:
//       Orders: 1
//       Price: 4900
//       Id: 0
//       PartialFilled: 0
//     Position:
//       Quantity: 0
//       MarginDeposit: 0
//       MarginAbsolute: 0
//       Notional: 0
//       Pnl: 0
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 0
//       MarginBalance: 0
//       MarginRatio: 0
//       LiquidationPip: 0
//     BalanceChanged: -4000
//     ClaimableAmount: 0
// - S2: OpenMarket
//   Input:
//     Quantity: 10
//     Leverage: 10
//     Trader: 2
//     Side: 0
//     Deposit: 5000
// - S3: ChangePrice
//   Input:
//     Price: 5200
// - S4: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: -10
//       MarginDeposit: 4000
//       MarginAbsolute: 4900
//       Notional: 49000
//       Pnl: -3000
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 147
//       MarginBalance: 1000
//       MarginRatio: 14
//       LiquidationPip: 5285.3
//     BalanceChanged: 0
// - S5: CloseLimit
//   Input:
//     Quantity: 4
//     Price: 4800
//     Trader: 2
//   Expect:
//     PendingOrder:
//       Orders: 1
//       Price: 4800
//       Id: 0
//       PartialFilled: 0
//     Position:
//       Quantity: 10
//       MarginDeposit: 0
//       MarginAbsolute: 0
//       Notional: 0
//       Pnl: 0
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 0
//       MarginBalance: 0
//       MarginRatio: 0
//       LiquidationPip: 0
//     BalanceChanged: 0
//     ClaimableAmount: 0
// - S6: CloseLimit
//   Input:
//     Quantity: 4
//     Price: 4800
//     Trader: 1
//   Expect:
//     PendingOrder:
//       Orders: 1
//       Price: 4800
//       Id: 0
//       PartialFilled: 0
//     Position:
//       Quantity: -6
//       MarginDeposit: 2400
//       MarginAbsolute: 2940
//       Notional: 29400
//       Pnl: 600
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 88.2
//       MarginBalance: 3000
//       MarginRatio: 2
//       LiquidationPip: 5285.3
//     BalanceChanged: 2000
//     ClaimableAmount: 2400
// - S7: ExpectData
//   Input:
//     Trader: 2
//   Expect:
//     Position:
//       Quantity: 6
//       MarginDeposit: 3000
//       MarginAbsolute: 2940
//       Notional: 29400
//       Pnl: -600
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 88.2
//       MarginBalance: 2400
//       MarginRatio: 3
//       LiquidationPip: 4414.7
//     BalanceChanged: 0
//     ClaimableAmount: 4600
// - S8: CloseLimit
//   Input:
//     Quantity: 6
//     Price: 4750
//     Trader: 1
//   Expect:
//     PendingOrder:
//       Orders: 1
//       Price: 4750
//       Id: 0
//       PartialFilled: 0
//     Position:
//       Quantity: -6
//       MarginDeposit: 0
//       MarginAbsolute: 0
//       Notional: 0
//       Pnl: 0
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 0
//       MarginBalance: 0
//       MarginRatio: 0
//       LiquidationPip: 0
//     BalanceChanged: 0
//     ClaimableAmount: 0
// - S9: CloseLimit
//   Input:
//     Quantity: 6
//     Price: 4750
//     Trader: 2
//   Expect:
//     PendingOrder:
//       Orders: 1
//       Price: 4750
//       Id: 0
//       PartialFilled: 0
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
//     BalanceChanged: 2100
//     ClaimableAmount: 0
// - S10: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: 0
//       MarginDeposit: 0
//       MarginAbsolute: 0
//       Notional: 0
//       Pnl: 0
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 0
//       MarginBalance: 0
//       MarginRatio: 0
//       LiquidationPip: 0
//     BalanceChanged: 0
//     ClaimableAmount: 3300
//
//       `)
//     })
    
    it("test case ## case07. File index 2", async function() {
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
    Quantity: 10
    Price: 4800
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4800
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
- S6: CloseLimit
  Input:
    Quantity: 10
    Price: 4800
    Trader: 2
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4800
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
    BalanceChanged: 4000
    ClaimableAmount: 0
- S7: ExpectData
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
    ClaimableAmount: 5000

      `)
    })
    
    it("test case ## case08. File index 3", async function() {
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
    Quantity: 10
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
    Quantity: 10
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
    BalanceChanged: 5000
    ClaimableAmount: 0
- S7: ExpectData
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
    ClaimableAmount: 4000

      `)
    })
    
    it("test case ## case09. File index 4", async function() {
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
- S5: OpenLimit
  Input:
    Quantity: 5
    Price: 4800
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 2500
  Expect:
    PendingOrder:
      Orders: 1
      Price: 5000
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
    BalanceChanged: -2500
    ClaimableAmount: 0
- S6: CloseLimit
  Input:
    Quantity: 10
    Price: 4950
    Trader: 2
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4950
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
- S7: CloseMarket
  Input:
    Quantity: 10
    Trader: 1
  Expect:
    Revert: 22.2

      `)
    })
    
    it("test case ## case10. File index 5", async function() {
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
    Quantity: 5
    Price: 4700
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4700
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
- S6: CloseLimit
  Input:
    Quantity: 10
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
- S7: CloseMarket
  Input:
    Quantity: 10
    Trader: 1
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
    BalanceChanged: 5000
    ClaimableAmount: 0

      `)
    })
    })