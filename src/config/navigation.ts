import {
  BarChart3,
  Bot,
  Gauge,
  LayoutDashboard,
  LineChart,
  NotebookPen,
  Send,
  Settings,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react'
import type { NavigationItem } from '../types/navigation'

export const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Market Watch', path: '/market-watch', icon: LineChart },
  { label: 'Trade Planner', path: '/trade-planner', icon: Target },
  { label: 'Signals', path: '/signals', icon: Send },
  { label: 'Journal', path: '/journal', icon: NotebookPen },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Risk Desk', path: '/risk-desk', icon: Gauge },
  { label: 'Telegram', path: '/telegram', icon: Bot },
  { label: 'Team Overview', path: '/team', icon: Users, roles: ['manager', 'admin'] },
  { label: 'Admin', path: '/admin', icon: ShieldCheck, roles: ['admin'] },
  { label: 'Settings', path: '/settings', icon: Settings },
]
