import type { JournalEntry, Trade } from '../types/database'
import type { AnalyticsFilters, ChartPoint } from '../types/analytics'

export function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function dateKey(value: string) {
  return value.slice(0, 10)
}

function monthKey(value: string) {
  return value.slice(0, 7)
}

function getStartDate(filters: AnalyticsFilters) {
  const now = new Date()
  if (filters.period === 'today') return startOfDay(now)
  if (filters.period === 'week') {
    const next = startOfDay(now)
    const day = next.getDay()
    next.setDate(next.getDate() - (day === 0 ? 6 : day - 1))
    return next
  }
  if (filters.period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
  if (filters.period === '3months') {
    const next = new Date(now)
    next.setMonth(next.getMonth() - 3)
    return startOfDay(next)
  }
  return filters.startDate ? startOfDay(new Date(filters.startDate)) : new Date(0)
}

function getEndDate(filters: AnalyticsFilters) {
  if (filters.period !== 'custom' || !filters.endDate) return null
  const end = new Date(filters.endDate)
  end.setHours(23, 59, 59, 999)
  return end
}

export function filterTrades(trades: Trade[], filters: AnalyticsFilters) {
  const start = getStartDate(filters)
  const end = getEndDate(filters)

  return trades.filter((trade) => {
    const createdAt = new Date(trade.created_at)
    if (createdAt < start) return false
    if (end && createdAt > end) return false
    if (filters.symbol !== 'all' && trade.symbol !== filters.symbol) return false
    if (filters.setupType !== 'all' && (trade.setup_type ?? 'Unassigned') !== filters.setupType) return false
    return true
  })
}

export function filterJournalEntries(entries: JournalEntry[], trades: Trade[], filteredTrades: Trade[]) {
  const tradeIds = new Set(filteredTrades.map((trade) => trade.id))
  return entries.filter((entry) => !entry.trade_id || tradeIds.has(entry.trade_id) || trades.length === 0)
}

export function getAverage(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((total, value) => total + value, 0) / values.length
}

export function calculateAverageRr(trades: Trade[]) {
  const ratios = trades
    .map((trade) => {
      const riskDistance = Math.abs(trade.entry_price - trade.stop_loss)
      const target = trade.tp1 ?? trade.tp2 ?? trade.tp3 ?? trade.tp4
      if (!target || riskDistance <= 0) return null
      const rewardDistance = trade.direction === 'buy' ? target - trade.entry_price : trade.entry_price - target
      return rewardDistance > 0 ? rewardDistance / riskDistance : null
    })
    .filter((value): value is number => value !== null)

  return getAverage(ratios)
}

export function groupProfitByDate(trades: Trade[]): ChartPoint[] {
  const grouped = trades.reduce<Record<string, { profitLoss: number; trades: number }>>((totals, trade) => {
    const key = dateKey(trade.created_at)
    totals[key] = totals[key] ?? { profitLoss: 0, trades: 0 }
    totals[key].profitLoss += trade.profit_loss ?? 0
    totals[key].trades += 1
    return totals
  }, {})

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name: name.slice(5), value: value.profitLoss, profitLoss: value.profitLoss, trades: value.trades }))
}

export function groupProfitByMonth(trades: Trade[]): ChartPoint[] {
  const grouped = trades.reduce<Record<string, { profitLoss: number; trades: number }>>((totals, trade) => {
    const key = monthKey(trade.created_at)
    totals[key] = totals[key] ?? { profitLoss: 0, trades: 0 }
    totals[key].profitLoss += trade.profit_loss ?? 0
    totals[key].trades += 1
    return totals
  }, {})

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name, value: value.profitLoss, profitLoss: value.profitLoss, trades: value.trades }))
}

export function buildEquityCurve(trades: Trade[]): ChartPoint[] {
  let equity = 0

  return [...trades]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((trade) => {
      equity += trade.profit_loss ?? 0
      return {
        name: dateKey(trade.created_at).slice(5),
        value: equity,
        profitLoss: trade.profit_loss ?? 0,
      }
    })
}

export function groupPerformance(trades: Trade[], getKey: (trade: Trade) => string): ChartPoint[] {
  const grouped = trades.reduce<Record<string, { profitLoss: number; trades: number }>>((totals, trade) => {
    const key = getKey(trade)
    totals[key] = totals[key] ?? { profitLoss: 0, trades: 0 }
    totals[key].profitLoss += trade.profit_loss ?? 0
    totals[key].trades += 1
    return totals
  }, {})

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value: value.profitLoss, profitLoss: value.profitLoss, trades: value.trades }))
    .sort((a, b) => b.value - a.value)
}

export function groupJournalGradePerformance(entries: JournalEntry[]): ChartPoint[] {
  const grouped = entries.reduce<Record<string, { profitLoss: number; trades: number }>>((totals, entry) => {
    const key = entry.trade_grade ?? 'Ungraded'
    totals[key] = totals[key] ?? { profitLoss: 0, trades: 0 }
    totals[key].profitLoss += entry.profit_loss ?? 0
    totals[key].trades += 1
    return totals
  }, {})

  return Object.entries(grouped).map(([name, value]) => ({ name, value: value.profitLoss, profitLoss: value.profitLoss, trades: value.trades }))
}

export function groupMistakeFrequency(entries: JournalEntry[]): ChartPoint[] {
  const totals = entries.reduce<Record<string, number>>((acc, entry) => {
    if (!Array.isArray(entry.mistake_checklist)) return acc
    entry.mistake_checklist.forEach((mistake) => {
      if (typeof mistake === 'string') acc[mistake] = (acc[mistake] ?? 0) + 1
    })
    return acc
  }, {})

  return Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function bestWorstByDay(trades: Trade[], mode: 'best' | 'worst') {
  const grouped = groupProfitByDate(trades)
  if (grouped.length === 0) return 'No day data'
  grouped.sort((a, b) => a.value - b.value)
  return mode === 'best' ? grouped[grouped.length - 1].name : grouped[0].name
}
