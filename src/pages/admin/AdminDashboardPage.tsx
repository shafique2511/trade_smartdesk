import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { BarChart3, Boxes, CheckCircle2, FileText, PackagePlus, Settings, ShieldCheck, Trash2, Users } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { GlassCard } from '../../components/ui/GlassCard'
import { Input } from '../../components/ui/Input'
import { LoadingState } from '../../components/ui/LoadingState'
import { Modal } from '../../components/ui/Modal'
import { PageTitle } from '../../components/ui/PageTitle'
import { Select } from '../../components/ui/Select'
import { StatCard } from '../../components/ui/StatCard'
import { Table } from '../../components/ui/Table'
import { Textarea } from '../../components/ui/Textarea'
import { initialPackageForm, packageFormToPayload, packageToForm } from '../../lib/admin'
import { formatCurrency } from '../../lib/dashboard'
import { supabase } from '../../lib/supabase'
import type { AdminTab, PackageForm } from '../../types/admin'
import type { AdminSetting, Database, Package, SignalLog, Subscription, SubscriptionStatus, Trade, UserProfile, UserRole } from '../../types/database'

type AdminMessage = {
  type: 'success' | 'error'
  text: string
}

type ConfirmAction = {
  title: string
  description: string
  onConfirm: () => Promise<void>
  variant?: 'danger' | 'primary'
}

