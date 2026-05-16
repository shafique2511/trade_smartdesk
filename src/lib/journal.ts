import type { Database, JournalEntry, Trade } from '../types/database'
import type { JournalFilters, JournalForm } from '../types/journal'

export const mistakeOptions = [
  'Entered too early',
  'Entered too late',
  'Ignored trend',
  'Ignored news',
  'Moved SL',
  'Closed too early',
  'Over-risked',
  'Revenge trade',
  'No confirmation',
  'Bad setup',
]

export const initialJournalForm: JournalForm = {
  tradeId: '',
  emotionBefore: '',
  emotionAfter: '',
  mistakes: [],
  setupQuality: '7',
  tradeGrade: 'B',
  result: 'breakeven',
  profitLoss: '0',
  notes: '',
  entryScreenshotUrl: '',
  exitScreenshotUrl: '',
}

export function buildJournalInsert(
  userId: string,
  form: JournalForm,
): Database['public']['Tables']['journal_entries']['Insert'] {
  return {
    user_id: userId,
    trade_id: form.tradeId || null,
    emotion_before: form.emotionBefore.trim() || null,
    emotion_after: form.emotionAfter.trim() || null,
    mistake_checklist: form.mistakes,
    setup_quality: Number(form.setupQuality) || null,
    trade_grade: form.tradeGrade,
    result: form.result,
    profit_loss: Number(form.profitLoss) || 0,
    notes: form.notes.trim() || null,
    entry_screenshot_url: form.entryScreenshotUrl.trim() || null,
    exit_screenshot_url: form.exitScreenshotUrl.trim() || null,
  }
}

export function buildJournalUpdate(form: JournalForm): Database['public']['Tables']['journal_entries']['Update'] {
  return {
    trade_id: form.tradeId || null,
    emotion_before: form.emotionBefore.trim() || null,
    emotion_after: form.emotionAfter.trim() || null,
    mistake_checklist: form.mistakes,
    setup_quality: Number(form.setupQuality) || null,
    trade_grade: form.tradeGrade,
    result: form.result,
    profit_loss: Number(form.profitLoss) || 0,
    notes: form.notes.trim() || null,
    entry_screenshot_url: form.entryScreenshotUrl.trim() || null,
    exit_screenshot_url: form.exitScreenshotUrl.trim() || null,
  }
}

export function journalEntryToForm(entry: JournalEntry): JournalForm {
  return {
    tradeId: entry.trade_id ?? '',
    emotionBefore: entry.emotion_before ?? '',
    emotionAfter: entry.emotion_after ?? '',
    mistakes: Array.isArray(entry.mistake_checklist) ? entry.mistake_checklist.filter((item): item is string => typeof item === 'string') : [],
    setupQuality: entry.setup_quality?.toString() ?? '7',
    tradeGrade: entry.trade_grade ?? 'B',
    result: entry.result === 'win' || entry.result === 'loss' || entry.result === 'breakeven' ? entry.result : 'breakeven',
    profitLoss: entry.profit_loss?.toString() ?? '0',
    notes: entry.notes ?? '',
    entryScreenshotUrl: entry.entry_screenshot_url ?? '',
    exitScreenshotUrl: entry.exit_screenshot_url ?? '',
  }
}

export function filterJournalEntries(entries: JournalEntry[], trades: Trade[], filters: JournalFilters) {
  const search = filters.search.trim().toLowerCase()

  return entries.filter((entry) => {
    const linkedTrade = entry.trade_id ? trades.find((trade) => trade.id === entry.trade_id) : null
    const setupType = linkedTrade?.setup_type ?? 'Unlinked'

    if (filters.result !== 'all' && entry.result !== filters.result) return false
    if (filters.grade !== 'all' && entry.trade_grade !== filters.grade) return false
    if (filters.setupType !== 'all' && setupType !== filters.setupType) return false

    if (!search) return true

    return [
      entry.notes,
      entry.emotion_before,
      entry.emotion_after,
      entry.trade_grade,
      entry.result,
      linkedTrade?.symbol,
      linkedTrade?.setup_type,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search))
  })
}
