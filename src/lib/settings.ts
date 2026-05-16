import type { LocalSettings } from '../types/settings'
export {
  downloadCsv,
  exportAnalyticsCsv,
  exportJournalCsv,
  exportMonthlyPerformanceReport,
  exportTradeReportPlaceholder,
  exportTradesCsv,
  todayStamp,
} from './exportSystem'

const settingsPrefix = 'trading-smartdesk-settings'

export const defaultLocalSettings: LocalSettings = {
  branding: {
    appDisplayName: 'Trading SmartDesk',
    signalFooter: 'Trading SmartDesk\nTrade with plan. Manage your risk.',
    logoUrl: '',
    brandColor: '#d4af37',
  },
  theme: {
    mode: 'dark',
    accentColor: 'gold',
  },
}

function storageKey(userId: string) {
  return `${settingsPrefix}:${userId}`
}

export function loadLocalSettings(userId: string): LocalSettings {
  try {
    const saved = window.localStorage.getItem(storageKey(userId))
    if (!saved) return defaultLocalSettings
    const parsed = JSON.parse(saved) as Partial<LocalSettings>
    return {
      branding: { ...defaultLocalSettings.branding, ...parsed.branding },
      theme: { ...defaultLocalSettings.theme, ...parsed.theme },
    }
  } catch {
    return defaultLocalSettings
  }
}

export function saveLocalSettings(userId: string, settings: LocalSettings) {
  window.localStorage.setItem(storageKey(userId), JSON.stringify(settings))
}
