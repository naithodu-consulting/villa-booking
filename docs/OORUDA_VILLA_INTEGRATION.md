# Writing to the Villa 19 database from Ooruda Villa

**Audience:** developers of the Ooruda Villa operator app.
**Applies to:** the villa-booking Supabase project (dev/staging `hlmqcdzazbrztfovixjk`; production not yet created).
**Last reviewed:** 2026-09-15

Villa 19's guest site (habbaa.in) has no admin of its own. Ooruda Villa blocks dates, records
phone/WhatsApp bookings, changes rates and processes cancellations and refunds by writing directly
into this database. The guest site's booking engine reads the same rows. If Ooruda Villa writes them
in a shape the engine does not expect, the result is silent: a date that looks blocked but is
bookable, a price that is quietly wrong, or a double booking.

This document is the contract. Everything here is enforced by the guest site's code, not by database
constraints, unless it says otherwise.

---

## 1. Rules at a glance

| # | Rule |
|---|---|
| 1 | Connect with this project's **service role key**, from a server only. Never ship it to a browser or mobile app. |
| 2 | All dates are **Indian calendar dates** (`DATE`, no time, no timezone). Compute "today" in `Asia/Kolkata`, never from UTC. |
| 3 | Every date range is **half-open**: `[start, end)`. The end date is the check-out morning, and that night is **not** included. This applies to bookings, blocked dates **and pricing rules**. |
| 4 | **Never `INSERT` into `bookings` directly.** Always call `create_booking_atomic`, then update the row. |
| 5 | **Never `DELETE` a booking.** Cancel it (`status = 'cancelled'`). |
| 6 | Every amount is **integer paise** (₹1 = 100). No decimals, no rupees. |
| 7 | Before blocking dates, **check availability**. The database does not stop a block being placed over a confirmed guest. |
| 8 | **Pricing rules must not overlap** each other. |
| 9 | When you refund or cancel anything in Razorpay, **update this database too**. The guest site's webhook is switched off. |
| 10 | Changes appear on the guest site's calendar within about **60 seconds** (edge cache). Checkout itself always reads live data. |

---

## 2. Connecting

- **Key:** the `service_role` key of the villa-booking project (Supabase dashboard, Project Settings, API).
  It bypasses row-level security, which is why it must stay server-side.
- **Row-level security:** enabled on every table. The anon and authenticated roles cannot write
  bookings, payments, blocked dates or rates, so a browser-side client will get permission errors.
- **Property id:** look it up once by slug and cache it:
  ```sql
  SELECT id FROM properties WHERE slug = 'villa-19';
  ```
  Villa 19 is currently `a1b2c3d4-0000-0000-0000-000000000001` on dev. Do not hardcode it for production.

---

## 3. Dates

- Columns are Postgres `DATE`. Send `'YYYY-MM-DD'` strings.
- **Today** must be the date in India:
  ```ts
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // "2026-09-15"
  ```
  `new Date().toISOString().slice(0, 10)` is **wrong**: between 00:00 and 05:30 IST it returns
  yesterday.
- **Half-open ranges, with worked examples**

  | What you mean | `start` / `check_in` | `end` / `check_out` |
  |---|---|---|
  | Block the single night of 10 Oct | `2026-10-10` | `2026-10-11` |
  | Block the nights of 10, 11, 12 Oct | `2026-10-10` | `2026-10-13` |
  | Guest arrives 10 Oct, leaves 13 Oct (3 nights) | `2026-10-10` | `2026-10-13` |
  | Seasonal rate for every night of May | `2026-05-01` | `2026-06-01` |

  A row where `end == start` covers **zero nights** and does nothing. The tables allow it, so do not
  write one.

---

## 4. Blocking and unblocking dates (`blocked_dates`)

| Column | Rule |
|---|---|
| `property_id` | Villa 19's id. |
| `start_date` | First blocked night. |
| `end_date` | Morning after the last blocked night (exclusive). Must be greater than `start_date`. |
| `reason` | One of `maintenance`, `owner_hold`, `offline_booking`. Not enforced by the database; the guest site treats any value the same. |
| `notes` | Free text for operators. Never shown to guests. |

**To block**, check first, then insert:

```sql
-- 'AVAILABLE', 'DATE_UNAVAILABLE' (a booking or live checkout hold) or 'DATE_BLOCKED' (already blocked)
SELECT check_availability('<property_id>', '2026-10-10', '2026-10-13');

INSERT INTO blocked_dates (property_id, start_date, end_date, reason, notes)
VALUES ('<property_id>', '2026-10-10', '2026-10-13', 'maintenance', 'Roof repair');
```

If the check returns `DATE_UNAVAILABLE`, a guest holds some of those nights. Do not block over them;
resolve the booking first. A `DATE_UNAVAILABLE` can also be a guest mid-checkout (a 15-minute hold);
waiting 15 minutes and retrying is fine.

