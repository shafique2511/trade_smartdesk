import type { Package } from '../types/database'
import type { PackageAccess, PackageFeature } from '../types/packageAccess'

const starterLimits = {
  maxTrades: 50,
  maxJournalEntries: 100,
}

function normalizePackageName(pkg: Package | null) {
  return (pkg?.name ?? 'Starter').trim().toLowerCase()
}

export function getPackageAccess(pkg: Package | null): PackageAccess {
  const normalizedName = normalizePackageName(pkg)
  const isBusiness = normalizedName === 'business'
  const isPro = normalizedName === 'pro' || isBusiness
  const isStarter = !isPro && !isBusiness

  const maxTrades = pkg?.max_trades ?? starterLimits.maxTrades
  const maxJournalEntries = pkg?.max_journal_entries ?? starterLimits.maxJournalEntries
  const telegramEnabled = Boolean(pkg?.telegram_enabled)
  const analyticsEnabled = pkg?.analytics_enabled ?? true
  const adminFeaturesEnabled = Boolean(pkg?.admin_features_enabled)

  return {
    packageName: pkg?.name ?? 'Starter',
    isStarter,
    isPro,
    isBusiness,
    maxTrades,
    maxJournalEntries,
    features: {
      tradePlanner: true,
      journal: true,
      riskDesk: true,
      basicAnalytics: analyticsEnabled,
      advancedAnalytics: isPro && analyticsEnabled,
      manualSignalCopy: true,
      telegramSend: isPro && telegramEnabled,
      signalLogs: isPro,
      exportCsv: isPro,
      branding: isBusiness && adminFeaturesEnabled,
      teamUsers: isBusiness && adminFeaturesEnabled,
      adminFeatures: isBusiness && adminFeaturesEnabled,
    },
  }
}

export function hasPackageFeature(access: PackageAccess, feature: PackageFeature) {
  return access.features[feature]
}

export function getUpgradeTarget(feature: PackageFeature) {
  if (feature === 'branding' || feature === 'teamUsers' || feature === 'adminFeatures') return 'Business'
  return 'Pro'
}

export function countRecordsThisMonth<T extends { created_at: string }>(records: T[]) {
  const now = new Date()
  return records.filter((record) => {
    const createdAt = new Date(record.created_at)
    return createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth()
  }).length
}

export function isLimitReached(limit: number, currentCount: number) {
  return limit > 0 && currentCount >= limit
}
