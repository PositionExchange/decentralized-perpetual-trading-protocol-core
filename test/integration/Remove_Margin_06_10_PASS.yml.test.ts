
  
  
// @notice this code is generated from "yaml" file using the script/auto-gen-test-case.ts

import { deployAndCreateHelper, TestFutureHelper } from "./utils";  
  
describe("Remove_Margin_06_10.yml", async function(){
  let testHelper: TestFutureHelper

  beforeEach(async () => {
    testHelper = await deployAndCreateHelper()
  })

  
    it("test case ## case06. File index 1", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 5
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 2500
- S2: OpenLimit
  Input:
    Quantity: 15
    Price: 4850
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 7800
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4850
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: -5
      MarginDeposit: 2600
      MarginAbsolute: 2450
      Notional: 24500
      Pnl: 250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 73.5
      MarginBalance: 2850
      MarginRatio: 2
      LiquidationPip: 540530
    BalanceChanged: -7800
    ClaimableAmount: 2600
- S3: OpenMarket
  Input:
    Quantity: 5
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 2500
- S3.5: ExpectData
  Input:
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4850
      Id: 1
      PartialFilled: 5
    Position:
      Quantity: -10
      MarginDeposit: 5200
      MarginAbsolute: 4875
      Notional: 48750
      Pnl: 250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 146.25
      MarginBalance: 5450
      MarginRatio: 2
      LiquidationPip: 538037
    BalanceChanged: 0
    ClaimableAmount: 5200
- S4: CancelLimit
  Input:
    Price: 4850
    Trader: 1
    Id: 1
  Expect:
    PendingOrder:
      Orders: 0
    Position:
      Quantity: -10
      MarginDeposit: 5200
      MarginAbsolute: 4875
      Notional: 48750
      Pnl: 250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 146.25
      MarginBalance: 5450
      MarginRatio: 2
      LiquidationPip: 538037
    BalanceChanged: 2600
    ClaimableAmount: 5200
- S5: AddMargin
  Input:
    Margin: 100
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 5300
      MarginAbsolute: 4875
      Notional: 48750
      Pnl: 250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 146.25
      MarginBalance: 5550
      MarginRatio: 2
      LiquidationPip: 539007
    BalanceChanged: -100
    ClaimableAmount: 5300
- S6: RemoveMargin
  Input:
    Margin: 50
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 5250
      MarginAbsolute: 4875
      Notional: 48750
      Pnl: 250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 146.25
      MarginBalance: 5500
      MarginRatio: 2
      LiquidationPip: 538522
    BalanceChanged: 50
    ClaimableAmount: 5250
- S7: RemoveMargin
  Input:
    Margin: 50
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 5200
      MarginAbsolute: 4875
      Notional: 48750
      Pnl: 250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 146.25
      MarginBalance: 5450
      MarginRatio: 2
      LiquidationPip: 538037
    BalanceChanged: 50
    ClaimableAmount: 5200

      `)
    })
    
    it("test case ## case08. File index 2", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 5
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 2500
- S2: OpenLimit
  Input:
    Quantity: 15
    Price: 4850
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 7800
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4850
      Id: 1
      Quantity: 10
      PartialFilled: 0
    Position:
      Quantity: -5
      MarginDeposit: 2600
      MarginAbsolute: 2450
      Notional: 24500
      Pnl: 250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 73.5
      MarginBalance: 2850
      MarginRatio: 2
      LiquidationPip: 540530
    BalanceChanged: -7800
    ClaimableAmount: 2600
- S3: OpenMarket
  Input:
    Quantity: 5
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 2500
- S3.5: ExpectData
  Input:
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4850
      Id: 1
      PartialFilled: 5
    Position:
      Quantity: -10
      MarginDeposit: 5200
      MarginAbsolute: 4875
      Notional: 48750
      Pnl: 250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 146.25
      MarginBalance: 5450
      MarginRatio: 2
      LiquidationPip: 538037
    BalanceChanged: 0
    ClaimableAmount: 5200
- S4: AddMargin
  Input:
    Margin: 100
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 5300
      MarginAbsolute: 4875
      Notional: 48750
      Pnl: 250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 146.25
      MarginBalance: 5550
      MarginRatio: 2
      LiquidationPip: 539007
    BalanceChanged: -100
    ClaimableAmount: 5300
- S5: CancelLimit
  Input:
    Price: 4850
    Trader: 1
    Id: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 5300
      MarginAbsolute: 4875
      Notional: 48750
      Pnl: 250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 146.25
      MarginBalance: 5550
      MarginRatio: 2
      LiquidationPip: 539007
    BalanceChanged: 2600
    ClaimableAmount: 5300
- S6: CloseLimit
  Input:
    Quantity: 8
    Price: 5000
    Trader: 2
- S7: CloseMarket
  Input:
    Quantity: 8
    Trader: 1
  Expect:
    Position:
      Quantity: -2
      MarginDeposit: 1060
      MarginBalance: 975
      Notional: 9750
      Pnl: -250
      Leverage: 10
    MaintenanceDetail: 29.25
    BalanceChanged: 3240
    ClaimableAmount: 1060
- S8: RemoveMargin
  Input:
    Margin: 30
    Trader: 1
  Expect:
    Revert: 12
- S9: RemoveMargin
  Input:
    Margin: 20
    Trader: 1
  Expect:
    Position:
      Quantity: -2
      MarginDeposit: 1040
      MarginAbsolute: 975
      Notional: 9750
      Pnl: -250
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 29.25
      MarginBalance: 790
      MarginRatio: 3
      LiquidationPip: 538037
    BalanceChanged: 20
    ClaimableAmount: 1040

      `)
    })
    
    it("test case ## case09. File index 3", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 15
    Price: 4900
    Leverage: 10
    Trader: 1
    Side: 0
    Deposit: 7200
- S2: OpenLimit
  Input:
    Quantity: 5
    Price: 4850
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 4200
- S2.5: ExpectData
  Input:
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4900
      Id: 1
      PartialFilled: 5
    Position:
      Quantity: 5
      MarginDeposit: 2400
      MarginAbsolute: 2450
      Notional: 24500
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 73.5
      MarginBalance: 2400
      MarginRatio: 3
      LiquidationPip: 443470
    BalanceChanged: null
    ClaimableAmount: 2400
- S3: AddMargin
  Input:
    Margin: 1000
    Trader: 1
  Expect:
    Position:
      Quantity: 5
      MarginDeposit: 3400
      MarginAbsolute: 2450
      Notional: 24500
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 73.5
      MarginBalance: 3400
      MarginRatio: 2
      LiquidationPip: 424070
    BalanceChanged: -1000
    ClaimableAmount: 3400
- S4: OpenMarket
  Input:
    Quantity: 5
    Leverage: 10
    Trader: 2
    Side: 1
    Deposit: 2600
- S4.5: ExpectData
  Input:
    Trader: 1
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4900
      Id: 1
      Quantity: 15
      PartialFilled: 10
    Position:
      Quantity: 10
      MarginDeposit: 5800
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 5800
      MarginRatio: 2
      LiquidationPip: 433770
    BalanceChanged: null
    ClaimableAmount: 5800
- S5: CancelLimit
  Input:
    Price: 4900
    Trader: 1
    Id: 1
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 5800
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 5800
      MarginRatio: 2
      LiquidationPip: 433770
    BalanceChanged: 2400
    ClaimableAmount: 5800
- S6: RemoveMargin
  Input:
    Margin: 1100
    Trader: 1
  Expect:
    Revert: 12
- S7: RemoveMargin
  Input:
    Margin: 1000
    Trader: 1
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
      LiquidationPip: 443470
    BalanceChanged: 1000
    ClaimableAmount: 4800

      `)
    })
    
    it("test case ## case10. File index 4", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 10
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 4500
- S2: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 6000
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 6000
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 6000
      MarginRatio: 2
      LiquidationPip: 548530
    BalanceChanged: -6000
    ClaimableAmount: 6000
- S3: AddMargin
  Input:
    Margin: 10
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 6010
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 6010
      MarginRatio: 2
      LiquidationPip: 548627
    BalanceChanged: -10
    ClaimableAmount: 6010
- S4: RemoveMargin
  Input:
    Margin: 5
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 6005
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 6005
      MarginRatio: 2
      LiquidationPip: 548578
    BalanceChanged: 5
    ClaimableAmount: 6005

      `)
    })
    })