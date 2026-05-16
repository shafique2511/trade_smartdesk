import { Menu, TrendingUp, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { navigationItems } from '../../config/navigation'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'

type SidebarProps = {
  isOpen: boolean
  onClose: () => void
  onToggle: () => void
}

export function Sidebar({ isOpen, onClose, onToggle }: SidebarProps) {
  const { profile } = useAuth()
  const visibleNavigation = navigationItems.filter((item) => !item.roles || item.roles.includes(profile?.role ?? 'trader'))

  return (
    <>
      <Button
        aria-label="Open navigation"
        className="fixed left-4 top-4 z-40 h-10 w-10 px-0 lg:hidden"
        onClick={onToggle}
        variant="secondary"
      >
        <Menu size={18} />
      </Button>
      <div
        className={`fixed inset-0 z-30 bg-black/60 transition lg:hidden ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-800/90 bg-ink-950/95 px-4 py-5 shadow-2xl transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:bg-ink-950/80 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-gold-400/40 bg-gold-500/10 text-gold-400">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-base font-bold text-white">Trading SmartDesk</p>
              <p className="text-xs text-slate-500">Command Center</p>
            </div>
          </div>
          <Button aria-label="Close navigation" className="h-9 w-9 px-0 lg:hidden" onClick={onClose} variant="ghost">
            <X size={18} />
          </Button>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {visibleNavigation.map(({ icon: Icon, label, path }) => (
            <NavLink
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'border border-gold-400/30 bg-gold-500/10 text-gold-400'
                    : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-100'
                }`
              }
              key={path}
              onClick={onClose}
              to={path}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">Disclaimer</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            This platform is for trade planning, journaling, and risk management only. It does not provide financial advice.
          </p>
        </div>
      </aside>
    </>
  )
}
