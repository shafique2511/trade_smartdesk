import { useEffect, useState, type FormEvent } from 'react'
import { Bot, CheckCircle2, Save, Send, ShieldCheck } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { GlassCard } from '../../components/ui/GlassCard'
import { Input } from '../../components/ui/Input'
import { LoadingState } from '../../components/ui/LoadingState'
import { PageTitle } from '../../components/ui/PageTitle'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { callTelegramApi } from '../../lib/telegram'

type TelegramForm = {
  botToken: string
  channelId: string
  defaultFooter: string
  brandingEnabled: boolean
  isConnected: boolean
}

type PageMessage = {
  type: 'success' | 'error' | 'info'
  text: string
}

const initialForm: TelegramForm = {
  botToken: '',
  channelId: '',
  defaultFooter: 'Trading SmartDesk\nTrade with plan. Manage your risk.',
  brandingEnabled: true,
  isConnected: false,
}

export function TelegramSettingsPage() {
  const { user } = useAuth()
  const [form, setForm] = useState<TelegramForm>(initialForm)
  const [hasSavedToken, setHasSavedToken] = useState(false)
  const [message, setMessage] = useState<PageMessage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      if (!user) return
      setIsLoading(true)

      const { data, error } = await supabase
        .from('telegram_settings')
        .select('id, user_id, channel_id, default_footer, branding_enabled, is_connected, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle()

      if (cancelled) return

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else if (data) {
        setForm({
          botToken: '',
          channelId: data.channel_id ?? '',
          defaultFooter: data.default_footer ?? initialForm.defaultFooter,
          brandingEnabled: data.branding_enabled,
          isConnected: data.is_connected,
        })
        setHasSavedToken(true)
      }

      setIsLoading(false)
    }

    void loadSettings()

    return () => {
      cancelled = true
    }
  }, [user])

  async function saveSettings(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (!user) return

    if (!form.channelId.trim()) {
      setMessage({ type: 'error', text: 'Channel ID is required.' })
      return
    }

    if (!form.botToken.trim() && !hasSavedToken) {
      setMessage({ type: 'error', text: 'Bot token is required before testing or sending messages.' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    const payload = {
      user_id: user.id,
      channel_id: form.channelId.trim(),
      default_footer: form.defaultFooter,
      branding_enabled: form.brandingEnabled,
      is_connected: form.isConnected,
      ...(form.botToken.trim() ? { bot_token: form.botToken.trim(), is_connected: false } : {}),
    }

    const { error } = await supabase.from('telegram_settings').upsert(payload, { onConflict: 'user_id' })

    setIsSaving(false)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }

    setHasSavedToken(true)
    setForm((current) => ({ ...current, botToken: '', isConnected: payload.is_connected }))
    setMessage({ type: 'success', text: 'Telegram settings saved.' })
  }

  async function testConnection() {
    if (!user) return

    if (form.botToken.trim() || !hasSavedToken) {
      await saveSettings()
    }

    setIsTesting(true)
    setMessage(null)

    const response = await callTelegramApi({ action: 'test_connection' })

    setIsTesting(false)

    if (!response.ok) {
      setForm((current) => ({ ...current, isConnected: false }))
      setMessage({ type: 'error', text: response.error ?? 'Telegram connection failed.' })
      return
    }

    setForm((current) => ({ ...current, isConnected: true }))
    setMessage({ type: 'success', text: 'Telegram bot connection verified.' })
  }

  if (isLoading) {
    return <LoadingState label="Loading Telegram settings" />
  }

  return (
    <>
      <PageTitle
        actions={
          <>
            <Button disabled={isSaving} icon={<Save size={16} />} onClick={() => void saveSettings()} variant="secondary">
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button disabled={isTesting || isSaving} icon={<Send size={16} />} onClick={() => void testConnection()}>
              {isTesting ? 'Testing...' : 'Test Connection'}
            </Button>
          </>
        }
        description="Connect a Telegram bot and channel for manually confirmed signal delivery."
        title="Telegram Settings"
      />

      {message ? (
        <GlassCard className={message.type === 'error' ? 'border-loss-500/30 bg-loss-500/10' : message.type === 'success' ? 'border-profit-500/30 bg-profit-500/10' : 'border-sky-500/30 bg-sky-500/10'}>
          <p className={message.type === 'error' ? 'text-sm text-red-200' : message.type === 'success' ? 'text-sm text-green-200' : 'text-sm text-sky-200'}>{message.text}</p>
        </GlassCard>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <GlassCard>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Bot Connection</h2>
              <p className="mt-1 text-sm text-slate-500">Save the bot token and channel ID before sending messages.</p>
            </div>
            <Badge tone={form.isConnected ? 'profit' : 'neutral'}>{form.isConnected ? 'Connected' : 'Not connected'}</Badge>
          </div>

          <form className="grid gap-4" onSubmit={(event) => void saveSettings(event)}>
            <Input
              label={hasSavedToken ? 'Bot token - leave blank to keep saved token' : 'Bot token'}
              onChange={(event) => setForm((current) => ({ ...current, botToken: event.target.value }))}
              placeholder={hasSavedToken ? 'Saved token is hidden' : '123456:ABC-DEF...'}
              type="password"
              value={form.botToken}
            />
            <Input
              label="Channel ID"
              onChange={(event) => setForm((current) => ({ ...current, channelId: event.target.value }))}
              placeholder="@your_channel or -1001234567890"
              value={form.channelId}
            />
            <Textarea
              label="Default footer"
              onChange={(event) => setForm((current) => ({ ...current, defaultFooter: event.target.value }))}
              value={form.defaultFooter}
            />
            <Select
              label="Branding"
              onChange={(event) => setForm((current) => ({ ...current, brandingEnabled: event.target.value === 'true' }))}
              value={String(form.brandingEnabled)}
            >
              <option value="true">Branding enabled</option>
              <option value="false">Branding disabled</option>
            </Select>
            <div className="flex flex-wrap gap-3">
              <Button disabled={isSaving} icon={<Save size={16} />} type="submit">
                {isSaving ? 'Saving...' : 'Save settings'}
              </Button>
              <Button disabled={isTesting || isSaving} icon={<CheckCircle2 size={16} />} onClick={() => void testConnection()} variant="secondary">
                {isTesting ? 'Testing...' : 'Test connection'}
              </Button>
            </div>
          </form>
        </GlassCard>

        <GlassCard>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg border border-gold-400/30 bg-gold-500/10 p-2 text-gold-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Security Notes</h2>
              <p className="text-sm text-slate-500">Token handling is server-side for message delivery.</p>
            </div>
          </div>
          <div className="grid gap-3 text-sm leading-6 text-slate-400">
            <p>The bot token is saved to Supabase and hidden after save.</p>
            <p>Telegram sends are made through the Vercel API route, not directly from the browser.</p>
            <p>Every sent signal stores a Telegram response in signal logs.</p>
          </div>
          <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex items-center gap-3">
              <Bot className="text-gold-400" size={20} />
              <div>
                <p className="text-sm font-semibold text-white">Supported message types</p>
                <p className="mt-1 text-xs text-slate-500">New signal, TP update, SL update, BE update, daily recap, weekly report.</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>
    </>
  )
}
