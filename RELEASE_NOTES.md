# Villa 19 — Release Notes

This document covers all feature work, fixes, and notable changes to the Villa 19 / Habbaa booking site.

---

## v1.32 - Regenerate TypeScript types for booking_cutoff_date - 2026-10-20

`src/types/database.types.ts` was stale: migration 00097 added `booking_cutoff_date` to
`properties` but the types file was last regenerated before that migration. Regenerated from the
production schema so the types match what both databases actually have.

---

## v1.31 - next.config.js becomes next.config.mjs - 2026-10-20

A follow-up to v1.30, caught by the deploy script rather than by me.

The CommonJS config written in v1.30 used `require('@next/mdx')`, which this project's lint config
forbids (`@typescript-eslint/no-require-imports`). I had missed it: my verification piped
`npm run lint` through `tail -1`, which showed the last line and swallowed the error above it.
`scripts/make-deploy-zip.sh` lints before packaging and refused to build the archive, which is
exactly what it is for.

`.mjs` rather than adding a lint exception: native ESM needs no compilation either, so it keeps the
property that matters on a host whose glibc cannot load Next's native SWC, and it matches
`postcss.config.mjs` and `eslint.config.mjs`, which this project already uses.

Re-verified after the change: `tsc`, `eslint` and `build` clean, 136 passed / 4 skipped, and the
CSP still carries every host and directive, with HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy` and `Permissions-Policy` alongside it.

---

## v1.30 - The host's glibc is too old for a TypeScript next.config - 2026-10-20

First deployment attempt on Hostinger Business failed. The cause is not what the log leads with.

### What actually failed

```
@next/swc-linux-x64-gnu  -> /lib64/libm.so.6: version `GLIBC_2.29' not found
@next/swc-linux-x64-musl -> invalid ELF header
Downloading swc package @next/swc-wasm-nodejs...
Failed to load next.config.ts
Cannot find module '.../6ad7035f0d050.next.config'
```

The host runs a glibc older than 2.29, so Next's **native** SWC binary cannot load there. Next falls
back to its WASM SWC, and that fallback cannot load a **TypeScript** config: it compiles
`next.config.ts` to a temporary file and then immediately fails to resolve it.

This is a property of the host's operating system, not of the Node version. Selecting Node 22 alone
would not have fixed it.

### The fix: next.config.ts becomes next.config.js

A plain JavaScript config needs no compilation, so the failure mode disappears. CommonJS, because
`package.json` declares no `"type"`, and `require('@next/mdx')` returns the factory directly with no
`.default` interop.

Nothing about the configuration changed - only the language it is written in. The file keeps a
`/** @type {import('next').NextConfig} */` annotation so editors still type-check the object.

