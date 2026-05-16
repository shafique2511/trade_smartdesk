export type MarketBias = 'Bullish' | 'Bearish' | 'Neutral'
export type MarketSession = 'Asia' | 'London' | 'New York' | 'Overlap'

export type WatchlistItem = {
  id: string
  symbol: string
  price: string
  dailyHigh: string
  dailyLow: string
  spread: string
  session: MarketSession
  bias: MarketBias
  notes: string
  updatedAt: string
}

export type MarketWatchState = {
  watchlist: WatchlistItem[]
  selectedSymbolId: string
  marketNotes: string
}
