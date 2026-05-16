import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, Gauge, Lock, Save, ShieldCheck, Target, TrendingDown, TrendingUp } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { GlassCard } from '../../components/ui/GlassCard'
import { Input } from '../../components/ui/Input'
import { LoadingState } from '../../components/ui/LoadingState'
import { PageTitle } from '../../components/ui/PageTitle'
import { Select } from '../../components/ui/Select'
import { StatCard } from '../../components/ui/StatCard'
import { useAuth } from '../../hooks/useAuth'
import { formatCurrency } from '../../lib/dashboard'
import {
  calculateDailyProfitLoss,
  formToRiskSettings,
  getRiskStatus,
  getRiskStatusMessage,
  getTodayTrades,
  initialRiskSettingsForm,
  riskSettingsToForm,
  shouldLockNewTrades,
} from '../../lib/risk'
import { supabase } from '../../lib/supabase'
import type { RiskSettings, Trade } from '../../types/database'
import type { RiskSettingsForm, RiskStatus } from '../../types/risk'

type PageMessage = {
  type: 'success' | 'error'
  text: string
}

const riskTone: Record<RiskStatus, 'profit' | 'loss' | 'gold' | 'neutral'> = {
  Safe: 'profit',
  Warning: 'gold',
  'Daily Loss Reached': 'loss',
  'Daily Profit Reached': 'profit',
  'Max Trades Reached': 'gold',
}

