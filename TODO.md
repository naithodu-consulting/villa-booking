# TODO

## Email (Resend)
- [ ] Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to `.env.local` and Supabase secrets
- [ ] Refund confirmation email — wire in `POST /api/bookings/webhook` `refund.processed` handler once Resend is live (see `src/lib/email.ts`)

## Admin — removed from this repo (2026-09-11)
Admin login and all admin tooling belong to the **Ooruda Villa** project (separate repo, separate
Supabase project). Deleted here: `src/app/admin/`, `src/app/api/admin/`, `src/components/admin/`,
`src/middleware.ts` (it existed only to guard /admin), `src/lib/supabase/client.ts` and the
cookie-session helper in `src/lib/supabase/server.ts` (both only used by the admin login).
- [x] Delete the admin surface.
- [x] Decided 2026-09-15: **Ooruda Villa** blocks dates, takes phone bookings, edits rates and
      issues refunds for Villa 19, writing to *this* site's Supabase project.
- [x] Contract written 2026-09-15: `docs/OORUDA_VILLA_INTEGRATION.md`. Share it with the Ooruda
      Villa developers.
- [ ] **Decide the seasonal rule end dates.** The engine excludes `end_date`, but Summer Holidays
      (ends 05-31) and Diwali Peak (ends 10-21) look like they meant to include that night. Either
      move each `end_date` forward a day or confirm the current pricing is intended.
- [ ] Push migrations `00019` and `00020` to the remote database (`scripts/db-push.sh`).

## Channel manager / OTAs (decided 2026-09-15)
- [x] **Timing: after launch.** Launch is direct-booking only; this site's DB stays the source of
      truth for availability until then.
- [x] **Sold only as the whole villa** on every platform, never room by room. Availability stays
      one calendar per property; no per-room inventory model needed.
- [ ] Post-launch: shortlist STAAH / Beds24 on live two-way MMT + Goibibo connectivity and webhooks
      (Master Plan section 7.2).

## Production
- [ ] Fill in `PROD_REF` in `scripts/db-push.sh` once prod Supabase project is created
- [ ] Set `NEXT_PUBLIC_SITE_URL` to `https://habbaa.in` in prod env
- [ ] Add `PROPERTY_WHATSAPP` and `PROPERTY_EMAIL` to prod Vercel env

## Content
- [ ] Add real property photos to Supabase Storage and update `property_images` rows with real URLs
- [ ] Add real room photos — link `room_id` on `property_images` rows
- [ ] Privacy Policy page — placeholder text added; replace with real legal copy before launch
- [ ] Terms & Conditions page — placeholder text added; replace with real legal copy before launch

## Optional / Post-launch
- [ ] Reviews page — wire real guest reviews once collected (page exists at /testimonials)
- [ ] Homepage reviews section — replace placeholder comment with real reviews component
- [ ] ~~Admin: blocked-dates calendar~~ — belongs to Ooruda Villa (see Admin section)

## Razorpay hardening (found in the 2026-09-03 flow review)
- [x] **Duplicate confirmation emails** — fixed 2026-09-11: compare-and-swap on
      `payments.status` in both `verify-payment` and the webhook; only the winner emails.
- [x] **`payment.failed` can cancel a paid booking** — fixed 2026-09-11: only moves
      `created`/`expired` payments, and only cancels a booking still `pending`.
- [x] **Webhook 500 on malformed signature** — fixed 2026-09-11: `hexSignatureMatches()` in
      `src/lib/signature.ts` never throws; returns 400.
- [x] **`verify-payment` idempotency** — fixed 2026-09-11: a resubmit on an already-captured
      payment returns `verified: true` without re-sending email.
- [x] `refund.processed` redelivery re-sent the refund email — fixed 2026-09-11 (same CAS).
- [ ] **Owner checking (2026-09-15):** confirm the Razorpay account is on **auto-capture**. Checkout's `handler` fires on
      *authorization*; under manual capture this code marks the payment `captured` and confirms
      a booking whose money was never actually taken.
