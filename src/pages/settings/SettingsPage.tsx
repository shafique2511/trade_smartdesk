import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Download, Palette, Save, ShieldAlert, UserRound } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { GlassCard } from '../../components/ui/GlassCard'
import { Input } from '../../components/ui/Input'
import { LoadingState } from '../../components/ui/LoadingState'
import { PageTitle } from '../../components/ui/PageTitle'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { useAuth } from '../../hooks/useAuth'
import {
  defaultLocalSettings,
  exportAnalyticsCsv,
  exportJournalCsv,
  exportTradesCsv,
  loadLocalSettings,
  saveLocalSettings,
} from '../../lib/settings'
import { supabase } from '../../lib/supabase'
import type { JournalEntry, Trade } from '../../types/database'
import type { LocalSettings } from '../../types/settings'

type PageMessage = {
  type: 'success' | 'error' | 'info'
  text: string
}

export function SettingsPage() {
  const { profile, refreshProfile, user } = useAuth()
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [localSettings, setLocalSettings] = useState<LocalSettings>(defaultLocalSettings)
  const [trades, setTrades] = useState<Trade[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [message, setMessage] = useState<PageMessage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingLocal, setIsSavingLocal] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadSettingsData() {
      if (!user) return
      setIsLoading(true)
      setFullName(profile?.full_name ?? '')
      setAvatarUrl(profile?.avatar_url ?? '')
      setLocalSettings(loadLocalSettings(user.id))

      const [tradesResult, journalResult] = await Promise.all([
        supabase.from('trades').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])

      if (cancelled) return

      if (tradesResult.error) setMessage({ type: 'error', text: tradesResult.error.message })
      else setTrades(tradesResult.data ?? [])

      if (journalResult.error) setMessage({ type: 'error', text: journalResult.error.message })
      else setJournalEntries(journalResult.data ?? [])

      setIsLoading(false)
    }

    void loadSettingsData()

    return () => {
      cancelled = true
    }
  }, [profile?.avatar_url, profile?.full_name, user])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return

    setIsSavingProfile(true)
    setMessage(null)

    const { error } = await supabase
      .from('user_profiles')
      .update({
        full_name: fullName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      })
      .eq('id', user.id)

    setIsSavingProfile(false)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }

    await refreshProfile()
    setMessage({ type: 'success', text: 'Profile settings saved.' })
  }

  function saveLocalPreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return

    setIsSavingLocal(true)
    saveLocalSettings(user.id, localSettings)
    setIsSavingLocal(false)
    setMessage({ type: 'success', text: 'Branding and theme settings saved locally.' })
  }

  if (isLoading) return <LoadingState label="Loading settings" />

  return (
    <>
      <PageTitle
        description="Manage profile details, branding preferences, shortcuts, exports, and account placeholders."
        title="Settings"
      />

      {message ? (
        <GlassCard className={message.type === 'success' ? 'border-profit-500/30 bg-profit-500/10' : message.type === 'error' ? 'border-loss-500/30 bg-loss-500/10' : 'border-sky-500/30 bg-sky-500/10'}>
          <p className={message.type === 'success' ? 'text-sm text-green-200' : message.type === 'error' ? 'text-sm text-red-200' : 'text-sm text-sky-200'}>{message.text}</p>
        </GlassCard>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassCard>
          <div className="mb-5 flex items-center gap-3">
            <UserRound className="text-gold-400" size={22} />
            <div>
              <h2 className="text-lg font-semibold text-white">Profile Settings</h2>
              <p className="text-sm text-slate-500">Update your workspace profile.</p>
            </div>
          </div>
          <form className="grid gap-4" onSubmit={saveProfile}>
            <Input label="Full name" onChange={(event) => setFullName(event.target.value)} value={fullName} />
            <Input label="Email" readOnly value={profile?.email ?? ''} />
            <Input label="Avatar URL" onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://..." value={avatarUrl} />
            <Button disabled={isSavingProfile} icon={<Save size={16} />} type="submit">
              {isSavingProfile ? 'Saving...' : 'Save profile'}
            </Button>
          </form>
        </GlassCard>

        <GlassCard>
          <div className="mb-5 flex items-center gap-3">
            <Palette className="text-gold-400" size={22} />
            <div>
              <h2 className="text-lg font-semibold text-white">Branding Settings</h2>
              <p className="text-sm text-slate-500">Local preferences for signal and workspace presentation.</p>
            </div>
          </div>
          <form className="grid gap-4" onSubmit={saveLocalPreferences}>
            <Input
              label="App display name"
              onChange={(event) => setLocalSettings((current) => ({ ...current, branding: { ...current.branding, appDisplayName: event.target.value } }))}
              value={localSettings.branding.appDisplayName}
            />
            <Textarea
              label="Signal footer"
              onChange={(event) => setLocalSettings((current) => ({ ...current, branding: { ...current.branding, signalFooter: event.target.value } }))}
              value={localSettings.branding.signalFooter}
            />
            <Input
              label="Logo URL"
              onChange={(event) => setLocalSettings((current) => ({ ...current, branding: { ...current.branding, logoUrl: event.target.value } }))}
              placeholder="https://..."
              value={localSettings.branding.logoUrl}
            />
            <Input
              label="Brand color"
              onChange={(event) => setLocalSettings((current) => ({ ...current, branding: { ...current.branding, brandColor: event.target.value } }))}
              type="color"
              value={localSettings.branding.brandColor}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Theme mode"
                onChange={(event) => setLocalSettings((current) => ({ ...current, theme: { ...current.theme, mode: event.target.value as LocalSettings['theme']['mode'] } }))}
                value={localSettings.theme.mode}
              >
                <option value="dark">Dark mode</option>
                <option value="light">Light mode placeholder</option>
              </Select>
              <Select
                label="Accent color"
                onChange={(event) => setLocalSettings((current) => ({ ...current, theme: { ...current.theme, accentColor: event.target.value as LocalSettings['theme']['accentColor'] } }))}
                value={localSettings.theme.accentColor}
              >
                <option value="gold">Gold</option>
                <option value="green">Green</option>
                <option value="blue">Blue</option>
              </Select>
            </div>
            <Button disabled={isSavingLocal} icon={<Save size={16} />} type="submit">
              {isSavingLocal ? 'Saving...' : 'Save branding'}
            </Button>
          </form>
        </GlassCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Telegram Settings</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Configure bot token, channel ID, and footer.</p>
          <Link className="mt-5 inline-flex" to="/telegram"><Button variant="secondary">Open Telegram Settings</Button></Link>
        </GlassCard>
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Risk Settings</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Manage account balance, daily limits, and lock behavior.</p>
          <Link className="mt-5 inline-flex" to="/risk-desk"><Button variant="secondary">Open Risk Desk</Button></Link>
        </GlassCard>
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Theme Status</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="gold">{localSettings.theme.mode === 'dark' ? 'Dark active' : 'Light placeholder'}</Badge>
            <Badge tone="neutral">{localSettings.theme.accentColor}</Badge>
          </div>
        </GlassCard>
      </section>

      <GlassCard>
        <div className="mb-5 flex items-center gap-3">
          <Download className="text-gold-400" size={22} />
          <div>
            <h2 className="text-lg font-semibold text-white">Export Data</h2>
            <p className="text-sm text-slate-500">Export current user data. Phase 14 expands this into the full export system.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => exportTradesCsv(trades)} variant="secondary">Export trades CSV</Button>
          <Button onClick={() => exportJournalCsv(journalEntries, trades)} variant="secondary">Export journal CSV</Button>
          <Button onClick={() => exportAnalyticsCsv(trades)} variant="secondary">Export analytics CSV</Button>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="mb-5 flex items-center gap-3">
          <ShieldAlert className="text-loss-500" size={22} />
          <div>
            <h2 className="text-lg font-semibold text-white">Account Settings</h2>
            <p className="text-sm text-slate-500">Account safety actions are placeholders until production support workflows are defined.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Button disabled variant="secondary">Disable account request placeholder</Button>
          <Button disabled variant="danger">Delete account warning placeholder</Button>
        </div>
      </GlassCard>
    </>
  )
}
