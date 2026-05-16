import { useEffect, useMemo, useState } from 'react'
import { BarChart3, CircleDollarSign, Percent, Sigma, TrendingDown, TrendingUp } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EmptyState } from '../../components/ui/EmptyState'
import { UpgradePrompt } from '../../components/billing/UpgradePrompt'
import { GlassCard } from '../../components/ui/GlassCard'
import { Input } from '../../components/ui/Input'
import { LoadingState } from '../../components/ui/LoadingState'
import { PageTitle } from '../../components/ui/PageTitle'
import { Select } from '../../components/ui/Select'
import { StatCard } from '../../components/ui/StatCard'
import { useAuth } from '../../hooks/useAuth'
import { usePackageAccess } from '../../hooks/usePackageAccess'
import {
  bestWorstByDay,
  buildEquityCurve,
  calculateAverageRr,
  filterJournalEntries,
  filterTrades,
  getAverage,
  groupJournalGradePerformance,
  groupMistakeFrequency,
  groupPerformance,
  groupProfitByDate,
  groupProfitByMonth,
} from '../../lib/analytics'
import { formatCurrency, formatPercent } from '../../lib/dashboard'
import { supabase } from '../../lib/supabase'
import type { AnalyticsFilters, ChartPoint } from '../../types/analytics'
import type { JournalEntry, Trade } from '../../types/database'

function ChartShell({ children, description, title }: { children: React.ReactNode; description: string; title: string }) {
  return (
    <GlassCard>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="h-72">{children}</div>
    </GlassCard>
  )
}

function EmptyChart({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-slate-800 bg-slate-950/30 text-sm text-slate-500">
      {title}
    </div>
  )
}

function plTone(value: number) {
  if (value > 0) return 'profit' as const
  if (value < 0) return 'loss' as const
  return 'neutral' as const
}

function ChartTooltip() {
  return <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
}

function BarCells({ data }: { data: ChartPoint[] }) {
  return data.map((entry) => <Cell fill={entry.value < 0 ? '#ef4444' : '#22c55e'} key={entry.name} />)
}

