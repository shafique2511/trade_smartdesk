import type { TradeGrade, TradeResult } from './database'

export type JournalForm = {
  tradeId: string
  emotionBefore: string
  emotionAfter: string
  mistakes: string[]
  setupQuality: string
  tradeGrade: TradeGrade
  result: Exclude<TradeResult, 'pending'>
  profitLoss: string
  notes: string
  entryScreenshotUrl: string
  exitScreenshotUrl: string
}

export type JournalFilters = {
  result: 'all' | Exclude<TradeResult, 'pending'>
  setupType: string
  grade: 'all' | TradeGrade
  search: string
}
