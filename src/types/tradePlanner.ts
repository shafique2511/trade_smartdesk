import type { TradeDirection, TradeStatus } from './database'

export type TradePlannerForm = {
  symbol: string
  direction: TradeDirection
  entryPrice: string
  stopLoss: string
  tp1: string
  tp2: string
  tp3: string
  tp4: string
  accountBalance: string
  riskPercentage: string
  setupType: string
  tradeReason: string
  confidenceScore: string
  screenshotUrl: string
  status: TradeStatus
}

export type TargetCalculation = {
  label: 'TP1' | 'TP2' | 'TP3' | 'TP4'
  price: number | null
  rewardDistance: number | null
  rr: number | null
  isValid: boolean
}

export type TradeCalculations = {
  entryPrice: number
  stopLoss: number
  accountBalance: number
  riskPercentage: number
  riskDistance: number
  riskAmount: number
  suggestedLotSize: number
  contractSize: number
  targets: TargetCalculation[]
  warnings: string[]
  isValid: boolean
}
