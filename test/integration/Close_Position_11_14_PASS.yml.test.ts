
  
  
// @notice this code is generated from "yaml" file using the script/auto-gen-test-case.ts

import { deployAndCreateHelper, TestFutureHelper } from "./utils";  
  
describe("Close_Position_11_14.yml", async function(){
  let testHelper: TestFutureHelper

  beforeEach(async () => {
    testHelper = await deployAndCreateHelper()
  })

  
    it("test case ## case11. File index 1", async function() {
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
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 5000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPip: 0
    BalanceChanged: -5000
    ClaimableAmount: 0
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
- S6: CloseMarket
  Input:
    Quantity: 5
    Trader: 2
  Expect:
    Position:
      Quantity: 5
      MarginDeposit: 2500
      MarginBalance: 4500
      Notional: 24500
      Pnl: -500
      Leverage: 10
    MaintenanceDetail: 0
    BalanceChanged: 2000
    ClaimableAmount: 2500
- S7: ChangePrice
  Input:
    Price: 4850
- S8: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -5
      MarginDeposit: 2000
      MarginAbsolute: 2450
      Notional: 24500
      Pnl: 250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 73.5
      MarginBalance: 2250
      MarginRatio: 3
      LiquidationPip: 5285.3
    BalanceChanged: 0
    ClaimableAmount: 4500
- S9: CloseLimit
  Input:
    Quantity: 2
    Price: 4700
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4700
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: -5
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
- S10: CloseLimit
  Input:
    Quantity: 3
    Price: 4900
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4900
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: -5
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
- S11: CloseLimit
  Input:
    Quantity: 5
    Price: 5100
    Trader: 2
  Expect:
    PendingOrder:
      Orders: 1
      Price: 5100
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: 5
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
- S12: CloseMarket
  Input:
    Quantity: 5
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
    BalanceChanged: 3500
    ClaimableAmount: 0

      `)
    })
    
    it("test case ##case12. File index 2", async function() {
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
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 5000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPip: 0
    BalanceChanged: -5000
    ClaimableAmount: 0
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
    Price: 5100
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 1
      Price: 5100
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
    Quantity: 4
    Price: 5100
    Trader: 2
  Expect:
    PendingOrder:
      Orders: 1
      Price: 5100
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: 6
      MarginDeposit: 3000
      MarginAbsolute: 2940
      Notional: 29400
      Pnl: 1200
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 88.2
      MarginBalance: 4200
      MarginRatio: 2
      LiquidationPip: 4414.7
    BalanceChanged: 2800
    ClaimableAmount: 3000
- S7: CancelLimit
  Input:
    Price: 5100
    Trader: 1
    Id: 1
  Expect:
    PendingOrder:
      Orders: 1
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
    ClaimableAmount: 0
- S8: CloseLimit
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
- S9: CloseMarket
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
    BalanceChanged: 2900
    ClaimableAmount: 0
- S4: ExpectData
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
    ClaimableAmount: 3300

      `)
    })
    
    it("test case ## case13. File index 3", async function() {
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
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 5000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPip: 0
    BalanceChanged: -5000
    ClaimableAmount: 0
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
    Deposit: 3000
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
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPip: 0
    BalanceChanged: -3000
- S6: OpenLimit
  Input:
    Quantity: 2
    Price: 4800
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 1500
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4800
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: 12
      MarginDeposit: 6500
      MarginAbsolute: 5860
      Notional: 58600
      Pnl: -1000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 175.8
      MarginBalance: 5500
      MarginRatio: 3
      LiquidationPip: 4231.3
    BalanceChanged: -1500
- S7: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -12
      MarginDeposit: 5200
      MarginAbsolute: 5860
      Notional: 58600
      Pnl: 1000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 175.8
      MarginBalance: 6200
      MarginRatio: 2
      LiquidationPip: 5302
    BalanceChanged: 0
- S8: CancelLimit
  Input:
    Price: 4800
    Trader: 1
    Id: 1
  Expect:
    PendingOrder:
      Orders: 1
    Position:
      Quantity: -12
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
    BalanceChanged: 1800
    ClaimableAmount: 0
- S9: CloseLimit
  Input:
    Quantity: 12
    Price: 4750
    Trader: 2
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4750
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: 12
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
- S10: CloseMarket
  Input:
    Quantity: 12
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
    BalanceChanged: 6800
    ClaimableAmount: 0
- S11: ExpectData
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
    
    it("test case ## case14. File index 4", async function() {
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
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 5000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 0
      MarginBalance: 0
      MarginRatio: 0
      LiquidationPip: 0
    BalanceChanged: -5000
    ClaimableAmount: 0
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
    Price: 5100
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 3000
  Expect:
    PendingOrder:
      Orders: 1
      Price: 5100
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
    BalanceChanged: -3000
- S6: OpenMarket
  Input:
    Quantity: 5
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 3000
  Expect:
    Position:
      Quantity: -15
      MarginDeposit: 7000
      MarginAbsolute: 7450
      Notional: 74500
      Pnl: -2000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 223.5
      MarginBalance: 5000
      MarginRatio: 4
      LiquidationPip: 5418.4
    BalanceChanged: -3000
    ClaimableAmount: 0
- S7: ExpectData
  Input:
    Trader: 2
  Expect:
    Position:
      Quantity: 15
      MarginDeposit: 8000
      MarginAbsolute: 7450
      Notional: 74500
      Pnl: 2000
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 223.5
      MarginBalance: 10000
      MarginRatio: 2
      LiquidationPip: 4448.2
    BalanceChanged: 0
    ClaimableAmount: 0
- S8: CloseLimit
  Input:
    Quantity: 6
    Price: 4750
    Trader: 2
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4750
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: 15
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
- S10: CloseMarket
  Input:
    Quantity: 6
    Trader: 1
  Expect:
    Position:
      Quantity: -9
      MarginDeposit: 4200
      MarginAbsolute: 4470
      Notional: 44700
      Pnl: 1950
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 134.1
      MarginBalance: 6150
      MarginRatio: 2
      LiquidationPip: 5418.4
    BalanceChanged: 4100
    ClaimableAmount: 4200
- S11: ExpectData
  Input:
    Trader: 2
  Expect:
    Position:
      Quantity: 9
      MarginDeposit: 4800
      MarginAbsolute: 4470
      Notional: 44700
      Pnl: -1950
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: null
      MarginBalance: 2849.99964295302
      MarginRatio: 4
      LiquidationPip: 4448.2
    BalanceChanged: 0
    ClaimableAmount: 6700

      `)
    })
    })