-- Trading SmartDesk Phase 2: Supabase database schema
-- Run this in the Supabase SQL editor or with the Supabase CLI.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  price numeric(12, 2) not null default 0 check (price >= 0),
  billing_cycle text not null check (billing_cycle in ('monthly', 'yearly', 'one_time')),
  max_trades integer not null default 0 check (max_trades >= 0),
  max_journal_entries integer not null default 0 check (max_journal_entries >= 0),
  telegram_enabled boolean not null default false,
  analytics_enabled boolean not null default false,
  admin_features_enabled boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'trader' check (role in ('admin', 'manager', 'trader')),
  avatar_url text,
  package_id uuid references public.packages (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = (select auth.uid())
      and role = 'admin'
      and is_active = true
  );
$$;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  package_id uuid references public.packages (id) on delete set null,
  status text not null default 'trial' check (status in ('trial', 'active', 'expired', 'cancelled')),
  start_date timestamptz not null default now(),
  end_date timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  symbol text not null,
  direction text not null check (direction in ('buy', 'sell')),
  entry_price numeric(18, 6) not null,
  stop_loss numeric(18, 6) not null,
  tp1 numeric(18, 6),
  tp2 numeric(18, 6),
  tp3 numeric(18, 6),
  tp4 numeric(18, 6),
  account_balance numeric(18, 2) not null check (account_balance >= 0),
  risk_percentage numeric(6, 3) not null check (risk_percentage >= 0),
  risk_amount numeric(18, 2) not null check (risk_amount >= 0),
  lot_size numeric(18, 4) check (lot_size >= 0),
  setup_type text,
  trade_reason text,
  confidence_score integer check (confidence_score between 0 and 100),
  status text not null default 'draft' check (
    status in (
      'draft',
      'waiting',
      'active',
      'tp1_hit',
      'tp2_hit',
      'tp3_hit',
      'tp4_hit',
      'sl_hit',
      'breakeven',
      'closed'
    )
  ),
  result text not null default 'pending' check (result in ('win', 'loss', 'breakeven', 'pending')),
  profit_loss numeric(18, 2),
  screenshot_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  trade_id uuid references public.trades (id) on delete set null,
  emotion_before text,
  emotion_after text,
  mistake_checklist jsonb not null default '[]'::jsonb,
  setup_quality integer check (setup_quality between 1 and 10),
  trade_grade text check (trade_grade in ('A', 'B', 'C', 'D')),
  result text check (result in ('win', 'loss', 'breakeven', 'pending')),
  profit_loss numeric(18, 2),
  notes text,
  entry_screenshot_url text,
  exit_screenshot_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.telegram_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.user_profiles (id) on delete cascade,
  bot_token text,
  channel_id text,
  default_footer text,
  branding_enabled boolean not null default true,
  is_connected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.risk_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.user_profiles (id) on delete cascade,
  account_balance numeric(18, 2) not null default 0 check (account_balance >= 0),
  risk_per_trade numeric(6, 3) not null default 1 check (risk_per_trade >= 0),
  max_daily_loss numeric(18, 2) not null default 0 check (max_daily_loss >= 0),
  max_daily_profit numeric(18, 2) not null default 0 check (max_daily_profit >= 0),
  max_trades_per_day integer not null default 0 check (max_trades_per_day >= 0),
  lock_after_daily_loss boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.signal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  trade_id uuid references public.trades (id) on delete set null,
  signal_type text not null,
  message text not null,
  sent_to_telegram boolean not null default false,
  telegram_response jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  date date not null,
  total_trades integer not null default 0 check (total_trades >= 0),
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  breakeven integer not null default 0 check (breakeven >= 0),
  profit_loss numeric(18, 2) not null default 0,
  win_rate numeric(6, 2) not null default 0 check (win_rate >= 0 and win_rate <= 100),
  average_rr numeric(10, 2),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.admin_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_trades_updated_at on public.trades;
create trigger set_trades_updated_at
before update on public.trades
for each row execute function public.set_updated_at();

drop trigger if exists set_journal_entries_updated_at on public.journal_entries;
create trigger set_journal_entries_updated_at
before update on public.journal_entries
for each row execute function public.set_updated_at();