function formatDate(value: string | null) {
  if (!value) return 'No end date'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function statusTone(status: SubscriptionStatus | boolean) {
  if (status === true || status === 'active' || status === 'trial') return 'profit'
  if (status === 'expired' || status === 'cancelled' || status === false) return 'loss'
  return 'neutral'
}

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [users, setUsers] = useState<UserProfile[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [signalLogs, setSignalLogs] = useState<SignalLog[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [adminSettings, setAdminSettings] = useState<AdminSetting[]>([])
  const [packageForm, setPackageForm] = useState<PackageForm>(initialPackageForm)
  const [userSearch, setUserSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [packageFilter, setPackageFilter] = useState('all')
  const [message, setMessage] = useState<AdminMessage | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  async function loadAdminData() {
    setIsLoading(true)
    setMessage(null)

    const [usersResult, packagesResult, subscriptionsResult, logsResult, tradesResult, settingsResult] = await Promise.all([
      supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('packages').select('*').order('price', { ascending: true }),
      supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
      supabase.from('signal_logs').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('trades').select('*').order('created_at', { ascending: false }),
      supabase.from('admin_settings').select('*').order('created_at', { ascending: false }),
    ])

    const error = usersResult.error ?? packagesResult.error ?? subscriptionsResult.error ?? logsResult.error ?? tradesResult.error ?? settingsResult.error
    if (error) setMessage({ type: 'error', text: error.message })

    setUsers(usersResult.data ?? [])
    setPackages(packagesResult.data ?? [])
    setSubscriptions(subscriptionsResult.data ?? [])
    setSignalLogs(logsResult.data ?? [])
    setTrades(tradesResult.data ?? [])
    setAdminSettings(settingsResult.data ?? [])
    setIsLoading(false)
  }

  useEffect(() => {
    let cancelled = false

    queueMicrotask(() => {
      if (!cancelled) void loadAdminData()
    })

    return () => {
      cancelled = true
    }
  }, [])

  const packageNameById = useMemo(() => new Map(packages.map((pkg) => [pkg.id, pkg.name])), [packages])
  const userEmailById = useMemo(() => new Map(users.map((user) => [user.id, user.email])), [users])

  const filteredUsers = useMemo(() => users.filter((user) => {
    const search = userSearch.trim().toLowerCase()
    const matchesSearch = !search || [user.email, user.full_name, user.role].filter(Boolean).some((value) => String(value).toLowerCase().includes(search))
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesPackage = packageFilter === 'all' || user.package_id === packageFilter
    return matchesSearch && matchesRole && matchesPackage
  }), [packageFilter, roleFilter, userSearch, users])

  const stats = useMemo(() => {
    const activeUsers = users.filter((user) => user.is_active).length
    const expiredUsers = subscriptions.filter((subscription) => subscription.status === 'expired').length
    const totalSignalsSent = signalLogs.filter((log) => log.sent_to_telegram).length
    const packageDistribution = packages
      .map((pkg) => `${pkg.name}: ${users.filter((user) => user.package_id === pkg.id).length}`)
      .join(' | ') || 'No packages'

    return {
      activeUsers,
      expiredUsers,
      totalSignalsSent,
      totalTrades: trades.length,
      packageDistribution,
    }
  }, [packages, signalLogs, subscriptions, trades.length, users])

  async function updateUser(userId: string, updates: Database['public']['Tables']['user_profiles']['Update']) {
    const { error } = await supabase.from('user_profiles').update(updates).eq('id', userId)
    if (error) setMessage({ type: 'error', text: error.message })
    else {
      setUsers((current) => current.map((user) => user.id === userId ? { ...user, ...updates } : user))
      setMessage({ type: 'success', text: 'User updated.' })
    }
  }

  async function assignUserPackage(userId: string, packageId: string | null) {
    await updateUser(userId, { package_id: packageId })

    if (!packageId) return

    const existingSubscription = subscriptions.find((subscription) => subscription.user_id === userId && ['trial', 'active'].includes(subscription.status))

    if (existingSubscription) {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ package_id: packageId, status: 'active' })
        .eq('id', existingSubscription.id)
        .select('*')
        .single()

      if (error) {
        setMessage({ type: 'error', text: error.message })
        return
      }

      setSubscriptions((current) => current.map((subscription) => subscription.id === existingSubscription.id ? data : subscription))
      setMessage({ type: 'success', text: 'Package and active subscription updated.' })
      return
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        package_id: packageId,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: null,
      })
      .select('*')
      .single()

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }

    setSubscriptions((current) => [data, ...current])
    setMessage({ type: 'success', text: 'Package assigned and subscription created.' })
  }

  async function savePackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setMessage(null)

    const payload = packageFormToPayload(packageForm)
    const query = packageForm.id
      ? supabase.from('packages').update(payload).eq('id', packageForm.id).select('*').single()
      : supabase.from('packages').insert(payload).select('*').single()

    const { data, error } = await query
    setIsSaving(false)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }

    setPackages((current) => packageForm.id ? current.map((pkg) => pkg.id === packageForm.id ? data : pkg) : [...current, data])
    setPackageForm(initialPackageForm)
    setMessage({ type: 'success', text: packageForm.id ? 'Package updated.' : 'Package created.' })
  }

  async function deletePackage(packageId: string) {
    const { error } = await supabase.from('packages').delete().eq('id', packageId)
    if (error) setMessage({ type: 'error', text: error.message })
    else {
      setPackages((current) => current.filter((pkg) => pkg.id !== packageId))
      setMessage({ type: 'success', text: 'Package deleted.' })
    }
  }

  async function updateSubscription(subscriptionId: string, updates: Database['public']['Tables']['subscriptions']['Update']) {
    const { data, error } = await supabase.from('subscriptions').update(updates).eq('id', subscriptionId).select('*').single()
    if (error) setMessage({ type: 'error', text: error.message })
    else {
      setSubscriptions((current) => current.map((subscription) => subscription.id === subscriptionId ? data : subscription))
      setMessage({ type: 'success', text: 'Subscription updated.' })
    }
  }

  async function createSetting() {
    const { data, error } = await supabase
      .from('admin_settings')
      .upsert({ setting_key: 'platform_notice', setting_value: { message: 'Trading SmartDesk admin setting placeholder' } }, { onConflict: 'setting_key' })
      .select('*')
      .single()

    if (error) setMessage({ type: 'error', text: error.message })
    else {
      setAdminSettings((current) => [data, ...current.filter((setting) => setting.id !== data.id)])
      setMessage({ type: 'success', text: 'System setting saved.' })
    }
  }

  if (isLoading) return <LoadingState label="Loading admin dashboard" />

  const tabs: { label: string; value: AdminTab }[] = [
    { label: 'Overview', value: 'overview' },
    { label: 'Users', value: 'users' },
    { label: 'Packages', value: 'packages' },
    { label: 'Subscriptions', value: 'subscriptions' },
    { label: 'Signal Logs', value: 'logs' },
    { label: 'Settings', value: 'settings' },
  ]

  return (
    <>
      <PageTitle
        actions={<Button icon={<ShieldCheck size={16} />} onClick={() => void loadAdminData()} variant="secondary">Refresh</Button>}
        description="Admin-only SaaS operations for users, packages, subscriptions, logs, and system settings."
        title="Admin Dashboard"
      />

      {message ? (
        <GlassCard className={message.type === 'success' ? 'border-profit-500/30 bg-profit-500/10' : 'border-loss-500/30 bg-loss-500/10'}>
          <p className={message.type === 'success' ? 'text-sm text-green-200' : 'text-sm text-red-200'}>{message.text}</p>
        </GlassCard>
      ) : null}

      <GlassCard>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Button key={tab.value} onClick={() => setActiveTab(tab.value)} variant={activeTab === tab.value ? 'primary' : 'secondary'}>
              {tab.label}
            </Button>
          ))}
        </div>
      </GlassCard>

      {activeTab === 'overview' ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard helper="All registered profiles" icon={<Users size={18} />} label="Total Users" value={String(users.length)} />
          <StatCard helper="is_active users" icon={<CheckCircle2 size={18} />} label="Active Users" tone="profit" value={String(stats.activeUsers)} />
          <StatCard helper="Expired subscription rows" icon={<ShieldCheck size={18} />} label="Expired Users" tone="loss" value={String(stats.expiredUsers)} />
          <StatCard helper="Telegram-delivered logs" icon={<BarChart3 size={18} />} label="Signals Sent" tone="gold" value={String(stats.totalSignalsSent)} />
          <StatCard helper="All trade records" icon={<FileText size={18} />} label="Trades Created" value={String(stats.totalTrades)} />
          <StatCard helper="Users per package" icon={<Boxes size={18} />} label="Package Distribution" value={stats.packageDistribution} />
        </section>
      ) : null}

      {activeTab === 'users' ? (
        <GlassCard>
          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <Input label="Search users" onChange={(event) => setUserSearch(event.target.value)} placeholder="Email, name, role" value={userSearch} />
            <Select label="Role" onChange={(event) => setRoleFilter(event.target.value as typeof roleFilter)} value={roleFilter}>
              <option value="all">All roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="trader">Trader</option>
            </Select>
            <Select label="Package" onChange={(event) => setPackageFilter(event.target.value)} value={packageFilter}>
              <option value="all">All packages</option>
              {packages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name}</option>)}
            </Select>
          </div>
          <Table
            columns={['User', 'Role', 'Package', 'Status', 'Created', 'Actions']}
            rows={filteredUsers.map((user) => [
              <div><p className="font-semibold text-white">{user.full_name ?? 'Unnamed'}</p><p className="text-xs text-slate-500">{user.email}</p></div>,
              <Select aria-label="Role" onChange={(event) => void updateUser(user.id, { role: event.target.value as UserRole })} value={user.role}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="trader">Trader</option>
              </Select>,
              <Select aria-label="Package" onChange={(event) => void assignUserPackage(user.id, event.target.value || null)} value={user.package_id ?? ''}>
                <option value="">No package</option>
                {packages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name}</option>)}
              </Select>,
              <Badge tone={statusTone(user.is_active)}>{user.is_active ? 'Active' : 'Inactive'}</Badge>,
              formatDate(user.created_at),
              <Button
                onClick={() => setConfirmAction({
                  title: user.is_active ? 'Deactivate User' : 'Activate User',
                  description: `${user.email} will be ${user.is_active ? 'deactivated' : 'activated'}.`,
                  onConfirm: () => updateUser(user.id, { is_active: !user.is_active }),
                  variant: user.is_active ? 'danger' : 'primary',
                })}
                variant={user.is_active ? 'danger' : 'secondary'}
              >
                {user.is_active ? 'Deactivate' : 'Activate'}
              </Button>,
            ])}
          />
        </GlassCard>
      ) : null}

      {activeTab === 'packages' ? (
        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <GlassCard>
            <h2 className="mb-5 text-lg font-semibold text-white">{packageForm.id ? 'Edit Package' : 'Create Package'}</h2>
            <form className="grid gap-4" onSubmit={savePackage}>
              <Input label="Name" onChange={(event) => setPackageForm((current) => ({ ...current, name: event.target.value }))} required value={packageForm.name} />
              <Textarea label="Description" onChange={(event) => setPackageForm((current) => ({ ...current, description: event.target.value }))} required value={packageForm.description} />
              <Input label="Price" min="0" onChange={(event) => setPackageForm((current) => ({ ...current, price: event.target.value }))} step="any" type="number" value={packageForm.price} />
              <Select label="Billing cycle" onChange={(event) => setPackageForm((current) => ({ ...current, billingCycle: event.target.value as PackageForm['billingCycle'] }))} value={packageForm.billingCycle}>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="one_time">One time</option>
              </Select>
              <Input label="Max trades" min="0" onChange={(event) => setPackageForm((current) => ({ ...current, maxTrades: event.target.value }))} type="number" value={packageForm.maxTrades} />
              <Input label="Max journal entries" min="0" onChange={(event) => setPackageForm((current) => ({ ...current, maxJournalEntries: event.target.value }))} type="number" value={packageForm.maxJournalEntries} />
              <Select label="Telegram" onChange={(event) => setPackageForm((current) => ({ ...current, telegramEnabled: event.target.value === 'true' }))} value={String(packageForm.telegramEnabled)}>
                <option value="true">Enabled</option><option value="false">Disabled</option>
              </Select>
              <Select label="Analytics" onChange={(event) => setPackageForm((current) => ({ ...current, analyticsEnabled: event.target.value === 'true' }))} value={String(packageForm.analyticsEnabled)}>
                <option value="true">Enabled</option><option value="false">Disabled</option>
              </Select>
              <Select label="Admin features" onChange={(event) => setPackageForm((current) => ({ ...current, adminFeaturesEnabled: event.target.value === 'true' }))} value={String(packageForm.adminFeaturesEnabled)}>
                <option value="true">Enabled</option><option value="false">Disabled</option>
              </Select>
              <Select label="Package status" onChange={(event) => setPackageForm((current) => ({ ...current, isActive: event.target.value === 'true' }))} value={String(packageForm.isActive)}>
                <option value="true">Active</option><option value="false">Inactive</option>
              </Select>
              <div className="flex gap-3">
                <Button disabled={isSaving} icon={<PackagePlus size={16} />} type="submit">{isSaving ? 'Saving...' : 'Save Package'}</Button>
                <Button onClick={() => setPackageForm(initialPackageForm)} variant="secondary">Reset</Button>
              </div>
            </form>
          </GlassCard>
          <GlassCard>
            <Table
              columns={['Package', 'Price', 'Limits', 'Features', 'Status', 'Actions']}
              rows={packages.map((pkg) => [
                <div><p className="font-semibold text-white">{pkg.name}</p><p className="text-xs text-slate-500">{pkg.description}</p></div>,
                `${formatCurrency(pkg.price)} / ${pkg.billing_cycle}`,
                `${pkg.max_trades} trades, ${pkg.max_journal_entries} journal`,
                `${pkg.telegram_enabled ? 'Telegram ' : ''}${pkg.analytics_enabled ? 'Analytics ' : ''}${pkg.admin_features_enabled ? 'Admin' : ''}` || 'Basic',
                <Badge tone={statusTone(pkg.is_active)}>{pkg.is_active ? 'Active' : 'Inactive'}</Badge>,
                <div className="flex gap-2">
                  <Button onClick={() => setPackageForm(packageToForm(pkg))} variant="secondary">Edit</Button>
                  <Button onClick={() => setConfirmAction({ title: 'Delete Package', description: `${pkg.name} will be deleted.`, onConfirm: () => deletePackage(pkg.id), variant: 'danger' })} variant="danger"><Trash2 size={14} /></Button>
                </div>,
              ])}
            />
          </GlassCard>
        </section>
      ) : null}

      {activeTab === 'subscriptions' ? (
        <GlassCard>
          <Table
            columns={['User', 'Package', 'Status', 'Start', 'End', 'Actions']}
            rows={subscriptions.map((subscription) => [
              userEmailById.get(subscription.user_id) ?? subscription.user_id,
              packageNameById.get(subscription.package_id ?? '') ?? 'No package',
              <Badge tone={statusTone(subscription.status)}>{subscription.status}</Badge>,
              formatDate(subscription.start_date),
              formatDate(subscription.end_date),
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void updateSubscription(subscription.id, { status: 'trial' })} variant="secondary">Trial</Button>
                <Button onClick={() => void updateSubscription(subscription.id, { status: 'active' })} variant="secondary">Active</Button>
                <Button onClick={() => {
                  const end = new Date(subscription.end_date ?? Date.now())
                  end.setDate(end.getDate() + 30)
                  void updateSubscription(subscription.id, { end_date: end.toISOString(), status: 'active' })
                }} variant="secondary">Extend 30d</Button>
                <Button onClick={() => setConfirmAction({ title: 'Cancel Subscription', description: 'This subscription will be cancelled.', onConfirm: () => updateSubscription(subscription.id, { status: 'cancelled' }), variant: 'danger' })} variant="danger">Cancel</Button>
              </div>,
            ])}
          />
        </GlassCard>
      ) : null}

      {activeTab === 'logs' ? (
        <GlassCard>
          {signalLogs.length > 0 ? (
            <Table
              columns={['User', 'Type', 'Telegram', 'Created', 'Message']}
              rows={signalLogs.map((log) => [
                userEmailById.get(log.user_id) ?? log.user_id,
                log.signal_type,
                <Badge tone={log.sent_to_telegram ? 'profit' : 'neutral'}>{log.sent_to_telegram ? 'Sent' : 'Manual'}</Badge>,
                formatDate(log.created_at),
                <span className="block max-w-md truncate">{log.message}</span>,
              ])}
            />
          ) : <EmptyState description="Signal logs will appear after users copy or send signals." title="No signal logs" />}
        </GlassCard>
      ) : null}

      {activeTab === 'settings' ? (
        <GlassCard>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">System Settings</h2>
              <p className="text-sm text-slate-500">Admin settings are stored as JSON values.</p>
            </div>
            <Button icon={<Settings size={16} />} onClick={() => void createSetting()}>Save Placeholder Setting</Button>
          </div>
          {adminSettings.length > 0 ? (
            <Table
              columns={['Key', 'Value', 'Updated']}
              rows={adminSettings.map((setting) => [
                setting.setting_key,
                <code className="text-xs text-slate-300">{JSON.stringify(setting.setting_value)}</code>,
                formatDate(setting.updated_at),
              ])}
            />
          ) : <EmptyState description="Create a setting to initialize system configuration." title="No system settings yet" />}
        </GlassCard>
      ) : null}

      <Modal isOpen={Boolean(confirmAction)} onClose={() => setConfirmAction(null)} title={confirmAction?.title ?? 'Confirm Action'}>
        <div className="grid gap-4">
          <p className="text-sm leading-6 text-slate-300">{confirmAction?.description}</p>
          <div className="flex justify-end gap-3">
            <Button onClick={() => setConfirmAction(null)} variant="secondary">Cancel</Button>
            <Button
              onClick={() => {
                if (!confirmAction) return
                void confirmAction.onConfirm().finally(() => setConfirmAction(null))
              }}
              variant={confirmAction?.variant === 'danger' ? 'danger' : 'primary'}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
