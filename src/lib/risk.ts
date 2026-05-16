import type { RiskSettings, Trade } from '../types/database'
import type { RiskSettingsForm, RiskStatus } from '../types/risk'

export const initialRiskSettingsForm: RiskSettingsForm = {
  accountBalance: '',
  riskPerTrade: '1',
  maxDailyLoss: '',
  maxDailyProfit: '',
  maxTradesPerDay: '3',
  lockAfterDailyLoss: false,
}

export function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

export function getTodayTrades(trades: Trade[]) {
  const today = startOfToday()
  return trades.filter((trade) => new Date(trade.created_at) >= today)
}

export function calculateDailyProfitLoss(trades: Trade[]) {
  return getTodayTrades(trades).reduce((total, trade) => total + (trade.profit_loss ?? 0), 0)
}

export function riskSettingsToForm(settings: RiskSettings | null): RiskSettingsForm {
  if (!settings) return initialRiskSettingsForm

  return {
    accountBalance: String(settings.account_balance),
    riskPerTrade: String(settings.risk_per_trade),
    maxDailyLoss: String(settings.max_daily_loss),
    maxDailyProfit: String(settings.max_daily_profit),
    maxTradesPerDay: String(settings.max_trades_per_day),
    lockAfterDailyLoss: settings.lock_after_daily_loss,
  }
}

export function formToRiskSettings(form: RiskSettingsForm, userId: string) {
  return {
    user_id: userId,
    account_balance: Number(form.accountBalance) || 0,
    risk_per_trade: Number(form.riskPerTrade) || 0,
    max_daily_loss: Number(form.maxDailyLoss) || 0,
    max_daily_profit: Number(form.maxDailyProfit) || 0,
    max_trades_per_day: Number(form.maxTradesPerDay) || 0,
    lock_after_daily_loss: form.lockAfterDailyLoss,
  }
}

export function getRiskStatus(settings: RiskSettings | null, dailyProfitLoss: number, tradesToday: number): RiskStatus {
  if (!settings) return 'Safe'
  if (settings.max_daily_loss > 0 && dailyProfitLoss <= -settings.max_daily_loss) return 'Daily Loss Reached'
  if (settings.max_daily_profit > 0 && dailyProfitLoss >= settings.max_daily_profit) return 'Daily Profit Reached'
  if (settings.max_trades_per_day > 0 && tradesToday >= settings.max_trades_per_day) return 'Max Trades Reached'
  if (settings.max_daily_loss > 0 && dailyProfitLoss <= -settings.max_daily_loss * 0.75) return 'Warning'
  return 'Safe'
}

export function shouldLockNewTrades(settings: RiskSettings | null, status: RiskStatus) {
  if (!settings?.lock_after_daily_loss) return false
  return status === 'Daily Loss Reached' || status === 'Max Trades Reached'
}

export function getRiskStatusMessage(status: RiskStatus) {
  if (status === 'Daily Loss Reached') return 'Your preset risk limit has been reached.'
  if (status === 'Daily Profit Reached') return 'Your preset daily profit level has been reached. Consider reviewing whether to continue today.'
  if (status === 'Max Trades Reached') return 'Your preset max trades per day has been reached.'
  if (status === 'Warning') return 'Current daily P/L is close to your preset daily loss limit.'
  return 'Current risk status is within your configured limits.'
}