**To unblock** part of a multi-night block, split the row rather than shortening it blindly:
delete it and insert the remaining pieces in one transaction. Unblocking the night of 11 Oct from
the example above leaves `[10, 11)` and `[12, 13)`.

**Phone/WhatsApp bookings are not blocks.** Record them as bookings (section 5) so they appear in
revenue, occupancy and the guest registry. Use `offline_booking` blocks only for nights sold somewhere
this system cannot see.

---

## 5. Bookings (`bookings`)

### 5.1 Creating a booking: always through `create_booking_atomic`

This function takes a per-property lock, re-checks availability inside it, generates the reference
number and inserts the row. It is the **only** thing that makes double booking impossible. An
`INSERT` from Ooruda Villa at the same moment a guest pays online can produce two confirmed bookings
for the same nights.

```ts
const { data, error } = await supabase.rpc('create_booking_atomic', {
  p_property_id: propertyId,
  p_guest_name: 'Ramesh Kumar',
  p_guest_email: 'ramesh@example.com', // NOT NULL: pass '' if unknown
  p_guest_phone: '9876543210',         // NOT NULL: pass '' if unknown
  p_num_adults: 6,
  p_num_children: 2,
  p_num_infants: 0,
  p_check_in: '2026-10-10',
  p_check_out: '2026-10-13',
  p_num_nights: 3,                     // must equal check_out minus check_in
  p_base_amount: 4_350_000,            // paise, see section 6 for how to compute
  p_extra_guest_amount: 0,
  p_tax_amount: 783_000,
  p_total_amount: 5_133_000,
  p_special_requests: null,
});
// error.message starts with 'DATE_UNAVAILABLE' or 'DATE_BLOCKED' when the dates are taken.
const { booking_id, reference_number } = data[0];
```

The row is created as `status = 'pending'` with a **15-minute hold**. If you stop here, the hold lapses
and the dates are released. You must confirm it:

```sql
UPDATE bookings
   SET status          = 'confirmed',
       payment_status  = 'unpaid',        -- or 'partially_paid' / 'paid'
       booking_channel = 'whatsapp',      -- see 5.3
       hold_expires_at = NULL,
       updated_at      = NOW()
 WHERE id = '<booking_id>'
   AND status = 'pending';                -- guards against confirming a lapsed hold
```

If that update touches **0 rows**, the hold lapsed before you confirmed and someone else may have
taken the dates. Call `create_booking_atomic` again rather than resurrecting the row.

### 5.2 Status values

| `status` | Meaning | Blocks dates? | Who sets it |
|---|---|---|---|
| `pending` | Awaiting payment, hold live for 15 min | Only while `hold_expires_at` is in the future | `create_booking_atomic` |
| `confirmed` | Booked | **Yes, always** | Guest site on payment; Ooruda Villa for offline bookings |
| `expired` | Hold lapsed without payment | No | Nightly database job |
| `cancelled` | Cancelled by guest or operator | No | Ooruda Villa (and the guest site on a failed payment) |
| `completed` | Stay finished | No | Not set by anything yet. Ooruda Villa may set it after check-out. |

| `payment_status` | Meaning |
|---|---|
| `unpaid` | Nothing received |
| `partially_paid` | Deposit or part payment received offline |
| `paid` | Fully paid |
| `refunded` | Refund issued (full or partial; record the amount in `special_requests` or your own table until a refunds table exists) |

### 5.3 `booking_channel`

Enforced by a check constraint: `online`, `whatsapp`, `phone`, `referral`, `instagram`, `manual`,
`other`. The guest site writes `online`. Anything else fails the insert or update.

### 5.4 Changing dates

There is no safe in-place date change: an `UPDATE` of `check_in`/`check_out` skips the lock and the
availability check. To move a booking:

1. `create_booking_atomic` for the new dates (fails cleanly if taken).
2. Confirm the new row (5.1) and copy over payment status and notes.
3. Cancel the old row (5.5).

### 5.5 Cancelling

```sql
UPDATE bookings
   SET status = 'cancelled', updated_at = NOW()
 WHERE id = '<booking_id>' AND status IN ('pending', 'confirmed');
```

The dates are free immediately. Never delete the row: payments reference it, and the reference number
has been sent to the guest.

### 5.6 Columns Ooruda Villa must not write

`reference_number` (generated, unique, already emailed), `hold_expires_at` (except clearing it on
confirm), `id`, `created_at`. Do not change amounts on a booking paid online; the Razorpay order was
created for that exact figure.

---

## 6. Rates

### 6.1 Base rates (`properties`)

| Column | Meaning |
|---|---|
| `base_nightly_rate` | Sunday to Thursday nights, paise |
| `weekend_nightly_rate` | **Friday and Saturday nights**, paise |
| `extra_guest_rate` | Per guest, per night, above `base_occupancy`, paise |
| `base_occupancy` | Guests included in the nightly rate (children count; infants do not) |
| `max_occupancy` | Hard cap. The guest site refuses anything above it. |

Changes apply to **new** bookings at once. Existing bookings keep their stored amounts.

