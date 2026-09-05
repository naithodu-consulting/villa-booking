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
- [ ] Set `CRON_SECRET` in Vercel env (generate with `openssl rand -hex 24`)
- [ ] Confirm the `vercel.json` cron for `/api/cron/expire-holds` is firing after deploy

## Known UX gaps (post-launch nice-to-haves)
- [ ] EnquiryForm "Send Enquiry" button — `enquiries` table missing from local Supabase; needs `supabase db reset` or manual CREATE TABLE on local
- [ ] Mobile homepage booking widget: currently buried at bottom on mobile (sticky bar added as stopgap). Consider a dedicated /book landing optimised for mobile.
- [ ] DatePicker: no keyboard arrow-key navigation within the calendar grid (ESC and click work; arrow nav would be ideal for a11y)
