import type { ReactNode } from 'react'
import { GlassCard } from './GlassCard'

type StatTone = 'neutral' | 'profit' | 'loss' | 'gold'

const toneClass: Record<StatTone, string> = {
  neutral: 'text-slate-100',
  profit: 'text-profit-500',
  loss: 'text-loss-500',
  gold: 'text-gold-400',
}

type StatCardProps = {
  label: string
  value: string
  helper?: string
  tone?: StatTone
  icon?: ReactNode
}

export function StatCard({ helper, icon, label, tone = 'neutral', value }: StatCardProps) {
  return (
    <GlassCard className="min-h-32">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <p className={`mt-3 text-2xl font-bold tracking-tight ${toneClass[tone]}`}>{value}</p>
        </div>
        {icon ? <div className="rounded-lg border border-slate-700/70 bg-slate-900/70 p-2 text-gold-400">{icon}</div> : null}
      </div>
      {helper ? <p className="mt-4 text-xs text-slate-500">{helper}</p> : null}
    </GlassCard>
  )
}
