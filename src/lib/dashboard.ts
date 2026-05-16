import { supabase } from './supabase'
import type { JournalEntry, RiskSettings, Trade } from '../types/database'

export type RiskStatus = 'Safe' | 'Warning' | 'Daily Loss Reached' | 'Daily Profit Reached'

export type DashboardChartPoint = {
  date: string
  profitLoss: number
}

export type DashboardData = {
  trades: Trade[]
  recentTrades: Trade[]
  recentJournalEntries: JournalEntry[]
  riskSettings: RiskSettings | null
  dailyProfitLoss: number
  weeklyProfitLoss: number
  monthlyProfitLoss: number
  winRate: number
  totalTrades: number
  openTrades: number
  closedTrades: number
  wins: number
  losses: number
  breakeven: number
  accountBalance: number
  currentRiskStatus: RiskStatus
  bestSetup: string
  worstSetup: string
  chartData: DashboardChartPoint[]
}

const openStatuses = new Set(['waiting', 'active', 'tp1_hit', 'tp2_hit', 'tp3_hit', 'tp4_hit', 'breakeven'])

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function startOfWeek(date: Date) {
  const next = startOfDay(date)
  const day = next.getDay()
  const diff = day === 0 ? 6 : day - 1
  next.setDate(next.getDate() - diff)
  return next
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function profitLossForPeriod(trades: Trade[], start: Date) {
  return trades.reduce((total, trade) => {
    if (new Date(trade.created_at) < start) return total
    return total + (trade.profit_loss ?? 0)
  }, 0)
}

function calculateSetupPerformance(trades: Trade[], mode: 'best' | 'worst') {
  const setupTotals = trades.reduce<Record<string, number>>((totals, trade) => {
    if (!trade.setup_type) return totals
    totals[trade.setup_type] = (totals[trade.setup_type] ?? 0) + (trade.profit_loss ?? 0)
    return totals
  }, {})

  const entries = Object.entries(setupTotals)
  if (entries.length === 0) return 'No setup data'

  entries.sort((a, b) => a[1] - b[1])
  return mode === 'best' ? entries[entries.length - 1][0] : entries[0][0]
}

function buildChartData(trades: Trade[]) {
  const today = startOfDay(new Date())
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (13 - index))
    return date
  })

  return days.map((date) => {
    const key = date.toISOString().slice(0, 10)
    const profitLoss = trades.reduce((total, trade) => {
      if (trade.created_at.slice(0, 10) !== key) return total
      return total + (trade.profit_loss ?? 0)
    }, 0)

    return {
      date: key.slice(5),
      profitLoss,
    }
  })
}

function getRiskStatus(dailyProfitLoss: number, riskSettings: RiskSettings | null): RiskStatus {
  if (!riskSettings) return 'Safe'
  if (riskSettings.max_daily_loss > 0 && dailyProfitLoss <= -riskSettings.max_daily_loss) return 'Daily Loss Reached'
  if (riskSettings.max_daily_profit > 0 && dailyProfitLoss >= riskSettings.max_daily_profit) return 'Daily Profit Reached'
  if (riskSettings.max_daily_loss > 0 && dailyProfitLoss <= -riskSettings.max_daily_loss * 0.75) return 'Warning'
  return 'Safe'
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [tradesResult, journalResult, riskResult] = await Promise.all([
    supabase.from('trades').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('journal_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
    supabase.from('risk_settings').select('*').eq('user_id', userId).maybeSingle(),
  ])

  if (tradesResult.error) throw tradesResult.error
  if (journalResult.error) throw journalResult.error
  if (riskResult.error) throw riskResult.error

  const trades = tradesResult.data ?? []
  const recentJournalEntries = journalResult.data ?? []
  const now = new Date()
  const dailyProfitLoss = profitLossForPeriod(trades, startOfDay(now))
  const wins = trades.filter((trade) => trade.result === 'win').length
  const losses = trades.filter((trade) => trade.result === 'loss').length
  const breakeven = trades.filter((trade) => trade.result === 'breakeven').length
  const decidedTrades = wins + losses + breakeven

  return {
    trades,
    recentTrades: trades.slice(0, 6),
    recentJournalEntries,
    riskSettings: riskResult.data ?? null,
    dailyProfitLoss,
    weeklyProfitLoss: profitLossForPeriod(trades, startOfWeek(now)),
    monthlyProfitLoss: profitLossForPeriod(trades, startOfMonth(now)),
    winRate: decidedTrades > 0 ? (wins / decidedTrades) * 100 : 0,
    totalTrades: trades.length,
    openTrades: trades.filter((trade) => openStatuses.has(trade.status)).length,
    closedTrades: trades.filter((trade) => trade.status === 'closed' || ['win', 'loss', 'breakeven'].includes(trade.result)).length,
    wins,
    losses,
    breakeven,
    accountBalance: riskResult.data?.account_balance ?? trades[0]?.account_balance ?? 0,
    currentRiskStatus: getRiskStatus(dailyProfitLoss, riskResult.data ?? null),
    bestSetup: calculateSetupPerformance(trades, 'best'),
    worstSetup: calculateSetupPerformance(trades, 'worst'),
    chartData: buildChartData(trades),
  }
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}
