import { Badge } from '../../components/ui/Badge'
import { GlassCard } from '../../components/ui/GlassCard'
import { Table } from '../../components/ui/Table'
import { PlaceholderPage } from '../PlaceholderPage'

export function AdminDashboardPage() {
  return (
    <PlaceholderPage
      description="Admin SaaS panel placeholder for users, packages, subscriptions, logs, and system settings."
      phase="Phase 12"
      title="Admin Dashboard"
    >
      <GlassCard>
        <Table
          columns={['Area', 'Status', 'Access']}
          rows={[
            ['User Management', <Badge tone="gold">Planned</Badge>, 'Admin only'],
            ['Package Management', <Badge tone="gold">Planned</Badge>, 'Admin only'],
            ['Subscription Management', <Badge tone="gold">Planned</Badge>, 'Admin only'],
          ]}
        />
      </GlassCard>
    </PlaceholderPage>
  )
}
