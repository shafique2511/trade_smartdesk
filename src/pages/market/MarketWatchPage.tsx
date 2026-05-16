import { Badge } from '../../components/ui/Badge'
import { GlassCard } from '../../components/ui/GlassCard'
import { Input } from '../../components/ui/Input'
import { PageTitle } from '../../components/ui/PageTitle'
import { Select } from '../../components/ui/Select'
import { Table } from '../../components/ui/Table'
import { Textarea } from '../../components/ui/Textarea'
import { watchlist } from '../../data/mockData'

export function MarketWatchPage() {
  return (
    <>
      <PageTitle
        description="Manual watchlist structure for forex and gold monitoring. Live market API integration is intentionally deferred."
        title="Market Watch"
      />
      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassCard>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">XAUUSD Focus</h2>
            <Badge tone="gold">Gold</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Manual price" placeholder="2385.40" />
            <Input label="Spread" placeholder="18 pts" />
            <Input label="Daily high" placeholder="2392.00" />
            <Input label="Daily low" placeholder="2368.20" />
            <Select label="Session status">
              <option>Asia</option>
              <option>London</option>
              <option>New York</option>
              <option>Overlap</option>
            </Select>
            <Select label="Market bias">
              <option>Bullish</option>
              <option>Bearish</option>
              <option>Neutral</option>
            </Select>
          </div>
        </GlassCard>
        <GlassCard>
          <h2 className="mb-5 text-lg font-semibold text-white">Watchlist</h2>
          <Table
            columns={['Symbol', 'Price', 'Bias', 'Spread']}
            rows={watchlist.map((item) => [item.symbol, item.price, item.bias, item.spread])}
          />
        </GlassCard>
      </section>
      <GlassCard>
        <Textarea label="Market notes" placeholder="Record structure, liquidity areas, session behavior, and setup context." />
      </GlassCard>
    </>
  )
}
