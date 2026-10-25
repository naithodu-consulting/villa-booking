# Writing to the Villa 19 database from Ooruda Villa

**Audience:** developers of the Ooruda Villa operator app.
**Applies to:** the villa-booking Supabase project (dev/staging `hlmqcdzazbrztfovixjk`; production not yet created).
**Last reviewed:** 2026-09-23

Villa 19's guest site (villa19.in) has no admin of its own. Ooruda Villa blocks dates, records
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
| 11 | After changing **content** (journal posts, nearby places, policies, FAQs), call **`POST /api/revalidate`** (section 9). Content pages are cached and will not change until you do. |

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

Add `RETURNING booking_code, access_token` to the update: confirming assigns the booking number
(5.7), and you will want it straight away for the guest's WhatsApp message.

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

`booking_code`, `confirmed_at` and `access_token` (set by the database), `reference_number`
(generated, unique), `hold_expires_at` (except clearing it on confirm), `id`, `created_at`. Do not change amounts on a booking paid online; the Razorpay order was
created for that exact figure.

### 5.7 Booking numbers, private links and IDs

Every booking has three identifiers. Use the right one for each job:

| Column | Example | What it is | Who sees it |
|---|---|---|---|
| `booking_code` | `V19-7KQ-M4X` | **The booking number.** Assigned automatically by a database trigger the first time `status` becomes `'confirmed'`, however that happens (website payment, this app, an OTA import). Never changes, never reused, and unique across all villas. | Guests, staff, emails, WhatsApp |
| `access_token` | 64 hex characters | The private key to the guest's booking page, `https://villa19.in/booking/<access_token>`. Created with the row. | Only the guest (by email or WhatsApp) |
| `reference_number` | `MNG-3F9A2C` | Internal hold reference, also the Razorpay receipt. Exists before payment. | Nobody outside the system |

- **Format:** villa prefix (`properties.booking_code_prefix`, e.g. `V19`), 5 random Crockford Base32
  characters and 1 check character, displayed as `V19-7KQ-M4X`. The alphabet has no `I`, `L`, `O` or
  `U`, so it reads cleanly over the phone.
- **Staff search:** people will type it in any case, without hyphens, or with `O` for zero. Normalise
  before searching: uppercase, strip spaces and hyphens, then `O`→`0` and `I`/`L`→`1`. The guest
  site's version is `normalizeBookingCode` in `src/lib/booking-code.ts`; it also rejects typos using
  the check character. Port it, do not reinvent it.
- **A booking code is a label, not a password.** Never show booking details to someone who only
  gives you a code. Ask for the guest's phone or email too. Only `access_token` opens the booking
  page, so never share it with anyone except the guest it belongs to.
- **OTA bookings** (Airbnb, Booking.com and so on) get their own `V19-…` code like any other
  confirmed booking. Keep the OTA's confirmation code in `external_reservations.channel_reservation_id`
  (with `channel` and `booking_id`), and let staff search by either. Do not put the OTA code in
  `booking_code`.
- **Not an invoice number.** GST invoices need their own gapless series per financial year; that is a
  separate table when invoicing is built.
- **New villas:** set `booking_code_prefix` when you create the property: 2 to 4 characters, starting
  with a letter (`^[A-Z][A-Z0-9]{1,3}$`). Without it, codes fall back to the prefix `HB`.

**Guest IDs (`id_status`).** Guests send a photo ID for every adult on WhatsApp, using the link on
their booking page and in the confirmation email. Nothing is uploaded to or stored in this database.
Ooruda Villa tracks where each booking stands:

| `id_status` | Set when | Guest's booking page shows |
|---|---|---|
| `pending` (default) | Nothing received yet | "Share ID documents" with the WhatsApp button |
| `received` | Documents arrived on WhatsApp | "ID documents received", button to send more |
| `verified` | Checked against the guest list | "ID documents received and checked" |

`id_status_updated_at` is stamped automatically. Accepted IDs: Aadhaar (masked copy preferred),
passport, driving licence. To resend the link to a guest, use this exact message format so the guest
site and Ooruda Villa stay consistent (replace the booking code and adult count, then URL-encode):

