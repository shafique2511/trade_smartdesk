import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { PlaceholderPage } from '../PlaceholderPage'

export function SettingsPage() {
  return (
    <PlaceholderPage
      description="User settings placeholder for profile, branding, theme, exports, and account controls."
      phase="Phase 13"
      title="Settings"
    >
      <section className="grid gap-4 md:grid-cols-3">
        <Input label="Full name" placeholder="Demo Trader" />
        <Input label="Avatar URL" placeholder="https://..." />
        <Select label="Accent color">
          <option>Gold</option>
          <option>Green</option>
          <option>Blue</option>
        </Select>
      </section>
    </PlaceholderPage>
  )
}
