import type { ReactNode } from 'react'
import { ArrowRight, Clock3 } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { GlassCard } from '../components/ui/GlassCard'
import { PageTitle } from '../components/ui/PageTitle'

type PlaceholderPageProps = {
  title: string
  description: string
  phase: string
  children?: ReactNode
}

export function PlaceholderPage({ children, description, phase, title }: PlaceholderPageProps) {
  return (
    <>
      <PageTitle
        actions={<Badge tone="gold">{phase}</Badge>}
        description={description}
        title={title}
      />
      {children}
      <GlassCard>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-gold-400">
              <Clock3 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Module placeholder</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Phase 1 defines the structure, routing, and premium shell. Real workflows and Supabase data arrive in later phases.
              </p>
            </div>
          </div>
          <Button icon={<ArrowRight size={16} />} variant="secondary">
            Ready for next phase
          </Button>
        </div>
      </GlassCard>
      <EmptyState
        description="No production data is connected in Phase 1. This screen uses placeholder content only."
        title="No live records yet"
      />
    </>
  )
}
