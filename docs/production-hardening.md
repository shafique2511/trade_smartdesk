# Trading SmartDesk Production Hardening

## Environment Variables

Frontend variables:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Server-only variable:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code or client logs.

## Supabase Checklist

- Apply `supabase/migrations/001_initial_schema.sql`.
- Apply `supabase/migrations/002_auth_profile_trigger.sql`.
- Confirm RLS is enabled on every public table.
- Confirm users can only read/write their own private records.
- Confirm admin policies work only for active users with `role = 'admin'`.
- Confirm the first admin user is manually promoted in `public.user_profiles`.
- Configure Auth redirect URLs for production and localhost.

## Telegram Checklist

- Bot token is stored in `telegram_settings`.
- Browser code never calls Telegram Bot API directly.
- `/api/telegram` validates the Supabase access token.
- `/api/telegram` uses `SUPABASE_SERVICE_ROLE_KEY` only server-side.
- Telegram responses are sanitized before being returned or logged.
- Signals require manual user confirmation before sending.

## Production Checklist

- `npm.cmd run lint`
- `npx.cmd tsc --noEmit`
- `npm.cmd run build`
- No bot tokens or service role keys in frontend source.
- No sensitive values printed to browser console.
- Error boundary fallback renders for unexpected runtime failures.
- Vercel env vars are configured.
- Vercel API route `/api/telegram` is reachable.
- Supabase Auth site URL and redirect URLs point to production domain.

## Deployment Notes

Use `vercel dev` locally when testing API routes. `npm.cmd run dev` runs only the Vite frontend.

The platform is for trade planning, journaling, and risk management only. It does not provide financial advice.