export function AnalyticsPage() {
  const { user } = useAuth()
  const packageAccess = usePackageAccess()
  const [trades, setTrades] = useState<Trade[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [filters, setFilters] = useState<AnalyticsFilters>({
    period: 'month',
    startDate: '',
    endDate: '',
    symbol: 'all',
    setupType: 'all',
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadAnalyticsData() {
      if (!user) return
      setIsLoading(true)
      setError(null)

      const [tradesResult, journalResult] = await Promise.all([
        supabase.from('trades').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      ])

      if (cancelled) return

      if (tradesResult.error) setError(tradesResult.error.message)
      else setTrades(tradesResult.data ?? [])

      if (journalResult.error) setError(journalResult.error.message)
      else setJournalEntries(journalResult.data ?? [])

      setIsLoading(false)
    }

    void loadAnalyticsData()

    return () => {
      cancelled = true
    }
  }, [user])

  const filteredTrades = useMemo(() => filterTrades(trades, filters), [filters, trades])
  const filteredJournalEntries = useMemo(() => filterJournalEntries(journalEntries, trades, filteredTrades), [filteredTrades, journalEntries, trades])

  const symbols = useMemo(() => ['all', ...Array.from(new Set(trades.map((trade) => trade.symbol)))], [trades])
  const setupTypes = useMemo(() => ['all', ...Array.from(new Set(trades.map((trade) => trade.setup_type ?? 'Unassigned')))], [trades])

  const stats = useMemo(() => {
    const wins = filteredTrades.filter((trade) => trade.result === 'win')
    const losses = filteredTrades.filter((trade) => trade.result === 'loss')
    const breakeven = filteredTrades.filter((trade) => trade.result === 'breakeven')
    const resolved = wins.length + losses.length + breakeven.length
    const profitLoss = filteredTrades.reduce((total, trade) => total + (trade.profit_loss ?? 0), 0)
    const pnlValues = filteredTrades.map((trade) => trade.profit_loss ?? 0)
    const averageWin = getAverage(wins.map((trade) => trade.profit_loss ?? 0))
    const averageLoss = getAverage(losses.map((trade) => trade.profit_loss ?? 0))
    const setupPerformance = groupPerformance(filteredTrades, (trade) => trade.setup_type ?? 'Unassigned')

    return {
      totalTrades: filteredTrades.length,
      wins: wins.length,
      losses: losses.length,
      breakeven: breakeven.length,
      winRate: resolved > 0 ? (wins.length / resolved) * 100 : 0,
      profitLoss,
      averageWin,
      averageLoss,
      biggestWin: pnlValues.length ? Math.max(...pnlValues) : 0,
      biggestLoss: pnlValues.length ? Math.min(...pnlValues) : 0,
      bestSetup: setupPerformance[0]?.name ?? 'No setup data',
      worstSetup: setupPerformance[setupPerformance.length - 1]?.name ?? 'No setup data',
      bestDay: bestWorstByDay(filteredTrades, 'best'),
      worstDay: bestWorstByDay(filteredTrades, 'worst'),
      averageRr: calculateAverageRr(filteredTrades),
    }
  }, [filteredTrades])

  const equityCurve = useMemo(() => buildEquityCurve(filteredTrades), [filteredTrades])
  const dailyPl = useMemo(() => groupProfitByDate(filteredTrades), [filteredTrades])
  const monthlyPl = useMemo(() => groupProfitByMonth(filteredTrades), [filteredTrades])
  const setupPerformance = useMemo(() => groupPerformance(filteredTrades, (trade) => trade.setup_type ?? 'Unassigned'), [filteredTrades])
  const sessionPerformance = useMemo(() => groupPerformance(filteredTrades, () => 'Manual Session'), [filteredTrades])
  const gradePerformance = useMemo(() => groupJournalGradePerformance(filteredJournalEntries), [filteredJournalEntries])
  const mistakeFrequency = useMemo(() => groupMistakeFrequency(filteredJournalEntries), [filteredJournalEntries])
  const winLossRatio = [
    { name: 'Wins', value: stats.wins },
    { name: 'Losses', value: stats.losses },
    { name: 'BE', value: stats.breakeven },
  ]

  if (isLoading) return <LoadingState label="Loading analytics" />

  if (error) {
    return <EmptyState description={error} title="Analytics could not be loaded" />
  }

  return (
    <>
      <PageTitle
        description="Performance analytics from real trades and journal entries. Metrics summarize recorded outcomes only."
        title="Analytics"
      />

      <GlassCard>
        <div className="grid gap-4 md:grid-cols-5">
          <Select label="Period" onChange={(event) => setFilters((current) => ({ ...current, period: event.target.value as AnalyticsFilters['period'] }))} value={filters.period}>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="3months">Last 3 months</option>
            <option value="custom">Custom date range</option>
          </Select>
          <Input disabled={filters.period !== 'custom'} label="Start date" onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))} type="date" value={filters.startDate} />
          <Input disabled={filters.period !== 'custom'} label="End date" onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))} type="date" value={filters.endDate} />
          <Select label="Symbol" onChange={(event) => setFilters((current) => ({ ...current, symbol: event.target.value }))} value={filters.symbol}>
            {symbols.map((symbol) => <option key={symbol} value={symbol}>{symbol === 'all' ? 'All symbols' : symbol}</option>)}
          </Select>
          <Select label="Setup type" onChange={(event) => setFilters((current) => ({ ...current, setupType: event.target.value }))} value={filters.setupType}>
            {setupTypes.map((setupType) => <option key={setupType} value={setupType}>{setupType === 'all' ? 'All setups' : setupType}</option>)}
          </Select>
        </div>
      </GlassCard>

      {filteredTrades.length === 0 ? (
        <EmptyState description="Create trades and journal entries to populate analytics charts." title="No analytics data for this filter" />
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard helper="Filtered trades" icon={<BarChart3 size={18} />} label="Total Trades" value={String(stats.totalTrades)} />
        <StatCard helper={`${stats.wins} wins, ${stats.losses} losses, ${stats.breakeven} breakeven`} icon={<Percent size={18} />} label="Win Rate" tone="gold" value={formatPercent(stats.winRate)} />
        <StatCard helper="Filtered trade P/L" icon={<CircleDollarSign size={18} />} label="Profit/Loss" tone={plTone(stats.profitLoss)} value={formatCurrency(stats.profitLoss)} />
        <StatCard helper="TP1-based estimate where available" icon={<Sigma size={18} />} label="Average RR" tone="neutral" value={`${stats.averageRr.toFixed(2)}R`} />
        <StatCard helper="Average winning trade" icon={<TrendingUp size={18} />} label="Average Win" tone="profit" value={formatCurrency(stats.averageWin)} />
        <StatCard helper="Average losing trade" icon={<TrendingDown size={18} />} label="Average Loss" tone="loss" value={formatCurrency(stats.averageLoss)} />
        <StatCard helper="Largest recorded win" icon={<TrendingUp size={18} />} label="Biggest Win" tone="profit" value={formatCurrency(stats.biggestWin)} />
        <StatCard helper="Largest recorded loss" icon={<TrendingDown size={18} />} label="Biggest Loss" tone="loss" value={formatCurrency(stats.biggestLoss)} />
        <StatCard helper="By filtered P/L" label="Best Setup" tone="profit" value={stats.bestSetup} />
        <StatCard helper="By filtered P/L" label="Worst Setup" tone={stats.worstSetup === 'No setup data' ? 'neutral' : 'loss'} value={stats.worstSetup} />
        <StatCard helper="Best filtered day" label="Best Day" tone="profit" value={stats.bestDay} />
        <StatCard helper="Worst filtered day" label="Worst Day" tone={stats.worstDay === 'No day data' ? 'neutral' : 'loss'} value={stats.worstDay} />
      </section>

      {!packageAccess.features.advancedAnalytics ? (
        <UpgradePrompt
          description="Starter includes summary analytics. Upgrade to Pro or Business to unlock advanced chart packs, setup breakdowns, mistake frequency, and export-ready analysis."
          feature="advancedAnalytics"
          title="Advanced analytics are locked"
        />
      ) : null}

      {packageAccess.features.advancedAnalytics ? (
      <section className="grid gap-5 xl:grid-cols-2">
        <ChartShell description="Cumulative P/L across filtered trades." title="Equity Curve">
          {equityCurve.length ? (
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={equityCurve}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <ChartTooltip />
                <Line dataKey="value" dot={false} stroke="#d4af37" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart title="No equity data" />}
        </ChartShell>

        <ChartShell description="Daily realized P/L from filtered trades." title="Daily P/L">
          {dailyPl.length ? (
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={dailyPl}>
                <defs>
                  <linearGradient id="dailyPl" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <ChartTooltip />
                <Area dataKey="value" fill="url(#dailyPl)" stroke="#d4af37" strokeWidth={2} type="monotone" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart title="No daily P/L data" />}
        </ChartShell>

        <ChartShell description="Monthly P/L grouped by close/create date." title="Monthly P/L">
          {monthlyPl.length ? (
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={monthlyPl}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <ChartTooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}><BarCells data={monthlyPl} /></Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart title="No monthly data" />}
        </ChartShell>

        <ChartShell description="Win, loss, and breakeven count." title="Win/Loss Ratio">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={winLossRatio}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis allowDecimals={false} stroke="#64748b" />
              <ChartTooltip />
              <Bar dataKey="value" fill="#d4af37" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell description="Total P/L by setup type." title="Setup Performance">
          {setupPerformance.length ? (
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={setupPerformance}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <ChartTooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}><BarCells data={setupPerformance} /></Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart title="No setup data" />}
        </ChartShell>

        <ChartShell description="Placeholder grouping until trade sessions are stored." title="Session Performance">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={sessionPerformance}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <ChartTooltip />
              <Bar dataKey="value" fill="#d4af37" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell description="Journal P/L grouped by trade grade." title="Trade Grade Performance">
          {gradePerformance.length ? (
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={gradePerformance}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <ChartTooltip />
                <Bar dataKey="value" fill="#d4af37" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart title="No grade data" />}
        </ChartShell>

        <ChartShell description="Most common mistakes from journal checklist." title="Mistake Frequency">
          {mistakeFrequency.length ? (
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={mistakeFrequency}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis allowDecimals={false} stroke="#64748b" />
                <ChartTooltip />
                <Bar dataKey="value" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart title="No mistake data" />}
        </ChartShell>
      </section>
      ) : null}

      <GlassCard>
        <h2 className="text-lg font-semibold text-white">Profit Factor</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Placeholder for Phase 10: gross profit divided by gross loss will be refined when trade closing workflows are complete.
        </p>
      </GlassCard>
    </>
  )
}