```
https://wa.me/<business number>?text=Hi, sharing ID documents for booking V19-7KQ-M4X (6 adults). Attaching one photo per adult guest: Aadhaar, passport or driving licence.
```

Keep guest names, dates and phone numbers out of the message.

**Retention (internal policy, decided 2026-09-23):** staff delete guest ID photos from WhatsApp, and
from any phone or computer they were saved to, **one week after check-out**. This is not yet stated on
the Privacy page; add it there once the process is in place. Ooruda Villa should remind staff when a
booking passes the one-week mark.

---

## 6. Rates

### 6.1 Base rates (`properties`)

| Column | Meaning |
|---|---|
| `base_nightly_rate` | Sunday to Thursday nights, paise |
| `weekend_nightly_rate` | **Friday and Saturday nights**, paise |
| `base_occupancy` | Guests included in the nightly rate (children count; infants do not). Currently **8**. |
| `extra_guest_rate` | Per guest, per night, for guests above `base_occupancy` up to the second tier, paise. Currently **100000** (₹1,000, guests 9-11). |
| `extra_guest_tier2_from` | First guest (by count) charged the second-tier rate instead. Currently **12**. `NULL` means one flat `extra_guest_rate` for every extra guest. |
| `extra_guest_tier2_rate` | Per guest, per night, from `extra_guest_tier2_from` onwards, paise. Currently **70000** (₹700, guests 12-14). Set both tier columns or neither. |
| `max_occupancy` | Hard cap. The guest site refuses anything above it. Currently **14**. |

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
- **Current data (2026-09-15, migration `00021`).** One rule only:

  | Rule | `start_date` | `end_date` | Nights priced | Rate | Min stay |
  |---|---|---|---|---|---|
  | New Year's Eve and New Year's Day | 2026-12-31 | 2027-01-02 | 31 Dec, 1 Jan | ₹16,000 | none |

  The earlier Diwali, New Year and Summer rules and their minimum stays were removed. Every other
  night uses the weekday/weekend rates until Ooruda Villa adds a rule. Minimum stay is still
  supported per rule; set `min_stay_nights = 1` for none.

### 6.3 Computing a booking's amounts

Use exactly the guest site's formula (`src/lib/pricing-engine.ts`) so a phone booking and an online
booking for the same stay cost the same:

1. For each night in `[check_in, check_out)`: the `pricing_rules.nightly_rate` covering it, else
   `weekend_nightly_rate` for Friday/Saturday, else `base_nightly_rate`. Sum = `base_amount`.
2. Extra guests, stepwise (guests = adults + children):
   - `extra = max(0, guests - base_occupancy)`
   - `tier2 = min(extra, max(0, guests - extra_guest_tier2_from + 1))` (0 if the tier columns are `NULL`)
   - `extra_guest_amount = ((extra - tier2) × extra_guest_rate + tier2 × extra_guest_tier2_rate) × nights`
   - Example, 12 guests for 1 night: 3 × ₹1,000 + 1 × ₹700 = ₹3,700.
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
  key `cancellation`): 100% at more than 14 days before check-in, 50% at 7 to 14 days, none under 7.
  These match the Airbnb listing's own tiers (00106). The site renders its copy from
  `src/lib/cancellation.ts`, so a future change has to land in both.
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

Both are the functions the guest site uses, so Ooruda Villa's calendar and villa19.in cannot
disagree. Do not re-implement the overlap logic.

---

## 9. Content: journal posts and refreshing the site

### 9.1 Journal posts (`journal_posts`)

The guest site's Journal (`/journal`) shows posts from this table alongside a few posts that ship
as files in the villa-booking repo. Ooruda Villa writes posts here.

