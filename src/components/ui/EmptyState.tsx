import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { GlassCard } from './GlassCard'

type EmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ action, description, title }: EmptyStateProps) {
  return (
    <GlassCard className="flex min-h-56 flex-col items-center justify-center text-center">
      <div className="mb-4 rounded-full border border-slate-700 bg-slate-900 p-3 text-gold-400">
        <Inbox size={24} />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </GlassCard>
  )
}
