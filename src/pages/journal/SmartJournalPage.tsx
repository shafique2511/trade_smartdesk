import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Edit3, Plus, Save, Search, Trash2 } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { GlassCard } from '../../components/ui/GlassCard'
import { Input } from '../../components/ui/Input'
import { LoadingState } from '../../components/ui/LoadingState'
import { Modal } from '../../components/ui/Modal'
import { PageTitle } from '../../components/ui/PageTitle'
import { Select } from '../../components/ui/Select'
import { Table } from '../../components/ui/Table'
import { Textarea } from '../../components/ui/Textarea'
import { useAuth } from '../../hooks/useAuth'
import { usePackageAccess } from '../../hooks/usePackageAccess'
import { countRecordsThisMonth, isLimitReached } from '../../lib/packageAccess'
import {
  buildJournalInsert,
  buildJournalUpdate,
  filterJournalEntries,
  initialJournalForm,
  journalEntryToForm,
  mistakeOptions,
} from '../../lib/journal'
import { supabase } from '../../lib/supabase'
import type { JournalEntry, Trade, TradeGrade, TradeResult } from '../../types/database'
import type { JournalFilters, JournalForm } from '../../types/journal'

type PageMessage = {
  type: 'success' | 'error'
  text: string
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function money(value: number | null) {
  return new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(value ?? 0)
}

function getResultTone(result: TradeResult | null) {
  if (result === 'win') return 'profit'
  if (result === 'loss') return 'loss'
  return 'neutral'
}

function getTradeLabel(trade: Trade) {
  return `${trade.symbol} ${trade.direction.toUpperCase()} - ${trade.setup_type ?? 'Manual'}`
}

export function SmartJournalPage() {
  const { user } = useAuth()
  const packageAccess = usePackageAccess()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [form, setForm] = useState<JournalForm>(initialJournalForm)
  const [filters, setFilters] = useState<JournalFilters>({ result: 'all', setupType: 'all', grade: 'all', search: '' })
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null)
  const [message, setMessage] = useState<PageMessage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadJournalData() {
      if (!user) return
      setIsLoading(true)

      const [entriesResult, tradesResult] = await Promise.all([
        supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('trades').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])

      if (cancelled) return

      if (entriesResult.error) setMessage({ type: 'error', text: entriesResult.error.message })
      else setEntries(entriesResult.data ?? [])

      if (tradesResult.error) setMessage({ type: 'error', text: tradesResult.error.message })
      else setTrades(tradesResult.data ?? [])

      setIsLoading(false)
    }

    void loadJournalData()

    return () => {
      cancelled = true
    }
  }, [user])

  const setupTypes = useMemo(() => {
    const unique = new Set(trades.map((trade) => trade.setup_type ?? 'Unlinked'))
    return ['all', ...Array.from(unique)]
  }, [trades])

  const filteredEntries = useMemo(() => filterJournalEntries(entries, trades, filters), [entries, filters, trades])
  const monthlyJournalCount = useMemo(() => countRecordsThisMonth(entries), [entries])
  const monthlyJournalLimitReached = isLimitReached(packageAccess.maxJournalEntries, monthlyJournalCount)

  function updateForm<Field extends keyof JournalForm>(field: Field, value: JournalForm[Field]) {
    setForm((current) => ({ ...current, [field]: value }))
    setMessage(null)
  }

  function toggleMistake(mistake: string) {
    setForm((current) => ({
      ...current,
      mistakes: current.mistakes.includes(mistake)
        ? current.mistakes.filter((item) => item !== mistake)
        : [...current.mistakes, mistake],
    }))
  }

  function resetForm() {
    setForm(initialJournalForm)
    setEditingEntryId(null)
    setMessage(null)
  }

  async function saveJournalEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return

    if (!editingEntryId && monthlyJournalLimitReached) {
      setMessage({ type: 'error', text: `${packageAccess.packageName} allows ${packageAccess.maxJournalEntries} journal entries per month. Upgrade to create more entries.` })
      return
    }

    setIsSaving(true)
    setMessage(null)

    const query = editingEntryId
      ? supabase.from('journal_entries').update(buildJournalUpdate(form)).eq('id', editingEntryId).eq('user_id', user.id).select('*').single()
      : supabase.from('journal_entries').insert(buildJournalInsert(user.id, form)).select('*').single()

    const { data, error } = await query
    setIsSaving(false)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }

    if (editingEntryId) {
      setEntries((current) => current.map((entry) => (entry.id === editingEntryId ? data : entry)))
      setMessage({ type: 'success', text: 'Journal entry updated.' })
    } else {
      setEntries((current) => [data, ...current])
      setMessage({ type: 'success', text: 'Journal entry created.' })
    }

    resetForm()
  }

  function editEntry(entry: JournalEntry) {
    setEditingEntryId(entry.id)
    setForm(journalEntryToForm(entry))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteEntry() {
    if (!entryToDelete || !user) return

    const { error } = await supabase.from('journal_entries').delete().eq('id', entryToDelete.id).eq('user_id', user.id)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }

    setEntries((current) => current.filter((entry) => entry.id !== entryToDelete.id))
    setEntryToDelete(null)
    setMessage({ type: 'success', text: 'Journal entry deleted.' })
  }

  if (isLoading) {
    return <LoadingState label="Loading journal entries" />
  }

  const rows = filteredEntries.map((entry) => {
    const linkedTrade = entry.trade_id ? trades.find((trade) => trade.id === entry.trade_id) : null

    return [
      <div>
        <p className="font-semibold text-white">{linkedTrade ? linkedTrade.symbol : 'Unlinked'}</p>
        <p className="text-xs text-slate-500">{linkedTrade?.setup_type ?? 'No setup'}</p>
      </div>,
      <Badge tone={getResultTone(entry.result)}>{entry.result ?? 'pending'}</Badge>,
      entry.trade_grade ? <Badge tone="gold">Grade {entry.trade_grade}</Badge> : 'Not graded',
      entry.setup_quality ?? '-',
      <span className={entry.profit_loss && entry.profit_loss < 0 ? 'text-loss-500' : 'text-profit-500'}>{money(entry.profit_loss)}</span>,
      formatDate(entry.created_at),
      <div className="flex gap-2">
        <Button className="min-h-8 px-2 py-1" onClick={() => editEntry(entry)} variant="ghost"><Edit3 size={14} /></Button>
        <Button className="min-h-8 px-2 py-1" onClick={() => setEntryToDelete(entry)} variant="danger"><Trash2 size={14} /></Button>
      </div>,
    ]
  })

  return (
    <>
      <PageTitle
        actions={
          <Button icon={<Plus size={16} />} onClick={resetForm} variant="secondary">
            New Journal Entry
          </Button>
        }
        description="Record execution quality, emotions, mistakes, screenshots, and linked trade outcomes."
        title="Smart Journal"
      />

      {message ? (
        <GlassCard className={message.type === 'success' ? 'border-profit-500/30 bg-profit-500/10' : 'border-loss-500/30 bg-loss-500/10'}>
          <p className={message.type === 'success' ? 'text-sm text-green-200' : 'text-sm text-red-200'}>{message.text}</p>
        </GlassCard>
      ) : null}

      {monthlyJournalLimitReached && !editingEntryId ? (
        <GlassCard className="border-gold-400/30 bg-gold-500/10">
          <p className="text-sm leading-6 text-slate-300">
            Monthly journal limit reached for {packageAccess.packageName}. You can still edit existing entries, or upgrade for higher limits.
          </p>
        </GlassCard>
      ) : null}

      <form className="grid gap-5 xl:grid-cols-[1fr_0.8fr]" onSubmit={saveJournalEntry}>
        <GlassCard>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">{editingEntryId ? 'Edit Journal Entry' : 'Add Journal Entry'}</h2>
            <p className="mt-1 text-sm text-slate-500">Link a trade and document execution behavior.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Linked trade" onChange={(event) => updateForm('tradeId', event.target.value)} value={form.tradeId}>
              <option value="">No linked trade</option>
              {trades.map((trade) => (
                <option key={trade.id} value={trade.id}>{getTradeLabel(trade)}</option>
              ))}
            </Select>
            <Input label="Profit/loss" onChange={(event) => updateForm('profitLoss', event.target.value)} step="any" type="number" value={form.profitLoss} />
            <Input label="Emotion before trade" onChange={(event) => updateForm('emotionBefore', event.target.value)} placeholder="Calm, anxious, confident..." value={form.emotionBefore} />
            <Input label="Emotion after trade" onChange={(event) => updateForm('emotionAfter', event.target.value)} placeholder="Satisfied, frustrated, neutral..." value={form.emotionAfter} />
            <Input label="Setup quality rating" max="10" min="1" onChange={(event) => updateForm('setupQuality', event.target.value)} type="number" value={form.setupQuality} />
            <Select label="Trade grade" onChange={(event) => updateForm('tradeGrade', event.target.value as TradeGrade)} value={form.tradeGrade}>
              <option>A</option>
              <option>B</option>
              <option>C</option>
              <option>D</option>
            </Select>
            <Select label="Result" onChange={(event) => updateForm('result', event.target.value as JournalForm['result'])} value={form.result}>
              <option value="win">Win</option>
              <option value="loss">Loss</option>
              <option value="breakeven">Breakeven</option>
            </Select>
            <Input label="Entry screenshot URL" onChange={(event) => updateForm('entryScreenshotUrl', event.target.value)} placeholder="https://..." value={form.entryScreenshotUrl} />
            <Input label="Exit screenshot URL" onChange={(event) => updateForm('exitScreenshotUrl', event.target.value)} placeholder="https://..." value={form.exitScreenshotUrl} />
            <div className="md:col-span-2">
              <Textarea label="Notes" onChange={(event) => updateForm('notes', event.target.value)} placeholder="Reflect on setup quality, execution, management, and discipline." value={form.notes} />
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Mistake Checklist</h2>
          <div className="mt-5 grid gap-2">
            {mistakeOptions.map((mistake) => (
              <label className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-300" key={mistake}>
                <input checked={form.mistakes.includes(mistake)} onChange={() => toggleMistake(mistake)} type="checkbox" />
                {mistake}
              </label>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button disabled={isSaving || (!editingEntryId && monthlyJournalLimitReached)} icon={<Save size={16} />} type="submit">
              {isSaving ? 'Saving...' : editingEntryId ? 'Update Journal' : 'Add Journal'}
            </Button>
            <Button onClick={resetForm} variant="secondary">Reset</Button>
          </div>
        </GlassCard>
      </form>

      <GlassCard>
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Journal Entries</h2>
            <p className="mt-1 text-sm text-slate-500">Filter by result, setup type, grade, or notes.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Select label="Result" onChange={(event) => setFilters((current) => ({ ...current, result: event.target.value as JournalFilters['result'] }))} value={filters.result}>
              <option value="all">All results</option>
              <option value="win">Win</option>
              <option value="loss">Loss</option>
              <option value="breakeven">Breakeven</option>
            </Select>
            <Select label="Setup" onChange={(event) => setFilters((current) => ({ ...current, setupType: event.target.value }))} value={filters.setupType}>
              {setupTypes.map((setupType) => (
                <option key={setupType} value={setupType}>{setupType === 'all' ? 'All setups' : setupType}</option>
              ))}
            </Select>
            <Select label="Grade" onChange={(event) => setFilters((current) => ({ ...current, grade: event.target.value as JournalFilters['grade'] }))} value={filters.grade}>
              <option value="all">All grades</option>
              <option>A</option>
              <option>B</option>
              <option>C</option>
              <option>D</option>
            </Select>
            <Input label="Search notes" onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search" value={filters.search} />
          </div>
        </div>

        {filteredEntries.length > 0 ? (
          <Table columns={['Trade', 'Result', 'Grade', 'Quality', 'P/L', 'Date', 'Actions']} rows={rows} />
        ) : (
          <EmptyState
            action={<Search className="text-gold-400" size={22} />}
            description="Create a journal entry or adjust filters to see matching records."
            title="No journal entries found"
          />
        )}
      </GlassCard>

      <Modal isOpen={Boolean(entryToDelete)} onClose={() => setEntryToDelete(null)} title="Delete Journal Entry">
        <div className="grid gap-4">
          <p className="text-sm leading-6 text-slate-300">
            This will permanently delete the selected journal entry. The linked trade will not be deleted.
          </p>
          <div className="flex justify-end gap-3">
            <Button onClick={() => setEntryToDelete(null)} variant="secondary">Cancel</Button>
            <Button onClick={() => void deleteEntry()} variant="danger">Delete</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
