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

### Pending (requires `npm run db:push`)

- `00006_rls.sql` — Row-Level Security migration — staged but not yet applied to the staging DB.

*Next: Phase 1 — design system, component library, property-scoped routing, schema migrations (10 new tables), real content seeding.*
