# Villa 19 — Release Notes

This document covers all feature work, fixes, and notable changes to the Villa 19 / Habbaa booking site.

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
- **`vercel.json`** — schedules the sweep every 10 minutes.
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

