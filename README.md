# StockPulse

Inventory tracking and forecasting for DTC brands and the agencies that run them. Built by [Flight Performance Co](https://flightperformance.co).

StockPulse pulls live inventory from Shopify, WooCommerce, or a CSV upload, calculates burn-rate velocity, forecasts when each SKU will run out, and fires Slack/email alerts before stockouts happen.

**Live**: <https://stockpulse-xi-six.vercel.app/>

---

## Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database / Auth**: Supabase (Postgres + Row Level Security + Supabase Auth)
- **Email**: Resend
- **UI**: Tailwind CSS · Radix UI · Recharts · Lucide icons
- **Validation**: Zod
- **Hosting**: Vercel (cron jobs included)

---

## Quick start

```bash
# 1. Clone and install
git clone https://github.com/GiannQuijano/stockpulse.git
cd stockpulse
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Then fill in the values — see "Required services" below

# 3. Set up the database
# Open https://app.supabase.com → your project → SQL Editor → New query
# Paste the contents of supabase/full_migration.sql and run it.
# (Or run the numbered files in supabase/migrations/ one by one.)

# 4. Run locally
npm run dev
# → http://localhost:3000
```

You should see the landing page. Sign up via `/signup`, then add your first brand at `/brands/new`.

---

## Required services

You need free-tier accounts on three services before the app does anything useful:

### 1. Supabase (Postgres + auth)

1. Create a project at <https://app.supabase.com>
2. From **Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` *(server-only, never expose to the browser)*
3. Run `supabase/full_migration.sql` in the SQL Editor to create all 6 tables, RLS policies, indexes, and the `updated_at` trigger.

### 2. Resend (email alerts)

1. Sign up at <https://resend.com>
2. Verify a sending domain (or use the sandbox `onboarding@resend.dev` for local dev)
3. Create an API key → `RESEND_API_KEY`
4. Set `RESEND_FROM_EMAIL` to a verified sender (e.g. `alerts@yourdomain.com`)

### 3. Cron secret (your own random string)

Generate any random string and set `CRON_SECRET`. The three cron jobs in `vercel.json` require an `Authorization: Bearer ${CRON_SECRET}` header to run, which keeps the cron endpoints from being publicly hammered.

```bash
openssl rand -hex 32
```

---

## Environment variables

See `.env.local.example` for the full list. All five are required:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key for browser-side Supabase calls (RLS-scoped) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key used by cron jobs and the Shopify webhook handler — bypasses RLS |
| `RESEND_API_KEY` | For sending alert emails |
| `RESEND_FROM_EMAIL` | The verified `From:` address for alert emails |
| `CRON_SECRET` | Random string used to authorize the three cron endpoints |

---

## Project structure

```
src/
├── app/
│   ├── (auth)/              # Login + signup pages
│   ├── (dashboard)/         # Authenticated pages: dashboard, brands, products, alerts, settings
│   ├── api/
│   │   ├── brands/[brandId]/csv-import   # CSV product upload
│   │   ├── brands/[brandId]/sync         # Manual API sync trigger
│   │   ├── webhooks/shopify              # Real-time Shopify product updates
│   │   └── cron/                         # Daily / weekly background jobs
│   ├── layout.tsx
│   └── page.tsx             # Landing page
├── components/              # Radix UI primitives + StockPulse-specific components
├── lib/
│   ├── engine/              # Velocity, forecast, alert rules
│   ├── integrations/        # Shopify + WooCommerce API clients
│   └── supabase/            # Server + client Supabase factories, types
└── middleware.ts            # Supabase auth middleware

supabase/
├── full_migration.sql       # Run-once full schema setup
└── migrations/              # Numbered individual migrations (001–008)
```

---

## How the engine works

1. **Sync**: Inventory pulled from Shopify/WooCommerce APIs (daily cron) or pushed via Shopify webhooks (real-time).
2. **Snapshot**: Each sync writes a row to `inventory_snapshots` so we have a historical timeline of stock levels per SKU.
3. **Velocity**: `lib/engine/velocity.ts` computes units-sold-per-day from the snapshot history.
4. **Forecast**: `lib/engine/forecast.ts` projects when each SKU will hit zero given current velocity.
5. **Alert evaluation**: `lib/engine/alerts.ts` checks each SKU against the configured `alert_threshold_days` and dispatches Slack/email alerts when the forecast crosses the threshold.

---

## Cron jobs

Defined in [`vercel.json`](./vercel.json) and protected by `CRON_SECRET`:

| Endpoint | Schedule | Job |
|---|---|---|
| `GET /api/cron/sync-inventory` | Daily 8:00 UTC | Pulls inventory from Shopify/WooCommerce APIs for all active brands and writes a snapshot |
| `GET /api/cron/check-alerts` | Daily 12:00 UTC | Recomputes velocity + forecast for every product, fires alerts when thresholds are crossed |
| `GET /api/cron/cleanup-snapshots` | Weekly Sunday 3:00 UTC | Deletes `inventory_snapshots` older than 90 days |

To trigger one manually for testing:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-deploy.vercel.app/api/cron/sync-inventory
```

---

## Integrations

| Platform | Mode | Where |
|---|---|---|
| **Shopify** | API pull (daily) + webhook push (real-time) | `lib/integrations/shopify.ts` + `app/api/webhooks/shopify/route.ts` |
| **WooCommerce** | API pull (daily) | `lib/integrations/woocommerce.ts` |
| **CSV upload** | Manual user upload | `app/api/brands/[brandId]/csv-import/route.ts` |
| **Custom / manual** | Manual quantity edits in the UI | Brand settings page |

To wire up a Shopify store: create the brand in StockPulse with `platform=shopify`, paste in the store URL + Admin API access token, then add a webhook in Shopify pointing at `https://your-deploy.vercel.app/api/webhooks/shopify` for the `products/update` topic.

---

## Deploy to Vercel

```bash
# Push to GitHub if you haven't already
git push origin main

# Then in the Vercel dashboard:
# 1. Import the repo
# 2. Add all env vars from .env.local
# 3. Deploy
```

The cron jobs in `vercel.json` will auto-register on first deploy. **Cron jobs require a Pro plan** — the Hobby plan does not support scheduled functions.

---

## Common gotchas

- **Supabase RLS is on for every table.** If a query returns nothing unexpectedly, check that the request is being made by an authenticated user (anon key + valid session) OR by the service role key (used by cron jobs).
- **Service role key must never reach the browser.** Only use `createServiceRoleClient()` in API routes and cron handlers.
- **CSV imports must match the expected column headers.** See `app/api/brands/[brandId]/csv-import/route.ts` for the parser.
- **First sync of a new brand** has no historical snapshots, so velocity will be 0 and forecasts will be infinite until at least 2 snapshots exist (typically takes 24h after the first daily sync).

---

## License

Proprietary — internal Flight Performance Co tool. Not for external distribution.
