# Analytics setup: the console work

The code is done (docs/ANALYTICS_PLAN.md, phases 1 to 4, v1.40 to v1.43). Everything left is
configuration in the Google Analytics console and on the hosts, and none of it can be done from the
repository. This is the order to do it in, and what to check at each step.

Until step 2 is done the site measures nothing at all, by design: no measurement ID means no request
to Google is ever made.

---

## 1. Create two GA4 properties

One for production, one for preview. **Not one shared property**: the preview deploy runs the full
payment flow with Razorpay test keys, so sharing would put test bookings into real revenue and the
reconciliation in §6 would never agree.

For each: Admin → Create property → add a **Web** data stream for that URL. Copy the measurement ID
(`G-XXXXXXXXXX`).

In each property, Admin → Data collection and modification → Data retention: set **14 months**.
Leave Google signals **off** and ads personalisation **off**; there is no advertising account, and
the privacy policy says we do not use advertising cookies.

---

## 2. Set the measurement ID where each host *builds*

| Host | What to set | Where |
|---|---|---|
| Vercel (preview) | `NEXT_PUBLIC_GA_ID` = the preview property's ID | Project → Settings → Environment Variables |
| Hostinger (production) | `NEXT_PUBLIC_GA_ID` = the production property's ID | hPanel → the Node.js app → Environment variables |

**This one is easy to get wrong on Hostinger.** `NEXT_PUBLIC_*` is compiled into the browser bundle
when the site is built, not read when it runs. Hostinger builds from the uploaded archive, and the
archive deliberately contains no `.env` file, so the variable must be in the host's panel *before*
that build runs. If it is added afterwards, every dashboard looks correct and the site measures
nothing.

The build now says so: a production build without the variable prints a warning in the build log.
Read the Hostinger build log once and check it is not there.

---

## 3. Register the custom dimensions

Admin → Custom definitions → Create custom dimension, event-scoped, for each:

| Dimension name | Event parameter |
|---|---|
| Source | `source` |
| Page type | `page_type` |
| Payments enabled | `payments_enabled` |
| Surface | `surface` |
| Nights | `nights` |
| Lead time days | `lead_time_days` |
| Stage | `stage` |
| FAQ question | `faq_question` |
| Metric | `metric` |
| Rating | `rating` |

**Do this before you start reading reports.** A parameter that is not registered is still collected,
but cannot be put in a report, and it cannot be backfilled: data from before the dimension existed
stays unreportable for ever.

---

## 4. Mark the key events

Admin → Events → mark as key event:

- `purchase` — a completed booking.
- `contact_whatsapp` — the live conversion while online payment is paused.
- `contact_call` — likewise.

Leave `contact_email` as an ordinary event unless email enquiries turn out to matter; it is the
least used of the three.

These two record *intent*, not outcome: we see the tap and never the conversation. Treat them as the
top of a funnel that finishes by hand, and use §6 to learn what share of them become bookings.

---

## 5. The reports worth building

### Funnel, while payments are paused (the one that matters today)

Explore → Funnel exploration, with these steps:

1. `booking_intent`
2. `reservation_notice_view`
3. `contact_whatsapp` or `contact_call`

Break down by `source` to see which button produces enquiries: the header, the drawer, the mobile
bar, the booking widget, the paused-payments dialog or `/book` itself.

### Funnel, once Razorpay is live

1. `booking_intent`
2. `select_dates`
3. `begin_checkout`
4. `add_payment_info`
5. `purchase`

`payment_abandoned` between steps 4 and 5 is a guest closing the payment window, which is normal.
`payment_failed` there is not: break it down by `stage` (`order`, `razorpay`, `verification`).
`verification` is the expensive one, because the guest has been charged.

### Acquisition

Reports → Acquisition → Traffic acquisition, and switch the metric from *Sessions* to the key
events above. Sessions by source answers nothing on a site with this little traffic; bookings and
enquiries by source answers the only question worth asking.

### Content

Explore → Free form, dimension `page_type`, metric `contact_whatsapp` + `purchase`. This is "which
pages precede an enquiry": the gallery, the rooms page, the FAQ or the journal.

