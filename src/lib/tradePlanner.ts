import type { Database, TradeDirection, TradeStatus } from '../types/database'
import type { TargetCalculation, TradeCalculations, TradePlannerForm } from '../types/tradePlanner'

export const setupTypes = [
  'SBR',
  'RBS',
  'Breakout Retest',
  'Fibo Confluence',
  'Gann Level',
  'Liquidity Sweep',
  'Supply Zone',
  'Demand Zone',
  'News Trade',
  'Manual Setup',
]

export const tradeStatuses: { label: string; value: TradeStatus }[] = [
  { label: 'Draft', value: 'draft' },
  { label: 'Waiting', value: 'waiting' },
  { label: 'Active', value: 'active' },
  { label: 'TP1 Hit', value: 'tp1_hit' },
  { label: 'TP2 Hit', value: 'tp2_hit' },
  { label: 'TP3 Hit', value: 'tp3_hit' },
  { label: 'TP4 Hit', value: 'tp4_hit' },
  { label: 'SL Hit', value: 'sl_hit' },
  { label: 'Breakeven', value: 'breakeven' },
  { label: 'Closed', value: 'closed' },
]

export const initialTradePlannerForm: TradePlannerForm = {
  symbol: 'XAUUSD',
  direction: 'buy',
  entryPrice: '',
  stopLoss: '',
  tp1: '',
  tp2: '',
  tp3: '',
  tp4: '',
  accountBalance: '',
  riskPercentage: '1',
  setupType: 'Manual Setup',
  tradeReason: '',
  confidenceScore: '70',
  screenshotUrl: '',
  status: 'waiting',
}

function toNumber(value: string) {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function getContractSize(symbol: string) {
  const normalized = symbol.toUpperCase()
  if (normalized.includes('XAU')) return 100
  if (normalized.includes('XAG')) return 5000
  if (normalized.includes('BTC') || normalized.includes('ETH')) return 1
  return 100000
}

function calculateTarget(
  label: TargetCalculation['label'],
  targetValue: string,
  direction: TradeDirection,
  entryPrice: number,
  riskDistance: number,
): TargetCalculation {
  const price = toNumber(targetValue)
  if (price === null) {
    return { label, price: null, rewardDistance: null, rr: null, isValid: true }
  }

  const rewardDistance = direction === 'buy' ? price - entryPrice : entryPrice - price
  const rr = riskDistance > 0 ? rewardDistance / riskDistance : null

  return {
    label,
    price,
    rewardDistance,
    rr,
    isValid: rewardDistance > 0,
  }
}

export function calculateTradePlan(form: TradePlannerForm): TradeCalculations {
  const warnings: string[] = []
  const entryPrice = toNumber(form.entryPrice) ?? 0
  const stopLoss = toNumber(form.stopLoss) ?? 0
  const accountBalance = toNumber(form.accountBalance) ?? 0
  const riskPercentage = toNumber(form.riskPercentage) ?? 0

  if (entryPrice <= 0) warnings.push('Entry price must be greater than zero.')
  if (stopLoss <= 0) warnings.push('Stop Loss must be greater than zero.')
  if (accountBalance <= 0) warnings.push('Account balance must be greater than zero.')
  if (riskPercentage <= 0) warnings.push('Risk percentage must be greater than zero.')

  const riskDistance = Math.abs(entryPrice - stopLoss)
  if (riskDistance <= 0) warnings.push('Risk distance must be greater than zero.')

  if (form.direction === 'buy' && stopLoss >= entryPrice) {
    warnings.push('For BUY trades, Stop Loss must be below entry.')
  }

  if (form.direction === 'sell' && stopLoss <= entryPrice) {
    warnings.push('For SELL trades, Stop Loss must be above entry.')
  }

  const targets = [
    calculateTarget('TP1', form.tp1, form.direction, entryPrice, riskDistance),
    calculateTarget('TP2', form.tp2, form.direction, entryPrice, riskDistance),
    calculateTarget('TP3', form.tp3, form.direction, entryPrice, riskDistance),
    calculateTarget('TP4', form.tp4, form.direction, entryPrice, riskDistance),
  ]

  targets.forEach((target) => {
    if (!target.isValid) {
      warnings.push(`For ${form.direction.toUpperCase()} trades, ${target.label} must be ${form.direction === 'buy' ? 'above' : 'below'} entry.`)
    }
  })

  const riskAmount = accountBalance * (riskPercentage / 100)
  const contractSize = getContractSize(form.symbol)
  const suggestedLotSize = riskDistance > 0 && contractSize > 0 ? riskAmount / (riskDistance * contractSize) : 0

  return {
    entryPrice,
    stopLoss,
    accountBalance,
    riskPercentage,
    riskDistance,
    riskAmount,
    suggestedLotSize,
    contractSize,
    targets,
    warnings,
    isValid: warnings.length === 0,
  }
}

export function buildTradeInsert(
  userId: string,
  form: TradePlannerForm,
  calculations: TradeCalculations,
  statusOverride?: TradeStatus,
): Database['public']['Tables']['trades']['Insert'] {
  const target = (label: TargetCalculation['label']) => calculations.targets.find((item) => item.label === label)?.price ?? null

  return {
    user_id: userId,
    symbol: form.symbol.trim().toUpperCase(),
    direction: form.direction,
    entry_price: calculations.entryPrice,
    stop_loss: calculations.stopLoss,
    tp1: target('TP1'),
    tp2: target('TP2'),
    tp3: target('TP3'),
    tp4: target('TP4'),
    account_balance: calculations.accountBalance,
    risk_percentage: calculations.riskPercentage,
    risk_amount: calculations.riskAmount,
    lot_size: Number(calculations.suggestedLotSize.toFixed(4)),
    setup_type: form.setupType,
    trade_reason: form.tradeReason.trim() || null,
    confidence_score: Math.min(100, Math.max(0, Number(form.confidenceScore) || 0)),
    status: statusOverride ?? form.status,
    result: 'pending',
    profit_loss: 0,
    screenshot_url: form.screenshotUrl.trim() || null,
  }
}