- [x] `create-order` orphan orders — fixed 2026-09-11: booking hold is taken first; if the
      Razorpay order then fails, the hold is released immediately.
- [x] Webhook decision 2026-09-15: **keep it off.** Consequences to accept: (a) refunds issued
      from the Razorpay dashboard are not recorded here, so Ooruda Villa must also mark the
      booking cancelled/refunded; (b) if a guest's browser closes after paying but before the
      checkout page confirms, the booking stays `pending`, expires, and needs manual recovery.

## Production env
- [ ] After pushing `00012_expire_holds_cron.sql`, confirm the sweep is registered on the remote:
      `SELECT jobname, schedule, active FROM cron.job;` should list `expire-booking-holds`.
      Check runs with `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;`

## Known UX gaps (post-launch nice-to-haves)
- [ ] EnquiryForm "Send Enquiry" button — `enquiries` table missing from local Supabase; needs `supabase db reset` or manual CREATE TABLE on local
- [ ] Mobile homepage booking widget: currently buried at bottom on mobile (sticky bar added as stopgap). Consider a dedicated /book landing optimised for mobile.
- [ ] DatePicker: no keyboard arrow-key navigation within the calendar grid (ESC and click work; arrow nav would be ideal for a11y)
- [x] Guest availability calendar: booked and blocked nights struck out in every date picker (2026-09-15).
- [ ] 12-month "from ₹X" rate chart (Master Plan 7.4) not built; the calendar shows availability only.

## Email domain migration to habbaa.in (2026-09-09)
The site now uses `hello@habbaa.in` everywhere in code and in `.env.local` /
`.env.example` (`PROPERTY_EMAIL`, `ADMIN_EMAIL`). Two pieces are deliberately
left on the old domain because changing them blind would break things:

- [ ] **`RESEND_FROM_EMAIL` is still `hello@habbaa.com`.** Resend will only send
      from a domain verified in its dashboard. Verify `habbaa.in` in Resend
      (DNS: SPF + DKIM records), confirm it shows as verified, and only then set
      `RESEND_FROM_EMAIL="Villa 19 by Habbaa <hello@habbaa.in>"`. Switching it
      before verification makes every transactional email fail to send:
      booking confirmations, refund notices, admin alerts.
- [ ] **Update the environment variables on Vercel.** `.env.local` is not
      deployed, so staging and production still resolve `PROPERTY_EMAIL` and
      `ADMIN_EMAIL` to the `.com` address and will render it in the footer and
      on /contact. Set both to `hello@habbaa.in` in the Vercel project settings
      for each environment, then redeploy.
- [ ] Confirm `hello@habbaa.in` actually exists and is monitored before the
      change goes live: it is now the only address published on the site, and
      it is where refund requests are directed from /terms.

## Follow-ups from the 2026-09-09 review
- [ ] **Privacy policy claims Google Analytics before it exists.** The Cookies
      section now says "We also use Google Analytics", but `NEXT_PUBLIC_GA_ID` is
      not set in any environment, so nothing loads. The consent gate and
      `Analytics.tsx` are ready; set the GA4 measurement ID and the wording
      becomes true. Until then the policy overstates collection, which is the
      same defect the review flagged in the original copy. Either ship the ID
      with this release or soften the wording to "we plan to use".
- [x] **Booking dates use the UTC calendar day, not IST.** Fixed in BookingWidget,
      BookingCheckout and (2026-09-11) EnquiryForm, all via `todayISO()`.
      `new Date().toISOString().split('T')[0]` in `BookingWidget.tsx:21` and
      `BookingCheckout.tsx:53` yields yesterday's date between 00:00 and 05:30
      IST, so `min=` on the date pickers allows a check-in already in the past
      locally, and the /book picker defaults to it. Pre-existing in the widget;
      the checkout picker inherited it. Fix with an IST-aware helper in
      `src/lib/format.ts` (e.g. `en-CA` formatting with `timeZone:
      'Asia/Kolkata'`) and use it for both `min` and the defaults.
