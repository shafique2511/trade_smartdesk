import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  CircleDollarSign,
  ClipboardPlus,
  Gauge,
  LineChart,
  NotebookPen,
  Radio,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { GlassCard } from '../../components/ui/GlassCard'
import { LoadingState } from '../../components/ui/LoadingState'
import { PageTitle } from '../../components/ui/PageTitle'
import { StatCard } from '../../components/ui/StatCard'
import { Table } from '../../components/ui/Table'
import { Tooltip as UiTooltip } from '../../components/ui/Tooltip'
import { useAuth } from '../../hooks/useAuth'
import { formatCurrency, formatPercent, getDashboardData, type DashboardData, type RiskStatus } from '../../lib/dashboard'
import type { Trade } from '../../types/database'

type StatTone = 'neutral' | 'profit' | 'loss' | 'gold'

const statusTone: Record<RiskStatus, 'profit' | 'loss' | 'gold' | 'info'> = {
  Safe: 'profit',
  Warning: 'gold',
  'Daily Loss Reached': 'loss',
  'Daily Profit Reached': 'profit',
}

function profitTone(value: number) {
  if (value > 0) return 'profit' as const
  if (value < 0) return 'loss' as const
  return 'neutral' as const
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value))
}

function formatStatus(status: string) {
  return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getRiskCopy(status: RiskStatus) {
  if (status === 'Daily Loss Reached') return 'Your preset risk limit has been reached.'
  if (status === 'Daily Profit Reached') return 'Your preset daily profit level has been reached.'
  if (status === 'Warning') return 'Current daily P/L is close to your preset loss limit.'
  return 'Current risk status is within the configured limits.'
}

function getWinLossChartData(data: DashboardData) {
  return [
    { name: 'Wins', value: data.wins, color: '#22c55e' },
    { name: 'Losses', value: data.losses, color: '#ef4444' },
    { name: 'BE', value: data.breakeven, color: '#d4af37' },
  ]
}

function tradeRows(trades: Trade[]) {
  return trades.map((trade) => [
    <span className="font-semibold text-white">{trade.symbol}</span>,
    <Badge tone={trade.direction === 'buy' ? 'profit' : 'loss'}>{trade.direction.toUpperCase()}</Badge>,
    formatStatus(trade.status),
    trade.setup_type ?? 'Unassigned',
    <span className={trade.profit_loss && trade.profit_loss < 0 ? 'text-loss-500' : 'text-profit-500'}>
      {formatCurrency(trade.profit_loss ?? 0)}
    </span>,
  ])
}

export function DashboardPage() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadDashboard() {
      if (!user) return

      setLoading(true)
      setError(null)

      try {
        const data = await getDashboardData(user.id)
        if (mounted) setDashboardData(data)
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard data.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadDashboard()

    return () => {
      mounted = false
    }
  }, [user])

  if (loading) {
    return <LoadingState label="Loading dashboard metrics" />
  }

  if (error) {
    return (
      <EmptyState
        description={error}
        title="Dashboard data could not be loaded"
      />
    )
  }

  if (!dashboardData) {
    return (
      <EmptyState
        description="No dashboard data is available for this account."
        title="Dashboard unavailable"
      />
    )
  }

  const hasTrades = dashboardData.trades.length > 0
  const winLossData = getWinLossChartData(dashboardData)
  const riskStatTone: StatTone =
    dashboardData.currentRiskStatus === 'Daily Loss Reached'
      ? 'loss'
      : dashboardData.currentRiskStatus === 'Warning'
        ? 'gold'
        : 'profit'

  const stats = [
    {
      label: 'Account Balance',
      value: formatCurrency(dashboardData.accountBalance),
      helper: dashboardData.riskSettings ? 'From risk settings' : 'No risk settings saved',
      tone: 'gold' as const,
      icon: <CircleDollarSign size={18} />,
    },
    {
      label: 'Daily P/L',
      value: formatCurrency(dashboardData.dailyProfitLoss),
      helper: 'Closed and updated trades today',
      tone: profitTone(dashboardData.dailyProfitLoss),
      icon: <TrendingUp size={18} />,
    },
    {
      label: 'Weekly P/L',
      value: formatCurrency(dashboardData.weeklyProfitLoss),
      helper: 'Current week performance',
      tone: profitTone(dashboardData.weeklyProfitLoss),
      icon: <Trophy size={18} />,
    },
    {
      label: 'Monthly P/L',
      value: formatCurrency(dashboardData.monthlyProfitLoss),
      helper: 'Current month performance',
      tone: profitTone(dashboardData.monthlyProfitLoss),
      icon: <TrendingDown size={18} />,
    },
    {
      label: 'Win Rate',
      value: formatPercent(dashboardData.winRate),
      helper: `${dashboardData.wins} wins, ${dashboardData.losses} losses`,
      tone: 'neutral' as const,
      icon: <Activity size={18} />,
    },
    {
      label: 'Total Trades',
      value: String(dashboardData.totalTrades),
      helper: `${dashboardData.openTrades} open, ${dashboardData.closedTrades} closed`,
      tone: 'neutral' as const,
      icon: <Target size={18} />,
    },
    {
      label: 'Open Trades',
      value: String(dashboardData.openTrades),
      helper: 'Waiting, active, TP hit, or breakeven',
      tone: 'gold' as const,
      icon: <LineChart size={18} />,
    },
    {
      label: 'Closed Trades',
      value: String(dashboardData.closedTrades),
      helper: 'Resolved trade records',
      tone: 'neutral' as const,
      icon: <ClipboardPlus size={18} />,
    },
    {
      label: 'Current Risk Status',
      value: dashboardData.currentRiskStatus,
      helper: getRiskCopy(dashboardData.currentRiskStatus),
      tone: riskStatTone,
      icon: <Gauge size={18} />,
    },
    {
      label: 'Best Setup',
      value: dashboardData.bestSetup,
      helper: 'By total realized P/L',
      tone: 'profit' as const,
      icon: <Trophy size={18} />,
    },
    {
      label: 'Worst Setup',
      value: dashboardData.worstSetup,
      helper: 'By total realized P/L',
      tone: dashboardData.worstSetup === 'No setup data' ? 'neutral' as const : 'loss' as const,
      icon: <TrendingDown size={18} />,
    },
  ]

  return (
    <>
      <PageTitle
        actions={
          <>
            <Link to="/trade-planner">
              <UiTooltip content="Create a structured trade plan with transparent risk calculations.">
                <Button icon={<ClipboardPlus size={16} />} variant="secondary">New Trade Plan</Button>
              </UiTooltip>
            </Link>
            <Link to="/journal">
              <UiTooltip content="Record execution notes, emotions, mistakes, and grade.">
                <Button icon={<NotebookPen size={16} />} variant="secondary">New Journal Entry</Button>
              </UiTooltip>
            </Link>
            <Link to="/signals">
              <UiTooltip content="Format a saved trade into a manually confirmed signal.">
                <Button icon={<Radio size={16} />}>Generate Signal</Button>
              </UiTooltip>
            </Link>
          </>
        }
        description="Live workspace overview built from Supabase trades, journal entries, and risk settings."
        title="Dashboard"
      />

      <GlassCard>
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-gold-400/30 bg-gold-500/10 p-2 text-gold-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Welcome onboarding</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">Start with a planned trade, then journal the execution after the result is known.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-sm font-semibold text-white">First trade guide</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">Set entry, SL, TP levels, account balance, and risk percentage before saving a plan.</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-sm font-semibold text-white">First journal guide</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">Link the trade, grade the setup, record mistakes, and keep notes factual.</p>
            </div>
          </div>
        </div>
      </GlassCard>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      {!hasTrades ? (
        <EmptyState
          action={
            <Link to="/trade-planner">
              <Button>Plan first trade</Button>
            </Link>
          }
          description="Create a trade plan in the Trade Planner to populate P/L, win rate, setup performance, and recent activity."
          title="No trades yet"
        />
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <GlassCard>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Daily Profit/Loss</h2>
              <p className="text-sm text-slate-500">Last 14 days from trade records.</p>
            </div>
            <Badge tone="info">Supabase</Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={dashboardData.chartData}>
                <defs>
                  <linearGradient id="profitLossGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#64748b" tickLine={false} />
                <YAxis stroke="#64748b" tickFormatter={(value) => `$${value}`} tickLine={false} width={70} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }}
                  formatter={(value) => [formatCurrency(Number(value)), 'P/L']}
                />
                <Area dataKey="profitLoss" fill="url(#profitLossGradient)" stroke="#d4af37" strokeWidth={2} type="monotone" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Win/Loss Mix</h2>
            <p className="text-sm text-slate-500">Resolved trade outcomes.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={winLossData}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                <YAxis allowDecimals={false} stroke="#64748b" tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {winLossData.map((entry) => (
                    <Cell fill={entry.color} key={entry.name} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <GlassCard>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Trades</h2>
              <p className="text-sm text-slate-500">Latest trade plans and outcomes.</p>
            </div>
            <Badge tone="gold">{dashboardData.recentTrades.length} shown</Badge>
          </div>
          {dashboardData.recentTrades.length > 0 ? (
            <Table columns={['Symbol', 'Direction', 'Status', 'Setup', 'P/L']} rows={tradeRows(dashboardData.recentTrades)} />
          ) : (
            <EmptyState description="Saved trade plans will appear here." title="No recent trades" />
          )}
        </GlassCard>

        <GlassCard>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Risk Warning Panel</h2>
            <Badge tone={statusTone[dashboardData.currentRiskStatus]}>{dashboardData.currentRiskStatus}</Badge>
          </div>
          <div className={`rounded-lg border p-4 ${
            dashboardData.currentRiskStatus === 'Daily Loss Reached'
              ? 'border-loss-500/30 bg-loss-500/10'
              : dashboardData.currentRiskStatus === 'Warning'
                ? 'border-gold-400/30 bg-gold-500/10'
                : 'border-profit-500/30 bg-profit-500/10'
          }`}>
            <p className="text-sm font-semibold text-white">{getRiskCopy(dashboardData.currentRiskStatus)}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Daily P/L is {formatCurrency(dashboardData.dailyProfitLoss)}. Risk warnings follow the user’s own saved risk settings.
            </p>
          </div>
          <div className="mt-4 grid gap-3 text-sm text-slate-400">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span>Max daily loss</span>
              <span className="font-semibold text-white">{formatCurrency(dashboardData.riskSettings?.max_daily_loss ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span>Max daily profit</span>
              <span className="font-semibold text-white">{formatCurrency(dashboardData.riskSettings?.max_daily_profit ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Risk per trade</span>
              <span className="font-semibold text-white">{formatPercent(dashboardData.riskSettings?.risk_per_trade ?? 0)}</span>
            </div>
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
          <div className="mt-5 grid gap-3">
            <Link to="/trade-planner"><Button className="w-full" variant="secondary">New Trade Plan</Button></Link>
            <Link to="/journal"><Button className="w-full" variant="secondary">New Journal Entry</Button></Link>
            <Link to="/signals"><Button className="w-full" variant="secondary">Generate Signal</Button></Link>
            <Link to="/telegram"><Button className="w-full" variant="secondary">Telegram Settings</Button></Link>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Recent Journal Entries</h2>
            <p className="text-sm text-slate-500">Latest execution notes and trade reflections.</p>
          </div>
          {dashboardData.recentJournalEntries.length > 0 ? (
            <div className="grid gap-3">
              {dashboardData.recentJournalEntries.map((entry) => (
                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4" key={entry.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {entry.trade_grade ? <Badge tone="gold">Grade {entry.trade_grade}</Badge> : null}
                      {entry.result ? <Badge tone={entry.result === 'win' ? 'profit' : entry.result === 'loss' ? 'loss' : 'neutral'}>{formatStatus(entry.result)}</Badge> : null}
                    </div>
                    <span className="text-xs text-slate-500">{formatDate(entry.created_at)}</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{entry.notes || 'No notes recorded.'}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState description="Journal reflections will appear here after you create entries." title="No journal entries yet" />
          )}
        </GlassCard>
      </section>
    </>
  )
}
