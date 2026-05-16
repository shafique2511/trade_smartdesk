import type { BillingCycle } from './database'

export type AdminTab = 'overview' | 'users' | 'packages' | 'subscriptions' | 'logs' | 'settings'

export type PackageForm = {
  id: string | null
  name: string
  description: string
  price: string
  billingCycle: BillingCycle
  maxTrades: string
  maxJournalEntries: string
  telegramEnabled: boolean
  analyticsEnabled: boolean
  adminFeaturesEnabled: boolean
  isActive: boolean
}
