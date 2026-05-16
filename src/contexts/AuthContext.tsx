import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Database, Subscription, UserProfile } from '../types/database'
import { AuthContext, type AuthContextValue } from './auth-context'

function isSubscriptionValid(subscription: Subscription | null) {
  if (!subscription) return true
  if (!['trial', 'active'].includes(subscription.status)) return false
  if (!subscription.end_date) return true
  return new Date(subscription.end_date).getTime() >= Date.now()
}

async function getLatestSubscription(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const loadUserData = useCallback(async (activeSession: Session | null) => {
    setAuthError(null)

    if (!activeSession?.user) {
      setProfile(null)
      setSubscription(null)
      return
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', activeSession.user.id)
      .maybeSingle()

    if (profileError) throw profileError

    setProfile(userProfile)
    setSubscription(await getLatestSubscription(activeSession.user.id))
  }, [])

  const refreshProfile = useCallback(async () => {
    setLoading(true)
    try {
      await loadUserData(session)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to refresh profile.')
    } finally {
      setLoading(false)
    }
  }, [loadUserData, session])

  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      if (!isSupabaseConfigured) {
        if (mounted) {
          setLoading(false)
          setAuthError('Supabase environment variables are not configured.')
        }
        return
      }

      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!mounted) return
        setSession(data.session)
        await loadUserData(data.session)
      } catch (error) {
        if (mounted) setAuthError(error instanceof Error ? error.message : 'Unable to initialize auth.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void initializeAuth()

    const { data } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession)
      setLoading(true)
      setTimeout(() => {
        void loadUserData(nextSession)
          .catch((error: unknown) => {
            setAuthError(error instanceof Error ? error.message : 'Unable to load user profile.')
          })
          .finally(() => setLoading(false))
      }, 0)
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [loadUserData])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: new Error('Supabase environment variables are not configured.') }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) return { error: new Error('Supabase environment variables are not configured.') }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) return { error }

    if (data.user) {
      const profilePayload: Database['public']['Tables']['user_profiles']['Insert'] = {
        id: data.user.id,
        email,
        full_name: fullName,
        role: 'trader',
        is_active: true,
      }
      const { error: profileError } = await supabase.from('user_profiles').upsert(profilePayload)

      if (profileError) return { error: profileError }
    }

    return { error: null }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) return { error: new Error('Supabase environment variables are not configured.') }
    const redirectTo = `${window.location.origin}/login`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    return { error }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    setSubscription(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const role = profile?.role

    return {
      user: session?.user ?? null,
      session,
      profile,
      subscription,
      loading,
      authReady: !loading,
      authError,
      isAdmin: role === 'admin',
      isManager: role === 'manager',
      isTrader: role === 'trader',
      isActive: profile?.is_active ?? true,
      hasValidSubscription: isSubscriptionValid(subscription),
      signIn,
      signUp,
      resetPassword,
      signOut,
      refreshProfile,
    }
  }, [authError, loading, profile, refreshProfile, resetPassword, session, signIn, signOut, signUp, subscription])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
