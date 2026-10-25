# Villa 19 — Deployment Guide

> **Read this first.** There are **two** remote databases and they serve different sites.
> `villa19.in` runs on Hostinger and reads the **production** project. The Vercel URL reads the
> **development** project. A `supabase db push` changes what guests see with no deploy involved, as
> soon as ISR revalidates, so the ref you are linked to is the whole question. Check it before every
> push: `cat supabase/.temp/project-ref`.
>
> This document twice described an arrangement that did not exist. It first mapped a `release`
> branch to a staging Vercel project that was never created, and then, after that was corrected,
> went on claiming `villa19.in` was parked and that `main` was the only branch, for a day after both
> had stopped being true. Anyone following it in either state would have verified the wrong host.
> If you change where a branch deploys or which database a host reads, correct this file in the same
> change, not afterwards.

---

## Environments, as they actually are

| Environment | Supabase project | Organisation | Ref | Serves |
|---|---|---|---|---|
| **Local** | Docker via Colima | - | - | `http://localhost:3000` |
| **Development** | Villa Project Development | Villa Project (Free) | `hlmqcdzazbrztfovixjk` | `villa-booking-psi.vercel.app` |
| **Production** | Villa 19 Production | Naithodu Consulting (Pro) | `wnmrxuggtfeaunacmztv` | **`villa19.in`, live** |

Production is `ap-south-1`, MICRO compute. The organisations are split by stage rather than by
product: **Naithodu Consulting (Pro)** holds both production databases, Villa 19's and Ooruda's,
and **Villa Project (Free)** holds both development ones. So the org name tells you the stage, not
the project - worth knowing before you go looking for Villa 19's production database in an org
called "Villa Project", where it is not.

`villa19.in` is served by this app, from Hostinger, reading the production project. It is real
traffic and real bookings: online payments are enabled there. Verify a production deploy against
`villa19.in` itself. The Vercel URL proves nothing about production, because it reads a different
database and deploys from a different branch.

`DEV_REF_SERVES_PROD` in `scripts/db-push.sh` is still `true` and is now **stale**: the dev ref no
longer serves live traffic. Left alone deliberately rather than flipped in passing, because its only
effect is to make a push to the development ref demand a typed `yes-live`, which errs towards
caution. The production guard does not depend on it: `db-push.sh` routes on the linked ref, so
production refuses without `--production` and a typed `yes-production`. Flip the flag the next time
this script is touched for a real reason.

### Branches

`release` is the working branch and deploys to Vercel. `main` is production: merging into it is the
decision to go live, and Hostinger is then deployed by hand from the archive (see below). Never
commit directly to `main`.

### Hostinger

GitHub integration is unavailable on this account, so every production deploy is a manual upload of
the archive built by `./scripts/make-deploy-zip.sh`. The archive carries no `.env` file by design;
every variable lives in Hostinger's Environment variables panel. Two consequences worth stating:

- **`NEXT_PUBLIC_*` variables are inlined at build time**, and Hostinger builds from the uploaded
  archive. A measurement ID added to the panel *after* a build is not in the bundle. `next.config.mjs`
  prints a build-log warning when `NEXT_PUBLIC_GA_ID` is missing from a production build, because
  that failure is otherwise silent and looks correct from every dashboard.
- **The previous archive is the rollback.** Keep it until the new deploy is verified.

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

Gitignored; create it by hand. **Point it at the local stack, not at either remote.** Both remotes
carry real data and production carries real bookings. See `.env.example` for the full list and the
notes on each variable.

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

### Schema before code, always

A migration that adds something the new code reads must be applied to that environment's database
**before** the code that reads it is deployed there. New schema under old code is inert; old schema
under new code is an outage.

This is not hypothetical. `00101` adds `payments.ga_client_id` and `ga_session_id`, and
`create-order` writes both on every booking. Deploying that code to a database without `00101`
fails every booking insert, and production has online payments enabled. The same commit's `00102`
through `00105` were applied to production while `00101` was not, because it was authored after
them and `db push` skips a lower number it has passed; it needs `--include-all`. So check
`migration list` for **gaps**, not just for the highest number.

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

Analytics loads only after a guest accepts cookies (`src/components/layout/Analytics.tsx`). There is
no footer control to revisit the choice: it was removed on 2026-10-25 at the operator's request, so a
guest changes their mind by clearing the site's cookies and site data (`clearConsent` in
`src/lib/consent.ts` is kept for the day a control comes back).

1. Create a GA4 property and a Web data stream for the production URL.
2. Put the measurement ID in the host's environment panel as `NEXT_PUBLIC_GA_ID`: Vercel for the
   development site, Hostinger for production. Redeploy. It is inlined at build time, so on
   Hostinger it has to be present when the bundle is built, not only when it runs. Use a **separate
   GA4 property per environment**, or the development site's test bookings land in real revenue.
3. Create a Measurement Protocol API secret (GA4 → Admin → Data Streams → the stream → Measurement
   Protocol API secrets) and set it as `GA4_API_SECRET`, server-side only. Without it no booking is
   ever counted: `purchase` is sent from the server, because a guest can close the tab the moment
   they finish paying and the Razorpay webhook is then the only thing that knows the booking is
   real. Check it with:

   ```bash
   GA4_MEASUREMENT_ID=G-XXXXXXXXXX GA4_API_SECRET=... node scripts/check-ga4-purchase.mjs
   ```

   The collector answers `204` whatever it is sent, so this validation endpoint is the only way to
   learn that the payload is wrong.
4. Use a **separate GA4 property for preview**. Sharing one puts test bookings into real revenue.
5. Register the custom dimensions, mark the key events, build the funnels, filter your own visits
   and link Search Console: **docs/ANALYTICS_SETUP.md** has the whole console checklist in order,
   and is the place to keep it rather than here.
6. Reconcile GA4 against the database monthly: `node scripts/analytics-reconcile.mjs`, because a
   dropped `purchase` is otherwise invisible.
7. Once live, add an "AI assistants" channel group so visits from AI answers are not counted as
   ordinary referrals. GA4 → Admin → Data display → Channel groups → Create new. Condition *Source
   matches regex*:
   `chatgpt\.com|chat\.openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com`
   Move it above "Referral".

---

## Pre-push checklist

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npm run build` — neither of the two above catches a client-only hook reaching a route
      handler, which is a build error and nothing less.
- [ ] `npm test` — with the local stack running, so the DB-backed tests actually execute. Expect
      **4 skipped**: the 4 are opt-in email tools, and one of them sends real mail. If you see 14
      skipped, the local stack is not running, and the two suites that need it did not run:
      `booking-concurrency`, the only automated proof against double-booking, and `purchase-once`,
      the proof that a confirmed booking is emailed and counted exactly once.
- [ ] Schema or content changed: applied to the remote **and verified** with `migration list`
- [ ] New migration: checked it works on a database built from migrations alone, with no seed
- [ ] `RELEASE_NOTES.md` updated
