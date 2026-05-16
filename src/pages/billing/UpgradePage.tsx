import { CheckCircle2, Crown, Sparkles } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { GlassCard } from '../../components/ui/GlassCard'
import { PageTitle } from '../../components/ui/PageTitle'
import { usePackageAccess } from '../../hooks/usePackageAccess'

const packages = [
  {
    name: 'Starter',
    price: '$29',
    description: 'Core planning, journaling, risk desk, basic analytics, and manual signal copy.',
    features: ['Trade Planner', 'Smart Journal', 'Risk Desk', 'Basic Analytics', 'Manual signal copy', 'Limited monthly trades'],
  },
  {
    name: 'Pro',
    price: '$79',
    description: 'Telegram delivery, advanced analytics, unlimited signal workflow, signal logs, and exports.',
    features: ['Everything in Starter', 'Telegram send', 'Advanced analytics', 'Signal logs', 'CSV exports', 'Higher monthly limits'],
  },
  {
    name: 'Business',
    price: '$199',
    description: 'Team-ready controls for signal channel owners and trading operations.',
    features: ['Everything in Pro', 'Team users', 'Admin features', 'Branding settings', 'Multi-user management', 'Client report placeholder'],
  },
]

export function UpgradePage() {
  const access = usePackageAccess()

  return (
    <>
      <PageTitle
        description="Package-based access for Trading SmartDesk. Admins can assign packages manually from the Admin Dashboard."
        title="Upgrade Packages"
      />

      <section className="grid gap-5 xl:grid-cols-3">
        {packages.map((pkg) => {
          const isCurrent = access.packageName.toLowerCase() === pkg.name.toLowerCase()

          return (
            <GlassCard key={pkg.name} className={pkg.name === 'Pro' ? 'border-gold-400/40 bg-gold-500/10' : undefined}>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-white">{pkg.name}</h2>
                    {pkg.name === 'Pro' ? <Sparkles className="text-gold-400" size={18} /> : null}
                    {pkg.name === 'Business' ? <Crown className="text-gold-400" size={18} /> : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{pkg.description}</p>
                </div>
                {isCurrent ? <Badge tone="profit">Current</Badge> : null}
              </div>
              <p className="text-3xl font-semibold text-white">{pkg.price}<span className="text-sm font-normal text-slate-500"> / mo</span></p>
              <div className="mt-6 grid gap-3">
                {pkg.features.map((feature) => (
                  <div className="flex items-center gap-3 text-sm text-slate-300" key={feature}>
                    <CheckCircle2 className="text-profit-500" size={16} />
                    {feature}
                  </div>
                ))}
              </div>
            </GlassCard>
          )
        })}
      </section>

      <GlassCard>
        <p className="text-sm leading-6 text-slate-400">
          Package upgrades are assigned manually by an admin in this phase. Subscription status still controls access, and locked features show upgrade prompts instead of silently failing.
        </p>
      </GlassCard>
    </>
  )
}
