import { Bell, Search, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export function Header() {
  const { profile, signOut } = useAuth()
  const displayName = profile?.full_name ?? profile?.email ?? 'Trading User'
  const role = profile?.role ?? 'trader'

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-ink-950/75 px-5 py-4 backdrop-blur-xl lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="ml-12 lg:ml-0">
          <p className="text-sm text-slate-500">Workspace</p>
          <p className="text-lg font-semibold text-white">Premium trading operations dashboard</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden min-h-10 items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-3 text-sm text-slate-500 md:flex">
            <Search size={16} />
            Search modules
          </div>
          <Badge tone="gold">Mock data</Badge>
          <Button className="h-10 w-10 px-0" variant="secondary">
            <Bell size={17} />
          </Button>
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
            <ShieldCheck className="text-gold-400" size={18} />
            <div>
              <p className="text-xs font-semibold text-white">{displayName}</p>
              <p className="text-[11px] capitalize text-slate-500">{role} role</p>
            </div>
          </div>
          <Button onClick={() => void signOut()} variant="ghost">
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
