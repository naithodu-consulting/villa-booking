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
- [x] Seasonal pricing decided 2026-09-15 (`00021`): festival rules and minimum stays removed;
      only 31 Dec and 1 Jan at ₹16,000. Future seasonal prices are set in Ooruda Villa.
- [ ] Share the updated section 6 of the integration doc with Ooruda Villa (occupancy now
      12 included / 15 max, extra ₹1,000 per person per night).
- [x] Migrations `00019`–`00021` pushed to the remote database (2026-09-15).

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
- [x] Nightly prices shown in every date picker, from the database (2026-09-15).
- [x] Colour-coded availability with legend: available / special price / not available (2026-09-15).
- [x] Site-wide colour roles documented in `globals.css` and applied (2026-09-15).
- [x] Italic page titles removed (2026-09-15).
- [x] Font roles fixed: Cinzel for the wordmark only, Cormorant for page/section titles, Nunito for
      card titles, labels and body (2026-09-16).
- [x] Booking form: one field style for dates and guests, 44px minimum height (2026-09-16).
- [x] Announcement bar close button removed (2026-09-16).
- [ ] Pre-existing lint errors to clean up: unescaped apostrophe in `events/page.tsx` ("What's
      Included"), and setState-inside-effect in BookingWidget, Analytics, CookieConsent, DatePicker.
- [ ] Optional: a 12-month "from ₹X" rate summary (Master Plan 7.4). The date pickers now show every
      night's price, so this is a nice-to-have rather than a gap.

## Email domain migration to habbaa.in (2026-09-09)
The site now uses `reservations@habbaa.com` everywhere in code and in `.env.local` /
`.env.example` (`PROPERTY_EMAIL`, `ADMIN_EMAIL`). Two pieces are deliberately
left on the old domain because changing them blind would break things:

- [ ] **`RESEND_FROM_EMAIL` is still `hello@habbaa.com`.** Resend will only send
      from a domain verified in its dashboard. Verify `habbaa.in` in Resend
      (DNS: SPF + DKIM records), confirm it shows as verified, and only then set
      `RESEND_FROM_EMAIL="Villa 19 by Habbaa <reservations@habbaa.com>"`. Switching it
      before verification makes every transactional email fail to send:
      booking confirmations, refund notices, admin alerts.
- [ ] **Update the environment variables on Vercel.** `.env.local` is not
      deployed, so staging and production still resolve `PROPERTY_EMAIL` and
      `ADMIN_EMAIL` to the `.com` address and will render it in the footer and
      on /contact. Set both to `reservations@habbaa.com` in the Vercel project settings
      for each environment, then redeploy.
- [ ] Confirm `reservations@habbaa.com` actually exists and is monitored before the
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

---

# Ooruda Villa integration — work owed by this repo

> Added 2026-09-27 by the Ooruda Villa (PropTech repo, branch `villa-v1.0`) planning session.
> **None of this was done in that session** — Ooruda-side work and villa-booking-side work are
> deliberately separate. Each item below is self-contained; pick them up in any order except where
> a dependency is stated.
>
> Context: `docs/OORUDA_VILLA_INTEGRATION.md` is the contract. **Every item here changes it, so
> update that document in the same commit as the migration.** The Ooruda plan lives at
> `PropTech/OORUDA_VILLA_PLAN.md`; section numbers below refer to it.

## 1. Discount codes — schema + atomic enforcement (blocks Ooruda M8)

**Why this repo.** Redemption happens at checkout, here. A usage counter read and written outside
`create_booking_atomic`'s advisory lock is a race: a `max_uses = 1` code hit by concurrent
checkouts is honoured every time. The counter must be incremented **inside** the lock, in the same
transaction as the booking insert, or the guardrail is decorative.

**Ownership split.** Ooruda Villa *defines and approves* codes and owns the audit trail. This repo
*enforces and counts*. Ooruda must never write the counter; this repo must never invent a code.

**Schema.**

```sql
create table discount_codes (
  id                 uuid primary key default gen_random_uuid(),
  property_id        uuid not null references properties(id) on delete cascade,
  code               text not null,                      -- store uppercase, no spaces
  discount_type      text not null check (discount_type in ('percent','flat')),
  discount_value     int  not null check (discount_value > 0),  -- percent 1-100, or paise
  max_discount_paise bigint,                             -- cap for percent codes
  valid_from         date not null,
  valid_to           date not null,                      -- inclusive, on the BOOKING date
  min_nights         int  not null default 1,
  min_booking_paise  bigint not null default 0,
  max_uses           int,                                -- null = unlimited
  max_uses_per_guest int  not null default 1,            -- keyed on guest_phone
  uses_count         int  not null default 0,            -- written ONLY inside the lock
  channels           text[] not null default '{online}', -- never include OTA channels
  stackable          boolean not null default false,
  status             text not null default 'active' check (status in ('active','paused','expired')),
  created_by         text,                               -- Ooruda user id, free text
  -- Ooruda enforces a 25% ceiling; >25% arrives only after super-admin approval.
  -- Defence in depth here too:
  constraint percent_ceiling check (discount_type <> 'percent' or discount_value <= 100),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint valid_code_dates check (valid_to >= valid_from),
  unique (property_id, code)
);

create table discount_blackouts (
  id          uuid primary key default gen_random_uuid(),
  code_id     uuid not null references discount_codes(id) on delete cascade,
  start_date  date not null,
  end_date    date not null,                             -- EXCLUSIVE, like every range here
  constraint valid_blackout_range check (end_date > start_date)
);

create table discount_redemptions (
  id              uuid primary key default gen_random_uuid(),
  code_id         uuid not null references discount_codes(id) on delete restrict,
  booking_id      uuid not null references bookings(id) on delete cascade,
  guest_phone     text,
  discount_paise  bigint not null,
  redeemed_at     timestamptz not null default now(),
  unique (booking_id)                                    -- one code per booking, no stacking
);
```

`bookings` gains `discount_code_id uuid references discount_codes(id)` and
`discount_amount bigint not null default 0`.

**Enforcement, inside `create_booking_atomic`.** Add an optional `p_discount_code text` parameter.
Adding a parameter creates a **new overload**, and an ambiguous call throws "could not choose best
candidate function" — so either drop the old signature in the same migration or have every caller
pass an explicit `null`. Inside the existing `pg_advisory_xact_lock`, after the availability
checks and before the insert:

1. `select ... from discount_codes where property_id = p_property_id and code = upper(trim(...))
   and status = 'active' for update` — the row lock is what makes the counter safe.
2. Reject with a distinct error prefix for each failure so the site can show a useful message:
   `DISCOUNT_NOT_FOUND`, `DISCOUNT_EXPIRED`, `DISCOUNT_MIN_NIGHTS`, `DISCOUNT_MIN_VALUE`,
   `DISCOUNT_BLACKOUT`, `DISCOUNT_EXHAUSTED`, `DISCOUNT_GUEST_LIMIT`, `DISCOUNT_CHANNEL`.
3. Blackout test uses the half-open overlap the rest of the schema uses:
   `p_check_in < b.end_date and p_check_out > b.start_date`.
4. Guest limit: count `discount_redemptions` joined to non-cancelled bookings by `guest_phone`.
5. Compute the discount, apply the cap, then **`uses_count = uses_count + 1`**, insert the booking
   and the redemption row in the same transaction.

**Order of operations for tax — this is the part that is easy to get wrong.** GST is charged on the
discounted value. In `src/lib/pricing-engine.ts` the discount is subtracted **after**
`base_amount + extra_guest_amount` and **before** the 18% is computed:

```
taxable = base_amount + extra_guest_amount - discount_amount
tax     = round(taxable * 18 / 100)
total   = taxable + tax
```

Never reduce `base_amount` itself — Ooruda's GST invoice shows the discount as its own line and
needs the gross and the discount separately.

**Release on cancellation.** When a booking is cancelled, decrement `uses_count` and delete the
redemption row, or a cancelled booking permanently consumes a limited code. Do it in the same
statement that sets `status = 'cancelled'`, or in a trigger — not in application code.

**Read-back for Ooruda.** Ooruda polls `discount_redemptions` (joined to `bookings` for the
`booking_code`) for its usage and revenue-impact reporting. Grant `service_role` select. Ooruda
has insert/update/delete on `discount_codes` and `discount_blackouts` and **select only** on
`discount_redemptions` and `discount_codes.uses_count`.

**Contract:** new section 12, plus a rule in the "Do not" list — *never write `uses_count` or
`discount_redemptions` from Ooruda Villa.*

## 2. Pricing rules — make non-overlap a constraint, not a convention

Contract §6.2 says rules must not overlap, and explains the consequence when they do: checkout and
the homepage widget can pick different rules, so **the guest is shown one price and charged
another**. It is enforced by nobody. Make the database enforce it:

```sql
create extension if not exists btree_gist;

alter table pricing_rules
  add constraint pricing_rules_no_overlap
  exclude using gist (
    property_id with =,
    daterange(start_date, end_date, '[)') with &&
  );
```

Check for existing overlaps before applying, or the migration fails:

```sql
select a.id, a.rule_name, b.id, b.rule_name
  from pricing_rules a join pricing_rules b
    on a.property_id = b.property_id and a.id < b.id
   and a.start_date < b.end_date and a.end_date > b.start_date;
```

Also worth the same treatment on `blocked_dates` (overlapping blocks are harmless but messy), and
a `check (end_date > start_date)` everywhere a zero-night range is currently possible — the
contract §3 warns that the tables allow them and asks callers not to write them.

**Contract:** update §6.2 to say the constraint enforces it, and drop the "check before inserting"
query to "the insert will fail cleanly; handle the error".

## 3. Room-level selling (future, but design it before the second villa)

Villa 19 sells the whole property. A future villa will sell **individual rooms**. The Ooruda side
already takes cheap forward-compatibility (a `villa_rooms` table, a `room_scope` column, an
optional room set in its adapter). The expensive half is here, because the availability grain
lives in this repo:

- `rooms` gains `is_sellable_separately boolean not null default false` and its own rate columns.
- A `booking_rooms` join table; a whole-property booking implicitly holds every room.
- `check_availability` and `get_unavailable_nights` take an optional room set and fall back to
  whole-property behaviour when it is null — signature change, so the overload caution above
  applies again.
- `create_booking_atomic` keeps the **property-level** advisory lock even for a room booking. It is
  the cheapest correct choice: room-level locks invite deadlock when a whole-property booking needs
  all of them.
- An exclusion constraint per room, plus the rule that a whole-property booking conflicts with any
  room booking and vice versa.
- The guest site's calendar and booking widget need a room picker; the pricing engine needs
  per-room rates.

Do not start this until a customer actually needs it, but do not let the schema drift somewhere
that makes it impossible either.

## 4. Razorpay webhook stays OFF — decided, do not re-enable

The Ooruda plan (§9b) makes Ooruda Villa the **sole** owner of the refund path: it calls the
Razorpay Refunds API with an idempotency key, then mirrors into this database exactly as contract
§7 prescribes, then issues a GST credit note.

Turning this repo's webhook back on would create **two writers** for the same rows and reintroduce
double-counting. It was considered and rejected. If anyone wants to revisit it, the two systems
must be changed together, in one go.

What this repo should do instead:
- Leave the webhook disabled, and add a comment at the handler saying why and pointing here.
- Confirm `service_role` can update `payments.status` and `bookings.status` / `payment_status`
  (contract §7 assumes it; `00020_service_role_write_grants.sql` should already cover it — verify).
- Consider a `refunds` table here instead of the contract's suggestion of stashing the amount in
  `special_requests`. Ooruda holds the authoritative ledger either way, but `special_requests` is
  guest-visible text and is the wrong place for a money record. Low priority; coordinate first.

## 5. Add-on services — reconcile with Ooruda

`addon_services` exists here and is unused. Ooruda plans `villa_addons` (extra bed, breakfast,
BBQ, early check-in, late check-out, pet fee) as an operator-managed catalogue. Decide one owner —
recommended: **Ooruda writes `addon_services` here**, same as it writes rates, and the booking
widget offers them at checkout. That needs:

- a `booking_addons` join table (booking, addon, quantity, unit price in paise at time of booking);
- add-on totals folded into the pricing engine **before** GST, like the discount;
- `service_role` write grants on `addon_services`;
- contract §6 extended with the add-on pricing formula, so a phone quote and an online quote agree.

## 6. GST rate — replace the hardcoded 18 with the per-night slab

`src/lib/pricing-engine.ts` hardcodes 18%. Checked 2026-09-27: since **22 Sep 2025**
(Notification 15/2025-CT(R)) accommodation under SAC **996311** is **5% (no ITC) when the value per
unit per day is ≤ ₹7,500, and 18% above**. The 12% slab no longer exists (so contract §6.3's
"do not use 12%" stays true), and the old ₹1,000 exemption was withdrawn in July 2022.

The slab is decided on the **actual value per unit per night**, after any discount and **including
extra-guest / extra-bed charges**. So:

```
for each night:
  night_value = nightly_rate + extra_guest_for_that_night - discount_share_for_that_night
  rate        = night_value <= 750000 ? 5 : 18        -- paise
  night_tax   = round(night_value * rate / 100)
tax_amount = sum(night_tax)
```

Villa 19 (₹14,500+ a night) is 18% on every night even at the 25% maximum discount, so nothing
changes for it today. It matters for any cheaper villa and for room-level selling. Ooruda
implements the identical rule in `lib/villa/gst.ts`; add a shared fixture of test cases to both
repos so they cannot drift. Keep `properties.gst_rate` out of it — the rate is a function of value,
not a setting.

## 7. Privacy page — guest ID documents are now stored

**Decided 2026-09-27:** Ooruda Villa stores guest identity documents in its own Supabase Storage
for legal record-keeping. That supersedes the WhatsApp-only arrangement in contract §5.7 and the
internal "staff delete from WhatsApp one week after check-out" policy.

This repo must, **before Ooruda enables the upload feature**:

- add a section to the Privacy page (`src/app/(site)/privacy`) stating what identity documents are
  collected, why (statutory guest records), that they are stored securely by the operator, who can
  access them, and the retention period;
- keep the retention period **identical** to what Ooruda states on ooruda.com — a mismatch between
  the two notices is worse than either one alone;
- the WhatsApp submission flow and the `id_status` states stay exactly as they are; only the
  storage destination and the notice change.

**Retention decided 2026-09-27: 30 days after check-out.** State exactly that; Ooruda's notice
says the same.

**Status 2026-09-30:** Ooruda's notice is written (ooruda.com Privacy Policy §5, "Villa Guests
and Identity Documents"). Ooruda keeps the upload switch (`VILLA_GUEST_ID_UPLOADS`) off until this
repo's notice is live; until then staff record IDs seen in person with the last 4 digits only.
Mirror Ooruda's wording on: who sees the documents (owner and managers, signed in), masked number
only, every view recorded, deletion 30 days after check-out.

## 8. `bookings.status = 'completed'`

Contract §5.2 says nothing sets it. Ooruda intends to set it at check-out. Confirm nothing here is
waiting to own it, then say so in the contract so it is no longer ambiguous.

## 8b. Atomic block and rate functions (found in the Ooruda M1 review, 2026-09-29)

Ooruda Villa writes blocks and seasonal rates with separate PostgREST requests,
because this database offers no function for them. Three races follow:

- **Partial unblock** (contract §4 says "delete it and insert the remaining
  pieces in one transaction"). Over PostgREST that is two requests. Ooruda now
  inserts the pieces first, deletes the original only if it still exists, and
  rolls its pieces back on a clash, so two partial releases can no longer
  undo each other. A timeout between the two steps can still leave an extra
  overlapping block (nights stay blocked, which is the safe direction).
- **Block creation** is check-then-insert: a guest checkout can land between
  `check_availability` and the insert.
- **Seasonal rate creation** is overlap-check-then-insert (item 2's exclusion
  constraint closes this one).

Add, with the same per-property advisory lock `create_booking_atomic` takes:

```sql
-- Blocks [p_start, p_end) if and only if every night is free.
create_block_atomic(p_property_id uuid, p_start date, p_end date,
                    p_reason text, p_notes text) returns uuid
-- Releases [p_from, p_to) out of block p_block_id in one transaction:
-- SELECT ... FOR UPDATE, delete, insert the remaining pieces.
release_blocked_nights(p_property_id uuid, p_block_id uuid,
                       p_from date, p_to date) returns setof blocked_dates
```

Grant EXECUTE to `service_role` only. Once they exist, Ooruda switches
`lib/villa-db/blocks.ts` to call them; tell the Ooruda side when shipped.

## 8c. Tax invoice at CHECK-OUT, not at payment (decided 2026-09-29)

Migration `00038_gst_invoices.sql` issues the invoice when a booking first
becomes `confirmed` AND `paid` — usually before the stay. The operator decided
(2026-09-29, in the Ooruda Villa planning session) that the tax invoice is
issued **at check-out**, so it can include what actually happened (extra bed,
late check-out, add-ons), with **receipt vouchers** for money received before
that.

This database stays the **single allocator** of the invoice series
(`V19/26-27/INV/NNNNNN`, `allocate_invoice_number`); Ooruda Villa issues
through it and never numbers invoices itself.

Change `bookings_assign_invoice()` so the number is allocated when a booking
first becomes **`completed`** (Ooruda sets this at check-out; contract §5.2),
not on confirmed+paid. Keep the rest: allocate inside the same transaction, no
gaps, no backfill, IST date. Bookings already invoiced under the old rule keep
their numbers.

Also needed for the invoice PDF: the GST slab per night (item 6) instead of a
flat 18%, and add-on lines (item 5).

Contract: rewrite §5.7's "Not an invoice number" bullet and add the rule
"invoice number is assigned at `completed`".

## 8d. Maintain `bookings.updated_at` with a trigger (found 2026-09-29)

`bookings.updated_at` is only changed when a writer sets it by hand. The site's
own payment paths don't: `api/bookings/verify-payment` and
`api/bookings/webhook` set `status = 'confirmed', payment_status = 'paid'`
(and the cancellations) without touching it. Ooruda Villa keeps a read-model of
bookings for revenue and occupancy reports, and "what changed since my last
sync" is exactly the question `updated_at` should answer. Today it misses the
most important change of all — a guest paying online.

Add the standard trigger (Ooruda falls back to re-reading a date window until
this ships, which is slower but correct):

```sql
create or replace function set_bookings_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists trg_bookings_updated_at on bookings;
create trigger trg_bookings_updated_at before update on bookings
  for each row execute function set_bookings_updated_at();

create index if not exists idx_bookings_property_updated_at
  on bookings (property_id, updated_at);
```

## 8e. `properties.whatsapp_number` column (found 2026-09-30)

The business WhatsApp number lives only in this repo's env (`PROPERTY_WHATSAPP`), so Ooruda cannot
read it and keeps its own copy (`villa_properties.whatsapp_number`, set in Villa Settings) for the
guest ID request link. Two copies drift. Add `properties.whatsapp_number text` (E.164 digits, as
`wa.me` expects), read it in `src/lib/data.ts` instead of the env var, and tell Ooruda so it can
read the site's value and drop its own field.

## 8f. Record refunded amounts on `payments` (found 2026-09-30)

Ooruda's booking ledger (M5a) reads website payments from `payments`. A **partial** refund made in
the Razorpay dashboard leaves `status = 'captured'` and records no amount, so Ooruda overstates
what was kept. Add `payments.amount_refunded bigint not null default 0` (paise, as Razorpay's
`amount_refunded`) and keep it current wherever refunds are recorded; Ooruda will read it. Until
Ooruda's own online-refund path ships (plan §9b), online refunds happen in the Razorpay dashboard
and must be mirrored here by hand.

## 9. Contract updates owed

Fold these into `docs/OORUDA_VILLA_INTEGRATION.md` as each item lands:

- [ ] §12 (new): discount codes — schema, error prefixes, what Ooruda may and may not write.
- [ ] §6.2: pricing-rule overlap is now a database constraint.
- [ ] §6.3: discount and add-on ordering relative to GST; `properties.gst_rate` instead of a literal 18.
- [ ] §7: the webhook stays off by decision; Ooruda owns refunds end-to-end; how partial refunds are recorded.
- [ ] §5.2: who sets `completed`.
- [ ] §5.7: identity documents are stored by Ooruda Villa; retention; the Privacy page states it.
- [ ] §10 "Do not": never write `uses_count` or `discount_redemptions` from Ooruda Villa.
- [ ] §11 checklist: add discount-code and add-on rows.
- [ ] §4: blocks are created and released through `create_block_atomic` / `release_blocked_nights`.
