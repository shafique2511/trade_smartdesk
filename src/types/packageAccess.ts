export type PackageFeature =
  | 'tradePlanner'
  | 'journal'
  | 'riskDesk'
  | 'basicAnalytics'
  | 'advancedAnalytics'
  | 'manualSignalCopy'
  | 'telegramSend'
  | 'signalLogs'
  | 'exportCsv'
  | 'branding'
  | 'teamUsers'
  | 'adminFeatures'

export type PackageAccess = {
  packageName: string
  isStarter: boolean
  isPro: boolean
  isBusiness: boolean
  maxTrades: number
  maxJournalEntries: number
  features: Record<PackageFeature, boolean>
}
