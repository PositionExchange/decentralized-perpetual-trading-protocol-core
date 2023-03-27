//
//
//
// // @notice this code is generated from "yaml" file using the script/auto-gen-test-case.ts
//
// import { deployAndCreateHelper, TestFutureHelper } from "./utils";
//
// describe("Limit_Increase_13_18.yml", async function(){
//   let testHelper: TestFutureHelper
//
//   beforeEach(async () => {
//     testHelper = await deployAndCreateHelper()
//   })
//
//
//     it("test case ## case013. File index 1", async function() {
//       return testHelper.process(`
// - S1: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 4900
//     Leverage: 5
//     Trader: 2
//     Side: 0
//     Deposit: 2700
// - S2: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 4950
//     Leverage: 5
//     Trader: 2
//     Side: 0
//     Deposit: 2800
// - S3: OpenLimit
//   Input:
//     Quantity: 15
//     Price: 4900
//     Leverage: 5
//     Trader: 1
//     Side: 1
//     Deposit: 15000
// - S4: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 4950
//     Leverage: 10
//     Trader: 1
//     Side: 1
//     Deposit: 2600
// - S5: OpenMarket
//   Input:
//     Quantity: 10
//     Leverage: 5
//     Trader: 2
//     Side: 0
//     Deposit: 5500
// - S6: ChangePrice
//   Input:
//     Price: 5765
// - S6.5: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: -20
//       MarginDeposit: 17600
//       MarginAbsolute: 17175
//       Notional: 98250
//       Pnl: -17050
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 515.25
//       MarginBalance: 550
//       MarginRatio: 93
//       LiquidationPip: 576673
//     BalanceChanged: null
//     ClaimableAmount: 17600
// - S7: Liquidate
//   Input:
//     Trader: 1
//     Liquidator: 3
//     Expect:
//       Position:
//         Quantity: -16
//         MarginDeposit: 17072
//         MarginAbsolute: 16659.75
//         Notional: 78600
//         Pnl: -13640
//         Leverage: 10
//       MaintenanceDetail:
//         MaintenanceMargin: 499.7925
//         MarginBalance: 3432
//         MarginRatio: 14
//         LiquidationPip: 594826
//       BalanceChanged: 7.92
//       ClaimableAmount: 17072
//
//       `)
//     })
//
//     it("test case ## case014. File index 2", async function() {
//       return testHelper.process(`
// - S1: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5100
//     Leverage: 5
//     Trader: 2
//     Side: 1
//     Deposit: 6000
// - S2: OpenMarket
//   Input:
//     Quantity: 5
//     Leverage: 5
//     Trader: 1
//     Side: 0
//     Deposit: 5200
// - S3: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5200
//     Leverage: 5
//     Trader: 2
//     Side: 1
//     Deposit: 6000
// - S4: OpenLimit
//   Input:
//     Quantity: 10
//     Price: 5150
//     Leverage: 6
//     Trader: 1
//     Side: 0
//     Deposit: 8000
// - S5: OpenMarket
//   Input:
//     Quantity: 10
//     Leverage: 10
//     Trader: 3
//     Side: 1
//     Deposit: 5100
// - S6: ChangePrice
//   Input:
//     Price: 4270
// - S6.5: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: 15
//       MarginDeposit: 13200
//       MarginAbsolute: 13683.333
//       Notional: 77000
//       Pnl: -12950
//       Leverage: 6
//     MaintenanceDetail:
//       MaintenanceMargin: 410.5
//       MarginBalance: 250
//       MarginRatio: 164
//       LiquidationPip: 428070
//     BalanceChanged: null
//     ClaimableAmount: 13200
// - S7: Liquidate
//   Input:
//     Trader: 1
//     Liquidator: 3
//     Expect:
//       Position:
//         Quantity: 0
//         MarginDeposit: 0
//         MarginAbsolute: 0
//         Notional: 0
//         Pnl: 0
//         Leverage: 0
//       MaintenanceDetail:
//         MaintenanceMargin: 0
//         MarginBalance: 0
//         MarginRatio: 0
//         LiquidationPip: 0
//       BalanceChanged: 198
//       ClaimableAmount: 0
//
//       `)
//     })
//
//     it("test case ## case015. File index 3", async function() {
//       return testHelper.process(`
// - S1: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5100
//     Leverage: 5
//     Trader: 2
//     Side: 0
//     Deposit: 6000
// - S2: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 4900
//     Leverage: 5
//     Trader: 2
//     Side: 0
//     Deposit: 5000
// - S3: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 5000
//     Leverage: 5
//     Trader: 2
//     Side: 0
//     Deposit: 5000
// - S4: OpenMarket
//   Input:
//     Quantity: 8
//     Leverage: 10
//     Trader: 1
//     Side: 1
//     Deposit: 4500
// - S5: OpenLimit
//   Input:
//     Quantity: 7
//     Price: 4850
//     Leverage: 10
//     Trader: 1
//     Side: 1
//     Deposit: 3400
// - S6: ChangePrice
//   Input:
//     Price: 5510
// - S6.5: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: -15
//       MarginDeposit: 7900
//       MarginAbsolute: 7500
//       Notional: 75000
//       Pnl: -7650
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 225
//       MarginBalance: 250
//       MarginRatio: 90
//       LiquidationPip: 551166
//     BalanceChanged: null
//     ClaimableAmount: 7900
// - S7: Liquidate
//   Input:
//     Trader: 1
//     Liquidator: 2
//   Expect:
//     Position:
//       Quantity: -12
//       MarginDeposit: 7663
//       MarginAbsolute: 7275
//       Notional: 60000
//       Pnl: -6120
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 218.25
//       MarginBalance: 1543
//       MarginRatio: 14
//       LiquidationPip: 562039
//     BalanceChanged: null
//     ClaimableAmount: 7663
//
//       `)
//     })
//
//     it("test case ## case016. File index 4", async function() {
//       return testHelper.process(`
// - S1: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 4900
//     Leverage: 5
//     Trader: 1
//     Side: 0
//     Deposit: 5000
// - S2: OpenLimit
//   Input:
//     Quantity: 10
//     Price: 4850
//     Leverage: 10
//     Trader: 2
//     Side: 1
//     Deposit: 4900
// - S3: OpenLimit
//   Input:
//     Quantity: 5
//     Price: 4950
//     Leverage: 10
//     Trader: 2
//     Side: 1
//     Deposit: 9700
// - S4: OpenLimit
//   Input:
//     Quantity: 15
//     Price: 5000
//     Leverage: 10
//     Trader: 1
//     Side: 0
//     Deposit: 7000
// - S5: OpenMarket
//   Input:
//     Quantity: 5
//     Leverage: 10
//     Trader: 2
//     Side: 1
//     Deposit: 2500
// - S6: ChangePrice
//   Input:
//     Price: 4342
// - S6.5: ExpectData
//   Input:
//     Trader: 1
//   Expect:
//     Position:
//       Quantity: 20
//       MarginDeposit: 12000
//       MarginAbsolute: 12300
//       Notional: 98500
//       Pnl: -11660
//       Leverage: 10
//     MaintenanceDetail:
//       MaintenanceMargin: 369
//       MarginBalance: 340
//       MarginRatio: 108
//       LiquidationPip: 434345
//     BalanceChanged: null
//     ClaimableAmount: 12000
// - S7: Liquidate
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
//     BalanceChanged: 180
//     ClaimableAmount: 0
//
//       `)
//     })
//     })