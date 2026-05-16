import { GlassCard } from '../../components/ui/GlassCard'
import { Table } from '../../components/ui/Table'
import { PlaceholderPage } from '../PlaceholderPage'

export function TeamOverviewPage() {
  return (
    <PlaceholderPage
      description="Manager-access placeholder for team trading activity, user summaries, and discipline monitoring."
      phase="Phase 3"
      title="Team Overview"
    >
      <GlassCard>
        <Table
          columns={['Trader', 'Role', 'Status', 'Today']}
          rows={[
            ['Demo Trader', 'Trader', 'Active', 'No live data yet'],
            ['Signal Desk', 'Manager', 'Active', 'No live data yet'],
          ]}
        />
      </GlassCard>
    </PlaceholderPage>
  )
}
