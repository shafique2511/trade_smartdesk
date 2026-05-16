import type { MarketWatchState, WatchlistItem } from '../types/market'

const storagePrefix = 'trading-smartdesk-market-watch'

export const defaultWatchlist: WatchlistItem[] = [
  {
    id: 'xauusd',
    symbol: 'XAUUSD',
    price: '',
    dailyHigh: '',
    dailyLow: '',
    spread: '',
    session: 'London',
    bias: 'Neutral',
    notes: 'Gold focus: mark key liquidity levels, session range, and invalidation before planning trades.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'eurusd',
    symbol: 'EURUSD',
    price: '',
    dailyHigh: '',
    dailyLow: '',
    spread: '',
    session: 'London',
    bias: 'Neutral',
    notes: '',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'gbpusd',
    symbol: 'GBPUSD',
    price: '',
    dailyHigh: '',
    dailyLow: '',
    spread: '',
    session: 'New York',
    bias: 'Neutral',
    notes: '',
    updatedAt: new Date().toISOString(),
  },
]

export function createDefaultMarketWatchState(): MarketWatchState {
  return {
    watchlist: defaultWatchlist,
    selectedSymbolId: 'xauusd',
    marketNotes: '',
  }
}

export function getMarketWatchStorageKey(userId: string) {
  return `${storagePrefix}:${userId}`
}

export function loadMarketWatchState(userId: string): MarketWatchState {
  const fallback = createDefaultMarketWatchState()

  try {
    const saved = window.localStorage.getItem(getMarketWatchStorageKey(userId))
    if (!saved) return fallback

    const parsed = JSON.parse(saved) as MarketWatchState
    if (!Array.isArray(parsed.watchlist) || parsed.watchlist.length === 0) return fallback

    return {
      watchlist: parsed.watchlist,
      selectedSymbolId: parsed.selectedSymbolId || parsed.watchlist[0].id,
      marketNotes: parsed.marketNotes ?? '',
    }
  } catch {
    return fallback
  }
}

export function saveMarketWatchState(userId: string, state: MarketWatchState) {
  window.localStorage.setItem(getMarketWatchStorageKey(userId), JSON.stringify(state))
}

export function createWatchlistItem(symbol: string): WatchlistItem {
  const normalizedSymbol = symbol.trim().toUpperCase()

  return {
    id: `${normalizedSymbol.toLowerCase()}-${Date.now()}`,
    symbol: normalizedSymbol,
    price: '',
    dailyHigh: '',
    dailyLow: '',
    spread: '',
    session: 'London',
    bias: 'Neutral',
    notes: '',
    updatedAt: new Date().toISOString(),
  }
}
