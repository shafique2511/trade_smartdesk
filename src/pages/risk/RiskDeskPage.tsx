import { Input } from '../../components/ui/Input'
import { PlaceholderPage } from '../PlaceholderPage'

export function RiskDeskPage() {
  return (
    <PlaceholderPage
      description="Risk settings placeholder for account balance, risk per trade, daily limits, and daily lock behavior."
      phase="Phase 11"
      title="Risk Desk"
    >
      <section className="grid gap-4 md:grid-cols-3">
        <Input label="Account balance" placeholder="$25,000" />
        <Input label="Risk per trade" placeholder="1%" />
        <Input label="Max daily loss" placeholder="$750" />
      </section>
    </PlaceholderPage>
  )
}
