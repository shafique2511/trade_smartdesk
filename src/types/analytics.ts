export type AnalyticsPeriod = 'today' | 'week' | 'month' | '3months' | 'custom'

export type AnalyticsFilters = {
  period: AnalyticsPeriod
  startDate: string
  endDate: string
  symbol: string
  setupType: string
}

export type ChartPoint = {
  name: string
  value: number
  profitLoss?: number
  trades?: number
}
