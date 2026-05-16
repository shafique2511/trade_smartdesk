export type UserRole = 'admin' | 'manager' | 'trader'
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled'

export type UserProfile = {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  package_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Subscription = {
  id: string
  user_id: string
  package_id: string | null
  status: SubscriptionStatus
  start_date: string
  end_date: string | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: UserRole
          avatar_url?: string | null
          package_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>
        Relationships: []
      }
      subscriptions: {
        Row: Subscription
        Insert: {
          id?: string
          user_id: string
          package_id?: string | null
          status?: SubscriptionStatus
          start_date?: string
          end_date?: string | null
          created_at?: string
        }
        Update: Partial<Omit<Subscription, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
