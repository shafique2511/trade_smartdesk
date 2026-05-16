import { Activity, CircleDollarSign, Target, TrendingDown, TrendingUp, Trophy } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { GlassCard } from '../../components/ui/GlassCard'
import { PageTitle } from '../../components/ui/PageTitle'
import { StatCard } from '../../components/ui/StatCard'
import { Table } from '../../components/ui/Table'
import { dashboardStats, moduleCards, recentTrades } from '../../data/mockData'

const icons = [CircleDollarSign, TrendingUp, Trophy, TrendingDown, Activity, Target]

export function DashboardPage() {
  return (
    <>
      <PageTitle
        actions={
          <>
            <Button variant="secondary">New Trade Plan</Button>
            <Button>Generate Signal</Button>
          </>
        }
        description="A command center foundation for planning trades, tracking discipline, and preparing future Supabase-powered analytics."
        title="Dashboard"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardStats.map((stat, index) => {
          const Icon = icons[index]
          return <StatCard icon={<Icon size={18} />} key={stat.label} {...stat} />
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <GlassCard>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Trades</h2>
              <p className="text-sm text-slate-500">Mock trade activity for layout validation.</p>
            </div>
            <Badge tone="info">Sample</Badge>
          </div>
          <Table columns={['Symbol', 'Direction', 'Status', 'RR', 'P/L']} rows={recentTrades} />
        </GlassCard>

        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Risk Warning Panel</h2>
          <div className="mt-5 rounded-lg border border-profit-500/30 bg-profit-500/10 p-4">
            <p className="text-sm font-semibold text-green-300">Current risk status: Safe</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Preset risk checks and daily lock logic will be implemented when the Risk Desk and Supabase data are connected.
            </p>
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {moduleCards.map((card) => (
          <GlassCard key={card.title}>
            <Badge tone="gold">{card.status}</Badge>
            <h3 className="mt-4 text-lg font-semibold text-white">{card.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{card.description}</p>
          </GlassCard>
        ))}
      </section>

      <EmptyState
        description="Charts, journal activity, and live analytics will render here after the Supabase schema and data layer are implemented."
        title="Analytics data not connected yet"
      />
    </>
  )
}
