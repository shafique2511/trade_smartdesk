import { Button } from '../../components/ui/Button'
import { GlassCard } from '../../components/ui/GlassCard'
import { Textarea } from '../../components/ui/Textarea'
import { PlaceholderPage } from '../PlaceholderPage'

export function SignalGeneratorPage() {
  return (
    <PlaceholderPage
      description="Signal formatting workspace with manual confirmation before Telegram delivery in later phases."
      phase="Phase 7"
      title="Signal Generator"
    >
      <GlassCard>
        <Textarea
          label="Signal preview"
          readOnly
          value={`XAUUSD BUY\n\nEntry: 2385.40\nSL: 2376.00\nTP1: 2394.00\nTP2: 2402.00\n\nRisk: 1%\nSetup: Liquidity Sweep\nStatus: Waiting\n\nTrading SmartDesk\nTrade with plan. Manage your risk.`}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary">Copy Signal</Button>
          <Button>Send to Telegram</Button>
        </div>
      </GlassCard>
    </PlaceholderPage>
  )
}
