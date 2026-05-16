import type { JournalEntry, Trade } from '../types/database'
import { calculateAverageRr, groupProfitByMonth } from './analytics'

function csvEscape(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

export function todayStamp() {
  return new Date().toISOString().slice(0, 10)
}

export function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function tradeLabel(trade: Trade | null) {
  return trade ? `${trade.symbol} ${trade.direction.toUpperCase()}` : ''
}

export function exportTradesCsv(trades: Trade[]) {
  downloadCsv(
    `trading-smartdesk-trades-${todayStamp()}.csv`,
    ['Date', 'Symbol', 'Direction', 'Entry', 'SL', 'TP1', 'TP2', 'TP3', 'TP4', 'Setup', 'Status', 'Result', 'Profit/Loss', 'RR', 'Notes'],
    trades.map((trade) => [
      trade.created_at,
      trade.symbol,
      trade.direction,
      trade.entry_price,
      trade.stop_loss,
      trade.tp1,
      trade.tp2,
      trade.tp3,
      trade.tp4,
      trade.setup_type,
      trade.status,
      trade.result,
      trade.profit_loss,
      calculateAverageRr([trade]).toFixed(2),
      trade.trade_reason,
    ]),
  )
}

export function exportJournalCsv(entries: JournalEntry[], trades: Trade[]) {
  downloadCsv(
    `trading-smartdesk-journal-${todayStamp()}.csv`,
    ['Date', 'Trade', 'Emotion Before', 'Emotion After', 'Mistakes', 'Grade', 'Result', 'Profit/Loss', 'Notes'],
    entries.map((entry) => {
      const trade = entry.trade_id ? trades.find((item) => item.id === entry.trade_id) ?? null : null
      return [
        entry.created_at,
        tradeLabel(trade),
        entry.emotion_before,
        entry.emotion_after,
        Array.isArray(entry.mistake_checklist) ? entry.mistake_checklist.join('; ') : '',
        entry.trade_grade,
        entry.result,
        entry.profit_loss,
        entry.notes,
      ]
    }),
  )
}

export function exportAnalyticsCsv(trades: Trade[]) {
  const wins = trades.filter((trade) => trade.result === 'win').length
  const losses = trades.filter((trade) => trade.result === 'loss').length
  const breakeven = trades.filter((trade) => trade.result === 'breakeven').length
  const profitLoss = trades.reduce((total, trade) => total + (trade.profit_loss ?? 0), 0)
  const resolved = wins + losses + breakeven
  const biggestWin = trades.length ? Math.max(...trades.map((trade) => trade.profit_loss ?? 0)) : 0
  const biggestLoss = trades.length ? Math.min(...trades.map((trade) => trade.profit_loss ?? 0)) : 0

  downloadCsv(
    `trading-smartdesk-analytics-${todayStamp()}.csv`,
    ['Metric', 'Value'],
    [
      ['Total Trades', trades.length],
      ['Wins', wins],
      ['Losses', losses],
      ['Breakeven', breakeven],
      ['Win Rate', resolved > 0 ? `${((wins / resolved) * 100).toFixed(2)}%` : '0%'],
      ['Profit/Loss', profitLoss],
      ['Average RR', calculateAverageRr(trades).toFixed(2)],
      ['Biggest Win', biggestWin],
      ['Biggest Loss', biggestLoss],
      ['Profit Factor', 'Placeholder'],
    ],
  )
}

export function exportMonthlyPerformanceReport(trades: Trade[]) {
  const monthly = groupProfitByMonth(trades)

  downloadCsv(
    `trading-smartdesk-monthly-performance-${todayStamp()}.csv`,
    ['Month', 'Trades', 'Profit/Loss'],
    monthly.map((month) => [month.name, month.trades ?? 0, month.profitLoss ?? month.value]),
  )
}

export function exportTradeReportPlaceholder() {
  downloadCsv(
    `trading-smartdesk-trade-report-placeholder-${todayStamp()}.csv`,
    ['Report', 'Status'],
    [['Trade report PDF', 'Placeholder for future PDF generation']],
  )
}
