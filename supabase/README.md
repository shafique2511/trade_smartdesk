# Trading SmartDesk Supabase Setup

Phase 2 adds the initial database schema in `migrations/001_initial_schema.sql`.
Phase 3 adds the auth profile trigger in `migrations/002_auth_profile_trigger.sql`.

Run the migration in one of these ways:

```bash
supabase db push
```

Or paste the SQL file into the Supabase SQL editor and run it once.

The migration creates:

- Core SaaS and trading tables
- Row Level Security policies
- Admin helper function
- `updated_at` trigger function and triggers
- Query and RLS indexes
- Starter, Pro, and Business package seed data
- Auth signup profile creation trigger

The frontend expects these environment variables:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` is used only by server/API routes. Do not expose it in browser code.

For local Telegram API testing, run the app through Vercel dev so `/api/telegram` is available:

```bash
vercel dev
```

Plain `npm.cmd run dev` runs the Vite frontend only.
