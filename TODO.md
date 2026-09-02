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

## Known UX gaps (post-launch nice-to-haves)
- [ ] EnquiryForm "Send Enquiry" button — `enquiries` table missing from local Supabase; needs `supabase db reset` or manual CREATE TABLE on local
- [ ] Mobile homepage booking widget: currently buried at bottom on mobile (sticky bar added as stopgap). Consider a dedicated /book landing optimised for mobile.
- [ ] DatePicker: no keyboard arrow-key navigation within the calendar grid (ESC and click work; arrow nav would be ideal for a11y)