### 6.2 Seasonal and holiday rates (`pricing_rules`)

| Column | Rule |
|---|---|
| `start_date` | First night the rate applies |
| `end_date` | **Exclusive.** The night of `end_date` gets the normal rate. |
| `nightly_rate` | Paise. Replaces **both** weekday and weekend rates for covered nights. |
| `min_stay_nights` | Applies to any stay that includes **at least one** covered night. |

- **No overlaps.** When two rules cover the same night, checkout and the homepage widget can pick
  different ones (checkout does not order the rules), so the guest may see one price and be charged
  another. Check before inserting:
  ```sql
  SELECT rule_name FROM pricing_rules
   WHERE property_id = '<property_id>'
     AND '<new_start>' < end_date AND '<new_end>' > start_date;
  ```
- **Existing data needs a decision.** The rules currently on dev read as if the end date were
  included, but the engine excludes it:

  | Rule | Stored | Nights actually priced |
  |---|---|---|
  | Summer Holidays | 2026-05-01 to 2026-05-31 | 1 to 30 May (**31 May at normal rate**) |
  | Diwali Peak | 2026-10-17 to 2026-10-21 | 17 to 20 Oct (**21 Oct at normal rate**) |
  | New Year Peak | 2026-12-29 to 2027-01-02 | 29 Dec to 1 Jan |

  If the last nights were meant to be included, move each `end_date` forward one day.

### 6.3 Computing a booking's amounts

Use exactly the guest site's formula (`src/lib/pricing-engine.ts`) so a phone booking and an online
booking for the same stay cost the same:

1. For each night in `[check_in, check_out)`: the `pricing_rules.nightly_rate` covering it, else
   `weekend_nightly_rate` for Friday/Saturday, else `base_nightly_rate`. Sum = `base_amount`.
2. `extra_guest_amount = max(0, adults + children - base_occupancy) × extra_guest_rate × nights`.
3. `tax_amount = round((base_amount + extra_guest_amount) × 18 / 100)` (GST at 18%).
4. `total_amount = base_amount + extra_guest_amount + tax_amount`.

A negotiated price is fine; store the agreed figures. Do not use 12% GST (an old admin route in this
repo did, and was wrong).

---

## 7. Payments and refunds

- **Online payments** are written by the guest site only. Ooruda Villa should read `payments`, not
  write it. `razorpay_order_id` is required and unique, so offline payments do not belong in this
  table: record them through `bookings.payment_status`.
- **Refunds.** The guest site's Razorpay webhook is **off**, so a refund issued from the Razorpay
  dashboard is not recorded here automatically. After refunding in Razorpay, Ooruda Villa must run:
  ```sql
  UPDATE payments SET status = 'refunded' WHERE razorpay_payment_id = '<pay_id>' AND status = 'captured';
  UPDATE bookings SET status = 'cancelled', payment_status = 'refunded', updated_at = NOW()
   WHERE id = '<booking_id>';
  ```
  The refund amount follows the cancellation policy published on the site (`property_policies`,
  key `cancellation`): 90% at 30 or more days before check-in, 50% at 15 to 29 days, none under 15.
- **Paid but still pending.** If a guest's browser closes between paying and returning to the site,
  their booking can expire even though Razorpay captured the money. Search Razorpay for captured
  payments whose booking is `expired`, and re-create them with `create_booking_atomic` (the original
  dates may already be taken).

---

## 8. Reading availability

| Need | Call | Returns |
|---|---|---|
| Can this stay be booked? | `check_availability(property_id, check_in, check_out)` | `'AVAILABLE'`, `'DATE_UNAVAILABLE'` or `'DATE_BLOCKED'` |
| Which nights are taken in a window? | `get_unavailable_nights(property_id, from, to)` | Set of dates (each is a taken night; `to` exclusive) |

Both are the functions the guest site uses, so Ooruda Villa's calendar and habbaa.in cannot
disagree. Do not re-implement the overlap logic.

---

## 9. Do not

- Insert into `bookings` directly, or update `check_in`/`check_out` in place.
- Delete bookings or payments.
- Edit or replace `create_booking_atomic`, `check_availability` or `get_unavailable_nights`. They are
  owned by the villa-booking repo's migrations; changes go there.
- Create overlapping pricing rules or zero-night ranges.
- Store rupees, decimals, or dates with times.
- Put the service role key in any client that runs on a phone or in a browser.

---

## 10. Before shipping an Ooruda Villa change that writes here

- [ ] Uses the service role key server-side only
- [ ] "Today" computed in `Asia/Kolkata`
- [ ] Every range written as `[start, end)` with `end > start`
- [ ] New bookings go through `create_booking_atomic` and are confirmed with the guarded update
- [ ] Cancellations update status, never delete
- [ ] Amounts in integer paise, computed per section 6.3
- [ ] Blocks and rate rules checked for overlaps first
- [ ] Razorpay refunds mirrored into `payments` and `bookings`
- [ ] Tested against the dev project, never production first