drop trigger if exists set_telegram_settings_updated_at on public.telegram_settings;
create trigger set_telegram_settings_updated_at
before update on public.telegram_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_risk_settings_updated_at on public.risk_settings;
create trigger set_risk_settings_updated_at
before update on public.risk_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_admin_settings_updated_at on public.admin_settings;
create trigger set_admin_settings_updated_at
before update on public.admin_settings
for each row execute function public.set_updated_at();

create index if not exists user_profiles_package_id_idx on public.user_profiles (package_id);
create index if not exists user_profiles_created_at_idx on public.user_profiles (created_at desc);
create index if not exists user_profiles_role_idx on public.user_profiles (role);
create index if not exists user_profiles_is_active_idx on public.user_profiles (is_active);

create index if not exists packages_is_active_idx on public.packages (is_active);
create index if not exists packages_created_at_idx on public.packages (created_at desc);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_package_id_idx on public.subscriptions (package_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);
create index if not exists subscriptions_created_at_idx on public.subscriptions (created_at desc);

create index if not exists trades_user_id_idx on public.trades (user_id);
create index if not exists trades_status_idx on public.trades (status);
create index if not exists trades_result_idx on public.trades (result);
create index if not exists trades_symbol_idx on public.trades (symbol);
create index if not exists trades_created_at_idx on public.trades (created_at desc);
create index if not exists trades_user_created_at_idx on public.trades (user_id, created_at desc);
create index if not exists trades_user_status_idx on public.trades (user_id, status);

create index if not exists journal_entries_user_id_idx on public.journal_entries (user_id);
create index if not exists journal_entries_trade_id_idx on public.journal_entries (trade_id);
create index if not exists journal_entries_result_idx on public.journal_entries (result);
create index if not exists journal_entries_created_at_idx on public.journal_entries (created_at desc);
create index if not exists journal_entries_user_created_at_idx on public.journal_entries (user_id, created_at desc);

create index if not exists telegram_settings_user_id_idx on public.telegram_settings (user_id);
create index if not exists telegram_settings_created_at_idx on public.telegram_settings (created_at desc);

create index if not exists risk_settings_user_id_idx on public.risk_settings (user_id);
create index if not exists risk_settings_created_at_idx on public.risk_settings (created_at desc);

create index if not exists signal_logs_user_id_idx on public.signal_logs (user_id);
create index if not exists signal_logs_trade_id_idx on public.signal_logs (trade_id);
create index if not exists signal_logs_created_at_idx on public.signal_logs (created_at desc);
create index if not exists signal_logs_user_created_at_idx on public.signal_logs (user_id, created_at desc);

create index if not exists analytics_snapshots_user_id_idx on public.analytics_snapshots (user_id);
create index if not exists analytics_snapshots_date_idx on public.analytics_snapshots (date desc);
create index if not exists analytics_snapshots_created_at_idx on public.analytics_snapshots (created_at desc);

create index if not exists admin_settings_created_at_idx on public.admin_settings (created_at desc);

alter table public.user_profiles enable row level security;
alter table public.packages enable row level security;
alter table public.subscriptions enable row level security;
alter table public.trades enable row level security;
alter table public.journal_entries enable row level security;
alter table public.telegram_settings enable row level security;
alter table public.risk_settings enable row level security;
alter table public.signal_logs enable row level security;
alter table public.analytics_snapshots enable row level security;
alter table public.admin_settings enable row level security;

