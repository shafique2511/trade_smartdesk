import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { PlaceholderPage } from '../PlaceholderPage'

export function TelegramSettingsPage() {
  return (
    <PlaceholderPage
      description="Telegram settings placeholder. Bot token handling and server-side message delivery will be implemented in Phase 8."
      phase="Phase 8"
      title="Telegram Settings"
    >
      <section className="grid gap-4 md:grid-cols-2">
        <Input label="Bot token" placeholder="Stored securely in later phase" type="password" />
        <Input label="Channel ID" placeholder="@your_channel" />
      </section>
      <Textarea label="Default footer" placeholder="Trading SmartDesk&#10;Trade with plan. Manage your risk." />
    </PlaceholderPage>
  )
}
