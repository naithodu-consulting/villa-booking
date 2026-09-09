# TODO

## Email (Resend)
- [ ] Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to `.env.local` and Supabase secrets
- [ ] Refund confirmation email — wire in `POST /api/bookings/webhook` `refund.processed` handler once Resend is live (see `src/lib/email.ts`)

## Admin
- [ ] Wire pricing edit form to `PATCH /api/admin/properties/[id]/pricing` (route exists, form needs wiring)
- [ ] Wire manual booking form to `POST /api/admin/bookings/manual` (route exists, form needs wiring)

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
- [ ] Admin: blocked-dates calendar — wire blocked_dates table (currently local state only)

## Razorpay hardening (found in the 2026-09-03 flow review)
- [ ] **Duplicate confirmation emails** — `verify-payment` and `webhook` both update `payments`
      unguarded and both send email. Enabling the webhook today sends every guest two
      confirmations. Fix: add `.eq('status','created')` to both updates so it is a
      compare-and-swap, and only email when a row is actually returned.
- [ ] **`payment.failed` can cancel a paid booking** — webhook delivery is unordered, so a late
      `failed` event from an earlier attempt can flip a `confirmed` booking to `cancelled` and
      release the dates. Guard with `.neq('status','captured')`.
- [ ] **Webhook 500 on malformed signature** — `timingSafeEqual` is outside the try/catch
      (try starts after it). A 64-char non-hex signature makes `Buffer.from(x,'hex')` truncate,
      which throws. Should return a clean 400.
- [ ] **`verify-payment` idempotency** — no guard, so a double-submit re-sends emails even
      without the webhook. Same compare-and-swap fixes it.
- [ ] Confirm the Razorpay account is on **auto-capture**. Checkout's `handler` fires on
      *authorization*; under manual capture this code marks the payment `captured` and confirms
      a booking whose money was never actually taken.
- [ ] `create-order` creates the Razorpay order *before* `create_booking_atomic` checks
      availability, so a `DATE_UNAVAILABLE` leaves an orphan order. Harmless, but backwards.
- [ ] Decide on the webhook. It is **not** needed to confirm bookings — `verify-payment` already
      does that with `RAZORPAY_KEY_SECRET`. It is only needed for (a) syncing dashboard-issued
      refunds, which has no other path since there is no refund API route, and (b) recovering
      mobile-UPI browser drops. Fix the three items above first if enabling it.

## Production env
- [ ] After pushing `00012_expire_holds_cron.sql`, confirm the sweep is registered on the remote:
      `SELECT jobname, schedule, active FROM cron.job;` should list `expire-booking-holds`.
      Check runs with `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;`

## Known UX gaps (post-launch nice-to-haves)
- [ ] EnquiryForm "Send Enquiry" button — `enquiries` table missing from local Supabase; needs `supabase db reset` or manual CREATE TABLE on local
- [ ] Mobile homepage booking widget: currently buried at bottom on mobile (sticky bar added as stopgap). Consider a dedicated /book landing optimised for mobile.
- [ ] DatePicker: no keyboard arrow-key navigation within the calendar grid (ESC and click work; arrow nav would be ideal for a11y)

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
- [ ] **Booking dates use the UTC calendar day, not IST.**
      `new Date().toISOString().split('T')[0]` in `BookingWidget.tsx:21` and
      `BookingCheckout.tsx:53` yields yesterday's date between 00:00 and 05:30
      IST, so `min=` on the date pickers allows a check-in already in the past
      locally, and the /book picker defaults to it. Pre-existing in the widget;
      the checkout picker inherited it. Fix with an IST-aware helper in
      `src/lib/format.ts` (e.g. `en-CA` formatting with `timeZone:
      'Asia/Kolkata'`) and use it for both `min` and the defaults.
