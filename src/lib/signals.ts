import type { Trade } from '../types/database'
import type { SignalTemplateOption, SignalTemplateType } from '../types/signals'

export const signalTemplateOptions: SignalTemplateOption[] = [
  { label: 'New signal', value: 'new_signal' },
  { label: 'TP1 hit', value: 'tp1_hit' },
  { label: 'TP2 hit', value: 'tp2_hit' },
  { label: 'TP3 hit', value: 'tp3_hit' },
  { label: 'TP4 hit', value: 'tp4_hit' },
  { label: 'SL hit', value: 'sl_hit' },
  { label: 'Move SL to BE', value: 'move_sl_be' },
  { label: 'Trade closed', value: 'trade_closed' },
  { label: 'Trade cancelled', value: 'trade_cancelled' },
]

function formatPrice(value: number | null) {
  return value === null ? '-' : value.toString()
}

function formatStatus(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function defaultSignalFooter() {
  return 'Trading SmartDesk\nTrade with plan. Manage your risk.'
}

export function formatSignalMessage(trade: Trade, templateType: SignalTemplateType, footer = defaultSignalFooter()) {
  if (templateType === 'new_signal') {
    return `${trade.symbol} ${trade.direction.toUpperCase()}

Entry: ${formatPrice(trade.entry_price)}
SL: ${formatPrice(trade.stop_loss)}
TP1: ${formatPrice(trade.tp1)}
TP2: ${formatPrice(trade.tp2)}
TP3: ${formatPrice(trade.tp3)}
TP4: ${formatPrice(trade.tp4)}

Risk: ${trade.risk_percentage}%
Setup: ${trade.setup_type ?? 'Manual Setup'}
Status: ${formatStatus(trade.status)}

${footer}`
  }

  const updateLines: Record<Exclude<SignalTemplateType, 'new_signal'>, string[]> = {
    tp1_hit: ['TP1 HIT', 'Move SL to breakeven.'],
    tp2_hit: ['TP2 HIT', 'Manage remaining position according to your plan.'],
    tp3_hit: ['TP3 HIT', 'Manage remaining position according to your plan.'],
    tp4_hit: ['TP4 HIT', 'Final target reached.'],
    sl_hit: ['SL HIT', 'Trade invalidated according to the plan.'],
    move_sl_be: ['MOVE SL TO BE', 'Move SL to breakeven.'],
    trade_closed: ['TRADE CLOSED', 'Trade closed according to the plan.'],
    trade_cancelled: ['TRADE CANCELLED', 'Setup cancelled. No action required.'],
  }

  return `${trade.symbol} UPDATE

${updateLines[templateType].join('\n')}

${footer}`
}
