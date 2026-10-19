# Villa 19 — Deployment Guide

> **Read this first.** There is **one** remote database, and it is what the live site serves.
> A separate production project does not exist yet. Until it does, `supabase db push` against the
> linked project changes what guests see, with no deploy involved, as soon as ISR revalidates.
>
> This document used to open by describing three environments each with its own database, and mapped
> a `release` branch to a staging Vercel project. None of that existed. Anyone following it believed
> they were pushing to staging while pushing to live. Creating the production project is tracked in
> `docs/PROD_DB_SETUP.md`; update the tables below the moment it exists.

---

## Environments, as they actually are

| Environment | Supabase project | Ref | Serves |
|---|---|---|---|
| **Local** | Docker via Colima | — | `http://localhost:3000` |
| **Remote / staging** | Villa Project Development | `hlmqcdzazbrztfovixjk` | **the live site, for now** |
| **Production** | Villa 19 Production | `wnmrxuggtfeaunacmztv` | nothing yet |

`Villa 19 Production` lives in the **Naithodu Consulting** org (Pro, `ap-south-1`, MICRO) but **Vercel is not pointed at it yet**, so the
development project is still what guests read. That is why `DEV_REF_SERVES_PROD` in
`scripts/db-push.sh` is still `true`: the flag tracks "is the dev ref serving live traffic", not
"does a production project exist". It flips in the same change that repoints the Vercel env vars.

Vercel production is `https://villa-booking-psi.vercel.app`, and it reads the remote project above.

`villa19.in` is **not** served by this app yet. It resolves to a parked page that returns HTTP 200
for every path, including paths that do not exist, so it will make a broken deploy look healthy.
**Verify against the Vercel URL, never against `villa19.in`**, until DNS is cut over.

### Branches

`main` is the only branch that deploys. There is no `release` branch; if you want a staging branch
and a second Vercel project, create them and then document them here.

---

## Local development

### Prerequisites

- Node.js 20+, npm
- Docker via Colima (`brew install colima`, `colima start`)
- Supabase CLI (`brew install supabase/tap/supabase`)

### 1. Install

```bash
npm install
```

### 2. `.env.local`

Gitignored; create it by hand. **Point it at the local stack, not at the remote** — the remote is
live. See `.env.example` for the full list and the notes on each variable.

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331
SUPABASE_SERVICE_ROLE_KEY=<from: npm run supabase:status>   # NEVER NEXT_PUBLIC_
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is **not** needed. Every query goes through the service-role client
in `src/lib/supabase/server.ts`; there is no browser Supabase client, and the anon key is read
nowhere in `src/`.

Razorpay, Resend and the property contact variables are all in `.env.example`.

### 3. Start the local stack

```bash
colima start
npm run supabase:start     # API 54331, DB 54332, Studio 54333
npm run supabase:reset     # drop, re-apply every migration, run the seed
npm run supabase:studio
npm run supabase:types     # regenerate types from the local schema
```

`supabase:reset` should end with `Finished supabase db reset`. If it ends on an error, read it —
do not re-run it hoping it passes.

### 4. Run

```bash
npm run dev
```

---

## Migrations

Migrations are the source of truth for both schema **and content**. A database built from
migrations alone must be complete and correct, because that is how the production project will be
built. Two rules follow from that:

- **Never `UPDATE properties` in a migration numbered before `00028`**, which is where the row is
  inserted. An UPDATE that matches nothing still succeeds, so the migration passes and the value is
  silently lost. This is not hypothetical: `00026` set the villa's tagline that way and no
  migrations-only database had one until `00094`.
- **Do not rely on `seed.sql` for anything production needs.** It is development data keyed to
  fixed UUIDs, and production is built without it.

### New migration

```bash
supabase migration new your_feature_name
```

### Apply locally

```bash
npm run supabase:reset
```

Then prove it from scratch *without* the seed, the way production will be built:

```bash
mv supabase/seed.sql /tmp/ && npm run supabase:reset   # inspect the result
mv /tmp/seed.sql supabase/
```

### Push to the remote

```bash
npm run supabase:migration:list   # what is pending
npm run db:push                   # ./scripts/db-push.sh
```

`db-push.sh` reads `supabase/.temp/project-ref` to see which project is linked. While
`DEV_REF_SERVES_PROD=true` it treats the dev ref as live: it warns, requires you to type
**`yes-live`** exactly, and refuses outright in a non-interactive shell. Anything other than
`yes-live` — including `yes`, `Y` or Enter — prints `Aborted.` and exits 1.

**Check it worked.** The script exiting is not proof:

```bash
npm run supabase:migration:list   # the remote column must now show the version
npx supabase db lint --linked     # schema-level confirmation
```

### Push to production

```bash
supabase link --project-ref wnmrxuggtfeaunacmztv   # prompts for the DB password
npm run supabase:migration:list                    # confirm what is pending
npm run db:push:prod                               # type 'yes-production'
supabase link --project-ref hlmqcdzazbrztfovixjk   # link back, so an absent-minded
                                                   # db:push cannot reach production
```

The guard routes on the linked ref: production without `--production` is blocked, `--production`
against a non-production ref is rejected, an unrecognised ref is refused, and every path refuses in
a non-interactive shell. Verified for all four.

Setup and the verification queries are in `docs/PROD_DB_SETUP.md`.

---

## Regenerate types

```bash
npm run supabase:types          # from the local stack
npm run supabase:types:remote   # from the linked remote
```

Output: `src/types/database.types.ts`. After a schema change on the remote, regenerating should
produce **no diff**. A diff means the deployed schema and the code disagree.

---

## Analytics (GA4)

Analytics loads only after a guest accepts cookies (`src/components/layout/Analytics.tsx`), and the
footer's "Cookie Preferences" lets them change their mind.

1. Create a GA4 property and a Web data stream for the production URL.
2. Put the measurement ID in Vercel as `NEXT_PUBLIC_GA_ID`. Redeploy.
3. Once live, add an "AI assistants" channel group so visits from AI answers are not counted as
   ordinary referrals. GA4 → Admin → Data display → Channel groups → Create new. Condition *Source
   matches regex*:
   `chatgpt\.com|chat\.openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com`
   Move it above "Referral".

---

## Pre-push checklist

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npm test` — with the local stack running, so the DB-backed tests actually execute. Expect
      **136 passed, 4 skipped**; the 4 are opt-in email tools and one of them sends real mail.
      If you see 14 skipped, the stack is not running and `booking-concurrency` — the only
      automated proof against double-booking — did not run.
- [ ] Schema or content changed: applied to the remote **and verified** with `migration list`
- [ ] New migration: checked it works on a database built from migrations alone, with no seed
- [ ] `RELEASE_NOTES.md` updated