**Verified the part that would hurt silently**, that the Content-Security-Policy survived intact:
every host (`*.razorpay.com`, `googletagmanager.com`, `fonts.googleapis.com`, `fonts.gstatic.com`,
`*.supabase.co`, `google-analytics.com`) and every directive (`frame-ancestors 'none'`,
`base-uri 'none'`, `object-src 'none'`, `upgrade-insecure-requests`) is still served, along with
HSTS, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy`.

### And a correction to v1.29

`engines` was declared as `>=20`. **Supabase requires `>=22`** - every `@supabase/*` package emitted
`EBADENGINE` against the Node 20 the host selected, which my own declaration had permitted. I should
have checked transitive engine requirements before pinning it. Now `>=22`.

### scripts/make-deploy-zip.sh

GitHub deployment is unavailable on this hosting account ("temporarily disabled while managing
clients"), and the public-repository-URL path is blocked too, so every deploy is a manual upload.
This builds that archive reproducibly: typechecks and lints first and refuses to package a tree that
does not compile, excludes `node_modules`, `.next`, `.git`, the internal planning documents and -
most importantly - **every `.env*` file**, then verifies the result and deletes it rather than
leaving a dangerous archive behind if anything secret-shaped is found inside.

Its first run failed on exactly that check, having matched *itself*: the script carries the
secret-detection patterns as literal text. Now excluded from its own scan, with a note, because a
self-referential grep is worth saying out loud.

### Not yet known

The build died while loading the config, before bundling, so whether Turbopack's own native binary
also fails on this glibc is still untested. If it does, the next lever is `next build --webpack`.
If that fails too, the host's OS is simply too old for Next 16.

---

## v1.29 - Pin a minimum Node version before deploying from GitHub - 2026-10-20

Hosting moves to Hostinger Business, deploying from this repository on every push to `main`.
Hostinger offers Node 18.x, 20.x, 22.x and 24.x, and `package.json` declared no `engines` field, so
nothing would have warned if the build ran on 18 while development is on 22.

- `"engines": { "node": ">=20" }`. Advisory rather than enforced, but it is what a host reads to
  pick a runtime and what tells the next person which versions this is known to work on.
- `docs/HOSTINGER_GO_LIVE.md` added to the gitignored group, with the other internal planning
  documents. The repository is public.

### Checked while here, and one earlier claim corrected

`npm ls --depth=0` reports six extraneous packages (`@img/sharp-wasm32` and its emnapi / napi-rs /
wasm-util chain). I had attributed those to the `@supabase/ssr` uninstall in v1.21. That was wrong:
`npm ci` wipes `node_modules`, reinstalls from the lockfile alone, and brings the same six back, so
they are part of the lockfile's own tree - sharp's WASM fallback, hoisted where `--depth=0` cannot
attribute it to a top-level dependency.

So **`npm prune` is not required and would be wrong**: it would remove packages a clean install
restores, leaving local diverged from what the host builds.

Verified on a fresh `npm ci`, which is exactly what Hostinger runs: install succeeds, the lockfile
is unchanged by it, `sharp` loads (`next/image` needs it for the 50 gallery images), and the
lockfile holds zero references to `@supabase/ssr`. `tsc`, `eslint` and `build` clean; 136 passed,
4 skipped.

---

## v1.28 - Revert: the announcement bar goes back to its fixed promo line - 2026-10-19

Reverts v1.25 (`4ffb18e`) at the operator's request. The v1.25 entry stays below as a record that
the change shipped, because it did.

- `src/app/(site)/layout.tsx` returns to the fixed `ANNOUNCEMENTS` array: "Book directly and save
  15%. Use code: VILLA19".
- `getActivePromo()` and the `ActivePromo` type are removed from `src/lib/data.ts`. The layout no
  longer reads `discount_codes`.
- Verified: `tsc`, `eslint` and `build` clean, and `VILLA19` is back in the rendered home page.

**Worth knowing, not an objection.** Production's `discount_codes` table starts empty - `00062`
creates it without rows and the codes come from Ooruda Villa's production. So between launch and
Ooruda pushing `VILLA19`, the bar advertises a code that checkout will refuse with "This code is
not valid for this booking." If Ooruda pushes the code first, that window never opens.

---

## v1.27 - Validate the guest-count constraint wherever it is safe to - 2026-10-19

A health check of a database built from all 95 migrations - the exact thing production is about to
be - found one outstanding item and nothing else.

Clean: every `SECURITY DEFINER` function pins `search_path`, RLS is on for all 25 tables, `anon`
holds no INSERT, UPDATE or DELETE anywhere, `service_role` can read every table the app touches,
`supabase db lint` reports no schema errors, and the cron job, all seven functions and all four
triggers are present.

The one item was `bookings_guest_counts_sane`, left `NOT VALID` by `00093`. That was right at the
time - it had to run against the development database, which holds 37 test bookings of unknown
quality, and a migration that fails on legacy junk blocks the whole push. It is a poor resting
state though: the planner cannot rely on it, and `\d bookings` reports it as unverified, which
invites doubt later about whether the data is sound.

`00096` validates it conditionally, because the same migration runs against both databases:

| Database | Outcome |
|---|---|
| Production, and any fresh build | no rows, nothing violates, **validated** |
| Development, if its test bookings are clean | **validated** |
| Development, if any row violates | **skipped**, with a NOTICE naming the count |

A skip is not a silent failure: the constraint governs every write either way, and only the
retroactive scan is deferred. Verified all three paths, including that a `NOT VALID` constraint
still rejects a new violating row.

After `00096`, the health audit returns zero rows.

---

## v1.26 - Production moves to the Pro organisation - 2026-10-19

- `Villa 19 Production` was first created in the **Villa Project** organisation, which is on the
  Free plan - where point-in-time recovery is not available at all, so the setup plan's backup step
  could not have been satisfied there.
- Recreated as `wnmrxuggtfeaunacmztv` in **Naithodu Consulting** (Pro), `ap-south-1`, MICRO compute.
  Recreating rather than transferring was the cheap option precisely because the project was empty:
  no data, no keys in use, nothing pointing at it.
- There was also a sequencing constraint: a Free organisation caps at two active projects and the
  Villa Project org already had two, so the new production project had to leave before
  `Ooruda Development` could move in.
- `PROD_REF` updated in `scripts/db-push.sh`, with `DEPLOYMENT.md` and the setup plan following.
- Re-verified all four routing branches against the new ref. The abandoned
  `vluukungxufnnnpcusal` now falls through to "not recognised, refusing to push to an unknown
  project", which is the correct answer for a ref that is about to be deleted.
- `DEV_REF_SERVES_PROD` still `true`: Vercel has not been repointed, so `hlmqcdzazbrztfovixjk` is
  still what the deployment reads.

---

## v1.25 - The announcement bar advertised a promo code nothing checked - 2026-10-19

### The problem

The bar hardcoded both the code and the saving in `src/app/(site)/layout.tsx`:

```ts
{ text: 'Book directly and save 15%. Use code:', code: 'VILLA19' }
```

with no connection at all to the `discount_codes` table checkout validates against. Two ways that
goes wrong, and the first was about to happen deliberately:

- **Production will have no discount codes.** It is built from migrations, `00062` creates
  `discount_codes` empty, and the codes come from Ooruda Villa's production, which is not live yet.
  Every page would have told guests to use `VILLA19`, and checkout would have answered "This code
  is not valid for this booking."
- **Drift.** Deactivate the code, let it expire, or change it from 15% to 10%, and a hardcoded
  string keeps promising the old terms indefinitely.

### The fix

`getActivePromo()` in `src/lib/data.ts` reads the best code that is active and valid **today** at
the property's own date, and the bar is built from it. No code, no promo line - just the
reservations line. A code, and the line carries that code and its real value.

Only the code and the saving are advertised. A code can also carry `min_nights`,
`min_booking_value` and blackouts, and a one-line bar cannot state those honestly; checkout applies
them and explains any that bite.

### Verified

| State | Bar shows |
|---|---|
| No codes in the table | reservations line only, no promo |
| `EARLYBIRD` at 12% | "Book directly and save **12%**. Use code: **EARLYBIRD**" |
| Either state | no trace of the old hardcoded `VILLA19` or `15%` |

The 12% is the point: the figure comes from the row, not from a string.

### A caching trap found while testing it, which matters at cutover

Deleting the code and running a **full** `npm run build` still served the old page. Next prerenders
these pages at build time and its build cache keys on **source**, not on the data the pages read, so
an unchanged source tree reuses the cached render. `rm -rf .next/cache` and rebuilding produced the
correct page.

Vercel persists its build cache between deployments, so the redeploy that repoints production at the
new database can serve pages rendered against the **old** one - no source file changes, only
environment variables. Redeploy with "Use existing build cache" **off**. Recorded as step 11b in the
production setup plan.

---

## v1.24 - Villa 19 Production exists; the live-database guard deliberately stays on - 2026-10-19

- `scripts/db-push.sh` now carries the real `PROD_REF` (`vluukungxufnnnpcusal`, created 2026-10-19)
  in place of the `REPLACE_WITH_PROD_REF` placeholder, so the production path is reachable for the
  first time.
- **`DEV_REF_SERVES_PROD` stays `true`.** The plan said to flip it in the same change that set
  `PROD_REF`; that was wrong. The flag tracks *"is the dev ref still serving live traffic"*, not
  *"does a production project exist"*. Vercel has not been repointed yet, so the development
  database is still what guests read, and flipping the flag now would have removed the only guard
  protecting it. It flips in the same change that repoints the Vercel env vars.
- The script's own message said to flip it "once a separate production project exists", which is
  now exactly the wrong advice. Corrected to name the real condition.
- Verified all four routing branches against the new ref: production without `--production` is
  blocked; `--production` against a non-production ref is rejected; an unrecognised ref is refused;
  every path refuses in a non-interactive shell. Tested against a stubbed `supabase` binary in an
  isolated copy, so no path could reach a real project.
- `DEPLOYMENT.md` records both projects, which one currently serves guests, and the production push
  sequence including linking back afterwards.

---

## v1.23 - An open write path into the database, left behind by a retired form - 2026-10-19

Found while deciding the Data API settings for the new production project, by auditing which roles
hold which privileges rather than by reading code - which is why the first pass over `src/` missed
it entirely.

### What it was

`00007` created the `enquiries` table for the contact form and gave it both halves of a public
write:

```sql
CREATE POLICY "public_insert_enquiries" ON enquiries FOR INSERT WITH CHECK (true);
GRANT INSERT ON enquiries TO anon, authenticated;
```

The operator retired the contact form on **2026-10-13**. The table kept the open write path, and
nothing in `src/` has read or written it since - the only mention left is its generated row type.

That left an unauthenticated, unvalidated, unbounded `POST /rest/v1/enquiries` accepting any JSON
body as many times as you like. It does not pass through Next.js, so **the per-IP limiter added in
v1.21 does not see it**, and neither does any of the input validation in those routes.

Demonstrated against a local stack before fixing: `201 Created`, row written, using nothing but the
public anon key.

### Why it was not already being abused

This app ships no browser Supabase client - every query goes through the service-role client on the
server - so the anon key is never published anywhere. That is the only thing that made the endpoint
hard to find. Anon keys are designed to be public, and the protection disappears the moment anyone
adds a client-side query or shares the key.

### The fix

`00095` removes both halves, because either alone would stop the insert and leaving the other
implies an access level that is no longer intended:

- `DROP POLICY "public_insert_enquiries"`
- `REVOKE INSERT ON enquiries FROM anon, authenticated`
- `REVOKE SELECT ON enquiries FROM authenticated` - RLS had no SELECT policy to permit it anyway,
  so the grant only advertised access that did not exist

**The table and its data stay.** The live database has been taking enquiries since before the form
was retired and those are real messages from real people. `service_role` keeps `SELECT` so staff
tooling can still read the history.

### Verified

Against a database built from all 95 migrations:

| Check | Result |
|---|---|
| `anon` INSERT `/rest/v1/enquiries` | `401 permission denied` |
| `anon` SELECT `/rest/v1/enquiries` | `401 permission denied` |
| `anon` SELECT `/rest/v1/properties` | `200` - public content unaffected |
| `service_role` SELECT enquiries | `200` - history still readable |
| Any `anon` INSERT grant left in `public` | **none** |

If the contact form ever returns, it should come back through a validated, rate-limited server
route like every other write in this app, not a blanket grant to `anon`.

---

## v1.22 - A database built from migrations alone was missing the home page's tagline - 2026-10-19

Found while preparing the production database, which will be built from migrations and nothing
else. Three defects, all of which only show on a genuinely fresh build, which is why none had been
noticed.

### `supabase db reset` has not finished successfully in a long time

- It ended with `failed to send batch: ERROR: cannot insert multiple commands into a prepared
  statement (SQLSTATE 42601)` at the seeding step.
- The SQL was valid: `psql -f supabase/seed.sql` accepted it with `ON_ERROR_STOP=1`. The CLI sends
  statements over the extended protocol, one per message, and its splitter lost quote tracking on
  the file's two `E'...'` literals, whose only escapes were four `\'`. A splitter that understands
  `''` doubling but not E-string backslash escapes reads `\'` as a closing quote, and the next
  chunk it sends then contains two statements.
- Replaced those four with standard `''` doubling, which makes the `E` prefix unnecessary. No
  backslashes remain in any seeded text. Verified: the reset now runs to "Finished".

### The seed carried two amenity labels that migrations had since renamed

- `High-speed Wi-Fi` and `Private manicured lawn`, replaced by `High-speed internet` and
  `Private lawn` in `00084`.
- The upsert keys on `(property_id, label)`, so a renamed label does not conflict: the seed inserted
  the old wording as an extra row beside the new one, taking amenities from 27 to 29. This was
  invisible precisely because the seed had not been running.
- Both renamed in the seed. Back to 27.

### A fresh database had no tagline, and the home page renders it as a heading

- `00026` sets the tagline, but the `properties` row is not inserted until `00028`, two migrations
  later. On a database built in order, `00026` matches zero rows — **and an UPDATE that matches
  nothing still succeeds**, so the migration reported no problem.
- Every existing database got its tagline from `seed.sql`, and the remote was built when the row
  already existed, so only a build from migrations alone is affected. That is exactly what the new
  production project will be.
- `src/app/(site)/page.tsx:227` renders `{property.tagline}` as an `<h2>`, so production would have
  served an empty heading on the home page.
- `00094` sets it after the row exists, writing only where it is missing so it cannot overwrite a
  value later changed in Ooruda Villa.
- Checked the rest of the class: `00015`, `00016`, `00021`, `00023`, `00025` and `00027` also update
  `properties` before `00028` creates it. Every other column they touch is re-set by a later
  migration, so the tagline was the only value actually lost.

### Verified

A database built from **migrations only**, with the seed file moved aside, now produces: tagline
present, 27 amenities, 42 FAQs, 5 rooms, 50 images, 19 nearby places, correct rates and the `V19`
code prefix — identical to migrations plus seed. That is the configuration production will be built
in. `tsc`, `eslint`, `build` clean; 136 passed, 4 skipped.

---

## v1.21 - Security, accessibility and validation pass from a full application audit - 2026-10-19

A line-by-line review of `src/`, all migrations, `next.config.ts` and the build output. Everything
below was reproduced before it was changed and verified after, against a local database built from
every migration and against a production build in a real browser.

### The booking endpoint could be used to hold the whole calendar

- `POST /api/bookings/create-order` takes no authentication, and each call writes a `pending`
  booking that holds its dates for 15 minutes **before any payment exists**. `check_availability()`
  counts a live hold as blocking, so a hold is indistinguishable from a confirmed booking.
- A stay is capped at 10 nights, so roughly **19 non-overlapping requests blanket the six-month
  calendar**, and repeating that every 15 minutes keeps the villa reading as fully booked. Nothing
  in the request is hard to produce: the property id is public and the phone and email only have to
  match a shape.
- Added a fixed-window per-IP limiter (`src/lib/rate-limit.ts`): 10 create-order calls per 10
  minutes, 10 promo-code checks per 5 minutes.
- **10, not 4, because of who shares an IP.** Indian mobile carriers run large-scale CGNAT, so many
  subscribers leave through one public address. The two failure modes are not symmetric: throttling
  an attacker costs nothing, throttling a real guest mid-booking loses the sale. Ten leaves room for
  two or three genuine guests behind one carrier address.
- The counters live in one serverless instance's memory, so this blunts a single-source flood and
  does not stop a distributed one. The durable fix is a Vercel Firewall rule on those two paths; the
  limiter ships now because it is worth more than a plan.

### The promo-code endpoint was an enumeration oracle

- `/api/discount/validate` distinguished "not found or not active" from "has expired" from "reached
  its maximum number of uses". Those three answers tell an unauthenticated caller which codes exist
  in a 3-20 character space, and then their terms. `VILLA19` is published on the site, so the only
  codes worth discovering are the unpublished ones.
- All three now return one message: "This code is not valid for this booking."
- The minimum-nights and minimum-value messages stay specific on purpose. They only ever describe a
  code the caller already named correctly, and without them "not valid" is unactionable when the fix
  is one more night. Verified: a valid code still applies and recalculates GST; an expired one is
  now byte-identical to a code that does not exist.

### Keyboard focus was invisible on the date picker

- `DatePicker` set `outline: 'none'` inline on its trigger and on every day cell. An inline style
  beats the site's `:focus-visible` rule whatever its layer, the trigger's glow was keyed to
  `isOpen` rather than focus, and the day cell's was set in `onMouseEnter` — mouse-only. So tabbing
  across the primary control of the booking flow showed nothing at all. It is a `<button>`, so there
  is no text input to fall back on.
- Both removed. Verified in a browser: tabbing to the trigger now paints `solid 2px rgb(168,116,50)`,
  the site's brass ring.
- Every other `focus:outline-none` in the codebase was already paired with a ring. These two were
  the only bare ones.

### Two dialogs declared `aria-modal` and did nothing to earn it

- The date-picker popup and the mobile nav drawer never moved focus in, never trapped it and never
  restored it, and the drawer had no Escape handler. The picker portals to `document.body`, so Tab
  from the trigger jumped past the whole page.
- Both now follow `PhotoViewer`, which already did this correctly.
- **Escape inside the booking pop-up used to throw away the pop-up as well as the calendar.** The
  pop-up is a native `<dialog>` opened with `showModal()`, where Escape is a browser close request,
  not an ordinary key event, so stopping propagation did nothing to it. The picker's handler now
  calls `preventDefault()`. Verified: one Escape closes the calendar and returns focus to the
  trigger with the pop-up still open; a second closes the pop-up.

### Dates and guest counts were never checked on the server

- Nothing rejected a **check-in in the past**: the pricing engine only checks range order and the
  night cap, `check_availability` has no opinion on dates that have gone, and the only constraint
  was `check_out > check_in`. A crafted POST could create and pay for a stay in 2019.
- Nothing rejected **zero, negative or fractional guest counts**. The pricing engine floors extra
  guests at zero, so a negative count priced at the base rate and stored a booking for minus five
  people; a non-numeric value made the total `NaN`, which compares false against the occupancy
  ceiling and slipped past it.
- Now refused in the route *and* in `create_booking_atomic` (`00092`), because the function is the
  one place every booking path goes through, with a table-level floor in `00093` for writes that do
  not use it (Ooruda's offline and OTA bookings).
- `00093` is `NOT VALID`: it applies to new rows, because this database has been serving as both
  development and production and may hold test rows. `VALIDATE CONSTRAINT` once those are cleaned.
- The past-date rule cannot be a `CHECK` constraint: `CURRENT_DATE` is `STABLE`, not `IMMUTABLE`,
  and a row that was legal when written must stay legal.

### "Today" was computed three different ways for discount validity

| Layer | Was | Now |
|---|---|---|
| `create-order` | `todayISO()` (IST) | unchanged, it was right |
| `/api/discount/validate` | `toISOString()` (UTC) | `todayISO()` |
| `create_booking_atomic` | `CURRENT_DATE` (UTC) | `(now() AT TIME ZONE 'Asia/Kolkata')::date` |

Between 00:00 and 05:30 IST all three disagreed, so a code on its first valid day was shown as
expired, and one on its last valid day was accepted by the browser-facing check and then rejected
inside the transaction, after the guest pressed Pay.

### Content-Security-Policy, and the one that nearly shipped broken

- Added CSP and HSTS. `script-src` is limited to this origin, Razorpay and Google Tag Manager;
  `frame-ancestors 'none'`, `base-uri 'none'`, `object-src 'none'`.
- `script-src` and `style-src` keep `'unsafe-inline'`, deliberately. Nonces need middleware, and
  reading a request header in middleware forces every page to render dynamically, which would trade
  the whole static-rendering strategy for one directive. The app has no user-generated HTML.
- **The first version broke Razorpay and the browser caught it:** listing only
  `checkout.razorpay.com` loads the modal but blocks the risk-detection bundle it pulls from
  `cdn.razorpay.com`. Now `https://*.razorpay.com`, since Razorpay can add hosts under its own
  domain without telling us. Verified: zero CSP violations on `/book`, `window.Razorpay` present,
  risk bundle loaded.
- `CSP_REPORT_ONLY=1` switches to report-only for testing a future change.

### `SECURITY DEFINER` without a pinned `search_path`

`check_availability()` and `expire_stale_booking_holds()` were defined in `00010` without
`SET search_path`, while every other definer in the schema sets it and `00005` exists specifically
to fix this class of defect. `00091` re-creates both with byte-identical bodies and the attribute
added. Verified: all four definers now report `{search_path=public}` in `pg_proc.proconfig`.

### Content pages were frozen at build time

Only the homepage carried a revalidation period. Every other content page is prerendered, reads live
content from Supabase, and had no refresh path but Ooruda calling `/api/revalidate` — which 503s
when `CONTENT_REVALIDATE_SECRET` is unset. All now carry `revalidate = 86400`, so a missing webhook
degrades to "a day behind" rather than "frozen until the next deploy". The webhook is still the fast
path.

### Smaller things

- **Unbounded free text.** `guest_name` and `guest_email` are `VARCHAR(255)`; neither input nor
  route capped them, so a long value reached Postgres, raised "value too long", and came back as the
  generic 503 "Booking could not be created." Capped at 120 and 254, in the form and the route.
- **Check-in could be any date, arbitrarily far out.** Both pickers set `min` and no `max`, and the
  forward month arrow was unbounded while the back arrow stopped correctly. Past the six loaded
  months, cells render with no price and no availability marking, so they look bookable. Added
  `BOOKING_HORIZON_MONTHS` (12, **a placeholder the operator should set**). Verified: the calendar
  now stops at October 2027.
- **"1 adults" on the payment screen.** The checkout hardcoded plurals; the confirmation page
  already got this right. Verified: "1 adult, 1 child".
- **A `<label>` pointing at a `<span>`.** `htmlFor="ds-guests"` referenced a `<span>`, which is not
  labelable, so the Guests label was associated with nothing. Now a `role="group"` with
  `aria-labelledby`.
- **No skip link.** Every page put the announcement bar and full nav ahead of `<main>`. Added one,
  plus the `id="main-content"` target — including on the two checkout branches that had no `<main>`
  element at all, which only showed up because the skip link had nothing to point at.
- **Cookie consent could not be revisited.** The banner hid for good once answered, so a guest who
  declined could never accept and one who accepted could never withdraw. Added "Cookie Preferences"
  to the footer, shown only once a choice exists.
- `/about` and `/contact` are indexable but were missing from `sitemap.xml`. `/testimonials` stays
  out because it genuinely sets `noindex`.
- Dropped `@supabase/ssr`, imported nowhere, and removed `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
  `.env.example`: every query uses the service-role client and the anon key is read nowhere in
  `src/`.
- `npm run supabase:studio` opened port 54323; `config.toml` says 54333.
- Internal review documents are gitignored. This repository is public, and a map of what was weak is
  not something to publish alongside the fixes.

### Migrations

| Migration | Purpose |
|---|---|
| `00091_security_definer_search_path.sql` | Pin `search_path` on the two definers that lacked it |
| `00092_booking_ist_dates_and_past_guard.sql` | IST discount window; refuse past check-ins and bad guest counts |
| `00093_booking_guest_count_constraints.sql` | Table-level floor on guest counts (`NOT VALID`) |

### Verification

`tsc`, `eslint` and `next build` clean. `npm test` with a local stack: **136 passed, 4 skipped**,
up from 126 passed and 14 skipped — the 10 newly running are the DB-backed files including
`booking-concurrency`, the only automated proof that `create_booking_atomic` cannot double-book. The
4 that remain skipped are opt-in email tools, one of which sends real mail.

Also confirmed directly against the database: past check-in, zero adults and negative children are
all refused, a valid future booking still succeeds, and the table constraint blocks a direct insert
that bypasses the function.

### Known, not fixed here

- **There is still no production database.** `scripts/db-push.sh` records it: production serves the
  development project. Tracked separately.
- **GST invoice numbers are allocated but no invoice is issued.** `00038` assigns `invoice_number`
  on every paid booking and `src/lib/invoice.ts` has no caller. Needs an owner's decision, since it
  touches a statutory series.
- `supabase/seed.sql` fails with "cannot insert multiple commands into a prepared statement". The
  content migrations carry everything, so a fresh database is complete without it, but the reset
  *looks* failed when it is not.

---

## v1.20 - Booking confirmations name all three policies, not just cancellation - 2026-10-19

### The change
- The confirmation email ended its cancellation block with "Refer to our **Cancellation Policy**
  for more details." That is now **"Please note that this booking is subject to our Privacy
  Policy, Terms of Service and Cancellation Policy."**, with all three linked.
- It applies to **all three refund states**, which is what a guest can receive: fully refundable,
  partially refundable and non-refundable. The sentence is built once and appended to the
  cancellation paragraph in each, so the three cannot drift apart again.
- In the two refundable states the sentence replaces only the closing line: the refund address and
  the 5-to-7-working-day processing note are unchanged and still come first.

### Why it needed new context fields
- The template knew only `cancellationUrl`. `privacyUrl` and `termsUrl` are now part of
  `BookingConfirmationContext`, set in `src/lib/booking-notify.ts` and in the preview/test fixture
  exactly as the cancellation link already was. All three pages already existed at `/privacy`,
  `/terms` and `/cancellation`.
- These are the first policy links the emails have carried at all.

### The links follow the booking, they are not hardcoded
- Every guest link is built from `guestLinkBase(booking.origin_url)`, the origin the browser sent
  when the order was created, checked against the allowlist in `src/lib/origin.ts`. Verified:

  | Booked on | Policy link |
  |---|---|
  | `http://localhost:3000` | `http://localhost:3000/privacy` |
  | `https://villa-booking-psi.vercel.app` | `https://villa-booking-psi.vercel.app/privacy` |
  | `https://villa19.in` | `https://villa19.in/privacy` |
  | nothing recorded | `SITE_URL`, i.e. `APP_URL` or `https://villa19.in` |
  | a spoofed origin | `SITE_URL`, never the spoofed host |

- So a test booking made on the dev deployment links to the dev deployment, and nobody can get a
  confirmation sent from our verified domain to carry a link to theirs.

### Plain text
- The HTML links the three names inline; the text part cannot, so it prints the same sentence and
  then lists the three URLs beneath it.
- The blank line before the sentence is produced in one place for all three states. A first attempt
  moved it and gave the non-refundable mail two blank lines where the others had one.

### Checked
- All three states rendered and read back: one policy sentence each, all three links present and
  pointing at `/privacy`, `/terms` and `/cancellation`, and the old "for more details" wording gone
  from both the HTML and the text.
- Full suite green: 136 passed, 4 skipped.

## v1.19 - The drone reel re-encoded from the square master - 2026-10-16

### The sharpness the operator flagged
- **The reel is re-encoded at CRF 31, up from CRF 38**, which is what v1.17 left open: "the
  operator's concern is the sharpness lost to that compression". 6.11 MB, up from 3.27 MB. Judged
  on 100% crops against the master: CRF 38 smears the aerial roof-tile courses into flat bands,
  CRF 34 holds most of the ridging, CRF 31 is close to indistinguishable. SSIM against the master
  over all 1420 frames: 0.910 at CRF 38, 0.939 at 34, 0.955 at 31.
- The static shots barely separate the three. Foliage and tile texture under a moving camera are
  what the bitrate is actually spent on, which is why the loss was visible but hard to point at.
- `-preset veryslow` rather than `slow`. Free detail at the same CRF: the old recipe's CRF 38 at
  veryslow comes out *smaller* than the shipped CRF 38 at slow (3.01 MB against 3.27 MB).

### The crop guidance from v1.15 is inverted and does not transfer
- **The new master is 1080x1080 square, not 1080x1920 vertical.** `crop=1080:720:0:600` is not
  merely wrong now, it is invalid: 600 + 720 runs past the 1080-row bottom.
- **An upper-biased crop is now the right one, `crop=1080:720:0:90`.** v1.15 recorded that an
  upper bias was tried and rejected because it decapitated the VILLA19 signage; that was true of
  the vertical source. On the square master the opposite holds. Checked at t=32s, where the
  signage sits highest: y=270 loses it completely, y=180 jams it against the top edge, y=90 places
  it cleanly. Confirmed at t=0 and t=44 as well.
- **Everything else carried over unchanged.** The trim is still `0 - 47.333`: frame-stepping the
  cut, the night shot holds to 47.300 and the logo end card is up at 47.333, exactly as before.
  Same 2s fade-out, same absence of a fade-in (frame 0 is the poster, so a fade-in would flash the
  cell black on load), same AAC 96k, same faststart.
- The carrom-board shot is still in the cut. Removing it means stitching, and v1.15 records that
  the soundtrack jumped audibly at every join.

### The soundtrack cut hard at the loop
- **The picture faded but the audio did not.** The new master's soundtrack is still at full level
  where the old one had already tapered: -11.2 dB at 47.2s against the old file's -26.2 dB. The
  clip then loops to frame 0, which is -49.2 dB, so an unmuted guest heard the music chop off on
  every pass. v1.15 rejected a whole edit over exactly this - "the soundtrack audibly jumped at
  each join" - so a hard cut once a loop is no better.
- **`afade=t=out:st=45.33:d=2`**, matching the picture's fade rather than inventing a second
  timing. -38.9 dB at 47.2s now, which meets the near-silent opening cleanly.
- Applied as an audio-only re-encode with `-c:v copy`: the video bitstream's MD5 is unchanged, so
  the picture is bit-for-bit the encode judged above.

### A timecode track rode along from the QuickTime master
- The master is `.mov` and carries a timecode track, so the encode came out with a third `tmcd`
  stream the previous file never had. `-dn` and an explicit `-map` do not remove it: the mp4
  muxer *generates* it from the video stream's timecode metadata rather than copying an input
  stream. `-write_tmcd 0` is what drops it.

### Poster
- **Regenerated from frame 0 of the shipped file**, not from the master: the cell paints the
  poster until the first frame decodes, so the two have to be the same image. 131 KB, up from
  84 KB - the new frame carries more foliage detail at the same JPEG quality.

### The recipe, for next time
```
ffmpeg -i MASTER.mov -t 47.333 \
  -vf "crop=1080:720:0:90,fade=t=out:st=45.33:d=2" \
  -c:v libx264 -preset veryslow -crf 31 -pix_fmt yuv420p \
  -af "afade=t=out:st=45.33:d=2" \
  -c:a aac -b:a 96k -write_tmcd 0 -movflags +faststart \
  public/video/villa19-hero.mp4
ffmpeg -i public/video/villa19-hero.mp4 -frames:v 1 -q:v 4 \
  public/video/villa19-hero-poster.jpg
```
The crop offset is a property of the master's framing, not a constant. Re-derive it against the
signage before reusing this.

---

## v1.18 - The photo viewer showed the wrong caption and mis-parked its arrows, and Room 4 came before Room 3 - 2026-10-16

### The viewer printed a different caption from the tile you clicked
- **It printed `alt_text`, not the caption.** Every tile in the gallery and the mosaic shows the
  operator's own label, so a guest clicking "Front view at night" landed on a photograph captioned
  "The front of the villa lit up at night, with the porch and the driveway in front of it".
- The viewer now prints `caption ?? alt_text`, which is what the tiles show. `alt_text` stays on
  the `img` for screen readers, which is what it was written for.

### Both arrows sat outside the photograph
- **They were positioned against the column, not the photograph.** The box was `w-full max-w-5xl
  flex-1` and the photograph `object-contain` inside it, so the two only coincided when the window
  happened to match 3:2. Measured at 1024x768: the column ran 24 to 1000, the photograph painted
  65 to 960, and the arrows sat at 32-76 and 948-992. Each one hung in the dead scrim and clipped
  the photograph's edge, and the gap grew as the window got wider.
- **The box now carries the photograph's own aspect ratio**, taken from the row's `width`/`height`,
  so it *is* the photograph and `object-contain` has nothing to letterbox. Measured after: arrows
  8px inside the photograph's real edges, left and right, and dead centre vertically, at 1024x768,
  1600x620 and 375x812.
- It also fixes the "Around Villa 19" photographs, which are 1600x1066 and 1594x1062 rather than a
  clean 3:2 and had always been letterboxed by a hair.

### Mobile had four WhatsApp buttons and one phone number
- The fixed CTA bar, the nav drawer, the "Planning Your Stay?" card and the footer all offered
  WhatsApp. Calling appeared once, in the card.
- **The card is now `md` and up only**, which is exactly where the bar and the drawer stop (both
  are `md:hidden`): no width shows all three, and none shows neither. It stays on desktop, where
  there is no bar and no drawer and it is the only contact point between the hero and the footer.
- **The drawer's second button is Call instead of WhatsApp Enquiry.** On a phone the drawer and the
  bar are on screen together and the bar's Enquire Now is already WhatsApp, so offering it twice
  crowded out the one channel with no always-reachable button of its own.
- It is styled `btn-secondary btn-secondary-solid`, not the `btn-wa-ghost` the WhatsApp button
  used: that class is WhatsApp green, and a phone number is not WhatsApp. Both classes were defined
  in the design system and had never been used; `-solid` exists for this exact ground, where a
  transparent fill reads as washed out.
- `Header` no longer takes `whatsappUrl`, and its inline WhatsApp icon is gone with it. The Footer
  still uses both.
- **One thing was lost**: "We usually reply on WhatsApp within an hour during the day" lived in
  that card and is now desktop-only. It belongs next to a WhatsApp button, and on mobile the
  remaining one is in the fixed bar, which has no room for a sentence.

### Room 4 came before Room 3, and it was chance
- **All four bedrooms sat at `display_order` 1.** 00028 created them without naming the column, so
  each took the schema default of 1, and its `ON CONFLICT` clause does not set it either.
  `seed.sql` does give 1, 2, 3, 4, but with `ON CONFLICT (id) DO NOTHING`, so it never corrected
  the existing rows. Only the Private Lounge, inserted separately with 5, was ever ordered on
  purpose.
- `ORDER BY display_order` on a four-way tie has no defined result. The order could differ between
  queries, after a vacuum, or after any write to the table, so this was not stable and not
  reproducible: it simply looked fine whenever it happened to come back sorted.
- 00090 sets 1 to 5 by slug, and `getRooms` now sorts by `display_order` then `name`, so a tie
  introduced later degrades to alphabetical rather than to chance.
- Checked the other ordered tables for the same fault: `property_images`, `property_amenities`,
  `faqs` and `nearby_places` all have distinct `display_order` values. `rooms` was the only one.

## v1.17 - The whole villa gallery reshot, and two guessed choices made explicit - 2026-10-16

### What the operator delivered
- **39 photographs in five numbered folders**, plus `Headings_Photos.docx` with one label per
  photograph in the same order, plus two folders naming the photographs for the homepage mosaic
  and for each room card. Folder names are the gallery sections, and the number prefix on each
  file is its place within that section.
- The delivery answers the list 00067 left behind. That migration had deleted all fifteen vertical
  frames and noted the subjects that needed landscape ones at the next shoot. The bathrooms are
  back, as three landscape frames, each a pair of vertical photographs joined side by side.
- **Gallery: 41 photographs to 50** (39 of the villa, plus the 11 neighbourhood ones, untouched).

### Aspect ratio: eight frames cropped by hand
- Thirty-one arrived at 3:2 and are used whole. Eight arrived at 16:9, and every tile and mosaic
  cell is 3:2, so a browser `object-cover` would have taken 16% off each side with no say in where.
- **Each of the eight was cropped to 3:2 one at a time, with the window chosen for that photograph**,
  at the operator's request (2026-10-16: "this is delicate work"). Not one is a centre crop by
  default:
  - the three aerials are cropped from the left edge, which drops the neighbouring apartment block
    that otherwise competes with the villa for attention;
  - the wide hall frame is right-aligned, because a centre crop sliced the right pillar down the
    middle and broke the arch's symmetry; the television at the left edge is shown whole in the
    frame beside it;
  - the long dining frame is cropped from the left, which drops a blank wall and keeps the table,
    the staircase and the wash basin;
  - the table setting is cropped so the flowers fall on the right third;
  - the Buddha alcove is cropped dead centre, because the composition is symmetrical.
- All 39 are 1600x1067, saved without EXIF, so without GPS. Total 13 MB for 50 photographs.

### Room identity corrected
- **00063 had Rooms 1 and 2 the wrong way round**, and the operator's new labelling reverses it:
  Room 1 is the terracotta room with the attached bathroom and the glass display cabinet, Room 2
  the terracotta room with the bird print and the windows. Both rooms are terracotta, which is how
  the two came to be swapped.
- This mattered more than a caption: Room 1 is the only room with an attached bathroom, so a guest
  choosing it on the Rooms page was looking at the other room.

### Two guessed choices made explicit
- **`home_order`.** The homepage mosaic took the first four photographs by `display_order`, so
  00063 had to thread low display_orders through the sections to steer it, which fought with the
  section ordering. The operator named the four, so they are named in the data and `display_order`
  is now nothing but gallery order.
- **`is_room_cover`.** The Rooms page showed whichever linked photograph happened to sort first.
  The operator named one per room, so the choice is recorded instead of incidental. A room with no
  cover marked still falls back to its first linked photograph.

### Sections
- **Parking is gone as a section.** Its one photograph in the delivery ("Closed Parking") is filed
  under Outdoor Spaces, so it lives there. The `parking` category stays in the database constraint,
  where another property may still use it.
- Captions are the operator's own labels from the docx, verbatim, including where two adjacent
  photographs carry the same one. `alt_text` stays the longer plain-English sentence the viewer
  prints and a screen reader reads, rewritten to match the new frames.

### Twelve photographs dropped
- No counterpart exists in the delivery for the coffee station, the first-floor landing and its
  carrom board, the garden and courtyard at night, the entrance gate, the open parking courtyard,
  the lounge seating detail, or four bedroom and terrace frames. The operator confirmed the
  delivery is a complete replacement.

### Seed
- **`supabase/seed.sql` was re-inserting 17 photograph rows for files that no longer exist**,
  pre-dating this change: every reshoot since 00046 deleted the villa's rows in a migration, and
  the seed put a stale copy of the old set back on the next local reset. The seed now carries the
  neighbourhood photographs only; the villa's own belong to the migrations.
- Unrelated and still open: `supabase db reset` fails part-way through seeding with
  `cannot insert multiple commands into a prepared statement`. It fails identically on the previous
  commit, so it is not from this work. The migrations apply cleanly and carry the photographs.

### Still to do
- **The drone reel.** The new file is the same clip, 1080x1920 and 50s at 29 MB; what ships is a
  1080x720 centre crop at 3.4 MB. The operator's concern is the sharpness lost to that compression,
  and the new master is a better source to re-encode from. Deferred by the operator until the rest
  landed. **Done in v1.19**, from a square master rather than the vertical one described here.

## v1.16 - The mobile footer was behind the CTA bar, and the rule meant to stop that never ran - 2026-10-14

### Footer clearance, and why the existing fix was invisible
- **The last footer row sat 31px behind the fixed CTA bar, unreachable by scrolling.** The
  copyright line ended at 772px with the bar starting at 741px. The page therefore had no visible
  ending, which is what a review flagged as feeling abrupt.
- **A rule to prevent exactly this already existed and had never applied.**
  `body:has(#mobile-cta-bar) .footer-inner { padding-bottom: 6rem }` lived in `@layer components`.
  Tailwind v4 orders `utilities` after `components`, so `.footer-inner`'s own `pb-10` won on *layer
  order*, which no amount of selector specificity can beat. `.footer-inner` computed to 40px, not
  the 96px the rule asked for.
- The rule's own comment reasoned about specificity ("an id selector beats a class"), which is true
  and irrelevant across layers. That is why it looked correct and did nothing.
- **Moved the rule out of the layer entirely.** An unlayered rule beats every layer. It keeps its
  `max-width: 767px` scope and its `:has(#mobile-cta-bar)` scope, so the padding still applies only
  below md and only on the one page that renders the bar. Verified: homepage 96px, `/rooms` 40px,
  desktop 56px.
- A first attempt put `pb-28 md:pb-10` on the Footer component instead. That was wrong and is not
  what shipped: the Footer is shared, so it would have added ~112px of dead space to the bottom of
  every page that has no bar.

### Mobile booking widget
- **Hidden below md.** It was rendering at 80% page depth, after the FAQs, because the desktop
  right rail falls to the end of the flow when the grid collapses to one column. Nobody scrolls
  5,000px to reach a form the fixed bar already offers.
- Nothing is lost: the bar carries the same two actions, and its Book Now opens the date dialog
  rather than needing dates chosen first.
- The breakpoint matches the bar's own `md:hidden` deliberately. Hiding at `lg` would have left
  tablets between 768px and 1024px with neither the widget nor the bar.
- The mobile page is 5,894px, down from 6,618px, and now closes on the contact card rather than a
  half-filled booking form.

### Migration safety
- **`db-push.sh` treated the live database as staging.** Production was never created, so Vercel
  production points at the dev ref; the script's "safe" path pushed to it with no confirmation, and
  its typed-confirmation path was unreachable behind a `REPLACE_WITH_PROD_REF` placeholder.
- It now treats that ref as live while `DEV_REF_SERVES_PROD` is set: a warning, a typed `yes-live`,
  and an outright refusal in a non-interactive shell, which is how the previous push slipped
  through unprompted. One flag to flip when a real production project exists.

### Copy
- The applied-promo line uses a colon rather than an em dash, which app-facing copy does not use.

---

## v1.15 - Hero video, and a security deposit that said three different things - 2026-10-14

### Homepage hero
- **The mosaic's hero cell now plays the drone reel instead of a photograph.** Muted, looping and
  `playsInline`, with a sound toggle bottom-left. `muted` is set as a DOM property rather than the
  JSX attribute: React drops it often enough that autoplay silently fails, and autoplay is only
  permitted while muted. A `prefers-reduced-motion` listener pauses it, and unmuting overrides that
  pause, since asking for sound is a deliberate gesture.
- **The source is a finished vertical reel (1080x1920, 50.8s), not raw footage**, so it is encoded
  already cropped to the 3:2 cell - `crop=1080:720:0:600` - rather than letting the browser decode
  1920 rows and discard two thirds of them. An upper-biased crop was tried and rejected: it
  decapitates the VILLA19 signage in several shots.
- **An earlier cut stitched three segments** to skip a carrom-board shot and a cityscape. It was
  tighter and 2.1 MB, but the soundtrack audibly jumped at each join. Continuity won: the clip is
  now one continuous trim, `0 - 47.33`, 3.3 MB at CRF 38. Only the logo end card is dropped, because
  it would strobe on every loop.
- **Fade-out at the end, deliberately no fade-in.** The fade stops the loop hard-cutting from a night
  shot into bright daylight. A fade-in cannot be used: it makes frame 0 black, and the poster is
  frame 0, so the cell would flash black on load.
- No WebM sibling. At matched quality libvpx came out 3-4x *larger* than x264 here - VP9's CRF
  numbers are not on the same scale as x264's - and H.264 already has universal support and
  hardware decode.
- The reel takes the hero slot, so the tiles now start at the first photo rather than skipping it,
  and the first two carry `priority`, which the hero image used to hold.

### Gallery brightness
- **The four tiles beside the hero were dimmed by a flat `bg-black/15` that served nothing.** The
  hero's gradient is a scrim with a job - it sits under the "Show All Photos" button - but the tiles
  carry no text at rest, since the caption is `opacity-0` until hover. It was darkening photography
  for no reason.
- It was also broken for most visitors: the brighten-on-hover payoff is inside `@media (hover: hover)`,
  so on a phone the tint never lifted. And pure `#000` contradicts a palette that deliberately avoids
  it everywhere else, `--ink` being `#1A1208`. Removed; hierarchy was already carried by the hero
  being four times the area.

### Security deposit, said three ways
- **The same policy appeared in four places and disagreed in three of them.** The new FAQ says it
  *is collected*, the email's plain-text part said *is collected*, the email's HTML part still said
  *might be requested*, and `SECURITY_DEPOSIT_TERMS` said *where applicable, will be collected*.
- The HTML and text halves of one email contradicting each other is the worst of these: which one a
  guest sees depends only on their mail client. `SECURITY_DEPOSIT_TERMS` renders on the homepage
  directly alongside the FAQ that now contradicted it.
- All four now state that a fully refundable deposit is collected at check-in. The terms block keeps
  its extra detail (inspection, 5 working days, original payment method) and drops the now-redundant
  second "refundable".

### Confirmation email
- **The extra-guests row is qualified with a count**, "Extra guests, 2", matching "Stay, 1 night".
  The count is derived at send time as guests above base occupancy, the same way the pricing engine
  worked out the amount, because the booking row stores the charge but not the headcount.
- The additional-guests note was reworded on the booking widget but not in the email; they match again.

### Booking widget
- The extra-guest rate is now stated on the card, including the second tier where one applies, so a
  guest pricing a party of 12 does not have to fill the form to discover it.

### Nearby places and copy (00086, 00087, 00088)
- Renames to full/correct forms: Kadri Manjunatha, Kudroli Gokarnanatheshwara, Gokula Kalyana
  Mantapa, Mangalore Railway Station, Mangalore Airport, Supermarkets.
- Removed Sharavu Mahaganapathi Temple, Nilgiris and KSRTC Bus Stand. Added Naturals Sundaes.
- The temple category renders as "Places of Worship" on The Villa page.
- Checkout's special-requests placeholder no longer suggests dietary restrictions.

---

## v1.14 - Email images, actual root cause - 2026-10-14

### Confirmation email badge
- **v1.13 made this worse, and the mechanism is worth recording.** `VERCEL_URL` names the host
  running the build, so it certainly holds the file - but it is the *deployment-specific* hostname,
  and Vercel's deployment protection puts those behind a login. Webmail's proxy got an auth page
  instead of a PNG. It loads perfectly in a browser that already carries the session, which is
  exactly why checking it by hand would not have caught it. It is no longer used.
- **It also overrode a correct setting.** `APP_URL` had by then been set to the preview alias, which
  is public and does serve the file, so v1.12's logic would have worked; v1.13 replaced that good
  value with the protected one.
- **A missing import was being swallowed by a bare `catch`.** Rewriting this block for v1.13 dropped
  `import { SITE_URL }`, so the reference threw at runtime, the `catch` returned the fallback, and
  the result looked like ordinary misconfiguration rather than a broken module. The `catch` is now
  narrowed to `TypeError` from `new URL()` and rethrows anything else.
- **Resolution now reads `APP_URL` directly rather than `SITE_URL`.** `SITE_URL` substitutes the
  canonical domain when `APP_URL` is unset, which is correct for a sitemap and wrong for an image:
  an unconfigured environment would have addressed the badge to a domain nobody had claimed was
  serving yet. Only an explicitly set value is trusted, and only when it is https and not loopback.
- Ten regression tests now cover all three shapes that shipped broken, plus the unset case.

---

## v1.13 - Email images follow the running deployment - 2026-10-14

### Confirmation email badge
- **v1.12 fixed the localhost case and missed the one that was actually live.** The deployment
  leaves `APP_URL` unset, so `SITE_URL` resolved to `villa19.in` (visible in the preview host's own
  `robots.txt`). The guard only rejected localhost, so it saw a public host, trusted it, and pointed
  the badge at a domain still parked at the registrar, which answers `200` with `text/html` for
  every path. The send looked healthy and the image was broken.
- **The mistake was conceptual, so the fix removes the source rather than widening the guard.**
  `APP_URL` is the canonical address we want indexed; it is not a promise that anything is serving
  it. The asset is served by this app, so the host running the build always has it: on Vercel that
  is `VERCEL_URL`, whatever the canonical domain happens to be doing. `EMAIL_ASSET_BASE` now reads
  `EMAIL_ASSET_BASE_URL`, then `VERCEL_URL`, then a known-good public fallback, and `APP_URL` can no
  longer reach an image URL at all.
- **Seven regression tests** in `emails/__tests__/asset-base.test.ts` pin this down, including the
  two shapes that shipped broken: a localhost `APP_URL` and a healthy-looking but unserved domain.

---

## v1.12 - Email images load off a host webmail can reach - 2026-10-14

### Confirmation email badge
- **The success badge pointed at APP_URL, which is localhost in development.** The circle itself
  came out correct after v1.11, but the tick inside it was a broken-image icon on every test send.
  Gmail and the other webmail clients fetch images through their own proxy, from their servers and
  not the reader's browser, so `localhost:3000` resolves to the proxy and never to the machine that
  sent the mail. No markup fixes that; the host has to be public.
- **`villa19.in` was not a working source either.** It answers `200` with 32KB of `text/html` - the
  parked Hostinger page - rather than the PNG, so production would have been broken too, and more
  quietly than a 404 would have been.
- **Images now resolve through `EMAIL_ASSET_BASE` in `lib/emails/html.ts`**, which is deliberately
  separate from the APP_URL every *link* in the email uses. A public APP_URL is used as-is, so
  production and previews are unaffected; a local one falls back to the always-deployed preview
  host, so test sends render. `EMAIL_ASSET_BASE_URL` overrides both, which is also the escape hatch
  if the canonical domain is ever serving something other than this app.
- Verified across all five cases: localhost, the preview host, `villa19.in`, an explicit override,
  and APP_URL unset.

---

## v1.11 - Confirmation email on mobile, production domain - 2026-10-14

### Booking confirmation email
- **The green success badge is an image now, not a character.** On Gmail for Android it had been
  rendering as a vertical oval at every size we tried. Measuring the badge across three sends gave
  width:height ratios of 0.759, 0.768 and 0.769 — near identical, which ruled out a fixed overflow
  (that would shrink proportionally as the box grew) and pointed at a height proportional to
  `font-size`. Working back through the device scale, the height was about 2.7x the font-size while
  the cell's own `height` and `line-height` were ignored outright. The cause is that U+2713 is
  absent from Roboto, so Android resolves it in a fallback symbol font whose line box is far taller
  than the text font's. No CSS on a text glyph survives that, and tuning `font-size` would only fit
  one device's fallback font. The badge is now `public/email/success-tick.png` at 22px with 13px of
  padding each side, so the 48px circle is built from fixed values and nothing depends on font
  metrics. A blocked image keeps its reserved 22px, so the circle still renders with the tick
  simply absent.
- **Labels no longer collide with their values.** Neither the details table nor the "If you need us"
  table set any right padding on the label cell, so "WhatsApp" ran straight into the phone number.
  "Email" only looked fine because the word is short enough not to fill its 34% column. Both now
  carry the gap explicitly.
- **The sign-off line was the only body paragraph in the template without a `line-height`**, so
  clients applied their own default and it sat differently from everything around it. It was also
  15px against a 13-14px neighbourhood. Now 14px at 1.6, with "Team Villa 19" given an explicit 1.4
  so the two read as one block.

### Production domain is villa19.in
- **`SITE_URL` fell back to a parked domain.** `src/lib/seo.ts` defaulted to `habbaa.in` whenever
  `APP_URL` was unset. That domain is retired, so every reference to it is gone from code, tests,
  `.env.example` and the deployment and planning docs.
- **This also corrects the origin allowlist.** `lib/origin.ts` derives its production host from
  `SITE_URL` rather than hardcoding one, so guest links in email now validate against the real
  domain as a consequence of the same one-line change.
- **`DEPLOYMENT.md` documented an env var the code does not read.** It listed
  `EMAIL_FROM=noreply@habbaa.in`; the sender is `RESEND_FROM_EMAIL`, and it is
  `reservations@habbaa.com`. Corrected to match what `lib/email.ts` actually reads.
- The `habbaa.com` email, the Habbaa brand and the registered entity are unchanged. Only the `.in`
  domain was retired. Historical mentions in this file are left as they are: they record what was
  true at the time, and rewriting them would make the changelog wrong.

### Room Breakdown shelf
- **The first card sat flush against the left edge on phones.** The shelf cancels the section's
  padding with `-mx-4` and re-adds it with `px-4`, but a scroll container's padding does not inset
  the snapport: `scroll-snap-align: start` aligned the card to the scrollport edge and scrolled the
  padding out of view. `scroll-px-4` sets the snap inset so the card lands level with every other
  section.

### Housekeeping
- **ESLint is clean.** Removed an unused `ShieldCheck` import and two dead assignments in
  `BookingWidget`. The `@ts-ignore` in `vitest.config.mts` sat on the `defineConfig` line rather
  than the `import.meta.dirname` it named, so it suppressed nothing; `tsc` passes without it, and
  `@ts-expect-error` would itself have errored as an unused directive.

---

## v1.10 - Booking forms open on a bookable night - 2026-10-13

### Default dates
- **The booking widget opened on an arbitrary future date.** It used `today + 3` to `today + 5`:
  a two-night span picked without consulting the calendar, so whenever that night was taken the
  homepage greeted every visitor with "Some of those nights are already booked" before they had
  chosen anything.
- **Both forms now open on the first bookable night, for one night.** New `firstAvailableNight()`
  in `lib/availability.ts`, bounded to 120 days because `unavailable` only holds the months loaded
  so far and walking past them would return a date nothing has verified.
- **`DateSelectForm` already used today to today+1**, so the two forms doing the same job disagreed.
  They now match, and both gained the availability check: the second had the same flaw, hidden
  only because its default was today.
- **Dates are derived during render, not corrected in an effect.** Availability arrives after the
  first paint, so an effect that reset the dates would fire a cascading render; the lint rule
  caught it. Only the guest's own picks are state now, and a null pick means "still on the
  default", which also removes the need for a separate touched flag.

---

## v1.9 - ID sharing inline, checkout error precedence - 2026-10-13

### Booking confirmation page
- **The brass "Share on WhatsApp" button is gone.** The action now lives in the sentence that
  closes the ID card: "Share IDs on **WhatsApp** in advance to help us complete the check-in
  formalities before you arrive." Only the word WhatsApp is the link, matching the inline links
  already used further down the page. The `id_status === 'received'` variant carries the same link,
  and the no-WhatsApp-number case still falls back to its note, so the card is never left without
  an instruction.
- **Accepted IDs read as a sentence** rather than a chip row, built from `ACCEPTED_ID_TYPES` so the
  list stays in one place. The constant's casing moved to "Driving Licence" to match the copy.
- **The Homepage button is now `btn-primary`** — maroon with white text, like every other closing
  action on the site, instead of the white outlined secondary.

### Checkout error precedence
- **The "nights already booked" screen no longer hides a payment in flight or a server error.**
  The availability refresh on `visibilitychange` fires when a guest returns from their UPI app, and
  by then their own just-confirmed booking holds those nights, so a successful payment was being
  answered with "Some of those nights are already booked" while the redirect was still running.
  The param-error screen now yields to `isProcessing` and to `serverError`, the latter because a
  failed verification that the webhook later confirms leaves the nights genuinely taken.

### Cancellation ladder
- **Each window opens the morning after the previous one closed** instead of restating the same
  instant as both an end and a beginning: "16 Sep 12:00 am to 30 Sep 11:59 pm".

### Confirmation email
- **Row spacing tightened** across the stay details, the payment breakdown, the refund ladder and
  the contact block. Every cell carried 7px top and bottom, so adjacent rows sat 14px apart.
- **"the villa's address" is now "the exact address"**, matching the wording used on the
  confirmation page and in the WhatsApp message.

---

## v1.8 - Refund deadlines land at end of day - 2026-10-13

### Cancellation deadlines
- **Deadlines are stated as 11:59 pm on the day before the tier's day**, not at the check-in time.
  Counting back from a 2:00 pm check-in produced "Wed 16 Sept, 2:00 pm": an arbitrary hour a guest
  has no reason to expect, and an invitation to dispute from anyone cancelling at 3pm that day.
- **This narrows the window slightly, deliberately.** The stated deadline is now always a little
  earlier than the policy's own, so the email can never promise more than will be honoured. A guest
  who cancels inside the gap is better off than the email implied, never worse.
- `cancellationOutlook` no longer takes a check-in time: a "days before" policy is a date
  calculation, and the hour was an implementation detail leaking into guest-facing copy.
- The reachability filter uses the same instant the guest is shown, so a surviving row can never
  carry a deadline that has already passed.

### Enquiry surface removed
- **`EnquiryForm` and `POST /api/enquiries` deleted.** Both existed only to serve `/contact`, which
  v1.7 retired, leaving a publicly reachable endpoint with no caller. The `enquiries` table is left
  in place; dropping it needs a migration and is not reversible.

---

## v1.7 - Refunds told truthfully, contact page retired - 2026-10-13

### The cancellation ladder now describes the guest's own booking
- **Tiers are filtered against when the booking was made.** The ladder was rendered in full from
  the check-in date alone, so a guest booking close in was shown deadlines that had passed before
  they paid: a stay booked three days out still advertised "₹37,760 refunded until 16 Sept", a
  date from the previous month. Technically true of the policy, and materially misleading about
  their own booking.
- **Three states**, decided by which tiers are still reachable. `cancellationSchedule` is replaced
  by `cancellationOutlook`, which takes the booking timestamp and returns the state with only the
  live rows:
  - **full** - the whole ladder, as before;
  - **partial** - an amber note naming the last refundable moment, then the surviving rows, with
    the top one relabelled "Until …" rather than starting mid-ladder;
  - **none** - a red "This booking is non-refundable." and no table at all.
- **The closing paragraph follows the state.** A non-refundable booking no longer carries a refund
  address or a "processed within 5 to 7 working days" promise, which contradicted the line above
  it; it links to the Cancellation Policy instead. Every state now carries exactly one policy link.
- **Boundary fixed**: the deadline comparison was strict, so a booking made at the exact 30-day
  deadline lost the top tier despite the policy reading "30 or more days before". Now inclusive,
  with tests covering both sides of each deadline.
- Section renamed **Cancellations & refund**, and every link in the email is maroon; two in this
  section were muted.

### Contact page retired
- **`/contact` returns 404**, with its enquiry form. Guests already reach us by WhatsApp from the
  header and sticky bar, and by phone and email in the footer; the page was a fourth and slowest
  path. Unlike `/about`, the body is not kept behind the `notFound()`: the page narrowed a nullable
  property inside JSX, and code after a never-returning call is unreachable, where TypeScript drops
  that narrowing. Restore from git history if it comes back.
- **Six links redirected** so nothing routes into the 404: the header nav entry and the sitemap are
  gone, and the homepage, FAQ, Events, Stay Guide and About calls to action fall back to
  `mailto:` instead. The FAQ one mattered most, having linked to `/contact` unconditionally.
- `EnquiryForm` and `POST /api/enquiries` are now orphaned. Left in place pending a decision.

### Smaller things
- **Razorpay checkout shows "Villa 19"**, not "Villa 19 by Habbaa".
- **The confirmation's tick is white on green** (`--ok`), was maroon on white, and a point larger
  so it holds up reversed out of colour.
- **The admin notice's "Open the booking" button is centred.**
- **A stray `r` fixed** in the cancellation paragraph, which rendered the refund address as
  `rreservations@habbaa.com` in every confirmation.

---

## v1.6 - Host notification rebuilt, cream bands corrected - 2026-10-13

### New-booking notice to the host
- **Template rewritten** as a pure `renderAdminNewBooking(ctx)` in
  `src/lib/emails/admin-new-booking.ts`, returning `{ subject, html, text }`. The old markup lived
  inline in `email.ts`, which now only carries transport.
- **Arrival flag added.** A same-day or next-day check-in shows an amber "Arriving today / tomorrow"
  strip and leads the subject line. Previously the reader had to compare two dates to notice that a
  guest was arriving in hours, which is the one case that changes what the host does next.
- **The phone number is actionable**: formatted `+91 99999 99999`, linked as `tel:`, with a
  "Message <guest> on WhatsApp" button. It used to render as a raw unformatted string.
- **Nights, guest breakdown and a payment breakdown** (stay, extra guests, discount with code, GST,
  total, received or balance due) replace a bare total and a guest count.
- **Special requests promoted** above the payment block, since that is the part needing a decision.
- **Subject carries the facts**: `Arriving today · New booking V19-8PE-1D8 · Tue 13 to Wed 14 Oct
  2026 · ₹16,520 · special requests`, was `New Booking: V19-8PE-1D8 (₹16,520)`.
- **Preheader, plain-text part, `color-scheme: light only` and AA-contrast greys**, matching the
  guest confirmation.

### Cream bands corrected
- **Section nav and the cancellation, privacy and terms page headers moved from `--paper-band` to
  `--paper`.** v1.5 repointed `--paper-band` at a near-white (`#FBF9F8`) for scrollbar tracks and
  wide fills, but these surfaces were still using it as a band on the cream ground. Against
  `--paper` (`#FFFCF0`) the new value differs in hue as well as lightness, so a warm page carried a
  cool grey strip. The nav keeps its brass bottom rule and shadow, which were always what separated
  it; `SectionNav`'s own doc comment had said it used `--paper` all along.
- **The three legal page headers also lose their bottom rule**, matching what `2bc5b15` did to
  `PageHero` when it made the same move.
- `--paper-band` is now used only by the scrollbar track, which is the role v1.5 gave it.

### Announcement bar
- **The promo code chip is defined by its edge, not its fill**: border `0.35` → `0.55` alpha, fill
  `0.10` → `0.16`. The chip reads as faint against the cream bar, but darkening the fill is a trap:
  its text is `--brass-ink` sitting on that fill, and past roughly `0.17` alpha the code drops below
  4.5:1. The border takes edge definition from 1.52:1 to 1.98:1 against the bar at no cost to the
  text, which stays at 4.59:1.

### Section nav
- **Tab labels enlarged** from `14.5px / 15.5px` to `16px / 17px`.

---

## v1.5 - Sunk tones resynced, confirmation page aligned - 2026-10-13

### Recessed surfaces repalettised
- **`--paper-sunk`, `--paper-sunk-hover` and `--paper-band` replaced** with a faint rose family
  (`#F6F2F1` / `#EDE4E1` / `#FBF9F8`). The previous beige was tuned for fields inside white cards;
  on the cream page ground its warmth was cancelled and only the grey remainder read, so every
  field, chip and tile on a cream section looked dull. One token change covers the booking widget
  fields, rules tiles, nearby rows, room spec rows, datepicker day cells, section-nav chips and
  the legal pages.
- **Two hardcoded scrims warmed to the brand.** The date dialog's backdrop was `slate-950/70`, a
  cold blue-grey, and the amenities sheet's was neutral `black/50`; both now use `--maroon-deep`
  at 62% and 55%. No token reaches a Tailwind `backdrop:` utility, so these had to be literal.

### Legibility in recessed rows
- **Row content promoted from `--ink-muted` to `--ink`** in the nearby lists (home and The Villa)
  and the room spec rows. These carry the content of the row, not meta, and were sitting at
  5.3:1 inside a field only 1.1:1 off the page ground. The distances beside them keep
  `--brass-ink`, so the two-tone split in each row is intact.

### Date dialog
- **Removed the duplicated fill** in `DateSelectForm`. The wrapper painted `--paper-sunk` and each
  `DatePicker` trigger painted it again, so the two fields merged into one slab. The fields now
  sit on the dialog's white surface, matching the booking widget.

### Booking confirmation page brought in line with the site
- **Section headings moved out of the cards.** Each section now uses the pattern every other page
  uses: a brass rule, a Cormorant title on the page ground, then a white `rounded-3xl shadow-sm`
  card below. The `--maroon-tint` header strips, which existed nowhere else in the app, are gone.
- **Hero no longer a `--paper-band` slab.** Since the tones were resynced that band is near-white
  against cream and drew a hard seam across the page; the hero now sits on the page ground.
- **`opacity-70` / `opacity-80` replaced with ink roles**, so the text follows the documented
  colour roles rather than alpha over an arbitrary ground.
- **Row labels use the site's uppercase micro-label**, the same one as the booking widget and the
  villa-rules tiles, instead of sentence-case grey.
- **Accepted-ID chips use the standard sunk chip**; the ID callout keeps a brass edge but at
  `--border-brass`, matching the stay-guide callout rather than a solid `--brass` hairline.

---

## v1.4 - Booking confirmation email rebuilt - 2026-10-13

### Booking confirmation email
- **Template rewritten** to the reviewed design. New `renderBookingConfirmation(ctx)` in
  `src/lib/emails/booking-confirmation.ts` is pure: it returns `{ subject, html, text }` and does
  no sending, so it can be tested and later moved without touching the transport.
- **New sections**: confirmation header with the stay range, booking reference card, check-in /
  nights / check-out panel, guest and contact details, a full payment breakdown (stay, extra
  guests, discount with code, GST, total, amount paid), a security-deposit note, "What happens
  next", a dated cancellation ladder and the registered-entity footer.
- **Cancellation ladder now shows real dates and amounts** for the specific booking. New
  `cancellationSchedule()` in `src/lib/cancellation.ts` derives them from `CANCELLATION_TIERS`
  rather than restating the policy, so the homepage, Terms page and this email cannot drift. The
  tiers gained `minDaysBefore` and `fraction`; `when`/`amount` are unchanged for existing callers.
- **Plain-text alternative added.** Every send is now multipart; `send()` takes a `text` part.
  A transactional sender without one reads as bulk mail to the filters that matter.
- **Preheader added**, so the inbox preview line shows the booking reference, dates and amount
  instead of "Dear <name>,".
- **GST rate is derived** from the amounts charged rather than hardcoded at 18%, and the row is
  omitted when there is no tax.
- **"Amount is paid in full" is now guarded** by `payment_status`. A part-paid booking shows a
  **Balance due** row instead of claiming full settlement.
- **No GST invoice attached.** The invoice is issued after check-out, not at booking. The
  `00038` trigger still assigns `invoice_number`; sending the document is pending (see `TODO.md`).

### Guest links point at the right deployment
- **`bookings.origin_url` added** (migration `00085`). `create-order` records the host the guest
  booked from, and both confirmation paths build `bookingUrl` and `cancellationUrl` from it,
  falling back to `APP_URL`. Previously every link came from one `APP_URL` per deployment, so a
  booking made on a Vercel preview was emailed a production link, and a confirmation triggered
  from a developer's machine was emailed a `localhost` link. The Razorpay webhook is
  server-to-server and has no guest origin of its own, which is why this is stored.
- **The `Origin` header is allowlisted before it is stored** (`src/lib/origin.ts`). It is set by
  the caller, so an unchecked value would let anyone have the confirmation — sent from our own
  verified domain — carry a link to their site. Only the configured site host, its `www` form,
  `*.vercel.app` previews and local development hosts are accepted. 14 tests cover suffix
  lookalikes, prefix attacks, embedded credentials, non-https and non-http schemes.

### Email configuration
- **`reply_to` set** on every send, to the address the emails themselves print. The sender is
  configurable and had already drifted away from it once.
- **`.env.example` corrected**: it declared `EMAIL_FROM`, which nothing reads — the code reads
  `RESEND_FROM_EMAIL`. `ADMIN_EMAIL` was missing entirely. The note claiming local mail is
  captured by Inbucket was wrong; every send goes to the Resend API, including in development.
- **`ENTITY.email` added** so the contact address has one source.

### Copy
- **Refund window is consistent everywhere**: "5 to 7 working days", matching the cancellation
  policy page. The refund email said "5 to 7 business days".
- **Security deposit stated once**, in the payment note; the duplicate sentence in the
  cancellation paragraph made a firmer commitment than the note did.
- **Times no longer carry an "IST" suffix** — every time shown is villa-local by definition.
- **Muted text darkened** from `#8a7f77` to `#73685f` for WCAG AA. The old grey measured 3.90:1
  on white and the footer greys 2.58:1 and 1.95:1; all now clear 4.5:1.
- **Dark mode pinned to light.** `content="only"` is not a valid `color-scheme` value; it is now
  `light only`, with `supported-color-schemes` and a matching `:root` rule.

### Fixes
- **A failed guest email can no longer undo a captured payment.** `notifyConfirmedBooking` is
  called inside the try block that answers the payment in both confirmation paths, so a thrown
  `fetch` (Resend unreachable, DNS failure) would have returned a 500: the guest would see the
  booking fail despite being charged, and Razorpay would retry an already-confirmed booking. It
  now logs its own failures and never throws.
- **Two `react/no-unescaped-entities` lint errors fixed** on the booking confirmation page
  (`we'll`, `We're` → `&apos;`). `npx eslint src` was exiting non-zero before this.
- **Migration `00028` no longer breaks a from-scratch database.** It inserted the lounge room
  referencing a property that only `seed.sql` creates, and Supabase applies migrations before
  seeds, so `supabase db reset` aborted there: migrations `00028` onward never applied locally
  and the DB-backed tests silently skipped. The insert is now guarded on the property existing.

---

## v1.3 - Custom 404 page, hidden pages blocked - 2026-10-12

### UI
- **Custom 404 page added** (`not-found.tsx`): branded page with display-font heading, muted body copy, and a single "Back to Homepage" maroon button. Inherits the full site layout (header, footer, announcement bar).

### Access control
- **Hidden pages now return 404** for any direct URL: `/about` and `/testimonials` always 404; `/stay-guide` gates on `SHOW_STAY_GUIDE`; `/events` gates on `EVENTS_PAGE_ENABLED`; `/journal` and `/journal/[slug]` gate on `isJournalLive()` in production.

---

## v1.2 - Page hero cleanup, amenity label fixes, Room 2 photo - 2026-10-12

### UI
- **Page hero subtext removed** across all inner pages (Rooms, The Villa, Gallery, FAQ, Events, Contact, Stay Guide, Journal, Testimonials, About Us). The `intro` prop is gone from `PageHero`; the component now renders the title only.
- **Hero background unified** with the page ground: was `--paper-band` with a bottom border, now `--paper` with no border.
- **Hero spacing tightened**: padding reduced from `py-10 sm:py-12` to `pt-6 pb-2 sm:pt-8 sm:pb-3`, and every content section's top padding cut from `py-12` to `pt-6 sm:pt-8 pb-12` to close the gap between title and content.

### Content
- **Amenity label "Landscaped Garden"** renamed to "Private lawn" in homepage tiles and The Villa quick-facts.
- **Amenity label "Private manicured lawn"** renamed to "Private lawn" in the DB (migration 00084).
- **Amenity label "High-speed Wi-Fi"** renamed to "High-speed internet" in the DB (migration 00084) and in the Stay Guide page copy.
- **Room 2 photo updated** (`/gallery/bedroom-2.jpg` replaced with new image).

---

## v1.1 - Cream ground, and the palette resynced to it - 2026-10-12

### Palette
- **Page ground is now cream** (`--paper` `#FBF8F3` → `#FFFCF0`).
- **Sunk tones split into two tokens.** A recessed tone reads differently depending on what it sits on: against a white card its full warmth shows, against the cream page only the remainder does. The old single `--paper-sunk` was tuned for fields inside white cards, so on the cream ground it lost its warmth and read grey - the hero band on every inner page looked like faded newsprint. One value cannot satisfy both: neutral enough for white is grey on cream, warm enough for cream is yellow on white. `--paper-sunk` keeps its original `#F2EDE4` for fields and tiles inside cards; new `--paper-band` `#F9F3DE` carries the recessed bands that sit directly on the page (page heroes, section nav and its edge fades, the legal and confirmation banners, gallery placeholders, scrollbar track).
- **Retired brand maroon removed.** `#5A2626`, replaced by `#5C1732` in the earlier palette migration, was still live in seven places: the primary button's shadow, the location map's radius disc, the announcement-bar dot, and the mobile nav's active and hover fills. The dot and the disc were mixing both maroons in a single element.

### Checkout
- **Form fields no longer vanish.** Guest name, email, mobile, special requests and coupon drew their fill from `--paper`, which is now the page ground, so each field read as a hole punched through the card rather than an input. They now use `--paper-sunk`, matching the booking widget's date fields - the same treatment for the same role across the flow.

### Content
- **Home page description extended** (migration 00080) and **"comfortably accommodating up to 14" set bold** (migration 00082).
- **Homepage FAQs reduced to 6** (migration 00079); **driver room FAQ** now ends "It can be arranged upon prior request." (migration 00081); **amenity** reads "Washing machine & Refrigerator" (migration 00083).
- **Room photographs replaced** for all four bedrooms.
- **Rooms page**: "Fresh linens & towels provided" is now "Fresh Linens & Towels", with "Amenity Kit & Toiletries" added beneath it.
- **Section nav** label "FAQ's" corrected to "FAQs"; the secondary CTA now reads "Homepage" rather than "Back to Overview".

---

## v0.9.24 - Homepage FAQs, section nav label, and content additions - 2026-10-12

### Content
- **Home page description extended** (migration 00080): three new paragraphs added after the existing two — covering the villa's relaxed contemporary character, ideal and max occupancy, and use cases (family gatherings, celebrations, group trips).
- **Driver room FAQ corrected** (migration 00081): "Is the driver room included in the four bedrooms?" answer now ends with "It can be arranged upon prior request."

### UI
- **Homepage FAQs reduced to 6** (migration 00079): "How many guests can Villa 19 accommodate?" and "Is smoking allowed?" unfeatured from the home page; both remain on the full FAQ section.
- **Section nav label fixed**: "FAQ's" corrected to "FAQs" (no apostrophe; plural, not possessive), now consistent with the footer.

---

## v0.9.23 - Guest requests reach the host, and content split per page - 2026-10-12

### Fixed
- **Special requests now reach the host.** They were captured at checkout, stored, and shown back to the guest on their confirmation page, but were never included in the host's "New Booking" email. A guest could ask for an early check-in, see it echoed on their own confirmation, and reasonably assume it had been passed on while the host never saw it. The admin email now carries them in a highlighted block with a prompt to confirm with the guest, and the subject line flags "has special requests" so it is visible without opening the mail. Covers both confirmation paths (verify-payment and the Razorpay webhook).
- **Checkout now highlights which fields are missing.** The form is `noValidate`, so submitting it empty went straight to the API with no indication of what was wrong. Name, email and phone are now validated client-side before any request, each showing a red border and its own message; errors clear per field as the guest types.

### Content
- **Home page and The Villa page descriptions split** (migrations 00076-00078). Both pages rendered the same `properties.description`, so updating one changed the other. Added a `long_description` column: the home page keeps the short pitch, The Villa page carries the fuller editorial copy ("A private space to stay together").
- **Address shortened** to "Urwa" (migration 00075); the street name is no longer shown on the hero or location card.
- **Driver room is now on request** (migrations 00073, 00074). The amenity reads "Driver's room with bathroom (Upon Request)" and the FAQ adds "It can be arranged upon prior request." The home and The Villa highlight tiles now lead with Air Conditioning, which applies to every stay.

### UI
- **Section nav made prominent.** Sticky detection was comparing against 73px while the bar parks at 80px, so the stuck styling never fired at all. Fixed the threshold, then dropped the conflicting white-pill-plus-underline treatment for a single underline language, raised the label size, and gave the bar a brass bottom edge and elevation on scroll.
- **Confirmation page buttons.** "Back to Home" was built from ad-hoc inline styles that matched the page's white content cards exactly, so it read as an empty card rather than a button. Added a `btn-secondary-solid` variant (surface fill, brass edge) for quiet buttons sitting directly on the paper ground, and used the system typography.
- **Confirmation page copy.** Fixed a body paragraph in the ID card that sat a size below its siblings; "WhatsApp Us" button demoted to an inline link, since a second full-width WhatsApp button duplicated the primary one; "Review our cancellation policy" now links only "cancellation policy".
- **Checkout header** matches the site header: "Villa 19 by Habbaa", centred, 80px.
- **Footer** Explore column spacing tightened.

---

## v0.9.22 - Content, pricing and checkout improvements - 2026-10-12

### Content
- **Home page hero** — added "A Private 4-Bedroom Villa in Mangalore" subtitle between the logo and address; bold for visual hierarchy.
- **About the Villa** — two-paragraph description update (migration 00069).
- **Section heading** — "Cancellation Policy" renamed to "Cancellation & Refund Policy".
- **About page hidden** — removed from nav, footer and sitemap; page marked `noindex`.

### Pricing
- **Seasonal pricing 2026-27** (migration 00070): Dec 1-23 ₹20,000; Dec 24-30 ₹30,000; Dec 31 + Jan 1 ₹40,000; Jan 2 onwards ₹16,000. Oct/Nov weekday (₹14,000) and weekend (₹16,000) base rates unchanged.

### Checkout
- **GST company invoice removed** — checkbox, company name and GSTIN fields removed from checkout, API and invoice PDF.
- **Booking widget** — rate no longer shown next to "Base rate includes up to N guests"; GST label simplified to "GST"; "Lowest rate guaranteed" shortened to "Lowest rate".
- **Confirmation page** — heading changed to "Your booking is confirmed."; subtext updated; "What happens next" section redesigned with numbered steps and a WhatsApp button.
- **ID card** — full copy update with "Accepted IDs" label, verification note and privacy notice; "Aadhaar (masked is fine)" simplified to "Aadhaar".

### FAQs (migrations 00071, 00072)
- **More than 8 guests** — answer updated to reflect mattress arrangements.
- **Cooking policy** — answer reworded to avoid prescriptive language around specific foods.

### Other
- Additional guests note (mattresses) shown in booking widget and confirmation email when guests exceed base occupancy.
- Terms page sleeping arrangements copy updated to match.

---

## v0.9.21 - Landscape-only gallery, and captions in plain English - 2026-10-10

Two asks from the operator: show only landscape photographs, with no border
above or below them, and write the descriptions in ordinary language.

- **Every tile is one landscape shape again**, filled edge to edge
  (`00067_landscape_only_gallery.sql`). Masonry and letterboxing both existed
  only to cope with the vertical frames, so both are gone. Measured in the
  browser across all 41 photographs: 0 vertical, the largest gap between a
  photo and its tile is 2px, which is the tile's own border, and the largest
  difference between a photo's ratio and its rendered ratio is 0.59%.
- **Fifteen vertical photographs were removed rather than cropped.** A 3:2 crop
  of a vertical bathroom frame cuts the mirror or the toilet in half, which is
  worse than not showing it. The operator chose this with the cost in front of
  them: **the Bathrooms section is gone entirely**, because all five bathroom
  frames in the shoot are vertical, and so are both living hall views, the
  Villa 19 sign, the nameboard, the Buddha corner, the driver room, the
  check-in desk, the table setting and the tea tray. 44 photographs became 29,
  plus 11 neighbourhood ones.
- **Nothing in the shoot can replace them.** Of its 45 landscape frames, not
  one is of a bathroom, the living hall, the signage, the driver room or the
  desk. The next shoot needs landscape frames of: the three bathrooms, the
  living hall from both ends, the driver room, the check-in desk, the Villa 19
  sign and nameboard, and the Buddha corner.
- **The eleven Around Villa 19 photographs are now 3:2 too**
  (`00068_around_photos_3x2.sql`). They were 4:3 and thereabouts, so the new
  tile was cropping one of them by 36% wherever it liked. Each crop was chosen
  by hand instead: the Kudroli gopuram and the Milagres cross keep their tops,
  Pilikula keeps its gate and sign. The vertical Mangaladevi Temple photo went
  with the rest.
- **The tile's shape and fit are inline styles, not utility classes.** A tab
  running an older stylesheet would otherwise fall back to the previous 4:3
  tile and letterbox the photo inside it. Inline styles travel with the markup,
  so the tile cannot come out the wrong shape.
- **Captions and descriptions are in plain English**
  (`00066_plain_english_captions.sql`). Out go frontage, forecourt, vessel
  basin, alcove, marble-effect tile, uplighters, gas hob and WC; in come lawn,
  wash basin, gas stove, toilet and fridge. Same facts, ordinary words. The
  viewer prints the description under the photograph, so this is what a guest
  actually reads.

---

## v0.9.20 - The gallery is masonry, so tiles fit the photographs - 2026-10-10

Uncropping the photographs left the other half of the problem: every tile was
a fixed 4:3 box, so a 2:3 portrait filled half of its tile and a 3:2 landscape
filled 89% of it. About a quarter of the gallery's surface was background, and
two photos in the same row appeared at two different sizes.

- **Each tile now carries its own photograph's aspect ratio**, so fitting and
  filling are the same thing: nothing is cropped and nothing is letterboxed.
  The ratio comes from the `width`/`height` already stored per row, so it is
  set when the page renders and there is no layout shift.
- **CSS columns, not a grid with row spans.** A row span has to be computed in
  pixels and the column width here is responsive, so it cannot be known on the
  server. Column balancing is left to the browser; DOM order is unchanged, so
  the viewer still opens the tile that was clicked.
- **The homepage mosaic and the Rooms page cards are now 3:2**, which is the
  shape of every photograph they show, so those cells fill edge to edge too.
  The mosaic's fixed pixel heights fitted neither the old crops nor the
  uncropped frames.
- **The twelve Around Villa 19 rows had no dimensions** and would have fallen
  back to 3:2 while most of them are 4:3 and one is portrait (migration
  `00065_around_photo_dimensions.sql`).
- Measured in the browser afterwards, across all 56 photographs: the largest
  gap between any photo and its tile is 2px, which is the tile's 1px border,
  and the largest difference between a photo's own ratio and its rendered
  ratio is 0.22%, well under a pixel.

---

## v0.9.19 - Gallery captions and descriptions reviewed - 2026-10-10

Every caption and description was re-read as a guest, as the owner and as a
tester, against the property record rather than against the photograph alone
(migration `00064_gallery_copy_review.sql`). The viewer prints `alt_text`
under the photo, so these are guest-facing sentences, not just screen-reader
text.

- **A guest could have counted four bathrooms.** Two bathrooms were
  photographed and the tiles read "Bathroom", "Basin and mirror", "Vanity",
  "Bathroom". The property record says three. Captions now name the fixture
  rather than implying a count, and one description says "one of the villa's
  three bathrooms" outright.
- **The washbasin alcove was filed as a bathroom fitting.** Two other frames
  show it beside the dining area, which is what it now says. A guest reading
  "bathroom" would have counted it as one more.
- **One room was named as two.** "Double-height hall" and "Living room" are
  the same hall from opposite ends.
- **Claims pulled back to what the photograph shows.** "Covered parking"
  became a covered porch you can park under; "Tea and coffee" became the
  coffee maker, kettle and canisters actually in frame, since the old caption
  read as a promise about supplies; "Prayer niche" became an alcove with a
  seated Buddha, which is what it is; "Reception" became the check-in desk,
  where the ID registration the house rules require is done; "Landing and
  carrom" made a carrom board the subject of a photograph of a landing.
- **Bedrooms now answer the booking question.** Bed size, floor,
  air-conditioning and, for Room 1 only, the attached bathroom, instead of
  wall colours and furniture. These match the rooms table.
- **A duplicate frame is gone.** "Blue hour" and "The villa at dusk" were the
  same evening from almost the same spot, so the second frame was dropped from
  the gallery and from 00063's insert: 45 photographs became 44.
- Captions are all distinct, so no two tiles read the same.

---

## v0.9.18 - The professional photo shoot replaces every villa photograph - 2026-10-10

121 frames arrived from the operator's shoot. 44 are now live; the 16
phone photographs from the September shoot are gone.

- **What was chosen and why.** Every frame was reviewed, then shortlisted for
  coverage first and quality second: each of the four bedrooms, both ends of
  the kitchen, the dining room and the laid table, the double-height hall, the
  private lounge, four bathrooms and the terracotta washbasin alcove, the
  rooftop terrace by day and at dusk, the garden, both parking areas, the
  gate, the nameboard, the prayer niche and the facade in daylight, at blue
  hour and lit at night. Near-duplicates were dropped: the shoot has more than
  twenty frames of the facade and three are published.
- **Nothing is cropped.** The first pass cut every frame to the gallery's 4:3
  tile and chopped a bed, a chair, the roofline, the nameplate and a washbasin
  in half. That pass is gone. Each photo is now published whole, with only its
  long side bounded at 1600px: landscape frames are 1600x1067 and portrait ones
  1067x1600, and `width`/`height` in the database are each photo's own. All 45
  were checked against their originals frame for frame, by aspect ratio and by
  pixel difference, before publishing.
- **The site handles the shapes instead.** Gallery tiles, the homepage mosaic
  and the Rooms page photo use `object-contain` over the sunk-paper colour, so
  a frame that does not fill its box is letterboxed rather than clipped. The
  full-screen viewer no longer forces a 4:3 box either: it takes the height
  available, so a portrait photograph fills the screen instead of sitting in a
  landscape hole. The five photos in the homepage mosaic are all landscape,
  since that grid's cells are wide.
- Everything is saved without EXIF, so without GPS.
- **Room identity** is the operator's, confirmed 2026-10-10: Room 1 is the
  terracotta room with the loft cabinets above the wardrobe, Room 2 the
  terracotta room photographed from both ends, Room 3 the maroon room with the
  balcony door, Room 4 the blue one. The Rooms page photo links follow.
- **Two weak frames**, the driver room and the reception desk, are published at
  the operator's request with a light lift (histogram clip, shadows opened,
  slight unsharp) and no more: anything heavier reads as a filter. Neither
  space has a better frame in the set.
- **New to the gallery**: the rooftop terrace, the first-floor landing with the
  carrom board, the garden and courtyard at night, the prayer niche, the driver
  room and the reception desk. The representative lawn stand-in is gone now
  that the garden has real photographs.
- The 12 "Around Villa 19" photographs are untouched and now sort after the
  villa's own (migration `00063_new_photo_shoot.sql`).
- **Privacy contact**: the privacy page now gives reservations@habbaa.com
  throughout, not hello@habbaa.com. One mailbox everywhere.

---

## v0.9.17 - Legal policies replaced with the issued Habbaa documents - 2026-10-10

The three policy documents issued by Habbaa Solutions Pvt Ltd (effective
7 October 2026) now replace the shorter site-written versions.

- **Terms of Service** (`/terms`) rewritten to the issued 27-section document:
  booking and confirmation, guest eligibility and registration, occupancy and
  sleeping arrangements, rates, payment, booking changes, no-show, check-in and
  check-out, house rules, parties, smoking, pets, damage and security deposit,
  driver accommodation, amenities, utilities, CCTV, personal belongings,
  termination of stay, force majeure, third-party platforms, website use,
  intellectual property, changes, governing law, contact and acceptance.
  Check-in/check-out times and maximum occupancy still come from the property
  record, so editing them does not leave the page stating old figures.
- **Cancellation & Refund Policy** now has its own page at `/cancellation`,
  carrying the full 13-section document: refund tiers, cancellation timing in
  IST, how to cancel, refund processing, date changes, early departure,
  no-show, cancellation by Villa 19, force majeure, promotional rates,
  third-party platforms, security deposit and policy changes. The tiers and the
  security deposit wording still come from `CANCELLATION_TIERS` and
  `SECURITY_DEPOSIT_TERMS`, so the homepage card, the Terms page and this page
  cannot drift. The footer link and the booking page link point here;
  `/terms#cancellation` still lands on the Terms section that refers to it.
- **Privacy Policy** (`/privacy`) rewritten to the issued document: collection,
  use, guest identification, third-party platforms, payments, cookies,
  marketing, sharing, CCTV, security, retention, rights, children, links,
  international processing, changes, contact and grievances. The site-specific
  detail that remains accurate was kept inside the matching sections: the
  WhatsApp enquiry and ID-document practice, Razorpay as the gateway, the
  3-year booking and 12-month enquiry retention, and the no-advertising-cookies
  statement. The privacy contact stays reservations@habbaa.com: the issued
  document names hello@habbaa.com, but the site uses a single mailbox.
- `/cancellation` added to the sitemap.

---

## v0.9.16 - Pricing update (14k weekday / 16k weekend) & gallery image distances removed - 2026-10-02

- **Nightly rates updated** (migration `00061_pricing_and_gallery_distances.sql`):
  - Weekday rate increased from ₹12,000 to ₹14,000 / night (1,400,000 paise).
  - Weekend rate (Friday and Saturday nights) increased from ₹14,000 to ₹16,000 / night (1,600,000 paise).
  - The booking widget starting rate, availability calendar, and booking price calculations reflect the new rates.
- **Gallery image descriptions cleaned**:
  - Removed distance indicators (` · X km`) from captions and alt texts below the photos in the "Around Villa 19" gallery section.
  - Image tiles now display clean titles (e.g., "Sultan Bathery Fort", "Tannirbhavi Beach", "Panambur Beach", "Kudroli Temple", "Kadri Manjunatha Temple", "Pilikula Park", "Pabbas", "Naturals").

---

## v0.9.15 - Lint clean - 2026-10-01

`npx eslint src/` now reports nothing. Seven problems, none of them in the
gallery work, four of them the same rule.

- **Cookie consent and analytics** read the stored choice through
  `useSyncExternalStore` instead of copying it into state from an effect. The
  stored choice is an external store and both components already had to agree
  about it, so they now read one. `undefined` means not yet known, which is
  what keeps the banner out of the server-rendered HTML and out of the face of
  someone who decided months ago.
- **The date picker** moves the visible month to the selected date during
  render rather than in an effect. An effect painted the old month first and
  corrected itself after.
- **The booking widget** no longer resets its submitting flag on mount, which
  was setting state to the value it already had. The bfcache listener that the
  effect exists for is unchanged. It also navigates with `router.push` instead
  of assigning `window.location.href`, so leaving the page no longer discards
  the client router.
- **Checkout** drops a `secured` prop that was passed at one call site and
  read at none, left behind when the Razorpay badge was removed, and a stale
  eslint-disable for a rule that no longer fires there.


The photo viewer's category row wrapped onto more lines instead of scrolling
sideways, so there is nothing left to indicate.

On a phone the eight categories are 759px of chips in a 369px row, so
scrolling put **half of them off-screen behind an undiscoverable gesture**,
with a sliced chip at the edge that read as a layout fault. Wrapping shows all
eight at once. It costs 80px of the roughly 460px this layout leaves empty on
a tall screen, because a 4:3 photo cannot fill a phone, and the photo keeps
exactly the size it had.

Replaces the scroll-position fades added in v0.9.13, along with the scroll and
resize listeners, the state behind them, and the `scrollbar-none` rule that
had no other user. The widths work out so that this only takes space where the
space is going spare: desktop fits one row, a phone in landscape two.

Known trade-off: a phone in landscape gives the chips two rows, which leaves
the photo about 15% shorter than before. Filtering stays reachable there,
which seemed worth more than the height, but it is worth a look on a real
device.

---

## v0.9.13 - Gallery polish - 2026-10-01

- **Removed the keyboard hint** from the photo viewer. With it gone the
  `pointer-only` rule had no users, so all custom hover CSS is now deleted:
  Tailwind v4 already wraps its own `hover:` in `@media (hover: hover)`.
- **Photo labels are centred** under their tile, matching the photo above them.
- **The category row says which way it continues.** It scrolls out of sight on
  a phone with nothing to show that, so a chip could sit half cut off at the
  edge and read as a layout fault rather than as more to come. A fade now
  appears on whichever side has more, and on neither side when the whole row
  fits, so it means something wherever it shows.

---

## v0.9.12 - Gallery corrections - 2026-10-01

Fixes to v0.9.11, which was verified against a stale stylesheet and shipped
several things that did not work.

### Gallery grid

- **Photo labels now always sit under the tile**, on every device. v0.9.11 put
  them under the tile on touch and over the photo on hover, which meant the
  label was governed by a media query on every page load. It is now plain
  markup with nothing conditional about it. Hover zooms the tile and tints the
  label; that is the whole hover treatment.
- The `can-hover` custom variant is gone. Tailwind v4 already wraps its own
  `hover:` and `group-hover:` in `@media (hover: hover)`, so the variant was
  never needed for hover rules. Only the inverse case is left, as one plain
  `@media (hover: none)` rule for the keyboard hint.
- Fixed the tile label colour, which was set by an inline style and so could
  never be changed by the hover rule that was supposed to change it.

### Photo viewer

- **Fixed the caption being pushed off the bottom of the screen.** The photo
  box used `max-h-full`, so it took the whole column and left the caption with
  nowhere to go. It now reserves the caption's height.
- **Fixed the cramped header on phones.** The category chips shared one row
  with the counter and the close button and were clipped mid-word. They now
  take a row of their own below them, at full width.
- **Fixed near-invisible arrow buttons.** They were `bg-black/40` on an almost
  black scrim, so only the chevron showed. They now have a lighter fill and a
  border.
- The photo box carries the 4:3 that 25 of the 28 photos share, so the photo
  and its caption read as one block instead of a small photo adrift in a large
  dark field. Photos that are not 4:3 letterbox inside it as before.

---

## v0.9.11 - Gallery works on phones and tablets - 2026-10-01

### Gallery

- **Tapping a photo on the Gallery page now opens it.** The page had no viewer, so on a phone there
  was no way to see any photo larger than its tile.
- **Labels moved out of the photo on touch devices.** They sat over the image behind a dark gradient
  that covered about 40% of every tile. They now sit underneath on touch and appear on hover on
  desktop, so the photos are no longer dimmed to make room for text.
- **Fixed: labels never appeared on tablets.** v0.9.10 keyed the hover overlay on `md:`, treating
  screen width as a proxy for having a mouse. An iPad in portrait is 768px wide, so it hid the
  labels until a hover that a touchscreen cannot produce. Now keyed on `@media (hover: hover)` via
  a `can-hover` variant, so the test is the input device rather than the screen size.
- **Short captions** for all 28 photos (migration 00060), e.g. "Room 2 · Queen bed". `alt_text` was
  written as full sentences for screen readers and was being truncated mid-word in tiles. It stays
  the accessible description and is what the viewer shows.

### Photo viewer

Extracted into `PhotoViewer`, shared by the Gallery page and the homepage mosaic.

- Photo fills the full width on a phone. It previously used about 45%, boxed in by room reserved
  for the arrow buttons and a forced widescreen frame.
- Swipe to move between photos. A mostly-vertical drag is ignored so scrolling does not flip it.
- Counter moved to the header as "5 / 28"; it was appended to the caption sentence.
- Keyboard hint only shows on devices with a keyboard-and-pointer.
- The category row fades at its right edge to show it scrolls, and no longer crowds the close button.
- Focus is held inside the viewer while open and returned to the tile that opened it on close.
- `.scrollbar-none` is now actually defined. The class was in use but had never been written.

---

## v0.9.10 - Gallery hover labels, Pabbas and Naturals photos, photo credits removed - 2026-10-01

### Gallery

- **Hover labels on gallery tiles**: on desktop, a gradient overlay with the photo description slides
  up on hover; on mobile/tablet the label is always visible at the bottom of each tile. Applied to
  both the `/gallery` page grid and the homepage `GalleryModal` thumbnails.
- **Pabbas photo** replaced with the operator's Gudbad ice cream shot (cropped to 4:3, 1200x900).
  Previously showed a green paan close-up from Wikimedia Commons.
- **Naturals Sundaes** photo added (migration 00059) using the operator's photo. Previously had no
  gallery entry. Image cropped to 4:3 at 1200x900.
- **Photo credits removed** from all `around` gallery rows (`credit` / `credit_url` nulled out via
  migration 00058). Credit display code removed from the gallery hover overlay and seed data cleaned.

---

## v0.9.9 - 2:00 PM check-in, Around Villa 19 photos, 10-night cap, policy fixes - 2026-10-01

### Stay details

- Check-in moves to 2:00 PM and check-out to 10:00 AM (migration 00051), superseding the 3:00 PM
  check-in set in 00049. Covers the property row, the check-in policy, the FAQ prose and the code
  fallbacks in `data.ts`, `create-order`, Stay Guide and Terms.
- Room 3 now sleeps 2 and the Private Lounge sleeps 3 (migration 00052).
- Full street address: Urwa Marigudi Cross Road, Urwa (migration 00054). The Terms contact block
  now reads it from the database instead of a hardcoded copy that had gone stale.

### Booking

- **Maximum stay of 10 nights.** Enforced in `MAX_STAY_NIGHTS` (`pricing-engine.ts`), so the booking
  widget, the "Choose your dates" modal and the engine itself all honour it. Both date pickers cap
  the check-out calendar; longer ranges show "For stays of this duration, please contact Villa 19
  directly for special pricing and availability."
- Pricing summary collapsed from a night-by-night ledger to three lines: total nights, GST and
  total payable. The per-night rows and the "wknd" tags are gone.

### Cancellation

- **The 30+ day tier is a 100% refund, not 90%.** The homepage card said 100% while the Terms page
  and the policy row said 90%, so a guest cancelling 30 days out could read either. Resolved in
  favour of 100% (migration 00056).
- Tiers now come from a single `src/lib/cancellation.ts`, rendered by both the homepage card and
  Terms, so the two cannot drift again.

### Gallery

- "Around Villa 19" rebuilt to the operator's list and order, 11 places (migration 00053):
  Sultan Bathery Fort, Tannirbhavi Beach, Panambur Beach, Kudroli Temple, Mangaladevi Temple,
  Kadri Park, Kadri Manjunatha Temple, St Aloysius Chapel, Milagres Church, Pilikula and Pabbas.
- Seven new photos added for the "Around Villa 19" section.
- Neighbourhood photos no longer appear in the homepage gallery; they belong to the Gallery page.
- Still missing a usable photo: Manasa Water Park.

### Content

- Lounge convertible sofas noted as additional sleeping space in the villa description.
- "Indoor games" is now "Books & Board Games"; "2 convertible sofas" splits into "Living room with
  plush sofas" and "Lounge with convertible sofas" (migrations 00055 and 00057). 00055 matched these
  rows by hardcoded UUID, but the ids are generated per environment, so on staging every rename
  matched zero rows while still reporting success. 00057 repairs it by matching on label and setting
  the display order outright.
- "Function Halls" is now "Wedding & Event Venues"; "Sanghaniketan Hall" is now "Sanghaniketan".
- Capitalised King and Queen in bed copy; the kitchen FAQ now lists cutlery.

### Hidden

- Stay Guide and Journal are out of the header, drawer, footer and sitemap via
  `src/lib/site-sections.ts`. The pages still build and resolve by URL; flip either flag to restore.

### Known issues

Five policy items from the 2026-10-01 content review need business decisions and are tracked in
`TODO.md` section 10. The most important: **children are billed at the full adult rate** even though
the FAQ promises under-5 free and 5-12 at 50%. The booking engine has no child pricing.

## v0.9.8 - FAQ page, 3:00 PM check-in, new tab title and icon - 2026-09-30

### FAQs

- **New /faq page** (migration 00050): 42 questions in sections, an accordion per section,
  FAQPage structured data and a "Still have questions?" panel. Linked from the header drawer,
  footer and sitemap.
- Home page shows the 8 featured FAQs (new `faqs.is_featured`) and a "View all FAQs" button.
- Children: under 5 free, 5-12 at 50% of the guest rate, above 12 full rate. Note: the booking
  engine does not price children yet.
- ID wording: all guests (not "all adults") must show government photo ID.

### Stay details

- Check-in moves to 3:00 PM (migration 00049), including code fallbacks and journal copy.
- Parking for 8 vehicles.
- Journal: power backup keeps fans, lighting and Wi-Fi running (not air conditioning).

### Look

- Tab title "Villa19 | Private Urban Villa"; new PNG favicon and Apple touch icon.
- Page intros wider (768px) and balanced across lines.

---

## v0.9.7 — Real gallery photos, room photos, "starting from" pricing — 2026-09-30

### Gallery

- **Real photographs replace the stock gallery** (migration 00046): 15 photos shortlisted from
  the operator's 23 Sep shoot (38 reviewed), one per room and the strongest of each space,
  cropped by hand to the 4:3 tiles, resized to 1600x1200 (34 MB of originals to 3.7 MB), number
  plates blurred and EXIF, including GPS, stripped. Files live in `public/gallery/`.
- **Room photos linked** (migration 00047): Rooms 1-4 and the Private Lounge, per the operator's
  labelled room photos. The Rooms page shows each room's photo instead of a bed icon.
- **Outdoor Spaces and Around Villa 19** get placeholder photos (migration 00048): one Unsplash
  lawn, and photos of Kudroli Temple, Panambur Beach, Sultan Bathery and Kadri Manjunatha Temple.
- One grid (2 / 3 / 4 columns) for every section, so tiles are the same size throughout.
- Structured data resolves site-relative image paths to absolute URLs.

### Pricing and copy

- **Booking widget shows "Starting from ₹12,000 / night + GST, for up to 8 guests"**, the lowest
  nightly rate on file, instead of "₹12,000 / night" as if fixed (weekends, holidays, extra
  guests and GST all cost more). `priceRange` in the structured data matches.
- Footer: "© 2026 Habbaa. All rights reserved."
- "Upto 14 Guests" corrected to "Up to", from `max_occupancy`, on the home and Villa pages.

### Deploy notes

- Migrations 00046-00048 are applied to staging after this code deployed, because they point the
  gallery at files this deploy adds.

---

## v0.9.6 — Consistent page headers, UI audit fixes, villa rules wording — 2026-09-29

### Page headers

- **One `PageHero` for every inner page** (About, Contact, Gallery, Journal, Rooms, Stay
  Guide, Testimonials, The Villa, Events). The hand-rolled headers had drifted to 40-80px of
  vertical padding, 16 or 20px under the title and four different intro widths. With the eyebrow
  labels gone the band is sized for title plus intro only, and intros are balanced so a
  two-line intro no longer leaves one word behind. Privacy and Terms keep their legal header.
- **Eyebrow labels removed** from The Villa, Stay Guide, Journal and Events.

### UI audit fixes

- Tap targets raised to 44px: "Show All N Photos" (was 34px) and the room shelf arrows (36px).
- Rooms browser title "Bedrooms & Sleeping Arrangements" is now "Rooms: Bedrooms, Beds &
  Capacity", matching the page.
- Audited all 13 pages at 375px and desktop: no horizontal overflow, no broken images,
  consistent page-title and section-heading styles.

### Villa rules

- The home page "All villa rules" list shows all eight; quiet hours had been dropped because
  a tile above repeats it.
- **Occupancy** and **Care for the Property** use the operator's wording on the home page,
  Terms and in `property_policies` (migration 00045). Care for the Property had been reworded
  to read as liability rather than conduct.

### Deploy notes

- Migration 00045 is applied to staging.

---

## v0.9.5 — Rooms and Stay Guide tidy-up — 2026-09-28

- **Rooms:** the bathroom-layout line under the intro is removed; the intro already gives the
  bathroom count and Room 1's card keeps its Attached Bathroom badge.
- **Stay Guide:** the Villa Rules card is removed (the rules stay on the home page and, in
  legal wording, on Terms). Page title and description no longer mention house rules.
- **Stay Guide booking panel** now uses the same stacked, centred layout as every other
  panel: heading, line, then the button pair. The side-by-side row squeezed the text into a
  narrow column.

---

## v0.9.4 — GST invoices, tiered pricing, villa rules, gallery, content — 2026-09-28

### GST invoices

- **Tax invoice PDF attached to every confirmation email** (`src/lib/invoice.ts`, pdf-lib):
  supplier with GSTIN and CIN, invoice number and date, booking number, place of supply
  Karnataka (29), SAC 996311, taxable value, CGST 9% + SGST 9% (always intra-state:
  accommodation is taxed where the property is), total in figures and words. Amounts come from
  the booking row, never a recalculation. If rendering fails the confirmation still sends.
- **Invoice numbers `V19/26-27/INV/000001`** (migration 00038), Ooruda's
  `{INITIALS}/{FY}/{TYPE}/{NNNNNN}` shape. A per-property, per-FY counter restarts each 1 April
  (IST) and is allocated by a trigger in the same transaction that confirms and pays the
  booking, so the series is gapless and every confirmation path (site, webhook, Ooruda) gets
  one. Bookings confirmed before this release are not backfilled.
- **Company invoices at checkout:** optional company name + GSTIN, validated in the browser and
  on the server and enforced by constraints (a GSTIN needs a company name).
- Both confirmation paths now share `notifyConfirmedBooking`. The confirmation email reads
  check-in/check-out times from the database (it hardcoded 2:00 PM / 11:00 AM) and all emails
  use the brand palette.

### Pricing

- **Tiered extra-guest pricing** (migration 00039): base rate covers 8 guests; guests 9-11 pay
  ₹1,000 and 12-14 pay ₹700 each per night, stepwise (12 guests = ₹3,700 a night extra). Was 12
  included at ₹1,000 each above. New `extra_guest_tier2_from` / `extra_guest_tier2_rate`
  columns; both null means one flat rate. The widget explains the tiers. Tests cover every
  group size and that a bigger group never costs less. `docs/OORUDA_VILLA_INTEGRATION.md` has
  the new formula (and the cap corrected from 15 to 14).

### Villa rules and content

- **Eight villa rules** (migration 00040), one shared list for the home page and Stay Guide
  (`src/lib/villa-rules.ts`); Terms reworded to match. "No parties" drops "events".
- **Private Lounge is not air-conditioned** (migration 00041); the Rooms badge reads `has_ac`.
- **Function halls and Urwa Marigudi Temple** under Location & Nearby (migration 00044), halls
  listed first, distances measured with Google Maps driving directions. Halls stay off the home
  page Location card.
- Rooms intro and booking panel rewritten; Rooms eyebrow and Gallery eyebrow removed; the
  Villa page title is "The Villa" and loses Amenities, Villa Rules, Good to Know and the hero
  button; FAQs live only on the home page (the Stay Guide copy is gone, JSON-LD moved).
- Footer: "Managed by" above the company; tagline removed. Company details moved to
  `src/lib/entity.ts`, shared with the invoice.
- Home page title adds the logo's own "by Habbaa" signature, right-aligned under the name.
- Announcement bar: reservations contact and the VILLA19 offer, with short phone versions so
  the useful part is not truncated.
- Journal copy corrected for the new pricing and 10 PM quiet hours.

### Gallery

- **Seven sections** (migration 00042): The Villa, Living & Dining, Bedrooms, Bathrooms,
  Outdoor Spaces, Parking, Around Villa 19; one list (`src/lib/gallery.ts`) for the page and
  the photo viewer. Alt text no longer claims an ensuite for Room 2, twin beds or cuisine.
- **Placeholder photos** for Bathrooms, Parking and Around Villa 19 (migration 00043). Every
  gallery image is still Unsplash stock; replace with real photographs before launch.

### UI

- One `CtaButtons` pair (brass Check Availability + frosted secondary) on every dark booking
  panel.
- **Events page hidden** behind `EVENTS_PAGE_ENABLED` (`src/lib/features.ts`): off the nav,
  footer and sitemap, and the route 404s.

### Known issues

- The VILLA19 code is advertised but checkout has no code field yet (TODO item 1).
- `/opengraph-image` still fails under `next dev`; verify on a production build.

### Deploy notes

- Migrations 00036-00044 are applied to staging. Apply them to production before deploying
  this code once production exists.
- Ooruda Villa must price staff-entered bookings with the new tiered formula.
- Redeploy so statically rendered pages pick up the new content.

---

## v0.9.3 — Booking confirmation page, security deposit wording — 2026-09-28

### Booking confirmation page

- **One state from both status columns.** The page only asked "is it paid?", so a cancelled
  or refunded booking read "Booking Pending". It now shows Confirmed, Confirming Your Payment,
  Booking Cancelled (noting a refund) or Booking Not Completed (noting no charge).
- **Claims only when true:** "Total Paid", "A confirmation has been emailed", the ID card and
  next steps appear only for confirmed bookings. Status reads in plain words, not raw values.
- **Check-in and check-out times from the database** (they were hardcoded as 2:00 PM and
  11:00 AM after 00031 moved them there). Property name and locality also come from the DB.
- **Price breakdown** from the amounts stored on the booking (stay, extra guests, GST, total),
  not a recalculation, so later rate changes cannot alter it.
- Adds night count, adults and children separately, Add to Google Calendar (IST, no exact
  address) and a cancellation policy link. Duplicated email and ID steps removed from "What
  happens next", now a real ordered list.
- **Pending pages refresh themselves** every 4 seconds for about a minute, covering the gap
  before the Razorpay webhook lands.
- Outbound WhatsApp links release focus after a click (no ring on return); long values wrap on
  mobile; phone shown as +91 XXXXX XXXXX; dates pinned to IST; row dividers use the subtle
  border colour instead of near-black.

### Content

- **Security deposit** wording from the operator on the Terms page, the home page deposit
  terms, the cancellation policy and FAQ (migration 00037), and a short form in the checkout
  footnote. The policy version said "subject to no damage" against "property inspection"
  elsewhere.
- **Reply time** reads "We usually reply within an hour during the day" on the home page,
  confirmation page, Stay Guide and confirmation email (was "within 30 minutes", with no
  overnight cover).
- **Sultan Battery -> Sultan Bathery** (migration 00036).

### Deploy notes

- Apply migrations 00036 and 00037 to remote databases, then redeploy so statically rendered
  pages pick up the new content.

---

## v0.9.2 — Villa 19 wordmark, brand palette, ideal occupancy — 2026-09-28

### Brand

- **Villa 19 wordmark** replaces the round badge and the typed "Villa 19 / By Habbaa" lockup
  in the header, mobile drawer, footer, checkout header and journal covers. It is a vector
  trace of the supplied logo (`public/villa19-wordmark.svg`, maroon, for light grounds;
  `villa19-wordmark-knockout.svg`, white, for dark grounds), transparent and tightly cropped.
  The old `villa19-badge.png` and `villa19-wordmark.png` are removed.
- **Palette moved to the logo's wine** (`--maroon` #5A2626 -> #5C1732, `--maroon-deep`
  #3C1717 -> #3A0E1F). The brick and the logo sat 22 degrees of hue apart, close enough to read
  as a mistake. Every contrast pair improved; none regressed.
- **Header back to a single-line mark** at 72px. The desktop nav tightens at tablet width
  (768-1023px) so "The Villa" no longer wraps into the logo.
- **Duplicate names removed:** the About hero no longer repeats the header's wordmark, the
  journal cover label reads "Journal" under the mark, and the checkout Booking Summary shows the
  wordmark in place of the typed name.
- **Share image** uses the wordmark instead of system-font "VILLA 19", on the new palette.

### Content

- **Ideal occupancy** (migration 00035): a new `properties.ideal_occupancy` (8) drives "Ideal for
  8 guests" copy, the Rooms intro, the "Ideal For" tile and every default guest count (booking
  dialog, booking widget, create-order fallback). It was a hardcoded 8 in four places. Pricing
  is unaffected: `base_occupancy` stays 12 and nothing in the pricing engine reads the column.
- **Location card** picks its four tiles with `closestByCategory`: nearest-first, one per
  category. The regex-picked set put the airport (22 min) beside a bus stand 100 m away.
- Section headings on Events, The Villa and Reviews brought onto one size tier.

### Fixes

- **Focus ring left on clicked nav links.** The header and footer persist across routes, so a
  clicked link kept focus on the new page and showed the ring at the next keypress. Mouse and
  touch clicks now release focus; keyboard activation keeps it.

### Known issues

- `/opengraph-image` fails in `next dev` ("failed to pipe response") even with no images in
  it, so this predates the logo work. Verify on a production build.

### Deploy notes

- Apply migration 00035 to remote databases.

---

## v0.9.1 — Contact details, nearby distances, coordinates, navigation — 2026-09-25

### Content

- **Contact details updated everywhere:** phone and WhatsApp to `918050484123`, email to
  `reservations@habbaa.com` (was `hello@habbaa.in`). Covers the announcement bar, footer,
  Contact, Privacy and Terms pages, transactional email, the structured data and the
  deployment docs.
- **Location & Nearby re-measured** (migration 00033). The previous figures were estimates and
  several were not achievable: four implied 35-42 km/h through city traffic, and the airport
  claimed 20 minutes against a real 25-40. Three separate places all sat at exactly "5 min",
  which is what gave them away. The list is now 17 places with implied speeds of 20-30 km/h;
  nothing reads as too fast. Someshwar Beach, St. Aloysius Chapel, Hotel Srinivas, Forum Fiza
  Mall and Mangaladevi Temple are dropped; Nilgiris and Kudroli Temple are added; Ideal Ice
  Cream becomes Pabbas Ideal Cafe and Big Bazaar becomes City Centre Mall.
- **Villa coordinates corrected** (migration 00034): 12.8892951, 74.8298580 -> 12.895188,
  74.830676, about 661 m north-east. These drive the "Open in Maps" links and the
  GeoCoordinates in the structured data. `public/villa-map.jpg` is a build asset with its own
  hardcoded pair in `scripts/make-map.py`; both were updated and the image regenerated.
- **Highlight labels reworded**: Centrally Located, Private Parking, Lounge Area, Landscaped
  Garden, High Speed Internet, Driver Room. Room cards read "Max N Guests", and the villa rules
  card leads with "Ideal For 8-14 Guests".
- **Two amenities recategorised** (migration 00032): the driver's room and the outdoor CCTV move
  from Convenience & Essentials to Outdoors & Spaces, where they describe the grounds.

### Navigation

- **`NavLinkBase`** replaces `next/link` in the header and footer. The App Router dedupes a
  navigation to the current URL, so its scroll reset never ran and clicking the link for the
  page you were already on did nothing. It now returns to the top, leaving modified clicks and
  hash links alone.
- **`scroll-behavior: smooth` removed from `html`.** On the root element it also captured the
  App Router's scroll reset, so every route change animated back to the top instead of jumping.
  The two places that want animation ask for it themselves.
- **`body` uses `overflow-x: clip`, not `hidden`.** `hidden` made the body a scroll container,
  which stopped scroll propagating to the viewport: every inbound `/#faq`-style link landed at
  the top instead of the section.

### Fixes

- The home page's "Call" button was 14px sentence case beside a 13.5px uppercase WhatsApp
  button, so the pair disagreed on size, casing and height. Its type now matches; its neutral
  colour role is unchanged.

### Deploy notes

- Apply migrations 00032, 00033 and 00034 to remote databases.
- Set `PROPERTY_PHONE`, `PROPERTY_WHATSAPP` and `PROPERTY_EMAIL` to the new values in every
  environment. `RESEND_FROM_EMAIL` still needs pointing at the verified sending domain.

---

## v0.9.0 — Content overhaul, room breakdown, amenities, scroll aid — 2026-09-25

### Content

- **Tagline is now "Premium 4-Bedroom Private Urban Villa"** everywhere (migration 00026, seed,
  footer, SEO descriptions and the social share image). The villa is positioned as urban rather
  than coastal, so "in Urwa, Mangalore" and "on the Karnataka coast" were dropped from the
  tagline. The About page's brand line and the Events backdrop line keep their coastal wording
  by decision.
- **"About the Villa" supports bold.** The description stores `**markers**`, rendered as
  `<strong>` by `src/lib/bold.tsx` on both the home and The Villa pages (migration 00027).
- **Amenities overhauled** (migration 00030): all 19 placeholders replaced with the villa's real
  26, under four renamed categories (Living & Dining, Bedrooms & Comfort, Outdoors & Spaces,
  Convenience & Essentials). The two location entries were dropped because they duplicated
  `nearby_places`, which already drives the Location section. `parking_spaces` 4 -> 10.
- **House rules reworded** (migration 00031): quiet hours 11 PM -> 10 PM; photo ID "mandatory
  for all guests"; "Outside guests are not allowed"; "Pets are not entertained". The 24/7
  caretaker is withdrawn everywhere, including the FAQ that advertised it, and the BBQ and
  bonfire kit go with it.
- **Walking-distance landmarks:** Main Road & Bus Stand (100 m) and Super Market (300 m).
  `formatDistance` now renders sub-kilometre distances in metres; the home page's Location box
  previously carried two hardcoded, invented figures ("Walking distance", "City Centre 3.7 km")
  which are now read from the database.
- **Events capacity** quoted `base_occupancy` (12) and contradicted every other page; it now
  quotes `max_occupancy` (14) and names the lounge.

### Rooms

- **Real room breakdown** (migrations 00028, 00029): four bedrooms plus the Private Lounge,
  which sleeps 2 on sofa-cum-beds and so completes the 14-guest cap (3+3+3+3+2). New `floor`
  column; room sizes recorded. Rooms keep their ids so the linked photos survive.
- **Bathrooms corrected to 3** (was 4): attached to Room 1, plus one common bathroom per floor.
  Only the attached bath is named per room; the arrangement is stated once in the Rooms intro.
- The Rooms page counted `rooms.length` as bedrooms, which would have claimed 5 once the lounge
  was added. It now counts bedrooms separately.

### UI

- **Scroll aid** (`src/components/layout/ScrollAid.tsx`): jump-to-top / jump-to-bottom control on
  long desktop pages. Mounted once in the site layout and self-activating above two viewports,
  so no page needs configuring. Hidden below `lg`, honours `prefers-reduced-motion`, and steps
  above the cookie banner while that is on screen.
- **Desktop nav** is now Home / The Villa / Rooms / Gallery, set in Cormorant Garamond at 20px to
  match the section headings, with a lighter brass for legibility on maroon.
- **Hero eyebrows** were 12px across six pages in three inconsistent treatments, making the first
  line on each page the smallest text on it. A new `.eyebrow-hero` tier (14px) standardises them.
  The existing `.eyebrow` and `.eyebrow-lg` classes had never been used by any page.
- **Home highlights bar** rebuilt with the gap-px technique: the conditional border classes
  produced uneven rules between cells.
- **Stay Guide CTA:** both buttons used `btn-frosted`, leaving the panel with no primary action.
  Book Now is now `btn-brass-filled`, matching every other dark CTA panel.
- **About page** uses the new Villa 19 badge (`public/villa19-badge.png`), sized with an inline
  style rather than an arbitrary Tailwind class, which silently falls back to the image's
  intrinsic width if the JIT misses it.

### Fixes

- `supabase/seed.sql` carried stale `UPDATE rooms SET slug = …` statements naming the retired
  placeholder rooms. On a fresh database they ran after the insert and reverted every new room
  slug, breaking the room URLs. Removed, and the whole seed was replayed to confirm it lands on
  the same state as the migrations.

### Deploy notes

- Apply migrations 00026 through 00031 to remote databases.

---

## v0.8.1 — Checkout fixes, 14-guest cap, new villa write-up — 2026-09-24

### Fixes

- **"window.Razorpay is not a constructor" on live checkout.** The checkout script was loaded with
  `strategy="beforeInteractive"` from a client component, which production builds do not honour.
  It now loads `afterInteractive`, and `loadRazorpay()` awaits the script before the booking order
  is created, so a gateway that fails to load never leaves a pending hold on the dates.

### Changes

- **Guests default to 8 adults** (capped at the villa maximum) in the date picker, the checkout
  page and the create-order API.
- **Max guests 14** (was 15). Migration 00025 sets `max_occupancy = 14`; the nightly rate still
  covers 12, so guests 13 and 14 pay the extra-guest rate. Fallbacks, meta descriptions and two
  journal posts now say 14.
- **New "About the Villa" write-up** (migration 00025 and seed). The description is stored as
  paragraphs separated by blank lines; the home and The Villa pages render each as its own `<p>`.
- **Calendar prefetch:** `useNightCalendar` loads six months on page load, then the month on
  screen plus the next two, in one request each.

### Deploy notes

- Apply migrations 00023, 00024 and 00025 to remote databases.

---

## v0.8.0 — Booking codes, private booking links, WhatsApp ID sharing, SEO and GEO — 2026-09-24

### Booking codes (`V19-7KQ-M4X`)

Replaces the random `MNG-3F9A2C` reference that guests used to see.

- **Format:** villa prefix (`properties.booking_code_prefix`), 5 random Crockford Base32
  characters (no I, L, O or U) and a mod-31 check character that catches single typos and swapped
  neighbours. Chosen after reviewing how Airbnb, Booking.com and PMS vendors number bookings;
  counter formats were rejected because they reset, collide across years, reveal booking volume
  and look like GST invoice numbers.
- **Assigned by a database trigger** (migration 00023) the first time a booking becomes confirmed,
  whichever path confirms it: website payment, Ooruda Villa, or an OTA import. Never changes and
  is unique across villas; confirming twice keeps the same code.
- `src/lib/booking-code.ts` mirrors the SQL algorithm to normalise and validate typed-in codes.
  Unit tests cover typos and swaps; a local-database test checks 200 SQL-generated codes against
  it, plus the trigger and the format constraint.
- `reference_number` stays internal (Razorpay receipts). Booking codes are not invoice numbers.

### Private booking links

The confirmation page lived at `/booking/<reference>` and showed the guest's name, email and phone
to anyone holding the 6-character reference. It now lives at `/booking/<access_token>`: 64 hex
characters generated by the database for every booking. Malformed or unknown tokens return 404
before any lookup. The confirmation email links to it.

### WhatsApp ID sharing

- A prefilled `wa.me` link carrying only the booking code and adult count (no name, dates or
  phone). Shown on the confirmation page and in the confirmation email once a booking is paid.
- New `bookings.id_status` (`pending`, `received`, `verified`, migration 00024) updated by Ooruda
  Villa; the page changes to match. Nothing is uploaded or stored on this site.
- Accepted IDs: Aadhaar (masked preferred), passport, driving licence. The Privacy page now
  explains the process. Internal retention (one week after check-out) is in the integration doc.

### SEO foundation

- `pageMetadata()` helper (`src/lib/seo.ts`) gives every page a canonical URL and complete Open
  Graph and Twitter tags. Page-level `openGraph` objects had been replacing the root one and
  silently dropping site name, locale and image.
- Titles and descriptions rewritten to search-result lengths (titles about 60 characters with the
  suffix, descriptions 140 to 160). The homepage title no longer repeats the brand.
- Structured data: `Organization` on every page, `LodgingBusiness` on the homepage and The Villa
  (built from database fields), `BreadcrumbList` on interior pages, `FAQPage` on the Stay Guide.
- Generated 1200 x 630 share image (`src/app/opengraph-image.tsx`), referenced on every page.
- Sitemap drops `/book`; `/testimonials` is noindex; `keywords` meta removed; Search Console and
  Bing verification via `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION`.

### GEO (AI assistants)

- `robots.txt` names and allows AI search and training crawlers (OpenAI, Anthropic, Perplexity,
  Google-Extended, Applebot-Extended, Common Crawl).
- Beach and airport distances on the homepage and The Villa now come from `nearby_places`, so the
  site cannot contradict itself. Panambur corrected to 15 minutes.
- New "Good to Know" section on The Villa (no pool, self-catering, not beachfront, no pets), also
  marked as absent amenities in the structured data.
- GA4 "AI assistants" channel group documented in `DEPLOYMENT.md`, for when analytics is live.

### Fixes

- The homepage WhatsApp and Call buttons fell back to a placeholder number belonging to a
  stranger. They are now hidden when no number is configured.
- Emails escaped guest-supplied text. A name containing HTML became live markup before.

### Integration doc

Section 5.7 covers booking codes, private links, OTA codes, searching, `id_status` and the exact
WhatsApp message format, with new checklist items.

**tsc clean, 73 tests pass, production build verified. Migrations 00023 and 00024 applied to
staging and local.**

---

## v0.7.0 — Journal, content refresh endpoint, Someshwar distance fix — 2026-09-23

### Journal (`/journal`)

A new editorial section for guests who are still deciding: Mangalore guides and stay planning
advice, aimed at longer search phrases the main pages cannot target. Named "Journal" rather than
"Blog".

- **Index:** latest post as a featured card, the rest in a 2-column grid. Category, date and
  reading time on every card.
- **Post page:** title band, body limited to about 68 characters per line, 2 related posts, and
  the standard "Check Availability" card. `Article` and `BreadcrumbList` structured data,
  canonical URL and Open Graph tags per post.
- **Typography matches the site:** Cormorant headings (`text-3xl font-black tracking-tight`),
  Nunito body at the site's `--text-body-lg` size for long reading, Cormorant card titles.
- **Covers:** a real photo when a post has one; otherwise a maroon panel with the Habbaa logo. A
  compact logo-only version is used for small thumbnails. No stock photos.
- **Launch rule:** the footer, mobile drawer and sitemap only link to the Journal once at least 3
  posts are published. The desktop nav is unchanged. Draft posts are visible in development only,
  return 404 in production, and are marked noindex.
- **First 3 posts** (MDX files in `src/content/journal/`): best time to visit Mangalore, beaches
  near Villa 19, and planning a group getaway. Facts come from the site's own data.

### Two post sources: MDX files and Ooruda Villa

- MDX files in the repo, compiled with `@next/mdx`.
- New `journal_posts` table (migration 00022) for posts written in Ooruda Villa. Body is plain
  Markdown, rendered with `react-markdown`; raw HTML, inline images and unsafe links are dropped,
  and a stray `#` heading cannot add a second h1. The database enforces slug format, category,
  a publish date on published posts, and alt text on cover images. Visitors can read published
  rows only.
- A database post with the same slug as an MDX post replaces it, so file posts can be moved into
  Ooruda Villa later by copying. If the database is unreachable, the MDX posts still render.

### Content refresh endpoint (`POST /api/revalidate`)

Content pages are rendered once and cached, so edits Ooruda Villa made to nearby places, policies
or FAQs only appeared after a redeploy. The new endpoint refreshes every page and the sitemap. It
requires `Authorization: Bearer <CONTENT_REVALIDATE_SECRET>`, compared in constant time
(`bearerSecretMatches`, with unit tests), and returns 503 when the secret is not configured. The
secret is set in Vercel; Ooruda Villa will add it when its Journal editor is built.

`docs/OORUDA_VILLA_INTEGRATION.md` gains section 9 (journal columns, Markdown rules, publishing,
the refresh call, and the pending Ooruda Villa setup) plus two checklist items.

### Someshwar Beach distance

Nearby places listed Someshwar Beach at 6 km and 18 minutes. It is about 24 km away. Corrected
to 24 km and about 45 minutes in `seed.sql`, staging and the local database.

**tsc clean, lint clean, 60 tests pass, production build verified.**

---

## v0.6.9 — Nav active state, logo fix, title bands, gallery grid — 2026-09-17

### Desktop and mobile nav active state

`NavLink` (desktop) and the mobile drawer links now track the current pathname via `usePathname`.
Active item shows white text and a brass underline (desktop) or maroon text with a faint maroon
background tint (drawer). `aria-current="page"` added for screen readers. Hover is suppressed on
the active item to avoid conflicting visual signals.

### About page logo

The hero section used `habbaa-logo.png` which has a dark navy background baked into the PNG.
Replaced with `habbaa-logo-white.svg` inside a `--maroon-deep` circle with a brass border — the
same treatment used in the header and drawer. Looks intentional rather than broken.

### VILLA 19 casing consistency

The Villa page h1 now renders `{property.name}` with `textTransform: uppercase`, matching the
homepage hero. Both pages now show "VILLA 19".

### WhatsApp contact card — brass palette

The WhatsApp card in the contact page used WhatsApp green for the icon background and the
"Message Us" link text. All three contact cards (WhatsApp, Email, Call) now use the site's
brass/maroon palette consistently.

### Title band padding reduced

Interior page title bands were set to `py-16 sm:py-20` (64/80px) with 2-3 lines of content —
visibly empty. Tightened to reflect content density:
- Gallery, Rooms, Contact: `py-10 sm:py-14`
- About, The Villa (more content): `py-12 sm:py-16`
- Events, Stay Guide: already at `py-10 sm:py-14`, unchanged

### Gallery subtitle improved

Replaced the placeholder "A visual tour of the villa and its surroundings" with copy that is
specific and useful to a prospective guest.

### Gallery grid — orphan stretching removed

The previous logic widened lone orphan tiles to fill their row (1 image → full-width banner,
2 images → double-wide tile). This made portrait photos appear as stretched landscape banners.
Removed entirely. All tiles use a consistent `aspect-[4/3]` at their natural column width.
`sizes` hint corrected to `50vw / 33vw` to match actual rendered column widths.

**tsc clean.**

---

## v0.6.8 — Consistent dark backgrounds, drawer direction fix — 2026-09-17

### CTA card backgrounds unified to `--maroon-deep`

Seven closing CTA cards (About, Rooms, Events, Gallery, Stay Guide, Testimonials, The Villa) used
`--maroon` (#5A2626) while the header, footer and checkout header bar use `--maroon-deep` (#3C1717).
On each page, the lighter card sits close to the darker footer — a two-tone dark that reads as a
mistake rather than a deliberate design choice. All seven changed to `--maroon-deep`.

Buttons and small UI elements (`EnquiryForm` send button, mobile sticky "Book Now") keep `--maroon`
— the contrast distinction is intentional at button scale.

### Mobile drawer now opens from the left

The hamburger button was on the left; the drawer slid in from the right. Mismatched direction breaks
the visual causality of the tap — Fitts's Law says the control and the surface it opens should be on
the same side. The drawer panel changed from `right-0` to `left-0`. The hamburger, drawer and close
button are now all on the left side of the screen.

**tsc clean.**

---

## v0.6.7 — Lining numerals, hero uppercase, nav audit — 2026-09-17

### Lining numerals in headings

Cormorant Garamond ships with old-style numerals by default: digits 3, 4, 5, 7 and 9 drop below
the text baseline, which at display and heading sizes reads as a rendering bug. A single CSS rule
(`font-variant-numeric: lining-nums` on `h1–h6`) switches all headings to lining numerals — uniform
height, all sitting on the baseline. Body text is unaffected and keeps old-style figures, which is
typographically correct in prose. Verified on "Villa 19" hero title and "4-Bedroom" subtitle.

### Hero title uppercased via CSS

The homepage `h1` previously hardcoded the string `'VILLA 19'`. It now uses `{property.name}` with
`textTransform: 'uppercase'` so the visual rendering stays the same but the data stays clean:
metadata, WhatsApp pre-fills and booking refs all continue to use the correctly-cased property name.

### Navigation and footer audit

A site-wide audit of every page against every navigation surface found several issues, now fixed:

**`/about` restored to nav:**
- Added to footer Explore column (replacing Testimonials)
- Added to mobile drawer (before Contact Us, replacing Testimonials)
- Added to sitemap.ts at priority 0.6
- Was removed in commit `48bd955`; page and content were always complete

**Testimonials removed from nav until reviews exist:**
- "Testimonials coming soon" landing after a nav click undermines trust more than no link
- Page stays live and will be re-added when real reviews are collected

**Social media icons removed:**
- All three (Facebook, Instagram, LinkedIn) linked to platform homepages, not Habbaa accounts
- Removed from desktop footer column and mobile icon row; dead links are worse than no links
- SVG components, `SOCIALS` array and layout blocks deleted; footer bottom bar simplified

**Privacy policy — Google Analytics claim removed:**
- Policy stated "We also use Google Analytics" but `NEXT_PUBLIC_GA_ID` is not configured
- Removed the false statement; wording replaced with a neutral no-ad-targeting note

**Stale code comment removed:**
- Footer had a comment claiming `/terms#cancellation` was broken; the link works correctly
  (`terms/page.tsx` has `id="cancellation"` on the Section). Comment deleted.

**`tsc` clean. 56 tests pass.**

---

## v0.6.6 — WhatsApp number fix, light title bands — 2026-09-16

### WhatsApp number corrected and fallback removed

`.env.local` had the sample number `919876543210` (copied from `.env.example`) instead of the real
number. It is now `917760777876`. More importantly, a fake fallback number was hardcoded in 11 places
across the codebase: a missing env var silently produced a working link to a stranger's number.

- The hardcoded fallback is removed from every file.
- If no number is configured, every WhatsApp button, card and link simply does not render.
- All nine link sites (contact card, call card, events hero, events CTA, testimonials CTA, stay-guide
  inline link, stay-guide CTA, homepage reviews, homepage mobile sticky bar) are guarded and verified.
- `.env.example` now ships blank with a comment explaining why a sample number is dangerous.
- **TODO added:** set `PROPERTY_WHATSAPP` in Vercel for staging and production.

### Light page title bands (10 pages + booking confirmation)

Every page opened with a dark maroon title band directly under the dark maroon header: two stacked
dark blocks made every page top-heavy and the title text was maroon on maroon (illegible).

All ten site pages and the booking confirmation page now use a warm off-white band (`--paper-sunk`):
- Title in maroon serif (Cormorant), small eyebrow label in darker gold, subtitle in muted grey
- A hairline border separates the light band from the dark header
- The dark header, footer and maroon closing CTA bands are deliberately unchanged
- The About page dark logo swapped to the dark-on-light version (`habbaa-logo.png`)
- Booking confirmation tick changed from gold to green (`--ok`)

Pages changed: About, Contact, Events, Gallery, Privacy, Rooms, Stay Guide, Terms, Testimonials,
The Villa, Booking confirmation.

**Verified** in browser at 1280x900 across all pages. tsc clean. 56 tests pass.

---

## v0.6.5 — Type roles, one form-field style, announcement bar — 2026-09-16

### Fonts now follow a role, not a tag

Three faces are loaded, and they were applied inconsistently: the homepage title used Cinzel (the
wordmark face) while every other page title used Cormorant, and a room name was serif on `/rooms` but
sans on the homepage. The rule now:

| Role | Face |
|---|---|
| Wordmark lockup ("Villa 19 by Habbaa": header, footer, checkout header) | **Cinzel** |
| Page titles, major section titles, dialog titles | **Cormorant Garamond** |
| Card and item titles (room names, card headings), labels, body, controls | **Nunito Sans** |

- Homepage title moved off Cinzel onto Cormorant, so every page title matches.
- Room names are sans in both places; "Send an Enquiry", "Testimonials coming soon" and "Enquiry
  Received" moved to sans as card titles.
- Unchanged and confirmed correct: "Room Breakdown" and the amenities dialog title stay serif; gallery
  category labels, "Stay Details", "Booking Summary", "Emergency Contacts" and "Important Notes" stay sans.

### One field style in the booking form

The two date fields sat inside an extra sunk panel while the guest selector used `--cream`, the
announcement bar's attention ground: one form, two field fills, and a box inside a box. All three
controls now share `--paper-sunk`, a hairline border, 12px radius, the same padding and a 44px minimum
height (WCAG 2.2 target size), with identical labels. The nested panel is gone.

### Announcement bar

- The close (X) button is removed, with its dismiss state and icon import; the next arrow moves back to
  the right edge.

### Other

- The enquiry form's guest field read "1 to 12" against a real maximum of 15. It now takes the limit
  from the property.

**Verified** in the browser at 1280x900: the three booking-widget controls are 44px tall with matching
fill, border, radius and width; homepage title renders in Cormorant; room names match across pages; the
announcement bar has only previous/copy/next. tsc, 56 tests and lint (no new errors) pass.

*Note: an earlier measurement pass in this round reported nonsense sizes (26px-wide fields). The
preview pane had rendered the app with a zero-width body; the figures above come from a re-run with a
confirmed 1272x900 viewport.*

---

## v0.6.4 — Colour system, clearer calendar, no italic headings — 2026-09-15

### A single colour system

Text colours had been chosen page by page: "By Habbaa" was brass in the header and 50% white in the
footer, small brass labels failed contrast, and green was used both for "available" and as decoration.
`globals.css` now documents one role table, and every page follows it:

| Ground | Role | Colour | Contrast |
|---|---|---|---|
| Light | Headings, titles | `--maroon` | 11.4 |
| Light | Body / secondary text | `--ink` / `--ink-muted` | 17.5 / 5.6 |
| Light | Eyebrows, small labels, accent numbers, inline links | **`--brass-ink` #8A5E22 (new)** | 5.4 |
| Light | Icons, stars, rules, borders | `--brass` | non-text only (3.8) |
| Light | Placeholders, disabled | `--ink-faint` | never readable text (3.0) |
| Light | Availability, success | `--ok` | status only |
| Dark | Wordmark, headings | white | |
| Dark | "By Habbaa", nav, eyebrows, column headings, icons | `--brass-light` | 5.9 |
| Dark | Links / fine print | white 75% / 60% minimum | 8.3 / 6.5 |

Changes that follow from it:
- Footer "By Habbaa", column headings and icons now `--brass-light`, matching the header. Footer
  fine print raised from 45% white (4.2, fails) to 60%.
- ~30 small accent texts moved from `--brass` to `--brass-ink` (eyebrows, category headings, inline
  email/WhatsApp links, the verified-booking badge, booking step numbers, totals).
- Readable text in `--ink-faint` moved to `--ink-muted` (captions, helper text, "Optional").
- Green removed from decoration ("Ensuite Bath" is now muted); green now means availability or success.
- Gallery lightbox moved off Tailwind slate/amber to a warm near-black with brass-light accents; an em
  dash in its caption replaced.
- Error text uses `--error` instead of Tailwind red.

### Calendar

- "Booked" renamed **"Not available"** in cells, legend and screen-reader labels (it also covers
  blocked dates, which are not bookings).
- The first tints were about 1.15:1 against the white popup and hard to tell apart. States now have a
  solid fill and a border: **green** available, **gold + star** special price, **rose, hatched, struck
  through** not available. Label inks are 5.6:1 or better.
- Cells enlarged from ~40px to 48×54px, day numbers 14px, labels 10px; popup 392px.
- **Fix:** the calendar popup was clipped or covered in three places. It is now positioned against
  its field (`position: fixed`) and rendered outside its container: under `<body>` on normal pages,
  and inside the `<dialog>` for the booking pop-up, which the browser draws in its top layer.
  - the homepage booking card's `overflow-hidden` cut off the legend and GST note;
  - the booking pop-up is a scrolling `<dialog>`, which cut the calendar off;
  - the booking column is `position: sticky`, a stacking context, so the popup's `z-index: 200` only
    ranked it within that column and the cookie banner (`z-50`) drew over its lower rows.

  It re-places after every render while open, follows scrolling (including inside the dialog), flips
  above the field when there is no room below, and is clamped to the viewport. Verified at 1024x768,
  768x1024 and 375x812, in the widget and the pop-up, with the cookie banner showing.
- "1 nights" now reads "1 night" in the widget and checkout.

### Italic headings removed

Page titles and closing CTA headings on About, Contact, Events, Gallery, Rooms, Stay Guide,
Testimonials, The Villa and the booking confirmation page were set in italic (15 headings). All are
upright now, and the italic variants of Nunito Sans and Cormorant Garamond are no longer downloaded.

---

## v0.6.3 — Colour-coded availability calendar — 2026-09-15

Guests could not tell at a glance which nights were free: every day looked the same apart from a
small price. Each date picker now reads like a hotel availability calendar.

| Night | Cell | Also shown by |
|---|---|---|
| Available | light green, price in green | price label, "₹12,000 per night" to screen readers |
| Special price (a `pricing_rules` night) | light brass, darker brass price | ★ icon, rule name read out |
| Booked or blocked | grey hatched, day number struck through | the word "Booked" |
| Past, or beyond the latest check-out | faded | "not available" to screen readers |
| Selected | maroon | — |
| Today | brass outline | — |

- Status never relies on colour alone (text, strike-through, star and aria-label all carry it).
  Special-price text uses `#8A5E22` because site brass (`#A87432`) fails AA at 9px; "Booked" uses
  `--ink-muted` for the same reason on the hatch.
- **Legend** under the grid: Available / Special price / Booked, and "Prices are per night, before
  18% GST". While a month loads it reads "Checking availability and prices…"; if it fails it says so
  and explains dates can still be chosen, instead of silently showing no prices.
- **Check-out calendar:** booked nights appear booked, except the morning of the first booked night,
  which is a valid check-out and shows as open. Nights beyond it fade out.
- **Fix:** the homepage widget let check-out equal check-in (a zero-night stay that only produced an
  error). Check-out now starts the day after check-in, as the booking pop-up already did.
- The calendar API adds `special` (the pricing rule name, or null) to each night. DatePicker takes one
  `getDayInfo` prop in place of the separate unavailable/price props, plus `getMonthStatus`.

**Verified** in the browser via computed styles: 30 Sep green tint + green ₹12k; 6 Oct hatched,
struck, "Booked", disabled; 31 Dec brass tint, star, ₹16k, rule name in the label; legend text present;
check-in 5 Oct moves check-out to 6 Oct, with 7 Oct faded. No console errors. 56 tests pass.

---

## v0.6.2 — Prices in the date picker — 2026-09-15

Every date picker (homepage widget, booking pop-up, `/book`) now shows the nightly price under each
available day, alongside the booked and blocked nights already struck out.

- **All from the database.** `GET /api/availability/calendar` now returns every night in the window
  with `{ date, rate, available }`, built from the property's weekday/weekend rates, `pricing_rules`,
  and `get_unavailable_nights()`. Nothing about prices lives in the component.
- **Same price as checkout.** The per-night rule (pricing rule, else Friday/Saturday weekend rate, else
  weekday rate) moved out of `calculateBookingPrice` into `nightlyRate()` in `pricing-engine.ts`. The
  calendar API and checkout both call it, so the figure on a date is the figure charged.
- **Loaded month by month** (`useNightCalendar`) as the guest pages through the calendar, instead of
  one fixed 180-day window, so prices and availability appear for any month. Every month a chosen stay
  touches is loaded so the "already booked" check sees all its nights.
- **Display:** a short label under the day (`₹12k`, `₹16k`), full amount in the screen-reader label
  ("31 December 2026, ₹16,000 per night"). Taken nights show no price. The popup widens from 280px to
  320px when prices are shown.
- If a month fails to load, its dates stay selectable without prices; checkout still prices the stay
  and re-checks availability on the server.

**Verified** against local Supabase in the browser: 17 Dec ₹12k, 18 Dec (Fri) ₹14k, 31 Dec and 1 Jan
₹16k, 2 Jan (Sat) ₹14k, 6 Oct (booked) struck out with no price, in both the widget and the booking
pop-up; API returns 404 for an unknown property and 400 for bad input. 56 tests pass, including new
tests for `nightlyRate`, `addMonthsISO` and `formatCompactINR`.

---

## v0.6.1 — Pricing and occupancy update — 2026-09-15

Operator decisions, applied by migration `00021` (local and hosted):

| | Before | After |
|---|---|---|
| Guests included in the nightly rate | 8 | **12** |
| Maximum guests | 12 | **15** (12 + up to 3 extra) |
| Extra guest charge | ₹750 per person per night | **₹1,000** per person per night |
| Weekday / weekend nightly rate | ₹12,000 / ₹14,000 | unchanged |
| Seasonal rules | Diwali ₹18,000 (min 2), New Year ₹20,000 (min 3), Summer ₹15,000 (min 2) | **Removed** |
| New Year | ₹20,000, 29 Dec to 1 Jan, 3-night minimum | **₹16,000** on 31 Dec and 1 Jan only, no minimum |

- Future seasonal prices are set by the operator in Ooruda Villa. Minimum stay remains supported per
  rule, but no rule sets one.
- **Advertised capacity stays "up to 12 guests"**: homepage, rooms, the-villa and events now read
  `base_occupancy` instead of `max_occupancy`, which became 15. House rules (stay guide, terms,
  homepage "Max guests") and the booking form use the real maximum of 15.
- `seed.sql` updated so a local reset does not restore the old rules and rates.
- New pricing tests cover the live configuration, including 1 Jan (a Friday) taking the ₹16,000 rule
  over the weekend rate.

---

## v0.6.0 — Guest availability calendar, concurrency tests, Ooruda Villa contract — 2026-09-15

### Guest availability calendar

Guests could previously pick any dates and only found out at payment that a night was taken.

- **`get_unavailable_nights(property, from, to)`** (migration `00019`) returns the taken nights in a
  window. It calls `check_availability()` for each night instead of copying its overlap rule, so the
  calendar, `/api/availability` and `create_booking_atomic` cannot disagree.
- **`GET /api/availability/calendar`** serves it, capped at 186 nights. Cached at Vercel's edge for
  60 seconds (`CDN-Cache-Control`) but `no-store` in the browser: browsers honour
  `stale-while-revalidate` too, and the first version of this route let a guest's browser show a
  just-blocked night as free for minutes. Caught in browser testing.
- **Date pickers** (homepage widget, booking dialog, `/book`) strike out booked and blocked nights for
  check-in, and cap check-out at the first taken night, since checking out on the morning someone else
  arrives is allowed. Choosing a new check-in that would span a taken night resets check-out.
- **Stale links** to `/book` with dates that are now taken show "Some of those nights are already
  booked" before the guest fills in the form.
- If the calendar request fails, every date stays selectable and checkout still re-checks under a
  lock. It degrades to the old behaviour rather than blocking bookings.
- Range rules live in `src/lib/availability.ts` with unit tests.

### Double-booking protection, proven under load

`src/lib/__tests__/booking-concurrency.test.ts` runs against local Supabase with real concurrent
requests:

| Check | Result |
|---|---|
| 50 simultaneous requests for the same dates | exactly 1 booking, 49 clean `DATE_UNAVAILABLE` |
| 20 staggered overlapping stays fired at once | no two winners share a night; no crashes or deadlocks |
| Back-to-back stays (check-out day = next check-in) | both succeed |
| Blocked night | refuses stays that include it, allows a stay checking out that morning |
| Lapsed 15-minute hold | dates released to the next guest |
| `get_unavailable_nights` | lists booked and blocked nights, never check-out days |

It refuses any non-localhost Supabase URL, skips when the local stack is down, and cleans up after
itself.

### Ooruda Villa integration contract

`docs/OORUDA_VILLA_INTEGRATION.md`: the rules Ooruda Villa must follow when it writes blocked dates,
bookings and rates into this database. Covers half-open date ranges, IST dates, creating bookings only
through `create_booking_atomic`, status values, cancellations, rate formulas, and mirroring Razorpay
refunds (the webhook is off).

It also flags existing data: the seeded seasonal pricing rules read as if their end dates were
inclusive, but the engine treats them as exclusive, so the last night of Summer Holidays (31 May) and
Diwali Peak (21 Oct) is priced at the normal rate.

### Database

- `00019_unavailable_nights.sql`: the function above, service_role only.
- `00020_service_role_write_grants.sql`: service_role can write `blocked_dates`, `pricing_rules` and
  `properties`. Hosted Supabase already allowed this; a local stack built from migrations did not, which
  the concurrency tests exposed.

---

## v0.5.1 — Payment hardening & admin removal — 2026-09-12

### Payments (Razorpay)

- **Compare-and-swap on `payments.status`** in `verify-payment` and the webhook. Only the first
  caller to move a payment to `captured` confirms the booking and sends email, so enabling the
  webhook no longer means every guest gets two confirmations, and a double-submit no longer
  re-sends them. A resubmit on an already-captured payment returns `verified: true`.
- **Late `payment.failed` can no longer cancel a paid booking.** It only moves `created`/`expired`
  payments and only cancels a booking that is still `pending`.
- **`refund.processed` redelivery** no longer re-sends the refund email.
- **Malformed signatures return 400, not 500.** New `hexSignatureMatches()` (`src/lib/signature.ts`)
  never throws; used by both routes. Unit-tested.
- **No more orphan Razorpay orders.** `create-order` now takes the booking hold first; if the
  Razorpay order then fails, the hold is released immediately instead of blocking the dates for
  15 minutes.

### Admin surface removed

Admin belongs to the Ooruda Villa project (separate repo and Supabase project), so the whole
surface is deleted here: `src/app/admin/`, `src/app/api/admin/`, `src/components/admin/`,
`src/middleware.ts`, `src/lib/supabase/client.ts`, and the cookie-session helper in
`src/lib/supabase/server.ts`. `/admin/` is dropped from robots.txt.

This also closes the hole it was hiding: `/api/admin/*` required **no authentication at all**
(the middleware matched `/admin/:path*` only), so anyone could change nightly rates or create
confirmed bookings. Those endpoints no longer exist.

### Security

- **Anyone could become an admin.** `profiles.role` defaulted to `'admin'` and email sign-up was
  open, so any account created through the public auth API landed with the admin role. Migration
  `00018` changes the default to `'guest'`; local `config.toml` disables sign-up. `00003` still
  has RLS policies keyed on `role = 'admin'`, so this matters even with no admin UI here.
  **Remote:** turn sign-up off in the Supabase dashboard and review existing `profiles` rows.

### Other

- `EnquiryForm` date pickers use the IST calendar day (`todayISO()`).
- `.claude/launch.json`: `autoPort: true`, because port 3000 is often held by another project.

### Verified

Against local Supabase and this app's dev server: webhook 400 on
a non-hex signature; captured replay, late failed and refund replay all leave state unchanged;
`verify-payment` 400 / 200 (idempotent) / 409 for bad signature / resubmit / unknown order.
`tsc`, eslint and 32 unit tests pass. Not covered: a first-time capture end to end (it sends real
email via Resend).

`npm run build` passes with no admin routes and no middleware.

---

## v0.4.0 — Booking hold expiry (the abandoned-checkout fix) — 2026-09-03

### The bug

`create_booking_atomic` writes a `pending` booking *before* the guest pays, and both
`/api/availability` and `create_booking_atomic` counted every `pending` row as blocking.
Nothing ever cleaned them up. **Every abandoned checkout blocked its dates permanently** —
open the form, hit Pay, close the tab, and those nights were dead forever.

### The fix — `00010_booking_hold_expiry.sql`

- **`bookings.hold_expires_at`** — a pending booking now carries a 15-minute hold. It blocks
  dates only while that hold is live. Expiry is therefore correct **at read time** and does
  not depend on a sweeper having run — dates free themselves even if every job is down.
- **`check_availability(property, check_in, check_out)`** — the overlap predicate now lives in
  one SQL function. It was previously duplicated between `create_booking_atomic` and the
  availability route, which is exactly how two copies drift apart. Both now call it.
  `COALESCE(hold_expires_at, created_at + 15 min)` guards rows written by older code paths,
  so a NULL can never silently unblock a live hold.
- **`expire_stale_booking_holds()`** — housekeeping only, not load-bearing. Flips lapsed holds
  to `expired` (and their `payments` rows from `created` to `expired`) so `pending` keeps
  meaning "genuinely awaiting payment" in admin views.
- **Existing pending rows backfilled** to `created_at + 15 min` — already in the past, so the
  historical backlog releases immediately. That is the intended repair.
- Partial index `idx_bookings_active_holds` on `(property_id, check_in, check_out)`.

### Supporting changes

- **`GET|POST /api/cron/expire-holds`** — runs the housekeeping sweep, gated on `CRON_SECRET`
  via `Authorization: Bearer`. Returns 401 without it, 503 if the secret is unset.
  *(Superseded in v0.4.1 — the route, `CRON_SECRET` and `vercel.json` were removed in favour
  of pg_cron. See "Vercel deployment failure" below.)*
- **`vercel.json`** — schedules the sweep every 10 minutes. *(Superseded in v0.4.1 — replaced by a
  daily pg_cron job; the 10-minute schedule was what broke Vercel deployments.)*
- **`/api/availability`** — now delegates to `check_availability` instead of carrying its own
  copy of the predicate.
- **`verify-payment`** — a guest can pay *after* their hold lapses (slow UPI, left the modal
  open). The payment is always honoured and `hold_expires_at` is cleared, making the row
  permanent. If the lapsed dates were meanwhile taken by someone else, the collision is logged
  as `DOUBLE BOOKING` for manual resolution — refusing a guest who has already been charged
  would be worse than flagging it.

### Verified end to end

Against local Supabase with live Razorpay **test** keys:

| Check | Result |
|---|---|
| Razorpay Checkout opens with real order, correct branding and ₹44,840 | pass |
| Booking written `pending` with a live 15-min hold, amount in integer paise | pass |
| `verify-payment` with a genuine HMAC → `confirmed` / `paid`, hold cleared | pass |
| Forged signature rejected with HTTP 400 | pass |
| Live hold blocks the dates | pass |
| Lapsed hold releases the dates **with no sweeper run** | pass |
| A second guest can then actually book the released dates | pass |
| Confirmed booking blocks dates regardless of a stale timestamp | pass |
| Pending row with NULL `hold_expires_at` still blocks (no NULL-comparison leak) | pass |
| Cron route: 401 unauthenticated, 401 wrong secret, sweeps when authorised | pass |

### Still open (found during this review, not yet fixed)

- `verify-payment` and the webhook both update `payments` unguarded and both send email. If
  the webhook is ever enabled, **every guest gets two confirmations**. Needs a compare-and-swap
  (`.eq('status','created')`) on the update so only the winner emails.
- Webhook `payment.failed` cancels the booking unconditionally. Webhook delivery is unordered,
  so a late `failed` from an earlier attempt can cancel an already-paid booking.
- Webhook's `timingSafeEqual` sits outside its try/catch — a malformed non-hex signature throws
  an unhandled 500 instead of a clean 400.

---

## v0.1 — Phase 0: Critical Pre-Launch Fixes — 2026-09-02

Nine blocking defects fixed before any public traffic is allowed. None of these are features — they are corrections to code that was actively broken, deceptive, or insecure.

### Payment Flow — Fixed (was completely broken)

- **`/book` page**: was showing "Payment Verified — Booking Confirmed!" immediately after calling `create-order`, without ever opening Razorpay. No money moved. Now correctly loads the Razorpay Checkout SDK (`checkout.js` via `<Script strategy="beforeInteractive">`), opens the modal, and only shows the success screen after server-side signature verification passes.
- **`create-order` API**: was falling back to a random mock booking reference (`MNG-XXXXXX`) on any DB error, silently issuing fake references for non-existent bookings. Now fails closed with HTTP 503 — no fake references issued under any circumstances.
- **`create-order` API**: never inserted a `payments` row, so the webhook could never find a matching row to confirm. Now inserts the `payments` row (with `razorpay_order_id`, `booking_id`, `amount`, status `created`) immediately after the Razorpay order is created. If the insert fails, the route returns 503 rather than proceeding.
- **New `/api/bookings/verify-payment` route**: verifies the Razorpay HMAC signature (`order_id|payment_id` digest) server-side, updates the `payments` row to `captured`, and marks the booking `confirmed` + `payment_status: paid`. The `/book` page calls this in the Razorpay `handler` callback before showing the success screen.
- **Success screen copy**: removed false claims — "Payment Verified" → "Payment Successful"; removed "confirmation receipt sent to email" (no email is wired yet).

### Security — Fixed

- **RLS migration `00006_rls.sql`**: enables Row-Level Security on all eight core tables (`properties`, `rooms`, `property_images`, `pricing_rules`, `blocked_dates`, `bookings`, `payments`, `addon_services`). Revokes the dangerous `GRANT INSERT ON bookings, payments TO anon, authenticated` from `00004_grants.sql` — direct PostgREST insertion is now disallowed for all client roles. Guests can read only their own bookings/payments (matched by JWT email). All write paths go through `createServiceClient()` in server-side API routes.
- **Middleware**: replaced the explicit `ADMIN_ROUTES` allowlist (new routes were public by default) with a default-deny approach — everything under `/admin` is protected except `/admin/login`. Removed the missing-env bypass that let unauthenticated requests through when Supabase credentials were absent; missing credentials now redirect to `/admin/login` rather than bypassing auth.

### Content — Fixed

- **Fabricated testimonials removed**: "Priya N.", "Rohan M.", "Ananya & Family" (one dated "Auguest 2026"), all with fake "Verified Stay" badges, are gone. The reviews section now shows a placeholder directing visitors to WhatsApp. The `avgRating` display derived from these fake reviews is also removed.
- **Metadata fixed** (`layout.tsx`): removed "Private pool", "ocean views", "private pool villa mangalore" from title, description, keywords, OG, and Twitter metadata. The villa has no pool and no ocean views. Corrected to: Villa 19 by Habbaa, private lawn, 4 bedrooms, sleeps 12.
- **Amenities restored** (`mock-data.ts`): three amenity items silently deleted by a lint pass were restored — `'BBQ Grill & Bonfire Kit'`, `'Outdoor Dining Area'`, `'Dining for up to 12 Guests'` under Kitchen & Dining.

### Configuration — Fixed

- **`.env.example`**: corrected env var names to match what the code actually reads. `NEXT_PUBLIC_RAZORPAY_KEY_ID` → `RAZORPAY_KEY_ID` (server-side only — the key was never supposed to be public). `NEXT_PUBLIC_PROPERTY_WHATSAPP` → `PROPERTY_WHATSAPP`. `NEXT_PUBLIC_APP_URL` → `APP_URL`. Domain fallback changed from `villamangalore.com` → `habbaa.in` in sitemap and robots.
- **Three-environment DB setup**: documented in `DEPLOYMENT.md` (to be created). Pattern follows the Proptech project: local Supabase → staging (remote-local) → production (remote-prod).

### Locked Decisions (from user, 2026-09-02)

- Hero: **stills** for launch, video deferred.
- `/events`: **events hostable at the property**, not Mangalore city events.
- OTA inventory: **whole villa only** (no individual bedroom sales on OTAs).
- Best-rate guarantee: **yes** — "Book Direct — Best Rate Guaranteed" badge on booking CTA.

| Migration | Change |
|-----------|--------|
| `00006_rls.sql` | RLS on all core tables; revoke anon INSERT on bookings/payments; guest self-read policies |

---

## v0.2 — Phase 1: Design System, Full Site, & Content — 2026-09-02

Complete ground-up rebuild of all guest-facing pages, design tokens, and supporting infrastructure.

### Design System

- CSS custom properties (`globals.css`): `--maroon`, `--brass`, `--paper`, `--ink`, `--surface`, `--border-*` tokens. Full dark-mode support via `prefers-color-scheme` + `data-theme` attribute.
- Display font: Crimson Text (Google Fonts, 400/600/700). Body: system font stack.
- Tailwind extended with brand tokens; all spacing/colour in components references CSS vars.

### Route Architecture

- Reorganised into Next.js App Router route groups: `(site)/` for all guest pages (with shared Header + Footer), `(checkout)/` for `/book` (minimal layout, no nav).
- Deleted old `src/app/page.tsx` and `src/app/book/page.tsx`; all pages now live under `(site)/`.

### New Pages & Components

- **Homepage** (`(site)/page.tsx`): hero, amenities grid, stat bar, cancellation-policy strip, trust signals.
- **The Villa** (`(site)/the-villa/`): architecture, outdoor spaces, amenities in detail.
- **Rooms** (`(site)/rooms/`): dynamic room cards from DB, shared-facilities section.
- **Gallery** (`(site)/gallery/`): masonry grid with full-screen modal (`GalleryModal.tsx`).
- **Events** (`(site)/events/`): event types, lawn capacity, enquiry CTA.
- **FAQ** (`(site)/faq/`): accordion, DB-driven.
- **Guest Info** (`(site)/guest-info/`): check-in/out, ID requirements, kitchen, house rules.
- **Reviews** (`(site)/reviews/`): verified placeholder (no fake testimonials).
- **About** (`(site)/about/`): Habbaa brand story.
- **Contact** (`(site)/contact/`): WhatsApp, email, map placeholder.
- **Terms** (`(site)/terms/`): full cancellation policy (30/15 days, 90%/50%/0%), quiet hours, ID rules.
- **Privacy** (`(site)/privacy/`): GDPR-aligned data policy.
- **Header** (`components/layout/Header.tsx`): sticky, Habbaa white SVG logo, nav links, Book CTA.
- **Footer** (`components/layout/Footer.tsx`): brand, explore links, contact, legal links.
- **BookingCheckout** (`components/guest/BookingCheckout.tsx`): stay summary with formatted dates, price breakdown, Razorpay integration.
- **EnquiryForm** (`components/guest/EnquiryForm.tsx`): events/enquiry form wired to `/api/enquiries`.
- **Admin dashboard** moved to `components/admin/AdminDashboard.tsx`; page is now a thin wrapper.

### Schema Migrations

| Migration | Description |
|-----------|-------------|
| `00007_phase1_tables.sql` | 10 new tables: rooms, property_images, pricing_rules, blocked_dates, property_policies, faqs, nearby_places, amenities, reviews, calendar_events |
| `00008_booking_channel.sql` | `booking_channel` column on bookings (direct/OTA/manual) |
| `00009_content_fixes.sql` | Aligns cancellation policy (30/15 days), quiet hours (11 PM), removes em/en dashes from DB-stored text |

### Content Fixes

- Cancellation policy unified across all surfaces: 30/15 days, 90%/50%/0% refund (Terms page is canonical).
- Quiet hours corrected to 11 PM everywhere (was inconsistent: "10 PM" on Terms, "11 PM" elsewhere).
- All AI-generated em dashes (—) and en dashes (–) replaced with hyphens or rephrased across all TSX files, SQL seeds, and email templates.
- Mock data (`mock-data.ts`) deleted entirely; all data sourced from Supabase.
- "Featured View" placeholder badge removed from GalleryModal.
- Reviews page: fake subtitle removed; replaced with honest "verified reviews coming soon" copy.

### API

- `/api/enquiries`: new POST endpoint, saves enquiry to DB, sends email via Resend.
- `/api/admin/bookings/manual`: admin-only manual booking creation.
- `/api/admin/properties/[id]/pricing`: admin pricing rule management.

### Seed Data

- `supabase/seed_phase1.sql`: rooms, images, amenities, policies, FAQs, nearby places for Villa 19.
- `supabase/seed_rooms_images.sql`: room image records.

---

## v0.1.1 — DB Environment Setup — 2026-09-02

Three-environment Supabase setup, matching the Proptech project pattern.

### Environments

- **Local**: Supabase via Colima Docker (offline, optional). Default port 54331.
- **Staging (remote-local)**: "Villa Project Development" — ref `hlmqcdzazbrztfovixjk`. Already linked.
- **Production**: to be created. Placeholder ref in `scripts/db-push.sh`.

### Guardrail Script (`scripts/db-push.sh`)

- `npm run db:push` — pushes to staging. Reads `supabase/.temp/project-ref`; blocked if linked to production without explicit flag.
- `npm run db:push:prod` — pushes to production. Requires linking to prod first, then typing `yes-production` at an interactive prompt.
- Refuses pushes to any unrecognised project ref.

### New npm Scripts

| Script | Purpose |
|---|---|
| `supabase:status` | Print local Supabase status |
| `supabase:types:remote` | Generate TypeScript types from linked remote |
| `supabase:diff` | Show schema diff |
| `supabase:lint` | Lint SQL migrations |
| `supabase:migration:list` | List pending migrations on linked remote |
| `db:push` | Safe push to staging (`scripts/db-push.sh`) |
| `db:push:prod` | Guarded push to production (`scripts/db-push.sh --production`) |

### Applied to Staging

- `00006_rls.sql` — pushed to staging DB (`hlmqcdzazbrztfovixjk`) via `npm run db:push` on 2026-09-02. Verified: site loads on staging, property data correct.
- Property slug corrected on staging DB via direct `UPDATE` (seed's `ON CONFLICT DO NOTHING` silently skipped the row because it already existed with the old slug `coastal-haven-mangalore`).

*Next: Phase 1 — design system, component library, property-scoped routing, schema migrations (10 new tables), real content seeding.*

---

## v0.3.0 — UI Modernization & Responsive Design — 2026-09-02

### Pages

- `/stay-guide`: new merged page combining `/faq` (DB-driven FAQ accordion) and `/guest-info` (practical info cards: check-in/out, arrival, WiFi, parking, house rules, emergency contacts)
- `/testimonials`: renamed from `/reviews`; honest "coming soon" state with trust signals
- `/faq` and `/guest-info`: deleted (merged into stay-guide)
- `/reviews`: deleted (renamed to testimonials)
- Sitemap updated accordingly

### Navigation

- "About Us" removed from header nav and footer
- "Contact" renamed to "Contact Us" in header
- Footer Explore column: removed duplicate "Contact Us" link; renamed right column from "Contact Us" → "Get in Touch"
- Header mobile "Book" button: was dead `href="#book"` anchor → fixed to `href="/book"`
- Desktop nav: Stay Guide hidden at md breakpoint (only shows at lg+) to prevent overflow on 768px

### Button Hover System

Root cause fixed: Tailwind `hover:bg-*` cannot override inline `style={{ backgroundColor }}` (CSS specificity 1,0,0 vs 0,1,0). Fixed by moving all button styles into `@layer components` in `globals.css`.

Five CSS button classes: `.btn-brass-filled`, `.btn-frosted`, `.btn-wa`, `.btn-wa-ghost`, `.btn-primary`.
All CTA buttons across all pages migrated to use these classes.

### Custom DatePicker

`src/components/ui/DatePicker.tsx` — zero-dependency React calendar dropdown replacing all OS-native `<input type="date">` inputs. Used in EnquiryForm and BookingWidget. Features: month nav, today ring, branded colors, ESC/outside-click to close, full keyboard accessibility, `maxWidth: calc(100vw - 32px)` to prevent viewport overflow on mobile.

### Contact Page

- Email: corrected to `hello@habbaa.com` (was `bookings@habbaa.in`)
- Phone: new `PROPERTY_PHONE` env var (`917760777876`) separate from `PROPERTY_WHATSAPP`
- `.env.example` and `DEPLOYMENT.md` updated

### Responsive Fixes

- Homepage location grid: `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`
- Mobile sticky booking bar: `fixed bottom-0 md:hidden` on homepage with WhatsApp + Book Now
- `pb-20 md:pb-0` removed from all inner pages (was leftover from deleted MobileNav)
- DatePicker dropdown clamped to `max-width: calc(100vw - 32px)`
- Booking confirmation WA link: was hardcoded `919876543210` → `process.env.PROPERTY_WHATSAPP`

### Dead Code Removed

- `src/components/layout/MobileNav.tsx`: deleted (was never imported anywhere)

---

## v0.3.1 — Cookie Consent, Nav Polish & Safari Fix — 2026-09-05

### Cookie Consent Bar

- New `CookieConsent.tsx` component: fixed bottom bar with `localStorage` persistence (`villa19_cookie_consent`).
- Accept / Decline buttons. Accept matches the Book Now button style (cream `#FBF7F1` bg, maroon text, hover inverts). Decline is a ghost button with sufficient contrast (`rgba(255,255,255,0.80)`).
- Mounted in `(site)/layout.tsx` after Footer.
- `overflow-x: clip` changed to `overflow-x: hidden` on `body` in `globals.css` — Safari treats `clip` as a containing block for `position: fixed`, causing the bar to anchor to the page instead of the viewport.

### Header

- Book Now button hover: inverts to maroon background + cream text (0.18s ease). Previous hover to plain white was imperceptible.
- Cinzel applied to "Villa 19" property name spans (desktop, mobile, drawer header).
- Desktop logo: 36px → 48px. Mobile logo: 30px → 48px.
- Mobile "Villa 19" text: 16px → 20px. "By Habbaa": 8px → 10px.
- WhatsApp removed from desktop nav (retained in mobile drawer).

### Bug Fix: Property Amenities Empty on The Villa Page

- Root cause: migration `00007` granted `SELECT` on `property_amenities`, `property_policies`, `faqs`, and `nearby_places` only to `anon` and `authenticated` roles — not `service_role`. The service client used by server-side data fetching (`getAmenities`, `getPolicies`, etc.) hit a `permission denied` error that was silently swallowed, returning an empty array.
- Fix: new migration `00011_grants_service_role.sql` adds `GRANT SELECT ... TO service_role` for all affected tables, applied to both local and staging.
- Also added a `UNIQUE (property_id, label)` constraint on `property_amenities` to prevent duplicate rows if the seed runs more than once.

### Local Seed Consolidation

- `supabase/seed.sql` now includes amenities, policies, FAQs, and nearby places (previously only in `seed_phase1.sql`, which had to be run manually after every local Supabase restart). Running `supabase db reset` now gives a fully populated local DB automatically. Remote DB unaffected.

### Announcement Bar

- `minHeight: 42px` changed to `height: 42px` (fixed) + `overflow: hidden` — variable content between carousel items was causing the navbar to shift up/down on each auto-advance.

---

## v0.5.0 — Site-wide Audit: Typography, Booking Flow, Legal Copy — 2026-09-09

### Room Breakdown shelf

- Replaced the bare scrollable row with a proper client component (`RoomShelf.tsx`) that carries
  real prev/next chevron buttons on mobile. The old "swipe" label was instructional text standing
  in for a missing control; the buttons are an affordance — pressable, state-aware (dimmed at
  boundaries), operable without touch.
- Fixed unreliable button navigation: the previous approach suspended `scroll-snap-type` and used
  `scrollTo({behavior:'smooth'})`, which is silently cancelled by snap-mandatory in some engines.
  Now uses direct `el.scrollLeft = target` with `scroll-behavior: smooth` on the container.
  The two do not conflict because we land exactly on a snap point.

### Footer desktop redesign

Restructured to match the habbaa.com footer, which is the house pattern across both properties.

- 4-column grid on large viewports: **Brand + registered entity**, **Explore**, **Get in Touch**,
  **Essence of Habbaa** (social). Previously 3 columns with mismatched proportions.
- Registered entity (HABBAA SOLUTIONS PVT LTD, address, CIN, GSTIN) is now the *first column*,
  not a bottom strip. habbaa.com leads with it; the company details are structural, not fine print.
- Legal links sit inline in the bottom bar with **no section heading**. A "Legal" column header
  gives boilerplate the same visual rank as navigation, which it does not warrant.
- Type scale raised throughout: column headings 10px → 12px, links 13px → 14px,
  copyright and legal links → 13px. At the old sizes the columns read as fine print.
- All column headings share one class constant, so they cannot drift apart.
- Contact column on desktop shows icon + text for each method (WhatsApp, phone number, email),
  replacing the cramped icon-only layout.
- Mobile layout unchanged: 3-up tap-target buttons for WhatsApp / Call / Email, social icons
  and legal links in the bottom bar.

### Map: live embed replaced with a pre-rendered image

The Location card showed "your browser does not support WebGL" instead of a map for some
visitors. Cause: `openstreetmap.org/export/embed.html` now ships MapLibre GL and **requires
WebGL even with `layer=mapnik`** (their embed bundle contains 156 `maplibre` references and the
exact error string). Anyone with WebGL disabled or a blocklisted GPU got the error page.

The embed was already `pointer-events: none` — deliberately inert so it could not trap scroll on
mobile — so a live map was buying us that failure mode and nothing else.

- **`public/villa-map.jpg`** — a 1600×960 map rendered once at build time from OSM raster tiles
  and committed. No WebGL, no API key in the browser, no third-party JS, no runtime dependency,
  and it paints immediately. Served through `next/image` (287KB source, ~90KB optimised).
- **`scripts/make-map.py`** — regenerates the image; update `LAT`/`LON` if the property moves.
  Tiles are fetched once by this script, never by a visitor.
- Attribution ("© OpenStreetMap") rendered on the card, as the tile licence requires.
- Click target now uses Google's documented URL form
  (`google.com/maps/search/?api=1&query=<lat>,<lng>`) and opens the same location.
- **Coordinates corrected to Urwa Mariyamma Circle: `12.8892951, 74.8298580`** (was
  `12.8634, 74.8422`, roughly 3.2 km to the south-east). Taken from the `!3d…!4d…` place
  parameters of the Google Maps URL, which are the place itself rather than the `@…` viewport
  centre. Updated in `supabase/seed.sql`, `scripts/make-map.py` and
  **`00016_property_coordinates.sql`**.

  The coordinate change was first applied to the local database by hand and not captured as a
  migration, so it never reached staging — while everything derived from it did, since 00015
  re-routed every distance from the *new* pin. Staging therefore held corrected distances
  against the old coordinates until 00016 was written. Caught by verifying the data after
  `db push` rather than trusting that the migration had been recorded.

### Cancellation Policy and House Rules: the disclosure now earns its click

Both cards paraphrased their own contents in the collapsed summary and then repeated the same
facts when opened, so expanding added colour but no information and the chevron read as
decoration. Both were also `p-6 sm:p-8` around a single line of text, and the summary label
renamed itself on open.

- **Cancellation** — the three refund tiers are now always visible as a 3-up grid
  (90% / 50% / No refund against their windows). The disclosure holds only what the tiers do
  not cover: deposit timing, inspection, refund method.
- **House Rules** — the four most-asked facts (check-in, check-out, quiet hours, max guests)
  are always visible as labelled values. The disclosure holds the five rules those four do not
  already answer; the duplicated check-in/out, quiet-hours and occupancy entries were removed
  from the expanded list.
- Padding reduced to `p-5 sm:p-6`; summary labels are stable across toggle.

### Cancellation policy: the day-30 boundary was ambiguous (content bug)

`00009_content_fixes.sql` wrote "30 or more days before check-in: 90% refund. **15 to 30 days**
before check-in: 50% refund." Both clauses claimed day 30, so a guest cancelling exactly 30 days
out could read either figure, on `/terms`, in the FAQ, and on the homepage card. On a refund
policy that is chargeback material.

**Resolved in favour of the guest: day 30 pays 90%.** The middle tier now ends at day 29.
Corrected in `00015_cancellation_boundary.sql` (`property_policies.cancellation` and the FAQ
answer), in `seed.sql`, and in the homepage tiles. **Staging and production need 00015 applied.**

### 12-hour clock across the application

Times were rendered raw from the database, so the House Rules card showed "From 14:00" beside
"11 PM to 7 AM" — two clock formats in one card — and Indian leisure guests read 12-hour.

- **`src/lib/format.ts`** — new `formatTime12()`. Times stay stored as 24-hour `HH:MM`
  (`getProperty` normalises to it and `<input type="time">` requires it); only the display is
  converted. Handles `HH:MM:SS`, renders midnight and noon as 12 rather than 0, and passes
  unparseable input through unchanged rather than inventing "12:00 AM". Covered by
  `src/lib/__tests__/format.test.ts` (6 cases).
- Applied to the homepage House Rules tiles and check-in/out rows, the Stay Guide, and
  `BookingCheckout`. **Not** applied to the admin form, `create-order` payloads or `data.ts`,
  which need the 24-hour value.
- Two database rows had 24-hour times baked into their prose (the check-in FAQ answer and the
  `checkin_time` policy body); both rewritten in `00015` and in `seed.sql`.

### Cancellation and House Rules cards: review fixes

- **Accessibility.** The small-caps tile labels used `--ink-faint` on `--paper-sunk`, measuring
  **2.71:1** at 11px against a 4.5:1 floor. Now `--ink-muted` at **5.08:1**.
- **Consistent tile structure.** The two adjacent cards used opposite layouts for the same kind
  of content: Cancellation was value-first, House Rules label-first. Both are now label-first,
  which also matches how a guest scans them (which window am I in, then what do I get).
- **`0%` replaces `No`**, so 90% / 50% / 0% reads as one numeric series.
- **Redundant words removed.** "refund" appeared three times under a heading already reading
  *Cancellation Policy*; it is now stated once above the tiles. "12 guests" under a MAX GUESTS
  label is now "12".
- **Icons dropped** from the refund tiles. Check, warning triangle and circled-X restated what
  the percentage and colour already said, and a warning triangle implied danger about a neutral
  contractual tier. The percentages carry the information, so colour is not load-bearing.
- **The "no refund" tier is neutral, not red.** A red fill read as an error state when nothing
  had gone wrong, and three saturated tints made the card the loudest block on a maroon-and-brass
  page, competing with the booking CTA.
- **Both disclosure summaries now look like controls** (bordered pill, hover state, real hit
  area) rather than captions.

### Booking widget header

- Background was `--maroon` (#5A2626) while the site header and footer are `--maroon-deep`
  (#3C1717), putting three different maroons on one page. Now matches the site chrome.
- **"Direct Booking" pill removed.** It asserted the same thing as the "Direct Lowest Guarantee"
  label beside it, and its `rgba(30,138,122,0.2)` fill composited over maroon to **#4E3A37**, a
  muddy brown-grey rather than the intended teal.
- Header now carries one message: the rate. Price at `text-3xl`, with a single brass line
  underneath reading "Lowest rate guaranteed · No platform fees".

### Desktop type scale

Card content was sized mobile-first and never stepped up, so at 1280px a room card title (16px)
was the same size as running body text and card meta sat at 14px. Added `lg:` steps rather than
raising the base, which would cost mobile density:

| Element | Was | Now (lg+) |
|---|---|---|
| Room card title | 16px | 17px |
| Room card meta, room type, guest badge | 14 / 12px | 15 / 13px |
| Amenity items and group headings | 14px | 15px |
| Location distance tiles | 14px | 15px |

### Footer icon treatment

Icons in the desktop columns used three unrelated colour systems side by side: WhatsApp green,
brass for phone and mail, grey for the social marks. In a footer list an icon is a marker, not a
brand mark, so all of them now share one muted tone and brighten to brass with their label on
hover. WhatsApp green is retained where it is an actual CTA (sticky bar, enquiry card); in the
footer the word "WhatsApp" already carries the recognition. The mobile 3-up buttons keep their
tinted treatment, as those are buttons rather than list markers.

### Colour system

- Off-token hex values in `BookingWidget.tsx` replaced with design tokens (`--maroon`, `--ink-muted`,
  `--paper-sunk`, `--cream`, `--paper-sunk-hover`, `--accent-verify`).
- Two WCAG AA failures fixed: `#8A9AAA` (2.88:1) and `#6B7A8A` (4.40:1) both mapped to
  `--ink-muted` (5.92:1 against `--surface`).

### Other

- Gallery orphan tiles: lone tiles in the last row now span the remaining columns at both 2-up
  (mobile) and 3-up (sm+) breakpoints.
- Cancellation Policy link fixed: was bare `#cancellation` fragment (only resolved on the homepage),
  now `/terms#cancellation` which works from any page.
- `terms/page.tsx`: `Section` component gains an `id` prop; cancellation section gets
  `id="cancellation"` and `scroll-mt-24` for smooth in-page navigation.
- Section headings for Cancellation Policy and Villa Rules moved outside their cards (matching
  Guest Reviews pattern) for consistent vertical rhythm.
- Seed files consolidated: `seed_phase1.sql` and `seed_rooms_images.sql` merged into `seed.sql`.

### The font system was silently dead (the big one)

`globals.css` declared `--font-display: var(--font-display, …)` and the same for `--font-brand`.
next/font already injects those exact names onto `<html>`, so each declaration referenced
**itself on the same element**. CSS treats that as a cycle: the property is invalid at
computed-value time and resolves to nothing. Verified in the browser — both computed to an
empty string.

**Cormorant Garamond and Cinzel were downloaded on every page load and applied to nothing.**
Every heading and the wordmark fell back to Nunito Sans. Fixed by deleting the two
self-referential lines (next/font already provides them); `--font-body` is a genuine alias to a
differently-named variable and was always fine.

Because Cormorant has a much smaller x-height than Nunito, display headings were then stepped up
one notch across 15 files so they read at the size originally intended.

### Booking flow: every CTA was a dead end

`/book` rendered "Invalid Booking Details" without query params, and **11 CTAs linked to a bare
`/book`** — including the header BOOK NOW on every page. Only the homepage widget passed params,
so the primary CTA site-wide led to an error screen.

- **`/book` without dates is now a real entry point**, rendering a date and guest picker that
  hands off to checkout. Direct links, bookmarks, refreshes and no-JS all land somewhere usable.
- **`BookingDialog`** — BOOK NOW now opens a native `<dialog>` over the page you are already on,
  so nobody loses their place. `showModal()` brings the focus trap, ESC handling and inert
  background; the existing `html:has(dialog[open])` rule handles scroll lock.
- **`BookNowLink`** is still an `<a href="/book">` and only preventDefaults when JS is running,
  so the page remains the no-JS fallback. Modified clicks (⌘-click, middle-click) pass through.
- **`DateSelectForm`** is shared by the dialog and the `/book` page so the two cannot drift.
- The checkout route had no chrome on its picker step; a shared `CheckoutHeader` now covers all
  three states, with the Razorpay badge shown only on the actual payment step.

### Booking dates used the UTC day, not IST

`new Date().toISOString().split('T')[0]` returns **yesterday in India between 00:00 and 05:30
IST**, so the date pickers offered — and defaulted to — a check-in that had already passed
locally. Replaced with `todayISO()` (`en-CA` + `timeZone: 'Asia/Kolkata'`, identical on server
and client) and `addDaysISO()` (UTC date-part arithmetic, immune to offset drift). Applied to
both pickers' defaults, both `min=` bounds, and both check-out auto-advance handlers.

### Modal dialogs rendered in the top-left corner

Tailwind v4's preflight resets `margin: 0` on every element, which strips the `margin: auto` the
UA stylesheet uses to centre a `showModal()` dialog. Both native dialogs were affected — the new
booking dialog and the pre-existing amenities sheet. Fixed once via `dialog:modal { margin: auto }`
rather than per component. The `amenity-sheet` class was referenced but styled nowhere; it now
anchors that sheet to the bottom edge below `sm`, matching its `rounded-t-3xl` intent.

### Legal and privacy copy

- **`/terms` refund tiers were hardcoded in JSX**, so `00015` fixed the database and left the
  canonical Terms page contradicting it — day 30 read as 50% there and 90% everywhere else.
  Now corrected and commented to stay in step with the migration.
- **`/terms` reads check-in, check-out and occupancy from the property record** instead of
  hardcoding them, so admin edits cannot silently leave the page stating old figures.
- **Privacy names HABBAA SOLUTIONS PVT LTD as the data fiduciary** with CIN and registered
  office, rather than the trading name.
- **New WhatsApp section** — it is the main enquiry channel, so guest data reaches Meta, and
  that was disclosed nowhere.
- Removed "provided for informational purposes, consult an attorney" from both legal pages: a
  privacy policy is a binding statement of practice, and the disclaimer undercut it.

### Cookie consent now gates something

The banner wrote a string to localStorage and gated nothing, so "Decline" declined nothing.

- **`src/lib/consent.ts`** stores the choice and broadcasts it.
- **`Analytics.tsx`** injects Google Analytics **only** after acceptance. Declining means no
  request is ever made to Google. Set `NEXT_PUBLIC_GA_ID` to switch it on; until then it renders
  nothing and the gate is already in place.

### Identity, contact and content corrections

- **Single mailbox: `reservations@habbaa.com`.** The site previously mixed `hello@habbaa.com` and
  `bookings@habbaa.in`. `RESEND_FROM_EMAIL` is deliberately unchanged pending domain
  verification in Resend — see TODO.
- **`formatPhone()`** — the Contact page, Stay Guide and footer printed `+917760777876` while
  the announcement bar showed the grouped form.
- **Distances re-routed** from the corrected coordinates. The beach was advertised at 1.5 km and
  is **7.6 km** by road; that figure appeared in the location tile, the page description, OG
  metadata, an FAQ and a featured amenity chip. 10 of the 18 `nearby_places` rows were updated;
  8 are listed in `00015` as needing local verification rather than guessed at.
- **No published response-time SLA.** "We respond within 30 minutes. Any time, any day" and
  "Within 4 hours" are replaced with channel guidance.
- **Testimonials** no longer offer to connect visitors with "past guests" on a page that states
  there are none yet.
- Two genuine em-dash violations fixed (an `/events` string and a `RoomShelf` `aria-label`).

### Visual system

- **Page heroes moved to `--maroon-deep`.** All 10 sat on `--maroon` directly below a
  `--maroon-deep` header, producing a visible seam on every page.
- **WhatsApp green retired as a button fill.** It fought the maroon/brass palette and, on
  `/events`, made the lower-intent action the loudest element. Dark grounds use frosted, light
  grounds the tinted ghost; the glyph and label carry recognition.
- **`--radius-btn` (12px)** replaces the 2px `--radius-sm` on `.btn-primary`, `.btn-secondary`
  and `.btn-ghost`. All 9 usages relied on that default, so square CTAs sat inside `rounded-xl`
  inputs and `rounded-2xl` cards.
- **Homepage gallery is inset at every width.** It was full-bleed below `sm` while every
  surrounding block was `px-4`, so it read as a bug; its `shadow-2xl` also had no margin to fall
  into. Now `px-4` + `rounded-2xl` + `shadow-lg`.
- **House Rules renamed Villa Rules** site-wide; both policy cards' tiles are centred, with
  expanded bodies explicitly left-aligned so prose and bulleted rules keep a left rail.
- **Footer mobile bottom bar** — social icons and legal links were flex siblings in one wrapping
  row, so they ran together and orphaned "Cancellation Policy". Each now has its own row below `lg`.
- **Footer dead space** — the mobile CTA bar is homepage-only but the footer reserved 96px for it
  on every page. Now tied to the bar's presence via `body:has(#mobile-cta-bar)`, scoped below
  `md` so it cannot outrank `lg:pb-14`.

### Two migrations that silently did nothing

Verifying data after `db push`, rather than treating a recorded migration as proof, turned up
two changes that never reached staging:

- **`00016_property_coordinates.sql`** — the pin correction had only ever been applied to the
  local database by hand and to `seed.sql`, never as a migration. 00015 then re-routed every
  distance from the *new* coordinates and did ship, so staging held corrected distances against
  the old pin.
- **`00017_id_policy_em_dash.sql`** — `00009` carried the comment "Fix government ID rule
  (em dash removal)" but targeted `WHERE key = 'government_id'`. The row's key is
  `id_requirement`, so it matched zero rows, succeeded, and left an em dash live in guest-facing
  policy copy on every environment. It looked fixed locally only because `db reset` re-seeds
  from `seed.sql`, which has the corrected text — the seed was masking a broken migration.

Both are keyed so they stay no-ops where the data is already correct.

### Testing

`src/lib/__tests__/format.test.ts` covers `formatTime12` (midnight/noon, `HH:MM:SS`, unparseable
passthrough), `formatPhone` (country code, bare 10-digit, idempotency, nullish) and
`todayISO`/`addDaysISO` (the 01:30 IST case, month and year boundaries). 27 tests total.

---

## v0.4.1 — Vercel Deployment Failure: Cron Moved Into the Database — 2026-09-06

### The bug

Every deployment since 2026-09-05 failed. The last successful deploy was `5a77f82` (2026-09-02);
the first failure was `7273181`, which introduced `vercel.json`:

```json
{ "crons": [ { "path": "/api/cron/expire-holds", "schedule": "*/10 * * * *" } ] }
```

Vercel's Hobby plan permits cron jobs to run **at most once per day**. A `*/10 * * * *` schedule is
rejected during deployment, before any build output is produced. This is why `npm run build` and
`tsc --noEmit` both passed locally while every Vercel deploy failed: it is a plan-limit validation
on `vercel.json`, not a compile error. Nothing in the application code was wrong.

### The fix — `00012_expire_holds_cron.sql`

The sweep now runs inside Postgres via `pg_cron` instead of being driven by an external HTTP call:

```sql
SELECT cron.schedule('expire-booking-holds', '30 21 * * *',
    $$ SELECT public.expire_stale_booking_holds() $$);