| Column | Rules |
|---|---|
| `property_id` | Villa 19's property id. |
| `slug` | The URL: `/journal/<slug>`. Lowercase letters, digits and single hyphens, up to 100 characters (`best-time-to-visit`). Unique per property. **Do not change a slug after publishing**: the old URL will 404 and lose its search ranking. |
| `title` | 1 to 160 characters. Used as the page title and in search results. |
| `excerpt` | 1 to 320 characters. One or two sentences shown on cards and as the search description. |
| `category` | `'mangalore-guides'` or `'plan-your-stay'`. Anything else fails the insert. |
| `body` | **Plain Markdown.** Supported: `##` and `###` headings, paragraphs, `**bold**`, lists, `>` quotes, `---` rules and links. Links starting with `/` stay on the site; others open in a new tab. Raw HTML and inline images are **dropped**, and a `#` heading is shown as `##` (the page title is the only top-level heading). Do not send MDX or JSX. |
| `cover_image_url` | Optional. A public URL in this project's Supabase Storage (`https://<project>.supabase.co/storage/v1/object/public/...`); other hosts will not load. Landscape, at least 1600 px wide. Without one the site shows a branded cover. |
| `cover_alt` | **Required when there is a cover image** (the database enforces this). Describe what the photo shows. |
| `status` | `'draft'` or `'published'`. Only published rows are shown. Drafts are private to Ooruda Villa. |
| `published_at` | Indian calendar date. **Required when `status = 'published'`** (enforced). Posts are sorted newest first by this date. |
| `created_at`, `updated_at` | Set by the database. Do not write. `updated_at` is shown to search engines as the modified date. |

- **Unpublish** by setting `status = 'draft'`. Deleting a published post also works, but its URL
  then 404s.
- If a row uses the same slug as one of the repo's file-based posts, **the row wins**. That is how a
  file-based post is moved into Ooruda Villa: copy it into a row with the same slug.
- The Journal only appears in the site's footer, menu and sitemap once there are **at least 3
  published posts** in total.
- The guest site never writes to this table.

### 9.2 Refreshing the site after a change

Content pages (journal, The Villa, Stay Guide and others) are rendered once and cached. After you
publish, edit or unpublish a post, or change nearby places, policies or FAQs, call:

```http
POST https://villa19.in/api/revalidate
Authorization: Bearer <CONTENT_REVALIDATE_SECRET>
```

> **Setup still to do in Ooruda Villa (when the Journal editor is built):** add
> `CONTENT_REVALIDATE_SECRET` to Ooruda Villa's server environment, with the **same value** already
> set in the guest site's Vercel project (set 2026-09-23). Copy it from Vercel (villa-booking
> project, Settings, Environment Variables); never paste it into code, tickets or chat. Until
> Ooruda Villa has it, publishing works but the site will not show the change until the next
> deploy. If the secret is ever rotated, update it in both apps at the same time.

- Keep the secret server-side, like the service role key.
- Responses: `200 {"revalidated": true}`, `401` for a missing or wrong secret, `503` if the guest
  site has no secret configured.
- It refreshes every page, not a single path, so one call covers any combination of changes. Pages
  re-render on their next visit, usually within seconds.
- If the call fails, retry. The data is already saved; only the cached pages are stale.

---

## 10. Do not

- Insert into `bookings` directly, or update `check_in`/`check_out` in place.
- Delete bookings or payments.
- Edit or replace `create_booking_atomic`, `check_availability` or `get_unavailable_nights`. They are
  owned by the villa-booking repo's migrations; changes go there.
- Create overlapping pricing rules or zero-night ranges.
- Store rupees, decimals, or dates with times.
- Put the service role key in any client that runs on a phone or in a browser.

---

## 11. Before shipping an Ooruda Villa change that writes here

- [ ] Uses the service role key server-side only
- [ ] "Today" computed in `Asia/Kolkata`
- [ ] Every range written as `[start, end)` with `end > start`
- [ ] New bookings go through `create_booking_atomic` and are confirmed with the guarded update
- [ ] Staff see and search `booking_code` (normalised); OTA codes stay in `external_reservations`
- [ ] Booking details are never revealed on a booking code alone
- [ ] `id_status` updated as WhatsApp ID documents arrive and are checked
- [ ] Cancellations update status, never delete
- [ ] Amounts in integer paise, computed per section 6.3
- [ ] Blocks and rate rules checked for overlaps first
- [ ] Razorpay refunds mirrored into `payments` and `bookings`
- [ ] Journal bodies saved as plain Markdown, with `published_at` set on publish
- [ ] `POST /api/revalidate` called after every content change
- [ ] Tested against the dev project, never production first
