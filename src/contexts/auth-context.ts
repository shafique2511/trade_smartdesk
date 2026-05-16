import { createContext } from 'react'
import type { AuthError, Session, User } from '@supabase/supabase-js'
import type { Package, Subscription, UserProfile } from '../types/database'

export type AuthContextValue = {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  subscription: Subscription | null
  activePackage: Package | null
  loading: boolean
  authReady: boolean
  authError: string | null
  isAdmin: boolean
  isManager: boolean
  isTrader: boolean
  isActive: boolean
  hasValidSubscription: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | Error | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
