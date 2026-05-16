import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { PlaceholderPage } from '../PlaceholderPage'

export function TradePlannerPage() {
  return (
    <PlaceholderPage
      description="Core planning form placeholder for entries, stop loss, targets, setup type, and risk calculations."
      phase="Phase 6"
      title="Trade Planner"
    >
      <section className="grid gap-4 md:grid-cols-3">
        <Input label="Symbol" placeholder="XAUUSD" />
        <Select label="Direction">
          <option>Buy</option>
          <option>Sell</option>
        </Select>
        <Input label="Risk percentage" placeholder="1.0%" />
      </section>
      <Textarea label="Trade reason" placeholder="Document the setup context before saving a plan." />
    </PlaceholderPage>
  )
}