### Speed

Explore → Free form, dimension `metric`, metrics `web_vitals` event count, with `rating` as a
secondary dimension. Watch the share of `poor` on mobile, which is the real question: a mid-range
Android phone on 4G, not a laptop on fibre.

---

## 6. The monthly reconciliation

Run, from the repository root:

```bash
node scripts/analytics-reconcile.mjs 2026-10
```

With no month it does the last complete one. It reads the database, which is the record for money,
and prints the booking count, the gross value and every booking reference for the month. Compare
against GA4 → Reports → Monetisation → Ecommerce purchases for the same month.

They should match. GA4 counts a purchase when the booking is confirmed, and so does the script, in
the villa's own timezone — a booking confirmed at 23:30 on the last of the month belongs to that
month, not the next one.

**A gap above about 5% means the server-sent `purchase` is being lost, not that a booking is
missing.** The database is the record; GA4 is the thing that can drop events. Check that
`GA4_API_SECRET` is set on the host, and look for `[analytics]` lines in the server log.

To reconcile production from a developer machine, pass production's credentials for that one
command rather than editing any file:

```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/analytics-reconcile.mjs 2026-10
```

The script prints which database host it read from. Check that line before believing the numbers.

---

## 7. The Measurement Protocol secret

Admin → Data Streams → the stream → Measurement Protocol API secrets → Create. Set it as
`GA4_API_SECRET` on the host, **server-side only**, never prefixed `NEXT_PUBLIC_`.

Then check the payload Google will actually receive:

```bash
GA4_MEASUREMENT_ID=G-XXXXXXXXXX GA4_API_SECRET=... node scripts/check-ga4-purchase.mjs
```

This matters more than it looks. The collector answers `204` whether the body was perfect or
nonsense, so a malformed purchase event is invisible in production and shows up weeks later as
revenue missing from a report. The validation endpoint this script calls is the only thing that will
say what is wrong.

Without the secret, bookings are never counted: `purchase` is sent from the server, because a guest
can close the tab the moment they finish paying and the Razorpay webhook is then the only thing that
knows the booking is real.

---

## 8. Keep your own visits out of the numbers

Visit any page with `?internal=1` once, on each browser and phone the villa's own people use.
`?internal=0` undoes it. The marker is stripped from the reported URL, so it cannot split a page
into two rows in a report.

Then in GA4: Admin → Data collection and modification → Data filters → Create filter → **Internal
Traffic**, matching `traffic_type` equals `internal`. Create it as **Testing** first and watch it
for a few days before switching to **Active**, because an active filter discards data permanently
and cannot be undone.

This is worth doing early. On a site with a handful of bookings a month, the operator checking their
own pages is a large share of all traffic, and it is the share that behaves least like a guest.

---

## 9. Search Console

1. Search Console → add the production property → verify by HTML tag.
2. Put the tag's content value in the host's environment as `GOOGLE_SITE_VERIFICATION` and rebuild;
   the site already renders it. `BING_SITE_VERIFICATION` works the same way for Bing.
3. GA4 → Admin → Product links → Search Console links → link the property.

---

## 10. After it is all on, check it once

On the production site, with a browser that has not marked itself internal:

- Open the site, **decline** cookies. Open developer tools, Network, filter `google`. There must be
  no request at all. This is what the banner and the privacy policy promise.
- Accept, reload, and watch GA4 → Admin → DebugView (or Realtime). A `page_view` should arrive with
  `page_type`.
- Press *Book Now*: `booking_intent` with the right `source`, then `reservation_notice_view` while
  payments are paused.
- Open `/booking/<any token>` from a real confirmation email. The page path in GA4 must read
  `/booking/[token]`. **If you ever see a real token in a report, stop and say so** — that is a
  guest's private link, and the redaction is the one thing in this whole system that cannot be
  fixed after the fact.
- Clear the site's cookies and site data to withdraw (the footer control was removed on
  2026-10-25), answer the banner with Decline, and confirm the hits stop.