drop policy if exists "Users can read own profile" on public.user_profiles;
create policy "Users can read own profile"
on public.user_profiles
for select
to authenticated
using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile"
on public.user_profiles
for update
to authenticated
using (id = (select auth.uid()) or (select public.is_admin()))
with check (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile"
on public.user_profiles
for insert
to authenticated
with check (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Admins can delete profiles" on public.user_profiles;
create policy "Admins can delete profiles"
on public.user_profiles
for delete
to authenticated
using ((select public.is_admin()));

drop policy if exists "Authenticated users can read active packages" on public.packages;
create policy "Authenticated users can read active packages"
on public.packages
for select
to authenticated
using (is_active = true or (select public.is_admin()));

drop policy if exists "Admins can manage packages" on public.packages;
create policy "Admins can manage packages"
on public.packages
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Users can read own subscriptions" on public.subscriptions;
create policy "Users can read own subscriptions"
on public.subscriptions
for select
to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Admins can manage subscriptions" on public.subscriptions;
create policy "Admins can manage subscriptions"
on public.subscriptions
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Users can read own trades" on public.trades;
create policy "Users can read own trades"
on public.trades
for select
to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Users can insert own trades" on public.trades;
create policy "Users can insert own trades"
on public.trades
for insert
to authenticated
with check (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Users can update own trades" on public.trades;
create policy "Users can update own trades"
on public.trades
for update
to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()))
with check (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Users can delete own trades" on public.trades;
create policy "Users can delete own trades"
on public.trades
for delete
to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Users can read own journal entries" on public.journal_entries;
create policy "Users can read own journal entries"
on public.journal_entries
for select
to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Users can insert own journal entries" on public.journal_entries;
create policy "Users can insert own journal entries"
on public.journal_entries
for insert
to authenticated
with check (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Users can update own journal entries" on public.journal_entries;
create policy "Users can update own journal entries"
on public.journal_entries
for update
to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()))
with check (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Users can delete own journal entries" on public.journal_entries;
create policy "Users can delete own journal entries"
on public.journal_entries
for delete
to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Users can manage own telegram settings" on public.telegram_settings;
create policy "Users can manage own telegram settings"
on public.telegram_settings
for all
to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()))
with check (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Users can manage own risk settings" on public.risk_settings;
create policy "Users can manage own risk settings"
on public.risk_settings
for all
to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()))
with check (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Users can read own signal logs" on public.signal_logs;
create policy "Users can read own signal logs"
on public.signal_logs
for select
to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Users can insert own signal logs" on public.signal_logs;
create policy "Users can insert own signal logs"
on public.signal_logs
for insert
to authenticated
with check (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Admins can update signal logs" on public.signal_logs;
create policy "Admins can update signal logs"
on public.signal_logs
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can delete signal logs" on public.signal_logs;
create policy "Admins can delete signal logs"
on public.signal_logs
for delete
to authenticated
using ((select public.is_admin()));

drop policy if exists "Users can read own analytics snapshots" on public.analytics_snapshots;
create policy "Users can read own analytics snapshots"
on public.analytics_snapshots
for select
to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Users can insert own analytics snapshots" on public.analytics_snapshots;
create policy "Users can insert own analytics snapshots"
on public.analytics_snapshots
for insert
to authenticated
with check (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Users can update own analytics snapshots" on public.analytics_snapshots;
create policy "Users can update own analytics snapshots"
on public.analytics_snapshots
for update
to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()))
with check (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Admins can delete analytics snapshots" on public.analytics_snapshots;
create policy "Admins can delete analytics snapshots"
on public.analytics_snapshots
for delete
to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can manage admin settings" on public.admin_settings;
create policy "Admins can manage admin settings"
on public.admin_settings
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

insert into public.packages (
  name,
  description,
  price,
  billing_cycle,
  max_trades,
  max_journal_entries,
  telegram_enabled,
  analytics_enabled,
  admin_features_enabled,
  is_active
)
values
  (
    'Starter',
    'Core planning, journal, risk desk, basic analytics, and manual signal copy for individual traders.',
    29.00,
    'monthly',
    50,
    100,
    false,
    true,
    false,
    true
  ),
  (
    'Pro',
    'Advanced analytics, Telegram sending, unlimited signals, signal logs, and CSV exports.',
    79.00,
    'monthly',
    1000,
    1000,
    true,
    true,
    false,
    true
  ),
  (
    'Business',
    'Team-ready package with admin features, branding settings, multi-user management, and client report placeholders.',
    199.00,
    'monthly',
    10000,
    10000,
    true,
    true,
    true,
    true
  )
on conflict (name) do update set
  description = excluded.description,
  price = excluded.price,
  billing_cycle = excluded.billing_cycle,
  max_trades = excluded.max_trades,
  max_journal_entries = excluded.max_journal_entries,
  telegram_enabled = excluded.telegram_enabled,
  analytics_enabled = excluded.analytics_enabled,
  admin_features_enabled = excluded.admin_features_enabled,
  is_active = excluded.is_active;
