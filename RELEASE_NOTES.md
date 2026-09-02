# Villa 19 — Release Notes

This document covers all feature work, fixes, and notable changes to the Villa 19 / Habbaa booking site.

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