export function RiskDeskPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<RiskSettings | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [form, setForm] = useState<RiskSettingsForm>(initialRiskSettingsForm)
  const [message, setMessage] = useState<PageMessage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadRiskData() {
      if (!user) return
      setIsLoading(true)

      const [settingsResult, tradesResult] = await Promise.all([
        supabase.from('risk_settings').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('trades').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])

      if (cancelled) return

      if (settingsResult.error) {
        setMessage({ type: 'error', text: settingsResult.error.message })
      } else {
        setSettings(settingsResult.data ?? null)
        setForm(riskSettingsToForm(settingsResult.data ?? null))
      }

      if (tradesResult.error) setMessage({ type: 'error', text: tradesResult.error.message })
      else setTrades(tradesResult.data ?? [])

      setIsLoading(false)
    }

    void loadRiskData()

    return () => {
      cancelled = true
    }
  }, [user])

  const riskSnapshot = useMemo(() => {
    const todayTrades = getTodayTrades(trades)
    const dailyProfitLoss = calculateDailyProfitLoss(trades)
    const status = getRiskStatus(settings, dailyProfitLoss, todayTrades.length)
    const remainingLoss = settings?.max_daily_loss ? Math.max(0, settings.max_daily_loss + dailyProfitLoss) : 0
    const remainingProfit = settings?.max_daily_profit ? Math.max(0, settings.max_daily_profit - dailyProfitLoss) : 0
    const tradesRemaining = settings?.max_trades_per_day ? Math.max(0, settings.max_trades_per_day - todayTrades.length) : 0

    return {
      todayTrades,
      dailyProfitLoss,
      status,
      remainingLoss,
      remainingProfit,
      tradesRemaining,
      isLocked: shouldLockNewTrades(settings, status),
    }
  }, [settings, trades])

  function updateField<Field extends keyof RiskSettingsForm>(field: Field, value: RiskSettingsForm[Field]) {
    setForm((current) => ({ ...current, [field]: value }))
    setMessage(null)
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return

    setIsSaving(true)
    setMessage(null)

    const { data, error } = await supabase
      .from('risk_settings')
      .upsert(formToRiskSettings(form, user.id), { onConflict: 'user_id' })
      .select('*')
      .single()

    setIsSaving(false)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }

    setSettings(data)
    setForm(riskSettingsToForm(data))
    setMessage({ type: 'success', text: 'Risk settings saved.' })
  }

  if (isLoading) return <LoadingState label="Loading risk desk" />

  return (
    <>
      <PageTitle
        description="Configure preset risk limits and monitor today’s trading discipline state."
        title="Risk Desk"
      />

      {message ? (
        <GlassCard className={message.type === 'success' ? 'border-profit-500/30 bg-profit-500/10' : 'border-loss-500/30 bg-loss-500/10'}>
          <p className={message.type === 'success' ? 'text-sm text-green-200' : 'text-sm text-red-200'}>{message.text}</p>
        </GlassCard>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard helper="From trades created today" icon={<Gauge size={18} />} label="Current Daily P/L" tone={riskSnapshot.dailyProfitLoss < 0 ? 'loss' : riskSnapshot.dailyProfitLoss > 0 ? 'profit' : 'neutral'} value={formatCurrency(riskSnapshot.dailyProfitLoss)} />
        <StatCard helper="Before preset daily loss is reached" icon={<TrendingDown size={18} />} label="Remaining Daily Loss Limit" tone="loss" value={formatCurrency(riskSnapshot.remainingLoss)} />
        <StatCard helper="Before preset daily profit is reached" icon={<TrendingUp size={18} />} label="Remaining Daily Profit Target" tone="profit" value={formatCurrency(riskSnapshot.remainingProfit)} />
        <StatCard helper="Trades created today" icon={<Target size={18} />} label="Trades Taken Today" value={String(riskSnapshot.todayTrades.length)} />
        <StatCard helper="Based on max trades per day" icon={<ShieldCheck size={18} />} label="Max Trades Remaining" tone={riskSnapshot.tradesRemaining === 0 ? 'gold' : 'neutral'} value={String(riskSnapshot.tradesRemaining)} />
        <StatCard helper={getRiskStatusMessage(riskSnapshot.status)} icon={<AlertTriangle size={18} />} label="Current Risk Status" tone={riskTone[riskSnapshot.status]} value={riskSnapshot.status} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <GlassCard>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Risk Settings</h2>
            <p className="mt-1 text-sm text-slate-500">Limits are user-defined presets for planning discipline.</p>
          </div>
          <form className="grid gap-4" onSubmit={saveSettings}>
            <Input label="Account balance" min="0" onChange={(event) => updateField('accountBalance', event.target.value)} placeholder="25000" required step="any" type="number" value={form.accountBalance} />
            <Input label="Risk per trade" min="0" onChange={(event) => updateField('riskPerTrade', event.target.value)} placeholder="1" required step="any" type="number" value={form.riskPerTrade} />
            <Input label="Max daily loss" min="0" onChange={(event) => updateField('maxDailyLoss', event.target.value)} placeholder="750" required step="any" type="number" value={form.maxDailyLoss} />
            <Input label="Max daily profit" min="0" onChange={(event) => updateField('maxDailyProfit', event.target.value)} placeholder="1500" required step="any" type="number" value={form.maxDailyProfit} />
            <Input label="Max trades per day" min="0" onChange={(event) => updateField('maxTradesPerDay', event.target.value)} placeholder="3" required step="1" type="number" value={form.maxTradesPerDay} />
            <Select label="Daily loss lock" onChange={(event) => updateField('lockAfterDailyLoss', event.target.value === 'true')} value={String(form.lockAfterDailyLoss)}>
              <option value="false">Do not lock trade creation</option>
              <option value="true">Lock after daily loss or max trades</option>
            </Select>
            <Button disabled={isSaving} icon={<Save size={16} />} type="submit">
              {isSaving ? 'Saving...' : 'Save Risk Settings'}
            </Button>
          </form>
        </GlassCard>

        <GlassCard>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Risk Warning System</h2>
              <p className="mt-1 text-sm text-slate-500">Warnings follow your own preset risk settings.</p>
            </div>
            <Badge tone={riskTone[riskSnapshot.status]}>{riskSnapshot.status}</Badge>
          </div>
          <div className={`rounded-lg border p-5 ${
            riskSnapshot.status === 'Daily Loss Reached'
              ? 'border-loss-500/30 bg-loss-500/10'
              : riskSnapshot.status === 'Daily Profit Reached'
                ? 'border-profit-500/30 bg-profit-500/10'
                : riskSnapshot.status === 'Warning' || riskSnapshot.status === 'Max Trades Reached'
                  ? 'border-gold-400/30 bg-gold-500/10'
                  : 'border-profit-500/30 bg-profit-500/10'
          }`}>
            <div className="flex items-start gap-3">
              {riskSnapshot.isLocked ? <Lock className="mt-0.5 text-loss-500" size={22} /> : <ShieldCheck className="mt-0.5 text-gold-400" size={22} />}
              <div>
                <p className="text-sm font-semibold text-white">{getRiskStatusMessage(riskSnapshot.status)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {riskSnapshot.isLocked
                    ? 'New trade creation is disabled while the lock condition remains active.'
                    : 'New trade creation remains available based on the current saved settings.'}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 grid gap-3 text-sm text-slate-400">
            <div className="flex justify-between border-b border-slate-800 pb-3">
              <span>Preset max daily loss</span>
              <span className="font-semibold text-white">{formatCurrency(settings?.max_daily_loss ?? 0)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-3">
              <span>Preset max daily profit</span>
              <span className="font-semibold text-white">{formatCurrency(settings?.max_daily_profit ?? 0)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-3">
              <span>Preset max trades</span>
              <span className="font-semibold text-white">{settings?.max_trades_per_day ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Lock after daily loss</span>
              <span className="font-semibold text-white">{settings?.lock_after_daily_loss ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </GlassCard>
      </section>
    </>
  )
}
