import type { Package } from '../types/database'
import type { PackageForm } from '../types/admin'

export const initialPackageForm: PackageForm = {
  id: null,
  name: '',
  description: '',
  price: '0',
  billingCycle: 'monthly',
  maxTrades: '50',
  maxJournalEntries: '100',
  telegramEnabled: false,
  analyticsEnabled: true,
  adminFeaturesEnabled: false,
  isActive: true,
}

export function packageToForm(pkg: Package): PackageForm {
  return {
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    price: String(pkg.price),
    billingCycle: pkg.billing_cycle,
    maxTrades: String(pkg.max_trades),
    maxJournalEntries: String(pkg.max_journal_entries),
    telegramEnabled: pkg.telegram_enabled,
    analyticsEnabled: pkg.analytics_enabled,
    adminFeaturesEnabled: pkg.admin_features_enabled,
    isActive: pkg.is_active,
  }
}

export function packageFormToPayload(form: PackageForm) {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    price: Number(form.price) || 0,
    billing_cycle: form.billingCycle,
    max_trades: Number(form.maxTrades) || 0,
    max_journal_entries: Number(form.maxJournalEntries) || 0,
    telegram_enabled: form.telegramEnabled,
    analytics_enabled: form.analyticsEnabled,
    admin_features_enabled: form.adminFeaturesEnabled,
    is_active: form.isActive,
  }
}
