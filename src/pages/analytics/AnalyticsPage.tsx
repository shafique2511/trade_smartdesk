import { BarChart3 } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { PlaceholderPage } from '../PlaceholderPage'

export function AnalyticsPage() {
  return (
    <PlaceholderPage
      description="Performance analytics placeholder for equity curve, daily P/L, win rate, setup quality, and mistake frequency."
      phase="Phase 10"
      title="Analytics"
    >
      <GlassCard className="flex min-h-72 items-center justify-center">
        <div className="text-center">
          <BarChart3 className="mx-auto text-gold-400" size={42} />
          <p className="mt-4 text-sm text-slate-400">Recharts visualizations will be added when real trade and journal data exists.</p>
        </div>
      </GlassCard>
    </PlaceholderPage>
  )
}
