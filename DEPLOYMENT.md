# Villa 19 — Deployment Guide

Three environments, each with its own Supabase database. Same pattern as the Proptech project.

---

## Architecture Overview

| Environment | Supabase Project | Ref | Vercel Branch | URL |
|---|---|---|---|---|
| **Local** | Docker via Colima | — | any | `http://localhost:3000` |
| **Staging / Dev** | Villa Project Development | `hlmqcdzazbrztfovixjk` | `release` | TBD |
| **Production** | Villa 19 Production (TBC) | `REPLACE_WITH_PROD_REF` | `main` | `https://villa19.in` |

**Rule:** all feature branches → local or staging. Only `main` touches production.

---

## Local Development Setup

### Prerequisites
- Node.js 20+, npm
- Docker via Colima (`brew install colima`, `colima start`)
- Supabase CLI (`brew install supabase/tap/supabase`)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure `.env.local`

`.env.local` is gitignored. Create it manually. **Default: points at Staging.**

```
# ── Supabase (Staging — Villa Project Development) ──────────────────
NEXT_PUBLIC_SUPABASE_URL=https://hlmqcdzazbrztfovixjk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging anon key>
SUPABASE_SERVICE_ROLE_KEY=<staging service role key>   # NEVER NEXT_PUBLIC_

# ── To use LOCAL Supabase instead, uncomment and comment out Staging block:
# NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<from: npm run supabase:status>
# SUPABASE_SERVICE_ROLE_KEY=<from: npm run supabase:status>

# ── To use Production, uncomment and comment out Staging block:
# NEXT_PUBLIC_SUPABASE_URL=https://<prod-ref>.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod anon key>
# SUPABASE_SERVICE_ROLE_KEY=<prod service role key>   # NEVER NEXT_PUBLIC_
# ⚠️  WARNING: changes against this block affect real guest data.

# ── Razorpay (use test keys for local/staging) ───────────────────────
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx              # NEVER NEXT_PUBLIC_
RAZORPAY_KEY_SECRET=<secret>                       # NEVER NEXT_PUBLIC_
RAZORPAY_WEBHOOK_SECRET=<secret>                   # NEVER NEXT_PUBLIC_

# ── Property ─────────────────────────────────────────────────────────
PROPERTY_WHATSAPP=918050484123
PROPERTY_PHONE=918050484123
PROPERTY_EMAIL=reservations@habbaa.com

# ── App URL ──────────────────────────────────────────────────────────
APP_URL=http://localhost:3000                       # override in Vercel

# ── Email (Resend) ───────────────────────────────────────────────────
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=Villa 19 by Habbaa <reservations@habbaa.com>
```

### 3. Start local Supabase (optional — offline mode)

Only needed if you want a fully isolated local DB. Most dev work runs against Staging.

```bash
colima start                  # start Docker runtime
npm run supabase:start        # starts local Supabase (ports 54331/54332/54333)
npm run supabase:reset        # apply all migrations from scratch
npm run supabase:studio       # open Studio at http://localhost:54333
npm run supabase:types        # regenerate TypeScript types from local schema
```

Then swap the Supabase block in `.env.local` to the local values shown by `npm run supabase:status`.

### 4. Start the dev server

```bash
npm run dev
```

---

## Database Migrations

**Always validate on Staging first. Never push directly to Production.**

### Create a new migration

```bash
supabase migration new your_feature_name
# writes supabase/migrations/<timestamp>_your_feature_name.sql
```

### Apply locally

```bash
npm run supabase:reset   # full reset + all migrations
# or: npm run supabase:diff  # diff only
```

### Push to Staging

```bash
npm run supabase:migration:list   # check what's pending
npm run db:push                   # runs ./scripts/db-push.sh (safe, blocks prod)
```

### Push to Production

```bash
# 1. Re-link CLI to the prod project
supabase link   # enter prod ref: REPLACE_WITH_PROD_REF

# 2. Verify pending
npm run supabase:migration:list

# 3. Push — requires typing 'yes-production' at the prompt
npm run db:push:prod

# 4. Re-link back to staging when done
supabase link   # enter staging ref: hlmqcdzazbrztfovixjk
```

The guardrail script (`scripts/db-push.sh`) reads `supabase/.temp/project-ref` to detect which project is linked. If linked to prod without `--production`, the push is blocked automatically.

---

## Regenerate TypeScript Types

```bash
npm run supabase:types          # from local Supabase (must be running)
npm run supabase:types:remote   # from currently-linked remote project
```

Generated file: `src/types/database.types.ts`

---

## Branch → Environment Mapping

```
feature-branch  →  develop locally (local DB or Staging)
      ↓
   release      →  auto-deploys to staging Vercel project (Staging DB)
      ↓
    main        →  auto-deploys to villa19.in (Production DB)
```

---

## Analytics (Google Analytics 4)

Analytics loads only after a guest accepts cookies (`src/components/layout/Analytics.tsx`).

1. Create a GA4 property for villa19.in and a **Web** data stream for `https://villa19.in`.
2. Copy the stream's **Measurement ID** (`G-XXXXXXXXXX`) into Vercel as `NEXT_PUBLIC_GA_ID`
   (Production, and Preview if you want staging traffic counted separately). Redeploy.
3. **To do once analytics is live:** add an "AI assistants" channel group so visits from AI answers
   are reported separately. In GA4: Admin, Data display, Channel groups, Create new channel group.
   Add a channel named `AI assistants` with the condition *Source matches regex*:
   `chatgpt\.com|chat\.openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com`
   and move it above "Referral" so these visits are not counted as ordinary referrals.

## Pre-Push Checklist

- [ ] `npx tsc --noEmit` — no type errors
- [ ] `npm run lint` — no lint errors
- [ ] `npm test` — all tests pass
- [ ] If schema changed: `npm run db:push` applied to Staging and verified
- [ ] `RELEASE_NOTES.md` updated with new section + migrations table + date
- [ ] If merging to `main`: `npm run db:push:prod` applied to Production
