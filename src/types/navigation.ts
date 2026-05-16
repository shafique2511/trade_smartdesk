import type { LucideIcon } from 'lucide-react'
import type { UserRole } from './database'

export type NavigationItem = {
  label: string
  path: string
  icon: LucideIcon
  roles?: UserRole[]
}
