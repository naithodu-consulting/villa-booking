# Villa 19 — Release Notes

This document covers all feature work, fixes, and notable changes to the Villa 19 / Habbaa booking site.

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

- **Single mailbox: `hello@habbaa.in`.** The site previously mixed `hello@habbaa.com` and
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
