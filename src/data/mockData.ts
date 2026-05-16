export const dashboardStats = [
  { label: 'Account Balance', value: '$25,000', helper: 'Demo workspace balance', tone: 'gold' as const },
  { label: 'Daily P/L', value: '+$420', helper: 'Mock daily result', tone: 'profit' as const },
  { label: 'Weekly P/L', value: '+$1,280', helper: 'Mock weekly result', tone: 'profit' as const },
  { label: 'Monthly P/L', value: '-$360', helper: 'Mock monthly result', tone: 'loss' as const },
  { label: 'Win Rate', value: '62%', helper: 'Based on sample trades', tone: 'neutral' as const },
  { label: 'Open Trades', value: '3', helper: 'Waiting or active plans', tone: 'neutral' as const },
]

export const recentTrades = [
  ['XAUUSD', 'Buy', 'Waiting', '+2.4R', '+$620'],
  ['EURUSD', 'Sell', 'Closed', '-1.0R', '-$250'],
  ['GBPJPY', 'Buy', 'TP1 Hit', '+1.2R', '+$300'],
]

export const moduleCards = [
  {
    title: 'Trade Planner',
    description: 'Plan entries, stop loss, targets, risk, and confidence before execution.',
    status: 'Phase 6',
  },
  {
    title: 'Signal Generator',
    description: 'Format clean signal templates and prepare Telegram-ready updates.',
    status: 'Phase 7',
  },
  {
    title: 'Risk Desk',
    description: 'Track preset daily limits, risk per trade, and trading discipline states.',
    status: 'Phase 11',
  },
]

export const watchlist = [
  { symbol: 'XAUUSD', price: '2,385.40', bias: 'Bullish', spread: '18 pts' },
  { symbol: 'EURUSD', price: '1.0875', bias: 'Neutral', spread: '0.8 pip' },
  { symbol: 'GBPUSD', price: '1.2732', bias: 'Bearish', spread: '1.1 pip' },
]