```

`expire_stale_booking_holds()` was already a SQL function, so pg_cron invokes it directly. There is
no HTTP hop, no Edge Function, and no shared secret. The migration unschedules any prior job of the
same name first, so it is safe to re-run.

**Cadence: daily at 3 AM IST (21:30 UTC), down from every 10 minutes.** This is a deliberate
choice, not a constraint carried over from the Hobby limit — pg_cron has no frequency ceiling.
Availability is already correct at read time, so the only consequence of a lapsed hold sitting
unswept is that it still reads as `pending` in admin views until the next run. A 10-minute cadence
would buy nothing for that and would write 144 rows/day into `cron.job_run_details`, which pg_cron
never prunes and which nothing else in this project cleans up.

This also aligns villa-booking with the scheduling pattern already used in PropTech
(`20260806000002_reminder_cron.sql`), which schedules its daily jobs with pg_cron in a migration.
No project in the group uses `vercel.json`.

### Caveat on the diagnosis

The Vercel build log was not readable from this session (the CLI was unauthenticated), so the
Hobby-plan cron limit is an inference from strong circumstantial evidence: `vercel.json` first
appears in the exact commit where deploys began failing, it is the only infrastructure-level change
in that range (`next.config.ts` and `package.json` are untouched since the last good deploy), and
the local build and typecheck both pass. The `*/10` schedule is a genuine Hobby-plan violation
regardless, so removing it is correct either way — but **the next deployment should be watched to
confirm it actually goes green.** If it still fails, the remaining suspect is a missing
`SUPABASE_SERVICE_ROLE_KEY` in the Vercel project environment.

### Removed

- `vercel.json`
- `src/app/api/cron/expire-holds/route.ts` (the HTTP wrapper the Vercel cron called)
- `CRON_SECRET` from `.env.example` — it existed solely to authenticate that route

### Verified

| Check | Result |
|---|---|
| pg_cron job registered on local and staging, `active = true`, schedule `30 21 * * *` | pass |
| Migration re-run leaves exactly one job (idempotent) | pass |
| Scheduled command `SELECT public.expire_stale_booking_holds()` executes | pass |
| Job observed actually firing on both local and staging (`cron.job_run_details` → `succeeded`) | pass |
| `npm run build` — `/api/cron/expire-holds` absent from route list | pass |
| `tsc --noEmit` clean | pass |
| No dangling `CRON_SECRET` / `api/cron` references in code or config | pass |
