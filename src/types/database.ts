export type UserRole = 'admin' | 'manager' | 'trader'
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled'
export type BillingCycle = 'monthly' | 'yearly' | 'one_time'
export type TradeDirection = 'buy' | 'sell'
export type TradeStatus =
  | 'draft'
  | 'waiting'
  | 'active'
  | 'tp1_hit'
  | 'tp2_hit'
  | 'tp3_hit'
  | 'tp4_hit'
  | 'sl_hit'
  | 'breakeven'
  | 'closed'
export type TradeResult = 'win' | 'loss' | 'breakeven' | 'pending'
export type TradeGrade = 'A' | 'B' | 'C' | 'D'

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

export type Package = {
  id: string
  name: string
  description: string
  price: number
  billing_cycle: BillingCycle
  max_trades: number
  max_journal_entries: number
  telegram_enabled: boolean
  analytics_enabled: boolean
  admin_features_enabled: boolean
  is_active: boolean
  created_at: string
}

export type Trade = {
  id: string
  user_id: string
  symbol: string
  direction: TradeDirection
  entry_price: number
  stop_loss: number
  tp1: number | null
  tp2: number | null
  tp3: number | null
  tp4: number | null
  account_balance: number
  risk_percentage: number
  risk_amount: number
  lot_size: number | null
  setup_type: string | null
  trade_reason: string | null
  confidence_score: number | null
  status: TradeStatus
  result: TradeResult
  profit_loss: number | null
  screenshot_url: string | null
  created_at: string
  updated_at: string
}

export type JournalEntry = {
  id: string
  user_id: string
  trade_id: string | null
  emotion_before: string | null
  emotion_after: string | null
  mistake_checklist: unknown
  setup_quality: number | null
  trade_grade: TradeGrade | null
  result: TradeResult | null
  profit_loss: number | null
  notes: string | null
  entry_screenshot_url: string | null
  exit_screenshot_url: string | null
  created_at: string
  updated_at: string
}

export type RiskSettings = {
  id: string
  user_id: string
  account_balance: number
  risk_per_trade: number
  max_daily_loss: number
  max_daily_profit: number
  max_trades_per_day: number
  lock_after_daily_loss: boolean
  created_at: string
  updated_at: string
}

export type SignalLog = {
  id: string
  user_id: string
  trade_id: string | null
  signal_type: string
  message: string
  sent_to_telegram: boolean
  telegram_response: unknown
  created_at: string
}

export type TelegramSettings = {
  id: string
  user_id: string
  bot_token: string | null
  channel_id: string | null
  default_footer: string | null
  branding_enabled: boolean
  is_connected: boolean
  created_at: string
  updated_at: string
}

export type AdminSetting = {
  id: string
  setting_key: string
  setting_value: unknown
  created_at: string
  updated_at: string
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
      packages: {
        Row: Package
        Insert: {
          id?: string
          name: string
          description: string
          price?: number
          billing_cycle: BillingCycle
          max_trades?: number
          max_journal_entries?: number
          telegram_enabled?: boolean
          analytics_enabled?: boolean
          admin_features_enabled?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Omit<Package, 'id' | 'created_at'>>
        Relationships: []
      }
      trades: {
        Row: Trade
        Insert: {
          id?: string
          user_id: string
          symbol: string
          direction: TradeDirection
          entry_price: number
          stop_loss: number
          tp1?: number | null
          tp2?: number | null
          tp3?: number | null
          tp4?: number | null
          account_balance: number
          risk_percentage: number
          risk_amount: number
          lot_size?: number | null
          setup_type?: string | null
          trade_reason?: string | null
          confidence_score?: number | null
          status?: TradeStatus
          result?: TradeResult
          profit_loss?: number | null
          screenshot_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Trade, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      journal_entries: {
        Row: JournalEntry
        Insert: {
          id?: string
          user_id: string
          trade_id?: string | null
          emotion_before?: string | null
          emotion_after?: string | null
          mistake_checklist?: unknown
          setup_quality?: number | null
          trade_grade?: TradeGrade | null
          result?: TradeResult | null
          profit_loss?: number | null
          notes?: string | null
          entry_screenshot_url?: string | null
          exit_screenshot_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<JournalEntry, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      risk_settings: {
        Row: RiskSettings
        Insert: {
          id?: string
          user_id: string
          account_balance?: number
          risk_per_trade?: number
          max_daily_loss?: number
          max_daily_profit?: number
          max_trades_per_day?: number
          lock_after_daily_loss?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<RiskSettings, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      signal_logs: {
        Row: SignalLog
        Insert: {
          id?: string
          user_id: string
          trade_id?: string | null
          signal_type: string
          message: string
          sent_to_telegram?: boolean
          telegram_response?: unknown
          created_at?: string
        }
        Update: Partial<Omit<SignalLog, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      telegram_settings: {
        Row: TelegramSettings
        Insert: {
          id?: string
          user_id: string
          bot_token?: string | null
          channel_id?: string | null
          default_footer?: string | null
          branding_enabled?: boolean
          is_connected?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<TelegramSettings, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      admin_settings: {
        Row: AdminSetting
        Insert: {
          id?: string
          setting_key: string
          setting_value?: unknown
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<AdminSetting, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
