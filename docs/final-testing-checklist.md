# Trading SmartDesk Final Testing Checklist

Use this checklist before deploying or onboarding a customer. Automated checks confirm the code compiles, lints, and builds. Live workflow checks require a configured Supabase project, email auth settings, and Telegram bot credentials.

## Automated Validation

- [ ] Run `npx.cmd tsc --noEmit`
- [ ] Run `npm.cmd run lint`
- [ ] Run `npm.cmd run build`
- [ ] Confirm the Vite production build completes without TypeScript or lint errors.

## Auth And Account Flow

- [ ] Register a new user with a unique email.
- [ ] Confirm the email if Supabase email confirmation is enabled.
- [ ] Log in with the confirmed user.
- [ ] Confirm the new `user_profiles` row exists.
- [ ] Confirm inactive users are redirected to `/account-disabled`.
- [ ] Confirm expired or cancelled subscriptions redirect to `/subscription-expired`.
- [ ] Confirm non-admin users are blocked from `/admin`.

## Trading Workflow

- [ ] Create a trade plan from `/trade-planner`.
- [ ] Confirm buy validation requires SL below entry and TP levels above entry.
- [ ] Confirm sell validation requires SL above entry and TP levels below entry.
- [ ] Confirm the risk amount and lot size calculations update when balance, risk percentage, entry, or SL changes.
- [ ] Confirm daily risk lock blocks new non-draft trade plans when enabled.
- [ ] Confirm monthly trade limits block new plans after the package limit is reached.

## Signal Workflow

- [ ] Open `/signals` after creating a trade.
- [ ] Generate a new signal message from a saved trade.
- [ ] Copy the signal and confirm a signal log is created.
- [ ] Confirm Telegram send requires manual confirmation.
- [ ] Confirm Starter users see a Telegram upgrade prompt and cannot send.
- [ ] Confirm Pro or Business users can send after Telegram settings are configured.

## Telegram

- [ ] Save bot token, channel ID, and default footer at `/telegram`.
- [ ] Confirm the bot token is hidden after save.
- [ ] Test Telegram connection with `/api/telegram`.
- [ ] Send a test signal to the configured channel.
- [ ] Confirm failed Telegram sends are logged without exposing the bot token.

## Journal

- [ ] Create a journal entry linked to a trade.
- [ ] Edit the journal entry.
- [ ] Delete the journal entry after confirmation.
- [ ] Filter by result, setup type, and grade.
- [ ] Search journal notes.
- [ ] Confirm monthly journal limits block new entries after the package limit is reached.

## Analytics

- [ ] Confirm summary stats load from trades and journal entries.
- [ ] Confirm empty states show when no data exists.
- [ ] Filter analytics by period, symbol, and setup type.
- [ ] Confirm Starter users see summary analytics and an advanced analytics upgrade prompt.
- [ ] Confirm Pro or Business users see the full chart set.

## Risk Desk

- [ ] Save risk settings.
- [ ] Confirm current daily P/L, remaining daily loss, remaining daily profit, and trades remaining update from live trades.
- [ ] Trigger daily loss reached status.
- [ ] Confirm lock-after-daily-loss disables new non-draft trade creation.
- [ ] Confirm daily profit reached shows the preset-limit message without financial advice wording.

## Exports

- [ ] Export trades CSV.
- [ ] Export journal CSV.
- [ ] Export analytics CSV.
- [ ] Export monthly performance report.
- [ ] Export trade report PDF placeholder.
- [ ] Confirm Starter users see export locks.
- [ ] Confirm Pro or Business users can download exports with `trading-smartdesk-*` filenames.

## Admin

- [ ] Log in as an admin.
- [ ] Create a package.
- [ ] Edit a package.
- [ ] Assign a package to a user.
- [ ] Confirm package assignment creates or updates the user's active subscription.
- [ ] Disable a user and confirm they cannot access the app.
- [ ] Change a user's role.
- [ ] Extend, cancel, and set trial subscriptions.
- [ ] Confirm package distribution stats update.

## Responsive And Error States

- [ ] Check desktop layout at 1440px width.
- [ ] Check tablet layout near 768px width.
- [ ] Check mobile layout near 390px width.
- [ ] Confirm sidebar/header remain usable on mobile.
- [ ] Confirm loading states appear during data fetches.
- [ ] Confirm error states show readable messages.
- [ ] Confirm empty states render for empty tables and charts.

## Production Readiness

- [ ] Confirm `.env` values are present locally.
- [ ] Confirm Vercel has `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Confirm Supabase Auth redirect URLs include localhost and production domains.
- [ ] Confirm RLS is enabled on all public tables.
- [ ] Confirm the platform disclaimer appears in core workflow pages.
