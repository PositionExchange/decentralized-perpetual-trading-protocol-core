
  
  
// @notice this code is generated from "yaml" file using the script/auto-gen-test-case.ts

import { deployAndCreateHelper, TestFutureHelper } from "./utils";  
  
describe("Create_Limit_No_Position_01_08.yml", async function(){
  let testHelper: TestFutureHelper

  beforeEach(async () => {
    testHelper = await deployAndCreateHelper()
  })

  
    it("test case ## case01. File index 1", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 10
    Price: 4950
    Leverage: 10
    Trader: 1
    Side: 0
    Deposit: 5000
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4950
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
    BalanceChanged: -5000
    ClaimableAmount: 0
- S2: OpenMarket
  Input:
    Quantity: 10
    Leverage: 20
    Trader: 2
    Side: 1
    Deposit: 4000
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 4000
      MarginAbsolute: 2475
      Notional: 49500
      Pnl: 0
      Leverage: 20
    MaintenanceDetail:
      MaintenanceMargin: 74.25
      MarginBalance: 4000
      MarginRatio: 1
      LiquidationPip: 5342.5
    BalanceChanged: -4000
    ClaimableAmount: 0
- S3: ChangePrice
  Input:
    Price: 5100
- S4: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 5000
      MarginAbsolute: 4950
      Notional: 49500
      Pnl: 1500
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 148.5
      MarginBalance: 6500
      MarginRatio: 2
      LiquidationPip: 4464.85
    BalanceChanged: 0

      `)
    })
    
    it("test case ## case02. File index 2", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 10
    Price: 4950
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 5000
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4950
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
    BalanceChanged: -5000
    ClaimableAmount: 0
- S2: OpenLimit
  Input:
    Quantity: 10
    Price: 4950
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 4000
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4950
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: 10
      MarginDeposit: 4000
      MarginAbsolute: 4950
      Notional: 49500
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 148.5
      MarginBalance: 4000
      MarginRatio: 3
      LiquidationPip: 4564.8
    BalanceChanged: -4000
    ClaimableAmount: 0
- S3: ChangePrice
  Input:
    Price: 5100
- S4: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 5000
      MarginAbsolute: 4950
      Notional: 49500
      Pnl: -1500
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 148.5
      MarginBalance: 3500
      MarginRatio: 4
      LiquidationPip: 5335.15
    BalanceChanged: 0

      `)
    })
    
    it("test case ##case03. File index 3", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 10
    Price: 4950
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 4000
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4950
      Id: 1
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
- S2: OpenLimit
  Input:
    Quantity: 8
    Price: 4950
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 3000
  Expect:
    PendingOrder:
      Orders: 0
      Price: 0
      Id: 0
      PartialFilled: 0
    Position:
      Quantity: 8
      MarginDeposit: 3000
      MarginAbsolute: 3960
      Notional: 39600
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 118.8
      MarginBalance: 3000
      MarginRatio: 3
      LiquidationPip: 4589.85
    BalanceChanged: -3000
    ClaimableAmount: 0
- S3: CancelLimit
  Input:
    Price: 4950
    Trader: 1
    Id: 1
  Expect:
    PendingOrder:
      Orders: 0
    Position:
      Quantity: -8
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
    BalanceChanged: 800.8
    ClaimableAmount: 0
- S4: ChangePrice
  Input:
    Price: 5100
- S5: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -8
      MarginDeposit: 3200
      MarginAbsolute: 3960
      Notional: 39600
      Pnl: -1200
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 118.8
      MarginBalance: 2000
      MarginRatio: 5
      LiquidationPip: 5435.15
    BalanceChanged: 0
    ClaimableAmount: 0

      `)
    })
    
    it("test case ##case04. File index 4", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 5
    Price: 4800
    Leverage: 10
    Trader: 2
    Side: 0
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
    ClaimableAmount: 0
- S2: OpenLimit
  Input:
    Quantity: 10
    Price: 4900
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 4900
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
    BalanceChanged: -4900
    ClaimableAmount: 0
- S3: OpenMarket
  Input:
    Quantity: 10
    Leverage: 10
    Trader: 2
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
      LiquidationPip: 4514.7
    ClaimableAmount: 0
- S4: ChangePrice
  Input:
    Price: 4950
- S5: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 4900
      MarginAbsolute: 4900
      Notional: 49000
      Pnl: -500
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 147
      MarginBalance: 4400
      MarginRatio: 3
      LiquidationPip: 5375.3
    BalanceChanged: 0

      `)
    })
    
    it("test case ##case05. File index 5", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 10
    Price: 5200
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 5000
  Expect:
    PendingOrder:
      Orders: 1
      Price: 5200
      Id: 1
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
    BalanceChanged: -5000
    ClaimableAmount: 0
- S2: OpenMarket
  Input:
    Quantity: 8
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 4000
  Expect:
    Position:
      Quantity: 8
      MarginDeposit: 4000
      MarginAbsolute: 4160
      Notional: 41600
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 124.8
      MarginBalance: 4000
      MarginRatio: 3
      LiquidationPip: 4715.6
    ClaimableAmount: 0
- S3: ChangePrice
  Input:
    Price: 4951
- S4: CancelLimit
  Input:
    Price: 5200
    Trader: 1
    Id: 1
  Expect:
    Position:
      Quantity: -8
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
    BalanceChanged: 1000
    ClaimableAmount: 0
- S5: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -8
      MarginDeposit: 4000
      MarginAbsolute: 4160
      Notional: 41600
      Pnl: 1992
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 124.8
      MarginBalance: 5992
      MarginRatio: 2
      LiquidationPip: 5684.4
    BalanceChanged: 0
    ClaimableAmount: 0

      `)
    })
    
    it("test case ##case06. File index 6", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 5
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 4000
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4900
      Id: 1
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
- S2: OpenLimit
  Input:
    Quantity: 3
    Price: 4800
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 2000
  Expect:
    PendingOrder:
      Orders: 2
      Price: 4800,4900
      Id: 1,1
      Quantity: 3,5
      PartialFilled: 0,0
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
    BalanceChanged: -2000
    ClaimableAmount: 0
- S3: OpenLimit
  Input:
    Quantity: 2
    Price: 4700
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 1500
  Expect:
    PendingOrder:
      Orders: 3
      Price: 4700,4800,4900
      Id: 1,1,1
      Quantity: 2,3,5
      PartialFilled: 0,0,0
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
    BalanceChanged: -1500
    ClaimableAmount: 0
- S4: OpenLimit
  Input:
    Quantity: 10
    Price: 4700
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 6000
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 6000
      MarginAbsolute: 4830
      Notional: 48300
      Pnl: 1300
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 144.9
      MarginBalance: 7300
      MarginRatio: 1
      LiquidationPip: 5415.51
    BalanceChanged: -6000
    ClaimableAmount: 0
- S5: ExpectData
  Input:
    Trader: 2
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 7500
      MarginAbsolute: 4830
      Notional: 48300
      Pnl: 0
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 144.9
      MarginBalance: 6200
      MarginRatio: 2
      LiquidationPip: 3644.49
    BalanceChanged: 0
    ClaimableAmount: 0

      `)
    })
    
    it("test case ##case07. File index 7", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 5
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 4000
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4900
      Id: 1
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
- S2: OpenLimit
  Input:
    Quantity: 3
    Price: 4800
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 2000
  Expect:
    PendingOrder:
      Orders: 2
      Price: 4800,4900
      Id: 1,1
      Quantity: 3,5
      PartialFilled: 0,0
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
    BalanceChanged: -2000
    ClaimableAmount: 0
- S3: OpenLimit
  Input:
    Quantity: 10
    Price: 4800
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 6000
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4800
      Id: 2
      Quantity: 2
      PartialFilled: 0
    Position:
      Quantity: -8
      MarginDeposit: 4800
      MarginAbsolute: 3890
      Notional: 38900
      Pnl: 500
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 116.7
      MarginBalance: 5300
      MarginRatio: 2
      LiquidationPip: 5447.9
    BalanceChanged: -6000
    ClaimableAmount: 0
- S4: OpenLimit
  Input:
    Quantity: 5
    Price: 4700
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 4000
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4700
      Id: 1
      PartialFilled: 0
    Position:
      Quantity: 8
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
- S5: OpenMarket
  Input:
    Quantity: 2
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 1500
  Expect:
    Position:
      Quantity: 10
      MarginDeposit: 7500
      MarginAbsolute: 4850
      Notional: 48500
      Pnl: -500
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 145.5
      MarginBalance: 7000
      MarginRatio: 2
      LiquidationPip: 3764.5
    BalanceChanged: -1500
    ClaimableAmount: 0
- S6: ExpectData
  Input:
    Trader: 1
  Expect:
    Position:
      Quantity: -10
      MarginDeposit: 6000
      MarginAbsolute: 4850
      Notional: 48500
      Pnl: 500
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 145.5
      MarginBalance: 6500
      MarginRatio: 2
      LiquidationPip: 5435.45
    ClaimableAmount: 0

      `)
    })
    
    it("test case ##case08. File index 8", async function() {
      return testHelper.process(`
- S1: OpenLimit
  Input:
    Quantity: 5
    Price: 4700
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 4000
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4700
      Id: 1
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
- S2: OpenLimit
  Input:
    Quantity: 3
    Price: 4900
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 2000
  Expect:
    PendingOrder:
      Orders: 2
      Price: 4900,4700
      Id: 1,1
      Quantity: 3,5
      PartialFilled: 0,0
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
    BalanceChanged: -2000
    ClaimableAmount: 0
- S3: OpenLimit
  Input:
    Quantity: 2
    Price: 4800
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 1500
  Expect:
    PendingOrder:
      Orders: 3
      Price: 4800,4700,4900
      Id: 1,1,1
      Quantity: 2,5,3
      PartialFilled: 0,0,0
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
    BalanceChanged: -1500
    ClaimableAmount: 0
- S4: OpenLimit
  Input:
    Quantity: 10
    Price: 4800
    Leverage: 10
    Trader: 1
    Side: 1
    Deposit: 6000
  Expect:
    PendingOrder:
      Orders: 1
      Price: 4800
      Id: 2
      Quantity: 5
      PartialFilled: 0
    Position:
      Quantity: -5
      MarginDeposit: 3000
      MarginAbsolute: 2430
      Notional: 24300
      Pnl: 300
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 72.9
      MarginBalance: 3300
      MarginRatio: 2
      LiquidationPip: 5445.4
    BalanceChanged: -6000
    ClaimableAmount: 0
- S5: OpenMarket
  Input:
    Quantity: 3
    Leverage: 10
    Trader: 2
    Side: 0
    Deposit: 2000
  Expect:
    Position:
      Quantity: 8
      MarginDeposit: 5500
      MarginAbsolute: 3870
      Notional: 38700
      Pnl: -300
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 116.1
      MarginBalance: 5200
      MarginRatio: 0
      LiquidationPip: 3352
    BalanceChanged: -2000
    ClaimableAmount: 0
- S6: CancelLimit
  Input:
    Price: 4700
    Trader: 2
    Id: 1
  Expect:
    PendingOrder:
      Orders: 0
    Position:
      Quantity: 8
      MarginDeposit: 5500
      MarginAbsolute: 3870
      Notional: 38700
      Pnl: -300
      Leverage: 10
    MaintenanceDetail:
      MaintenanceMargin: 116.1
      MarginBalance: 5200
      MarginRatio: 2
      LiquidationPip: 5442.9
    BalanceChanged: 4000
    ClaimableAmount: 0

      `)
    })
    })