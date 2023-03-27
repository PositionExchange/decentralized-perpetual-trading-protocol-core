//
//
//
// // @notice this code is generated from "yaml" file using the script/auto-gen-test-case.ts
//
// import { deployAndCreateHelper, TestFutureHelper } from "./utils";
//
// describe("Limit_Increase_01_12.yml", async function(){
//   let testHelper: TestFutureHelper
//
//   beforeEach(async () => {
//     testHelper = await deployAndCreateHelper()
//   })
//
//
//     it("test case ## case01. File index 1", async function() {
//       return testHelper.process(`
// - S1: OpenLimit
//   Input:
//     Quantity: 10
//     Price: 4950
//     Leverage: 5
//     Trader: 1
//     Side: 1
//     Deposit: 4500
//   Expect:
//     PendingOrder:
//       Orders: 1
//       Price: 4950
//       Id: 1
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
//     BalanceChanged: -4500
//     ClaimableAmount: 0
// - S2: OpenMarket
//   Input:
//     Quantity: 10
//     Leverage: 10
//     Trader: 2
//     Side: 0
//     Deposit: 2500
//   Expect:
//     Position:
//       Quantity: 10
//       MarginDeposit: 2500
//       MarginAbsolute: 4950
//       Notional: 49500
//       Pnl: 0
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 148.5
//       MarginBalance: 2500
//       MarginRatio: 5
//       LiquidationPip: 472970
//     BalanceChanged: -2500
//     ClaimableAmount: 2500
// - S3: OpenLimit
//   Input:
//     Quantity: 6
//     Price: 4900
//     Leverage: 10
//     Trader: 1
//     Side: 1
//     Deposit: 5000
//   Expect:
//     PendingOrder:
//       Orders: 1
//       Price: 4900
//       Id: 1
//       PartialFilled: 0
//     Position:
//       Quantity: -10
//       MarginDeposit: 4500
//       MarginAbsolute: 9900
//       Notional: 49500
//       Pnl: 500
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 297
//       MarginBalance: 5000
//       MarginRatio: 5
//       LiquidationPip: 537030
//     BalanceChanged: -5000
//     ClaimableAmount: 4500
// - S4: OpenLimit
//   Input:
//     Quantity: 6
//     Price: 5000
//     Leverage: 15
//     Trader: 2
//     Side: 0
//     Deposit: 5000
//   Expect:
//     PendingOrder:
//       Orders: 0
//     Position:
//       Quantity: 16
//       MarginDeposit: 7500
//       MarginAbsolute: 6910
//       Notional: 78900
//       Pnl: -500
//       Leverage: 15
//     MaintenanceDetail:
//       MaintenanceMargin: 207.3
//       MarginBalance: 7000
//       MarginRatio: 2
//       LiquidationPip: 447545
//     BalanceChanged: -5000
//     ClaimableAmount: 7500
// - S5: ChangePrice
//   Input:
//     Price: 4900
// - S6: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: -16
//       MarginDeposit: 9500
//       MarginAbsolute: 12840
//       Notional: 78900
//       Pnl: 500
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 385.2
//       MarginBalance: 10000
//       MarginRatio: 3
//       LiquidationPip: 550092
//     BalanceChanged: 0
//     ClaimableAmount: 9500
//
//       `)
//     })
//
//     it("test case ## case02. File index 2", async function() {
//       return testHelper.process(`
// - S1: OpenLimit
//   Input:
//     Quantity: 10
//     Price: 4950
//     Leverage: 5
//     Trader: 1
//     Side: 1
//     Deposit: 9000
// - S2: OpenMarket
//   Input:
//     Quantity: 10
//     Leverage: 10
//     Trader: 2
//     Side: 0
//     Deposit: 4950
// - S3: OpenLimit
//   Input:
//     Quantity: 6
//     Price: 4900
//     Leverage: 6
//     Trader: 1
//     Side: 1
//     Deposit: 4000
// - S4: OpenLimit
//   Input:
//     Quantity: 6
//     Price: 5000
//     Leverage: 15
//     Trader: 2
//     Side: 0
//     Deposit: 2000
// - S5: ChangePrice
//   Input:
//     Price: 5710
// - S5.5: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: -16
//       MarginDeposit: 13000
//       MarginAbsolute: 14800
//       Notional: 78900
//       Pnl: -12460
//       Leverage: 6
//     MaintenanceDetail:
//       MaintenanceMargin: 444
//       MarginBalance: 540
//       MarginRatio: 82
//       LiquidationPip: 571600
//     BalanceChanged: 0
//     ClaimableAmount: 13000
// - S6: Liquidate
//   Input:
//     Trader: 1
//     Liquidator: 3
//   Expect:
//     Position:
//       Quantity: -12.8
//       MarginDeposit: 12610
//       MarginAbsolute: 14356
//       Notional: 63120
//       Pnl: -9968
//       Leverage: 6
//     MaintenanceDetail:
//       MaintenanceMargin: 430.68
//       MarginBalance: 2642
//       MarginRatio: 16
//       LiquidationPip: 588275
//     BalanceChanged: 195
//     ClaimableAmount: 12610
//
//       `)
//     })
//
//     it("test case ## case03. File index 3", async function() {
//       return testHelper.process(`
// - S1: OpenLimit
//   Input:
//     Quantity: 10
//     Price: 4950
//     Leverage: 5
//     Trader: 1
//     Side: 0
//     Deposit: 9000
// - S2: OpenMarket
//   Input:
//     Quantity: 10
//     Leverage: 10
//     Trader: 2
//     Side: 1
//     Deposit: 4960
// - S3: OpenLimit
//   Input:
//     Quantity: 6
//     Price: 4900
//     Leverage: 5
//     Trader: 1
//     Side: 0
//     Deposit: 7000
// - S4: OpenMarket
//   Input:
//     Quantity: 6
//     Leverage: 15
//     Trader: 2
//     Side: 1
//     Deposit: 2000
// - S5: ChangePrice
//   Input:
//     Price: 3960
// - S5.5: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: 16
//       MarginDeposit: 16000
//       MarginAbsolute: 15780
//       Notional: 78900
//       Pnl: -15540
//       Leverage: 5
//     MaintenanceDetail:
//       MaintenanceMargin: 473.4
//       MarginBalance: 460
//       MarginRatio: 102
//       LiquidationPip: 396083
//     BalanceChanged: 0
//     ClaimableAmount: 16000
// - S6: Liquidate
//   Input:
//     Trader: 1
//     Liquidator: 3
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
//     BalanceChanged: 240
//     ClaimableAmount: 0
//
//       `)
//     })
//
//     it("test case ## case04. File index 4", async function() {
//       return testHelper.process(`
// - S1: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5050
//     Leverage: 5
//     Trader: 2
//     Side: 1
//     Deposit: 5000
// - S2: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5100
//     Leverage: 8
//     Trader: 2
//     Side: 1
//     Deposit: 3000
// - S3: OpenLimit
//   Input:
//     Quantity: 7
//     Price: 5200
//     Leverage: 7
//     Trader: 1
//     Side: 0
//     Deposit: 4500
// - S3.5: ChangePrice
//   Input:
//     Price: 5000
// - S3.6: ExpectData
//   Input:
//     Trader: 2
//   Expect:
//     Position:
//       Quantity: -7
//       MarginDeposit: 8000
//       MarginAbsolute: 6325
//       Notional: 35450
//       Pnl: 450
//       Leverage: 8
//     MaintenanceDetail:
//       MaintenanceMargin: 189.75
//       MarginBalance: 8,450.00
//       MarginRatio: 2
//       LiquidationPip: 618003
//     BalanceChanged: null
//     ClaimableAmount: 8000
// - S4: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5050
//     Leverage: 10
//     Trader: 1
//     Side: 0
//     Deposit: 3600
// - S5: OpenMarket
//   Input:
//     Quantity: 5
//     Leverage: 5
//     Trader: 3
//     Side: 1
//     Deposit: 5000
// - S5.5: ChangePrice
//   Input:
//     Price: 4900
// - S5.6: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: 12
//       MarginDeposit: 8100
//       MarginAbsolute: 7589.286
//       Notional: 60700
//       Pnl: -1900
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 227.6785714
//       MarginBalance: 6200
//       MarginRatio: 3
//       LiquidationPip: 440230
//     BalanceChanged: null
//     ClaimableAmount: 8100
//
//       `)
//     })
//
//     it("test case ## case05. File index 5", async function() {
//       return testHelper.process(`
// - S1: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5050
//     Leverage: 5
//     Trader: 2
//     Side: 1
//     Deposit: 5000
// - S2: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5100
//     Leverage: 8
//     Trader: 2
//     Side: 1
//     Deposit: 3000
// - S3: OpenLimit
//   Input:
//     Quantity: 7
//     Price: 5200
//     Leverage: 7
//     Trader: 1
//     Side: 0
//     Deposit: 4500
// - S4: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5050
//     Leverage: 10
//     Trader: 1
//     Side: 0
//     Deposit: 2100
// - S5: OpenMarket
//   Input:
//     Quantity: 5
//     Leverage: 5
//     Trader: 3
//     Side: 1
//     Deposit: 5000
// - S5.5: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: 12
//       MarginDeposit: 6600
//       MarginAbsolute: 7589.286
//       Notional: 60700
//       Pnl: -6340
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 227.6785714
//       MarginBalance: 260
//       MarginRatio: 87
//       LiquidationPip: 452730
//     BalanceChanged: null
//     ClaimableAmount: 6600
// - S5.6: ChangePrice
//   Input:
//     Price: 4530
// - S6: Liquidate
//   Input:
//     Trader: 1
//     Liquidator: 3
//   Expect:
//     Position:
//       Quantity: 9.6
//       MarginDeposit: 6402
//       MarginAbsolute: 7361.607143
//       Notional: 48560
//       Pnl: -5072
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 220.8482143
//       MarginBalance: 1330
//       MarginRatio: 16
//       LiquidationPip: 441446
//     BalanceChanged: 2.97
//     ClaimableAmount: 6402
//
//       `)
//     })
//
//     it("test case ## case06. File index 6", async function() {
//       return testHelper.process(`
// - S1: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5050
//     Leverage: 5
//     Trader: 2
//     Side: 0
//     Deposit: 5000
// - S2: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5100
//     Leverage: 8
//     Trader: 2
//     Side: 0
//     Deposit: 3000
// - S3: OpenMarket
//   Input:
//     Quantity: 7
//     Leverage: 7
//     Trader: 1
//     Side: 1
//     Deposit: 4500
// - S4: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5150
//     Leverage: 10
//     Trader: 1
//     Side: 1
//     Deposit: 2200
// - S5: OpenMarket
//   Input:
//     Quantity: 5
//     Leverage: 5
//     Trader: 3
//     Side: 0
//     Deposit: 5000
// - S6: ChangePrice
//   Input:
//     Price: 5652
// - S6.5: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: -12
//       MarginDeposit: 6700
//       MarginAbsolute: 7660.714
//       Notional: 61350
//       Pnl: -6474
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 229.8214286
//       MarginBalance: 226
//       MarginRatio: 101
//       LiquidationPip: 565168
//     BalanceChanged: null
//     ClaimableAmount: 6700
// - S7: Liquidate
//   Input:
//     Trader: 1
//     Liquidator: 3
//   Expect:
//     Position:
//       Quantity: -9.6
//       MarginDeposit: 6499
//       MarginAbsolute: 7430.892857
//       Notional: 49080
//       Pnl: -5179.2
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 222.9267857
//       MarginBalance: 1319.8
//       MarginRatio: 16
//       LiquidationPip: 576625
//     BalanceChanged: 201
//     ClaimableAmount: 6499
//
//       `)
//     })
//
//     it("test case ## case07. File index 7", async function() {
//       return testHelper.process(`
// - S1: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5050
//     Leverage: 5
//     Trader: 2
//     Side: 1
//     Deposit: 5000
// - S2: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5100
//     Leverage: 8
//     Trader: 2
//     Side: 1
//     Deposit: 3000
// - S3: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5150
//     Leverage: 10
//     Trader: 2
//     Side: 1
//     Deposit: 2000
// - S4: OpenLimit
//   Input:
//     Quantity: 7
//     Price: 5200
//     Leverage: 5
//     Trader: 1
//     Side: 0
//     Deposit: 7000
// - S5: OpenLimit
//   Input:
//     Quantity: 8
//     Price: 5200
//     Leverage: 10
//     Trader: 1
//     Side: 0
//     Deposit: 4000
// - S6: ChangePrice
//   Input:
//     Price: 5300
// - S6.5: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: 15
//       MarginDeposit: 11000
//       MarginAbsolute: 11195
//       Notional: 76500
//       Pnl: 3000
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 335.85
//       MarginBalance: 14000
//       MarginRatio: 2
//       LiquidationPip: 438905
//     BalanceChanged: null
//     ClaimableAmount: 11000
//
//       `)
//     })
//
//     it("test case ## case08. File index 8", async function() {
//       return testHelper.process(`
// - S1: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5050
//     Leverage: 5
//     Trader: 2
//     Side: 1
//     Deposit: 5000
// - S2: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5100
//     Leverage: 8
//     Trader: 2
//     Side: 1
//     Deposit: 3000
// - S3: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5150
//     Leverage: 10
//     Trader: 2
//     Side: 1
//     Deposit: 2000
// - S4: OpenLimit
//   Input:
//     Quantity: 7
//     Price: 5200
//     Leverage: 5
//     Trader: 1
//     Side: 0
//     Deposit: 7000
// - S5: OpenLimit
//   Input:
//     Quantity: 8
//     Price: 5200
//     Leverage: 10
//     Trader: 1
//     Side: 0
//     Deposit: 4200
// - S6: ChangePrice
//   Input:
//     Price: 4380
// - S5.6: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: 15
//       MarginDeposit: 11200
//       MarginAbsolute: 11195
//       Notional: 76500
//       Pnl: -10800
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 335.85
//       MarginBalance: 400
//       MarginRatio: 83
//       LiquidationPip: 437572
//     BalanceChanged: null
//     ClaimableAmount: 11200
// - S6: Liquidate
//   Input:
//     Trader: 1
//     Liquidator: 3
//   Expect:
//     Position:
//       Quantity: 12
//       MarginDeposit: 10864
//       MarginAbsolute: 10859.15
//       Notional: 61200
//       Pnl: -8640
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 325.7745
//       MarginBalance: 2224
//       MarginRatio: 14
//       LiquidationPip: 422181
//     BalanceChanged: 5.04
//     ClaimableAmount: 10864
//
//       `)
//     })
//
//     it("test case ## case09. File index 9", async function() {
//       return testHelper.process(`
// - S1: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5050
//     Leverage: 5
//     Trader: 2
//     Side: 1
//     Deposit: 5000
// - S2: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5100
//     Leverage: 8
//     Trader: 2
//     Side: 1
//     Deposit: 3000
// - S3: OpenMarket
//   Input:
//     Quantity: 7
//     Leverage: 5
//     Trader: 1
//     Side: 0
//     Deposit: 7000
// - S4: OpenLimit
//   Input:
//     Quantity: 7
//     Price: 5200
//     Leverage: 5
//     Trader: 1
//     Side: 0
//     Deposit: 7000
// - S5: OpenLimit
//   Input:
//     Quantity: 8
//     Price: 5200
//     Leverage: 10
//     Trader: 1
//     Side: 0
//     Deposit: 4200
// - S6: ChangePrice
//   Input:
//     Price: 4370
// - S5.6: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: 15
//       MarginDeposit: 11200
//       MarginAbsolute: 11195
//       Notional: 76500
//       Pnl: -10800
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 335.85
//       MarginBalance: 400
//       MarginRatio: 83
//       LiquidationPip: 437572
//     BalanceChanged: null
//     ClaimableAmount: 11200
// - S6: Liquidate
//   Input:
//     Trader: 1
//     Liquidator: 3
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
//     BalanceChanged: 168
//     ClaimableAmount: 0
//
//       `)
//     })
//
//     it("test case ## case10. File index 10", async function() {
//       return testHelper.process(`
// - S1: OpenLimit
//   Input:
//     Quantity: 10
//     Price: 4950
//     Leverage: 5
//     Trader: 1
//     Side: 0
//     Deposit: 9000
// - S2: OpenMarket
//   Input:
//     Quantity: 5
//     Leverage: 5
//     Trader: 2
//     Side: 1
//     Deposit: 4600
// - S3: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5050
//     Leverage: 5
//     Trader: 2
//     Side: 1
//     Deposit: 5000
// - S4: OpenLimit
//   Input:
//     Quantity: 3
//     Price: 5000
//     Leverage: 8
//     Trader: 2
//     Side: 1
//     Deposit: 1800
// - S5: OpenLimit
//   Input:
//     Quantity: 10
//     Price: 5100
//     Leverage: 8
//     Trader: 1
//     Side: 0
//     Deposit: 7500
// - S6: OpenMarket
//   Input:
//     Quantity: 7
//     Leverage: 10
//     Trader: 2
//     Side: 1
//     Deposit: 1000
// - S7: ChangePrice
//   Input:
//     Price: 5150
// - S7.5: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: 20
//       MarginDeposit: 16500
//       MarginAbsolute: 16206.25
//       Notional: 99950
//       Pnl: 3050
//       Leverage: 8
//     MaintenanceDetail:
//       MaintenanceMargin: 486.1875
//       MarginBalance: 19550
//       MarginRatio: 2
//       LiquidationPip: 419680
//     BalanceChanged: null
//     ClaimableAmount: 16500
//
//       `)
//     })
//
//     it("test case ## case11. File index 11", async function() {
//       return testHelper.process(`
// - S1: OpenLimit
//   Input:
//     Quantity: 10
//     Price: 4950
//     Leverage: 5
//     Trader: 1
//     Side: 0
//     Deposit: 9000
// - S2: OpenMarket
//   Input:
//     Quantity: 5
//     Leverage: 5
//     Trader: 2
//     Side: 1
//     Deposit: 4600
// - S3: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5050
//     Leverage: 5
//     Trader: 2
//     Side: 1
//     Deposit: 5000
// - S4: OpenLimit
//   Input:
//     Quantity: 3
//     Price: 5000
//     Leverage: 8
//     Trader: 2
//     Side: 1
//     Deposit: 1800
// - S5: OpenLimit
//   Input:
//     Quantity: 10
//     Price: 5100
//     Leverage: 8
//     Trader: 1
//     Side: 0
//     Deposit: 7500
// - S6: OpenMarket
//   Input:
//     Quantity: 7
//     Leverage: 10
//     Trader: 2
//     Side: 1
//     Deposit: 1000
// - S7: ChangePrice
//   Input:
//     Price: 4200
// - S7.5: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: 20
//       MarginDeposit: 16500
//       MarginAbsolute: 16206.25
//       Notional: 99950
//       Pnl: -15950
//       Leverage: 8
//     MaintenanceDetail:
//       MaintenanceMargin: 486.1875
//       MarginBalance: 550
//       MarginRatio: 88
//       LiquidationPip: 419680
//     BalanceChanged: null
//     ClaimableAmount: 16500
// - S8: Liquidate
//   Input:
//     Trader: 1
//     Liquidator: 2
//   Expect:
//     Position:
//       Quantity: 16
//       MarginDeposit: 16005
//       MarginAbsolute: 15720.0625
//       Notional: 79960
//       Pnl: -12760
//       Leverage: 8
//     MaintenanceDetail:
//       MaintenanceMargin: 471.601875
//       MarginBalance: 3245
//       MarginRatio: 14
//       LiquidationPip: 402666
//     BalanceChanged: 7.425
//     ClaimableAmount: 16005
//
//       `)
//     })
//
//     it("test case ## case12. File index 12", async function() {
//       return testHelper.process(`
// - S1: OpenLimit
//   Input:
//     Quantity: 10
//     Price: 4950
//     Leverage: 5
//     Trader: 1
//     Side: 0
//     Deposit: 9000
// - S2: OpenMarket
//   Input:
//     Quantity: 5
//     Leverage: 5
//     Trader: 2
//     Side: 1
//     Deposit: 4600
// - S3: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5050
//     Leverage: 5
//     Trader: 2
//     Side: 1
//     Deposit: 5000
// - S4: OpenLimit
//   Input:
//     Quantity: 3
//     Price: 5000
//     Leverage: 8
//     Trader: 2
//     Side: 1
//     Deposit: 1800
// - S5: OpenLimit
//   Input:
//     Quantity: 10
//     Price: 5100
//     Leverage: 8
//     Trader: 1
//     Side: 0
//     Deposit: 7100
// - S6: OpenMarket
//   Input:
//     Quantity: 7
//     Leverage: 10
//     Trader: 2
//     Side: 1
//     Deposit: 1000
// - S7: ChangePrice
//   Input:
//     Price: 4210
// - S7.5: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: 20
//       MarginDeposit: 16100
//       MarginAbsolute: 16206.25
//       Notional: 99950
//       Pnl: -15750
//       Leverage: 8
//     MaintenanceDetail:
//       MaintenanceMargin: 486.1875
//       MarginBalance: 350
//       MarginRatio: 138
//       LiquidationPip: 421680
//     BalanceChanged: null
//     ClaimableAmount: 16100
// - S8: Liquidate
//   Input:
//     Trader: 1
//     Liquidator: 3
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
//     BalanceChanged: 241.5
//     ClaimableAmount: 0
//
//       `)
//     })
//     })