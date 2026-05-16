export type RiskSettingsForm = {
  accountBalance: string
  riskPerTrade: string
  maxDailyLoss: string
  maxDailyProfit: string
  maxTradesPerDay: string
  lockAfterDailyLoss: boolean
}

export type RiskStatus = 'Safe' | 'Warning' | 'Daily Loss Reached' | 'Daily Profit Reached' | 'Max Trades Reached'
