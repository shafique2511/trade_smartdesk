import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Activity, Plus, RotateCcw, Save, Star, Trash2 } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { GlassCard } from '../../components/ui/GlassCard'
import { Input } from '../../components/ui/Input'
import { PageTitle } from '../../components/ui/PageTitle'
import { Select } from '../../components/ui/Select'
import { Table } from '../../components/ui/Table'
import { Textarea } from '../../components/ui/Textarea'
import { useAuth } from '../../hooks/useAuth'
import {
  createDefaultMarketWatchState,
  createWatchlistItem,
  loadMarketWatchState,
  saveMarketWatchState,
} from '../../lib/marketWatch'
import type { MarketBias, MarketSession, MarketWatchState, WatchlistItem } from '../../types/market'

const biasTone: Record<MarketBias, 'profit' | 'loss' | 'neutral'> = {
  Bullish: 'profit',
  Bearish: 'loss',
  Neutral: 'neutral',
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function findXauusdItem(watchlist: WatchlistItem[]) {
  return watchlist.find((item) => item.symbol === 'XAUUSD') ?? watchlist[0]
}

export function MarketWatchPage() {
  const { user } = useAuth()
  const [state, setState] = useState<MarketWatchState>(() => createDefaultMarketWatchState())
  const [newSymbol, setNewSymbol] = useState('')
  const [savedAt, setSavedAt] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    queueMicrotask(() => {
      if (!cancelled) setState(loadMarketWatchState(user.id))
    })

    return () => {
      cancelled = true
    }
  }, [user])

  const selectedItem = useMemo(
    () => state.watchlist.find((item) => item.id === state.selectedSymbolId) ?? state.watchlist[0],
    [state.selectedSymbolId, state.watchlist],
  )

  const xauusdItem = useMemo(() => findXauusdItem(state.watchlist), [state.watchlist])

  function persist(nextState: MarketWatchState) {
    if (!user) return
    saveMarketWatchState(user.id, nextState)
    setSavedAt(new Date().toISOString())
  }

  function updateItem(itemId: string, updates: Partial<WatchlistItem>) {
    setState((current) => {
      const nextState = {
        ...current,
        watchlist: current.watchlist.map((item) =>
          item.id === itemId
            ? {
                ...item,
                ...updates,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      }
      persist(nextState)
      return nextState
    })
  }

  function updateMarketNotes(marketNotes: string) {
    setState((current) => {
      const nextState = { ...current, marketNotes }
      persist(nextState)
      return nextState
    })
  }

  function addSymbol(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const symbol = newSymbol.trim().toUpperCase()
    if (!symbol) return

    setState((current) => {
      if (current.watchlist.some((item) => item.symbol === symbol)) {
        return {
          ...current,
          selectedSymbolId: current.watchlist.find((item) => item.symbol === symbol)?.id ?? current.selectedSymbolId,
        }
      }

      const item = createWatchlistItem(symbol)
      const nextState = {
        ...current,
        watchlist: [...current.watchlist, item],
        selectedSymbolId: item.id,
      }
      persist(nextState)
      return nextState
    })

    setNewSymbol('')
  }

  function removeSymbol(itemId: string) {
    setState((current) => {
      const nextWatchlist = current.watchlist.filter((item) => item.id !== itemId)
      const fallback = createDefaultMarketWatchState()
      const safeWatchlist = nextWatchlist.length > 0 ? nextWatchlist : fallback.watchlist
      const nextState = {
        ...current,
        watchlist: safeWatchlist,
        selectedSymbolId: current.selectedSymbolId === itemId ? safeWatchlist[0].id : current.selectedSymbolId,
      }
      persist(nextState)
      return nextState
    })
  }

  function resetWatchlist() {
    const nextState = createDefaultMarketWatchState()
    setState(nextState)
    persist(nextState)
  }

  const watchlistRows = state.watchlist.map((item) => [
    <button
      className="font-semibold text-white transition hover:text-gold-400"
      onClick={() => setState((current) => ({ ...current, selectedSymbolId: item.id }))}
      type="button"
    >
      {item.symbol}
    </button>,
    item.price || 'Manual',
    <Badge tone={biasTone[item.bias]}>{item.bias}</Badge>,
    item.spread || 'Not set',
    item.session,
    <span className="text-xs text-slate-500">{formatUpdatedAt(item.updatedAt)}</span>,
    <Button className="min-h-8 px-2 py-1" onClick={() => removeSymbol(item.id)} variant="ghost">
      <Trash2 size={14} />
    </Button>,
  ])

  return (
    <>
      <PageTitle
        actions={
          <>
            <Button icon={<Save size={16} />} onClick={() => persist(state)} variant="secondary">
              Save Snapshot
            </Button>
            <Button icon={<RotateCcw size={16} />} onClick={resetWatchlist} variant="ghost">
              Reset
            </Button>
          </>
        }
        description="Manual market monitoring for forex and gold. Live market API integration is intentionally deferred and this structure is ready for a future provider connection."
        title="Market Watch"
      />

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassCard>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">XAUUSD Focus</h2>
              <p className="mt-1 text-sm text-slate-500">Gold-specific session context and manual pricing.</p>
            </div>
            <Badge tone="gold">Gold</Badge>
          </div>

          {xauusdItem ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Manual price" onChange={(event) => updateItem(xauusdItem.id, { price: event.target.value })} placeholder="2385.40" value={xauusdItem.price} />
              <Input label="Spread" onChange={(event) => updateItem(xauusdItem.id, { spread: event.target.value })} placeholder="18 pts" value={xauusdItem.spread} />
              <Input label="Daily high" onChange={(event) => updateItem(xauusdItem.id, { dailyHigh: event.target.value })} placeholder="2392.00" value={xauusdItem.dailyHigh} />
              <Input label="Daily low" onChange={(event) => updateItem(xauusdItem.id, { dailyLow: event.target.value })} placeholder="2368.20" value={xauusdItem.dailyLow} />
              <Select label="Session status" onChange={(event) => updateItem(xauusdItem.id, { session: event.target.value as MarketSession })} value={xauusdItem.session}>
                <option>Asia</option>
                <option>London</option>
                <option>New York</option>
                <option>Overlap</option>
              </Select>
              <Select label="Market bias" onChange={(event) => updateItem(xauusdItem.id, { bias: event.target.value as MarketBias })} value={xauusdItem.bias}>
                <option>Bullish</option>
                <option>Bearish</option>
                <option>Neutral</option>
              </Select>
              <div className="sm:col-span-2">
                <Textarea
                  label="XAUUSD notes"
                  onChange={(event) => updateItem(xauusdItem.id, { notes: event.target.value })}
                  placeholder="Record gold liquidity, range high/low, news risk, and key invalidation levels."
                  value={xauusdItem.notes}
                />
              </div>
            </div>
          ) : (
            <EmptyState description="Add XAUUSD to the watchlist to activate the gold focus panel." title="XAUUSD not found" />
          )}
        </GlassCard>

        <GlassCard>
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Manual Watchlist</h2>
              <p className="mt-1 text-sm text-slate-500">Track symbol bias, price, spread, and session by hand.</p>
            </div>
            <form className="flex gap-2" onSubmit={addSymbol}>
              <Input aria-label="New symbol" className="min-w-32" onChange={(event) => setNewSymbol(event.target.value)} placeholder="USDJPY" value={newSymbol} />
              <Button icon={<Plus size={16} />} type="submit">Add</Button>
            </form>
          </div>
          <Table columns={['Symbol', 'Price', 'Bias', 'Spread', 'Session', 'Updated', '']} rows={watchlistRows} />
        </GlassCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <GlassCard>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg border border-gold-400/30 bg-gold-500/10 p-2 text-gold-400">
              <Star size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Selected Symbol</h2>
              <p className="text-sm text-slate-500">Edit the active watchlist row.</p>
            </div>
          </div>

          {selectedItem ? (
            <div className="grid gap-4">
              <Input label="Symbol" onChange={(event) => updateItem(selectedItem.id, { symbol: event.target.value.toUpperCase() })} value={selectedItem.symbol} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Manual price" onChange={(event) => updateItem(selectedItem.id, { price: event.target.value })} placeholder="Manual input" value={selectedItem.price} />
                <Input label="Spread" onChange={(event) => updateItem(selectedItem.id, { spread: event.target.value })} placeholder="0.8 pip" value={selectedItem.spread} />
                <Input label="Daily high" onChange={(event) => updateItem(selectedItem.id, { dailyHigh: event.target.value })} value={selectedItem.dailyHigh} />
                <Input label="Daily low" onChange={(event) => updateItem(selectedItem.id, { dailyLow: event.target.value })} value={selectedItem.dailyLow} />
              </div>
              <Select label="Session status" onChange={(event) => updateItem(selectedItem.id, { session: event.target.value as MarketSession })} value={selectedItem.session}>
                <option>Asia</option>
                <option>London</option>
                <option>New York</option>
                <option>Overlap</option>
              </Select>
              <Select label="Market bias" onChange={(event) => updateItem(selectedItem.id, { bias: event.target.value as MarketBias })} value={selectedItem.bias}>
                <option>Bullish</option>
                <option>Bearish</option>
                <option>Neutral</option>
              </Select>
              <Textarea label="Symbol notes" onChange={(event) => updateItem(selectedItem.id, { notes: event.target.value })} value={selectedItem.notes} />
            </div>
          ) : (
            <EmptyState description="Add a symbol to start tracking manual market context." title="No symbol selected" />
          )}
        </GlassCard>

        <GlassCard>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Notes Panel</h2>
              <p className="mt-1 text-sm text-slate-500">Record session context, major levels, and trade-planning observations.</p>
            </div>
            <Badge tone="info">{savedAt ? `Saved ${formatUpdatedAt(savedAt)}` : 'Local'}</Badge>
          </div>
          <Textarea
            label="Market notes"
            onChange={(event) => updateMarketNotes(event.target.value)}
            placeholder="Record structure, liquidity areas, session behavior, news risk, and setup context."
            value={state.marketNotes}
          />
          <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-start gap-3">
              <Activity className="mt-0.5 text-gold-400" size={18} />
              <p className="text-sm leading-6 text-slate-400">
                Future API hook: manual fields can be replaced by a market data adapter without changing this page’s watchlist model.
              </p>
            </div>
          </div>
        </GlassCard>
      </section>
    </>
  )
}
