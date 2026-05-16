import { useEffect, useMemo, useState } from 'react'
import { Clipboard, History, RefreshCw, Send } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { GlassCard } from '../../components/ui/GlassCard'
import { LoadingState } from '../../components/ui/LoadingState'
import { Modal } from '../../components/ui/Modal'
import { PageTitle } from '../../components/ui/PageTitle'
import { Select } from '../../components/ui/Select'
import { Table } from '../../components/ui/Table'
import { Textarea } from '../../components/ui/Textarea'
import { useAuth } from '../../hooks/useAuth'
import { formatSignalMessage, signalTemplateOptions } from '../../lib/signals'
import { supabase } from '../../lib/supabase'
import type { SignalLog, Trade } from '../../types/database'
import type { SignalTemplateType } from '../../types/signals'

type SignalMessage = {
  type: 'success' | 'error' | 'info'
  text: string
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatTradeLabel(trade: Trade) {
  return `${trade.symbol} ${trade.direction.toUpperCase()} - ${trade.status.replaceAll('_', ' ')}`
}

export function SignalGeneratorPage() {
  const { user } = useAuth()
  const [trades, setTrades] = useState<Trade[]>([])
  const [signalLogs, setSignalLogs] = useState<SignalLog[]>([])
  const [selectedTradeId, setSelectedTradeId] = useState('')
  const [templateType, setTemplateType] = useState<SignalTemplateType>('new_signal')
  const [footer, setFooter] = useState('Trading SmartDesk\nTrade with plan. Manage your risk.')
  const [messageText, setMessageText] = useState('')
  const [statusMessage, setStatusMessage] = useState<SignalMessage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLogging, setIsLogging] = useState(false)
  const [confirmTelegramOpen, setConfirmTelegramOpen] = useState(false)

  const selectedTrade = useMemo(() => trades.find((trade) => trade.id === selectedTradeId) ?? null, [selectedTradeId, trades])

  useEffect(() => {
    let cancelled = false

    async function loadSignalData() {
      if (!user) return
      setIsLoading(true)

      const [tradesResult, logsResult] = await Promise.all([
        supabase.from('trades').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('signal_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      ])

      if (cancelled) return

      if (tradesResult.error) {
        setStatusMessage({ type: 'error', text: tradesResult.error.message })
      } else {
        const nextTrades = tradesResult.data ?? []
        setTrades(nextTrades)
        setSelectedTradeId((current) => current || nextTrades[0]?.id || '')
      }

      if (logsResult.error) {
        setStatusMessage({ type: 'error', text: logsResult.error.message })
      } else {
        setSignalLogs(logsResult.data ?? [])
      }

      setIsLoading(false)
    }

    void loadSignalData()

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    let cancelled = false

    queueMicrotask(() => {
      if (cancelled) return

      if (!selectedTrade) {
        setMessageText('')
        return
      }

      setMessageText(formatSignalMessage(selectedTrade, templateType, footer))
    })

    return () => {
      cancelled = true
    }
  }, [footer, selectedTrade, templateType])

  async function logSignal(signalType: string, sentToTelegram: boolean, telegramResponse: unknown = null) {
    if (!user || !selectedTrade) return null

    setIsLogging(true)
    const { data, error } = await supabase
      .from('signal_logs')
      .insert({
        user_id: user.id,
        trade_id: selectedTrade.id,
        signal_type: signalType,
        message: messageText,
        sent_to_telegram: sentToTelegram,
        telegram_response: telegramResponse,
      })
      .select('*')
      .single()

    setIsLogging(false)

    if (error) {
      setStatusMessage({ type: 'error', text: error.message })
      return null
    }

    setSignalLogs((current) => [data, ...current].slice(0, 10))
    return data
  }

  async function copySignal() {
    if (!messageText.trim()) {
      setStatusMessage({ type: 'error', text: 'Generate or edit a signal message before copying.' })
      return
    }

    try {
      await navigator.clipboard.writeText(messageText)
      await logSignal(`copied:${templateType}`, false)
      setStatusMessage({ type: 'success', text: 'Signal copied and logged.' })
    } catch (error) {
      setStatusMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to copy signal.' })
    }
  }

  async function confirmTelegramSend() {
    await logSignal(`telegram_queued:${templateType}`, false, {
      phase: 7,
      status: 'telegram_send_requires_phase_8',
    })
    setConfirmTelegramOpen(false)
    setStatusMessage({ type: 'info', text: 'Telegram send requires Phase 8. The manual confirmation was logged.' })
  }

  if (isLoading) {
    return <LoadingState label="Loading saved trades and signal logs" />
  }

  const logRows = signalLogs.map((log) => [
    <Badge tone={log.sent_to_telegram ? 'profit' : 'neutral'}>{log.sent_to_telegram ? 'Telegram' : 'Manual'}</Badge>,
    log.signal_type,
    log.trade_id ? trades.find((trade) => trade.id === log.trade_id)?.symbol ?? 'Saved trade' : 'No trade',
    formatDate(log.created_at),
  ])

  return (
    <>
      <PageTitle
        actions={
          <>
            <Button disabled={!selectedTrade || isLogging} icon={<Clipboard size={16} />} onClick={() => void copySignal()} variant="secondary">
              Copy Signal
            </Button>
            <Button disabled={!selectedTrade || isLogging} icon={<Send size={16} />} onClick={() => setConfirmTelegramOpen(true)}>
              Send to Telegram
            </Button>
          </>
        }
        description="Generate clean signal templates from saved trade plans. Telegram messages always require manual confirmation."
        title="Signal Generator"
      />

      {statusMessage ? (
        <GlassCard className={statusMessage.type === 'error' ? 'border-loss-500/30 bg-loss-500/10' : statusMessage.type === 'success' ? 'border-profit-500/30 bg-profit-500/10' : 'border-sky-500/30 bg-sky-500/10'}>
          <p className={statusMessage.type === 'error' ? 'text-sm text-red-200' : statusMessage.type === 'success' ? 'text-sm text-green-200' : 'text-sm text-sky-200'}>{statusMessage.text}</p>
        </GlassCard>
      ) : null}

      {trades.length === 0 ? (
        <EmptyState
          description="Create a trade plan first. Saved trades from the Trade Planner will appear here for signal formatting."
          title="No saved trades available"
        />
      ) : (
        <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <GlassCard>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white">Signal Controls</h2>
              <p className="mt-1 text-sm text-slate-500">Select a trade and generate a message template.</p>
            </div>
            <div className="grid gap-4">
              <Select label="Saved trade" onChange={(event) => setSelectedTradeId(event.target.value)} value={selectedTradeId}>
                {trades.map((trade) => (
                  <option key={trade.id} value={trade.id}>{formatTradeLabel(trade)}</option>
                ))}
              </Select>
              <Select label="Template" onChange={(event) => setTemplateType(event.target.value as SignalTemplateType)} value={templateType}>
                {signalTemplateOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
              <Textarea label="Custom footer" onChange={(event) => setFooter(event.target.value)} value={footer} />
              <Button icon={<RefreshCw size={16} />} onClick={() => selectedTrade && setMessageText(formatSignalMessage(selectedTrade, templateType, footer))} variant="secondary">
                Regenerate Message
              </Button>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Signal Preview</h2>
                <p className="mt-1 text-sm text-slate-500">Review and edit before copy or Telegram confirmation.</p>
              </div>
              <Badge tone="gold">Manual confirm</Badge>
            </div>
            <Textarea className="min-h-96 font-mono" label="Editable signal message" onChange={(event) => setMessageText(event.target.value)} value={messageText} />
            <div className="mt-4 flex flex-wrap gap-3">
              <Button disabled={isLogging} icon={<Clipboard size={16} />} onClick={() => void copySignal()} variant="secondary">
                Copy Signal
              </Button>
              <Button disabled={isLogging} icon={<Send size={16} />} onClick={() => setConfirmTelegramOpen(true)}>
                Send to Telegram
              </Button>
            </div>
          </GlassCard>
        </section>
      )}

      <GlassCard>
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-lg border border-gold-400/30 bg-gold-500/10 p-2 text-gold-400">
            <History size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Signal Logs</h2>
            <p className="text-sm text-slate-500">Every copied or confirmed signal action is logged.</p>
          </div>
        </div>
        {signalLogs.length > 0 ? (
          <Table columns={['Channel', 'Type', 'Trade', 'Created']} rows={logRows} />
        ) : (
          <EmptyState description="Copied and Telegram-confirmed signal actions will appear here." title="No signal logs yet" />
        )}
      </GlassCard>

      <Modal isOpen={confirmTelegramOpen} onClose={() => setConfirmTelegramOpen(false)} title="Confirm Telegram Send">
        <div className="grid gap-4">
          <p className="text-sm leading-6 text-slate-300">
            Telegram delivery is implemented in Phase 8. This confirmation step is already enforced so no signal can be sent automatically.
          </p>
          <div className="max-h-64 overflow-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3 whitespace-pre-wrap text-sm text-slate-300">
            {messageText}
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Button onClick={() => setConfirmTelegramOpen(false)} variant="secondary">Cancel</Button>
            <Button onClick={() => void confirmTelegramSend()}>Confirm Manually</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
