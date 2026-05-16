import { Lock, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { GlassCard } from '../ui/GlassCard'
import type { PackageFeature } from '../../types/packageAccess'
import { getUpgradeTarget } from '../../lib/packageAccess'

type UpgradePromptProps = {
  feature: PackageFeature
  title?: string
  description?: string
}

export function UpgradePrompt({ feature, title, description }: UpgradePromptProps) {
  const target = getUpgradeTarget(feature)

  return (
    <GlassCard className="border-gold-400/30 bg-gold-500/10">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-gold-400/30 bg-gold-500/10 p-2 text-gold-400">
            <Lock size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">{title ?? `${target} feature`}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              {description ?? `Upgrade to ${target} to unlock this feature for your workspace.`}
            </p>
          </div>
        </div>
        <Link to="/upgrade">
          <Button icon={<Sparkles size={16} />} variant="secondary">View packages</Button>
        </Link>
      </div>
    </GlassCard>
  )
}
