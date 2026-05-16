import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Calculator, FileUp, RotateCcw, Save, Send, ShieldCheck } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { GlassCard } from '../../components/ui/GlassCard'
import { Input } from '../../components/ui/Input'
import { PageTitle } from '../../components/ui/PageTitle'
import { Select } from '../../components/ui/Select'
import { StatCard } from '../../components/ui/StatCard'
import { Table } from '../../components/ui/Table'
import { Textarea } from '../../components/ui/Textarea'
import { useAuth } from '../../hooks/useAuth'
import { calculateDailyProfitLoss, getRiskStatus, getTodayTrades, shouldLockNewTrades } from '../../lib/risk'
import { supabase } from '../../lib/supabase'
import {
  buildTradeInsert,
  calculateTradePlan,
  initialTradePlannerForm,
  setupTypes,
  tradeStatuses,
} from '../../lib/tradePlanner'
import type { RiskSettings, Trade, TradeStatus } from '../../types/database'
import type { TradePlannerForm } from '../../types/tradePlanner'

type PlannerMessage = {
  type: 'success' | 'error'
  text: string
}

function formatNumber(value: number, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : '0.00'
}

function currency(value: number) {
  return new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(value)
}

export function TradePlannerPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<TradePlannerForm>(initialTradePlannerForm)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [message, setMessage] = useState<PlannerMessage | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [riskSettings, setRiskSettings] = useState<RiskSettings | null>(null)
  const [todayTrades, setTodayTrades] = useState<Trade[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadRiskDefaults() {
      if (!user) return

      const [settingsResult, tradesResult] = await Promise.all([
        supabase.from('risk_settings').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('trades').select('*').eq('user_id', user.id).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      ])

      if (cancelled) return

      const data = settingsResult.data
      setRiskSettings(data ?? null)
      setTodayTrades(getTodayTrades(tradesResult.data ?? []))
      if (!data) return

      setForm((current) => ({
        ...current,
        accountBalance: current.accountBalance || String(data.account_balance),
        riskPercentage: current.riskPercentage || String(data.risk_per_trade),
      }))
    }

    void loadRiskDefaults()

    return () => {
      cancelled = true
    }
  }, [user])

  const calculations = useMemo(() => calculateTradePlan(form), [form])
  const dailyProfitLoss = useMemo(() => calculateDailyProfitLoss(todayTrades), [todayTrades])
  const riskStatus = useMemo(() => getRiskStatus(riskSettings, dailyProfitLoss, todayTrades.length), [dailyProfitLoss, riskSettings, todayTrades.length])
  const tradeCreationLocked = shouldLockNewTrades(riskSettings, riskStatus)

  function updateField<Field extends keyof TradePlannerForm>(field: Field, value: TradePlannerForm[Field]) {
    setForm((current) => ({ ...current, [field]: value }))
    setMessage(null)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setSelectedFileName(file?.name ?? '')
  }

  function resetForm() {
    setForm(initialTradePlannerForm)
    setSelectedFileName('')
    setMessage(null)
  }

  async function saveTrade(statusOverride?: TradeStatus) {
    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in to save a trade plan.' })
      return null
    }

    if (!calculations.isValid) {
      setMessage({ type: 'error', text: 'Fix the validation warnings before saving this trade plan.' })
      return null
    }

    if (tradeCreationLocked && statusOverride !== 'draft') {
      setMessage({ type: 'error', text: 'Daily risk limit reached.' })
      return null
    }

    setIsSaving(true)
    setMessage(null)

    const payload = buildTradeInsert(user.id, form, calculations, statusOverride)
    const { data, error } = await supabase.from('trades').insert(payload).select('*').single()

    setIsSaving(false)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return null
    }

    setMessage({ type: 'success', text: `Trade plan saved as ${statusOverride ?? form.status}.` })
    setTodayTrades((current) => [data, ...current])
    return data
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await saveTrade(form.status)
  }

  async function saveAndGoToSignals() {
    const trade = await saveTrade(form.status)
    if (trade) navigate('/signals')
  }

  const targetRows = calculations.targets.map((target) => [
    target.label,
    target.price === null ? 'Not set' : formatNumber(target.price, 5),
    target.rewardDistance === null ? 'Not set' : formatNumber(target.rewardDistance, 5),
    target.rr === null ? 'Not set' : `${formatNumber(target.rr)}R`,
    <Badge tone={target.isValid ? 'profit' : 'loss'}>{target.isValid ? 'Valid' : 'Invalid'}</Badge>,
  ])

  return (
    <>
      <PageTitle
        actions={
          <>
            <Button disabled={!calculations.isValid || isSaving} icon={<Save size={16} />} onClick={() => void saveTrade('draft')} variant="secondary">
              Save as Draft
            </Button>
            <Button disabled={!calculations.isValid || isSaving} icon={<Send size={16} />} onClick={() => void saveAndGoToSignals()}>
              Generate Signal
            </Button>
          </>
        }
        description="Plan entries, targets, transparent risk, and validation before a trade is saved."
        title="Trade Planner"
      />

      {tradeCreationLocked ? (
        <GlassCard className="border-loss-500/30 bg-loss-500/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 text-loss-500" size={20} />
            <div>
              <h2 className="text-sm font-semibold text-red-200">Daily risk limit reached.</h2>
              <p className="mt-2 text-sm leading-6 text-red-100">
                Your preset risk limit has been reached. New non-draft trade creation is disabled while lock-after-loss is enabled.
              </p>
            </div>
          </div>
        </GlassCard>
      ) : null}

      <form className="grid gap-6" onSubmit={handleSubmit}>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard helper="Absolute entry to SL distance" icon={<Calculator size={18} />} label="Risk Distance" tone="gold" value={formatNumber(calculations.riskDistance, 5)} />
          <StatCard helper="Balance x risk percentage" icon={<ShieldCheck size={18} />} label="Risk Amount" tone="loss" value={currency(calculations.riskAmount)} />
          <StatCard helper={`Risk amount / (${formatNumber(calculations.riskDistance, 5)} x ${calculations.contractSize})`} icon={<Calculator size={18} />} label="Suggested Lot Size" tone="profit" value={formatNumber(calculations.suggestedLotSize, 4)} />
          <StatCard helper="Contract-size assumption for symbol" icon={<Calculator size={18} />} label="Contract Size" tone="neutral" value={String(calculations.contractSize)} />
        </section>

        {calculations.warnings.length > 0 ? (
          <GlassCard className="border-loss-500/30 bg-loss-500/10">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 text-loss-500" size={20} />
              <div>
                <h2 className="text-sm font-semibold text-red-200">Validation warnings</h2>
                <ul className="mt-2 grid gap-1 text-sm text-red-100">
                  {calculations.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </GlassCard>
        ) : null}

        {message ? (
          <GlassCard className={message.type === 'success' ? 'border-profit-500/30 bg-profit-500/10' : 'border-loss-500/30 bg-loss-500/10'}>
            <p className={message.type === 'success' ? 'text-sm text-green-200' : 'text-sm text-red-200'}>{message.text}</p>
          </GlassCard>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <GlassCard>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white">Trade Setup</h2>
              <p className="mt-1 text-sm text-slate-500">Define the trade idea and execution context.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Symbol" onChange={(event) => updateField('symbol', event.target.value.toUpperCase())} placeholder="XAUUSD" required value={form.symbol} />
              <Select label="Direction" onChange={(event) => updateField('direction', event.target.value as TradePlannerForm['direction'])} value={form.direction}>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </Select>
              <Input label="Entry price" min="0" onChange={(event) => updateField('entryPrice', event.target.value)} placeholder="2385.40" required step="any" type="number" value={form.entryPrice} />
              <Input label="Stop Loss" min="0" onChange={(event) => updateField('stopLoss', event.target.value)} placeholder="2376.00" required step="any" type="number" value={form.stopLoss} />
              <Input label="TP1" min="0" onChange={(event) => updateField('tp1', event.target.value)} placeholder="2394.00" step="any" type="number" value={form.tp1} />
              <Input label="TP2" min="0" onChange={(event) => updateField('tp2', event.target.value)} placeholder="2402.00" step="any" type="number" value={form.tp2} />
              <Input label="TP3" min="0" onChange={(event) => updateField('tp3', event.target.value)} placeholder="2410.00" step="any" type="number" value={form.tp3} />
              <Input label="TP4" min="0" onChange={(event) => updateField('tp4', event.target.value)} placeholder="2420.00" step="any" type="number" value={form.tp4} />
              <Input label="Account balance" min="0" onChange={(event) => updateField('accountBalance', event.target.value)} placeholder="25000" required step="any" type="number" value={form.accountBalance} />
              <Input label="Risk percentage" min="0" onChange={(event) => updateField('riskPercentage', event.target.value)} placeholder="1" required step="any" type="number" value={form.riskPercentage} />
              <Input label="Risk amount" readOnly value={formatNumber(calculations.riskAmount)} />
              <Input label="Lot size" readOnly value={formatNumber(calculations.suggestedLotSize, 4)} />
              <Select label="Setup type" onChange={(event) => updateField('setupType', event.target.value)} value={form.setupType}>
                {setupTypes.map((setupType) => (
                  <option key={setupType}>{setupType}</option>
                ))}
              </Select>
              <Input label="Confidence score" max="100" min="0" onChange={(event) => updateField('confidenceScore', event.target.value)} step="1" type="number" value={form.confidenceScore} />
              <Select label="Status" onChange={(event) => updateField('status', event.target.value as TradeStatus)} value={form.status}>
                {tradeStatuses.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </Select>
              <Input label="Screenshot URL" onChange={(event) => updateField('screenshotUrl', event.target.value)} placeholder="https://..." value={form.screenshotUrl} />
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-300">Screenshot upload field</span>
                <div className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-700/80 bg-slate-950/50 px-3 text-sm text-slate-400">
                  <FileUp size={16} />
                  <input className="w-full text-sm" onChange={handleFileChange} type="file" />
                </div>
                {selectedFileName ? <p className="mt-2 text-xs text-slate-500">{selectedFileName} selected. Storage upload is planned for a later media phase.</p> : null}
              </label>
              <div className="md:col-span-2">
                <Textarea label="Trade reason" onChange={(event) => updateField('tradeReason', event.target.value)} placeholder="Document the setup context, invalidation, confluence, and execution plan." value={form.tradeReason} />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white">Reward/Risk Breakdown</h2>
              <p className="mt-1 text-sm text-slate-500">TP levels are validated against the selected direction.</p>
            </div>
            <Table columns={['Target', 'Price', 'Reward Distance', 'RR', 'Status']} rows={targetRows} />
            <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-sm font-semibold text-white">Calculation method</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Risk amount = account balance x risk percentage. Suggested lot size = risk amount / (risk distance x contract size). The result is a planning estimate only.
              </p>
            </div>
          </GlassCard>
        </section>

        <GlassCard>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm leading-6 text-slate-400">
              This platform is for trade planning, journaling, and risk management only. It does not provide financial advice.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button disabled={!calculations.isValid || isSaving || tradeCreationLocked} icon={<Save size={16} />} type="submit">
                {isSaving ? 'Saving...' : 'Save Trade Plan'}
              </Button>
              <Button icon={<RotateCcw size={16} />} onClick={resetForm} variant="secondary">
                Reset Form
              </Button>
              <Link to="/signals">
                <Button variant="ghost">Open Signals</Button>
              </Link>
            </div>
          </div>
        </GlassCard>
      </form>
    </>
  )
}
