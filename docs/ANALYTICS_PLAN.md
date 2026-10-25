# Analytics Plan

Status: proposed 2026-10-23, revised the same day after checking every claim against the code.
Nothing here is implemented yet beyond what §1 records as already present. §10 lists what the
first draft got wrong and why, so the reasoning is not lost.

## 1. Where we actually are

| Piece | State |
|---|---|
| GA4 loader | Exists: `src/components/layout/Analytics.tsx`, mounted once in `src/app/(site)/layout.tsx`. Renders nothing unless `NEXT_PUBLIC_GA_ID` is set. Not set anywhere: it is commented out in `.env.hostinger`. |
| Consent gate | Exists: `src/lib/consent.ts` + `CookieConsent.tsx`. Binary accept/decline in `localStorage`; no Google request is made before accept. |
| CSP | Already allows `www.googletagmanager.com`, `*.google-analytics.com`, `*.analytics.google.com` (`next.config.mjs`). No CSP change needed for GA4. |
| Events | **None.** `gtag` is called nowhere outside the init snippet. |
| Checkout route group | `src/app/(checkout)/layout.tsx` mounts **neither** `<Analytics />` **nor** `<CookieConsent />`. `/book` is unmeasured, and a guest who lands on it directly never sees the banner. |
| Booking page URL | `/booking/[token]` is in `(site)`, so once GA is on, the guest's access token is sent to Google in every `page_location`. Must be fixed before GA is switched on, not after. |
| Server-side measurement | None. |
| Web vitals | None. |
| Error tracking | None. Master plan §12 lists Sentry; out of scope here. |

Two facts shape everything below.

**Online payments are paused.** `ONLINE_PAYMENTS_ENABLED` is false in production
(`src/lib/features.ts`). Every Book Now opens `PaymentsPausedDialog`, and `/book` renders
`ReservationNotice` instead of the checkout. The live conversion is **an enquiry by WhatsApp, phone or
email**, not a purchase. The plan measures both and works in either mode.

**Production builds on Hostinger, previews on Vercel.** `villa19.in` (Hostinger) is still parked and
the only deployed site is the Vercel link. Anything Vercel-only (Vercel Analytics, Speed Insights)
would go blind the day production cuts over, so the plan uses nothing host-specific.
`NEXT_PUBLIC_*` values are inlined at build time, so `NEXT_PUBLIC_GA_ID` has to be present in the
Hostinger build environment, not just at runtime.

## 2. What we want to answer

Ranked. An event that answers none of these does not get added.

1. How many visitors try to book, and where do they drop out?
2. Which traffic sources produce enquiries and bookings, not just sessions?
3. While payments are paused, how many guests leave for WhatsApp / phone / email, and from which page and which button?
4. Which pages precede an enquiry (gallery, rooms, FAQ, journal)?
5. Do promo codes get used, and does `VILLA19` from the announcement bar convert?
6. Booking value, nights and lead time, reconcilable against the `bookings` table.
7. Is the site fast enough on a mid-range phone on 4G?

## 3. Stack

| Need | Tool | Why |
|---|---|---|
| Behaviour + acquisition | **GA4 via gtag.js**, keeping the existing component. No GTM. | Already wired and in the CSP. GTM is a second thing to govern, a second consent surface and extra weight, for one property and one developer. Revisit only if a non-developer needs to add tags. |
| Server-truth conversions | **GA4 Measurement Protocol** from the payment routes | Only the server knows a booking is confirmed; the browser can close between payment and redirect. |
| Web vitals | **Next's `useReportWebVitals` → GA4 events** | Works on both hosts, no extra vendor. Replaces the first draft's Speed Insights pick. |
| Errors | Sentry, separately | Not analytics; keep it out of this work. |

Out, with reasons: Meta Pixel (no paid social, and it needs a privacy-policy change for nothing);
Clarity/Hotjar (session replay over forms that take guest details); PostHog (a second product for what
GA4 covers); Vercel Analytics/Speed Insights (host-specific, see §1); Consent Mode v2 (see §6).

## 4. Event schema

### 4.1 One module, two capture styles

`src/lib/analytics.ts` owns every call.

```ts
// Shape, not final code.
export function track<N extends EventName>(name: N, params: EventParams[N]): void
```

- No-ops when `window.gtag` is absent (no consent, no GA ID, server render). Call sites never branch.
- Event names and their params are one typed map, so a typo or a missing param fails the build.
- Never accepts guest name, email, phone, address, GSTIN, ID documents or payment identifiers.

**Contact clicks are captured by one delegated listener, not per call site.** There are 66
`wa.me` / `tel:` / `mailto:` occurrences across 16 files. Instrumenting each is how events go
missing. A single `click` listener on `document` classifies the link by `href` scheme and reads the
`source` from the nearest `data-track-source` attribute (falling back to the containing landmark:
`header`, `footer`, `dialog`, `main`). New links are measured the day they are added. Only the
attribute needs adding, and only where the default is not precise enough.

### 4.2 Booking funnel (payments on: local, preview, and production after go-live)

| Event | Fires when | Params |
|---|---|---|
| `booking_intent` | Any CTA dispatches `OPEN_BOOKING_EVENT` | `source`, `payments_enabled` |
| `select_dates` | `DateSelectForm` continues | `nights`, `adults`, `children`, `lead_time_days` |
| `begin_checkout` | `/book` renders the checkout with a valid quote | `value`, `currency`, `nights`, `adults` |
| `promo_applied` | `/api/discount/validate` accepts | `promo_code` |
| `promo_rejected` | same, rejects | `promo_code` |
| `add_payment_info` | Razorpay modal opens | `value`, `currency` |
| `payment_failed` | Razorpay reports failure, or `verify-payment` rejects | `stage` (`razorpay` / `verification`) |
| `booking_conflict` | `create-order` refuses because the dates were taken meanwhile | `nights` |
| `purchase` | **Server-side only**, see §5 | `transaction_id`, `value`, `tax`, `currency`, `coupon`, `nights`, `lead_time_days` |

- `begin_checkout`, `add_payment_info` and `purchase` are GA4 recommended names, used with their real
  meaning so the built-in reports work.
- `value` is what the guest is charged, in rupees as a number, with GST in `tax`. Convert from paise in
  one helper next to the pricing engine; nothing else touches money.
- `lead_time_days` comes from `todayISO()` in `src/lib/format.ts`, which is property-timezone aware.
  Computing it with `new Date()` would be off by a day for part of every day.
- The date picker already strikes out unavailable nights, so a "chose unavailable dates" event cannot
  fire from the UI; `booking_conflict` captures the real version of that failure.

### 4.3 Enquiry funnel (payments paused: production today)

| Event | Fires when | Params |
|---|---|---|
| `booking_intent` | as above, with `payments_enabled: false` | `source` |
| `reservation_notice_view` | `PaymentsPausedDialog` opens, or `/book` renders `ReservationNotice` | `surface` (`dialog` / `page`) |
| `contact_whatsapp` | delegated listener, `wa.me` link | `source`, `page_type` |
| `contact_call` | delegated listener, `tel:` link | `source`, `page_type` |
| `contact_email` | delegated listener, `mailto:` link | `source`, `page_type` |

Mark `contact_whatsapp`, `contact_call` and `purchase` as key events in GA4. These record intent: we
see the tap, never the conversation. Reconcile monthly against bookings in Supabase and record the
tap-to-booking ratio in this file once there are a few months of it.

`page_type` is a short fixed set (`home`, `rooms`, `gallery`, `faq`, `journal`, `contact`, `book`,
`other`) so reports group cleanly instead of by raw path.

### 4.4 Engagement (thin on purpose)

GA4 enhanced measurement already gives scrolls, outbound clicks and engaged sessions.

| Event | Fires when | Params |
|---|---|---|
| `gallery_open` | `GalleryModal` / `PhotoViewer` opens | `source` |
| `gallery_close` | it closes | `photos_viewed` |
| `video_unmute` | the hero video is unmuted (it autoplays muted, so "play" means nothing) | |
| `faq_open` | a `<details>` in `FaqList` opens | `question_index` |
| `promo_code_copy` | the announcement bar code is copied, if it offers copying | `code` |
| `web_vitals` | `useReportWebVitals` reports LCP, INP, CLS | `metric`, `value`, `rating`, `page_type` |

Dropped from the first draft: `ota_click` (there are no OTA links on the site yet; add it with them)
and `journal_read` (GA4's 90% scroll covers it).

### 4.5 Custom dimensions

Register in GA4 admin **before** shipping events, because unregistered params cannot be reported and
cannot be backfilled: `source`, `page_type`, `payments_enabled`, `surface`, `nights`,
`lead_time_days`, `stage`. Standard GA4 properties allow 50 event-scoped dimensions, so this is well
within limits.

## 5. Server-side `purchase`

**Where.** A booking becomes confirmed in two places: `verify-payment/route.ts` (browser returns) and
`webhook/route.ts` (`payment.captured`). Both must be able to send, because either may be the only one
that runs.

**Idempotency, as built (v1.42).** This is where the plan was wrong and the code was right.

The plan called for a new `bookings.analytics_sent_at` claim column, reasoning that the booking
update in `verify-payment` is unconditional and so cannot be used as a claim. That part is true, but
it looks at the wrong row. The gate is one step upstream: both routes first compare-and-swap the
*payment*, `update payments set status='captured' ... where razorpay_order_id = $1 and status in
('created','expired','failed')`, and only the caller that gets a row back goes on to confirm the
booking. Postgres serialises those updates, so exactly one caller proceeds however many run at once.

That is the same gate the confirmation emails already depend on, and a double-sent email is far more
visible than a double-counted purchase, so it is a gate we would hear about if it ever broke. Adding
a second claim column would have been a second mechanism for a guarantee the codebase already makes
once, and two mechanisms for one rule is how they drift apart.

So `reportPurchase` is called beside `notifyConfirmedBooking` in both routes, and the column was not
added. The assumption is tested rather than asserted: `purchase-once.test.ts` fires 20 simultaneous
confirmations at a real local Postgres and asserts exactly one gets through, and that a webhook
redelivery after the browser has confirmed finds nothing left to do.

**Attribution needs `session_id`, not just `client_id`.** A Measurement Protocol event with only a
`client_id` is attached to the user but not to a session, so it shows up with no source and medium, which
breaks question 2. At `create-order`, the browser reads both with
`gtag('get', GA_ID, 'client_id' | 'session_id')` and posts them with the order. Store them on the
`payments` row (`ga_client_id`, `ga_session_id`, both nullable). The server sends them back with
`purchase`.

**Guests who declined.** They have no client ID. Send `purchase` with a random `client_id` and no
session: the booking is counted, but with no link to their browsing, which matches what they agreed to.
State this in the privacy policy.

**Safety.** `GA4_API_SECRET` is server-only, next to the Razorpay secret. The call is wrapped,
time-limited (2s), logged on failure, and never affects the payment response.

**Testing, as built.** Measurement Protocol returns 2xx even for malformed events. The payload is
asserted field by field offline, since a unit test that calls Google would need live credentials and
would fail whenever the network does. The live check is `scripts/check-ga4-purchase.mjs`, run once
against `/debug/mp/collect` when the property exists, and then DebugView on the preview.

## 6. Consent and privacy

**Keep the hard gate; do not add Consent Mode v2.** The first draft proposed Consent Mode v2 for
"modelled pings from guests who decline". That only happens in *advanced* mode, where the tag loads
and pings Google before consent, which breaks the banner's promise and the privacy policy. *Basic*
mode is what we already have. Google's behavioural modelling also needs about 1,000 events a day from
declining users for a week, which a single villa will not reach. India does not require Consent Mode,
and there is no Google Ads account. So Consent Mode v2 adds work and no data. Revisit only if Google Ads
starts.

Changes that are needed:

1. **Move `<CookieConsent />` and `<Analytics />` to the root layout** (`src/app/layout.tsx`) so both
   route groups get them. The first draft assumed every guest reaches `/book` through the site's
   dialog; they do not: `/book` is a real, linkable page.
2. **Redact the booking token.** Disable enhanced measurement's history-based page views
   (`send_page_view: false`) and send `page_view` from a route listener with sanitised `page_location`,
   `page_path` and `page_referrer`, so `/booking/<token>` becomes `/booking/[token]`. The referrer
   matters too: the next page view after the booking page would otherwise carry the token as its
   referrer. The site's `strict-origin-when-cross-origin` Referrer-Policy covers external sites, not
   GA.
3. **Withdrawal stops tracking now.** `clearConsent()` cannot unload gtag, but it can set
   `window['ga-disable-' + GA_ID] = true`, which stops further hits on the current page. Add that.
4. **Privacy policy** (`src/app/(site)/privacy/page.tsx`): name GA4, what is collected, the server-side
   purchase event and how declined guests are handled, retention, and the withdrawal control.
5. **GA4 settings:** data retention 14 months; Google signals off; ads personalisation off. Remove
   `anonymize_ip` from the snippet: it does nothing in GA4, which never stores IPs, and leaving it
   suggests it does something.
6. **Never collect** guest name, email, phone, address, GSTIN, ID documents or payment IDs, in params
   or in URLs. The booking code is fine as `transaction_id`; it identifies a booking, not a person,
   and the WhatsApp ID link already treats it that way.

## 7. Environments

- **Separate GA4 properties** for production and preview. Shared would mix test bookings into real
  revenue. Local sets no ID, so nothing is sent from development.
- **Internal traffic:** the operator's own visits skew a low-traffic site badly. Define an internal
  traffic rule in GA4 and set a `traffic_type: internal` parameter when a `?internal=1` visit sets a
  local flag (IPs are not stable on Indian mobile networks).
- **Debug mode:** `debug_mode: true` on preview builds so events land in DebugView.

## 8. Reporting

- Funnel exploration, payments on: `booking_intent` → `select_dates` → `begin_checkout` →
  `add_payment_info` → `purchase`.
- Funnel exploration, payments paused: `booking_intent` → `reservation_notice_view` →
  `contact_whatsapp` / `contact_call` / `contact_email`.
- Key events by source and medium, not sessions by source.
- Monthly reconciliation of GA4 `purchase` count and value against `bookings`. Supabase is the record
  for money; GA4 is for behaviour and acquisition. A gap above 5% means the server path is losing
  events.
- Link Search Console to GA4; the site already supports `GOOGLE_SITE_VERIFICATION`.

## 9. Phases

Each phase ships on `release` and is verified on the Vercel link (never `villa19.in`, which is parked
and returns 200 for everything).

**Phase 1 (shipped, v1.40): make the foundation safe and complete. No new business events.**
- Create the preview GA4 property; set `NEXT_PUBLIC_GA_ID` on Vercel.
- Move `Analytics` + `CookieConsent` to the root layout.
- Manual, sanitised `page_view` (§6.2); remove `anonymize_ip`; withdrawal kill switch (§6.3).
- `src/lib/analytics.ts` with the typed `track()` and the `page_type` mapping.
- Verify: accept, page views arrive in DebugView and `/booking/x` shows as `/booking/[token]`;
  decline, no request to any Google host; withdraw, hits stop.

**Phase 2 (shipped, v1.41): the funnel that is live today.** Delegated contact listener, `booking_intent`,
`reservation_notice_view`, all of §4.2 except `purchase`. Register the §4.5 dimensions first.
Unit-test the link classifier and the `page_type` mapping.

**Phase 3 (shipped, v1.42): server-side `purchase`.** Migration 00101 for `ga_client_id` and
`ga_session_id` (no claim column: see §5); client and session capture at `create-order`; the send in
both confirmation routes; `scripts/check-ga4-purchase.mjs` for the live payload check. Useful in
production only after Razorpay go-live, and silent until `GA4_API_SECRET` is set.

**Phase 4 (shipped, v1.43): privacy policy update, web vitals, engagement events (§4.4), internal
traffic rule.**

**Phase 5 (code done, v1.44; the rest is console work): production property, Hostinger build
variable, Search Console link, the reports in §8.** Everything that can live in the repository now
does: a build-time warning when a production build has no measurement ID, the reconciliation script
for §8, and docs/ANALYTICS_SETUP.md, which is the console checklist in the order to do it. The
console steps themselves need credentials and a live production deploy, so they stay the operator's
to do at cut-over.

## 10. What the first draft got wrong

Kept so the corrections are traceable.

| First draft | Actual | Change |
|---|---|---|
| Consent Mode v2 "gives modelled pings from decliners" | Only advanced mode does, and it breaks the consent promise; modelling thresholds are out of reach at this traffic | Dropped (§6) |
| Speed Insights / Vercel Analytics for vitals | Production builds on Hostinger | `useReportWebVitals` → GA4 |
| Idempotency via "the update returns a changed row" | `verify-payment`'s update is unconditional; it returns a row every time | `analytics_sent_at` claim column |
| `client_id` alone attributes the purchase | Without `session_id` the MP event has no source | Capture both via `gtag('get')` |
| Token redaction "in GA4 admin" | Data arrives with the token before any admin rule; the referrer leaks it too | Redact in the browser before sending |
| Banner only in `(site)` is fine because the dialog is the only way into `/book` | `/book` is a real linkable page | Move both components to the root layout |
| `anonymize_ip` "already handled" | No-op in GA4 | Remove it |
| `availability_blocked` event | Picker already strikes out unavailable nights | `booking_conflict` from `create-order` |
| `ota_click` | No OTA links exist | Dropped until they do |
| `video_play` | Hero autoplays muted | `video_unmute`, then dropped in v1.43: HeroVideo is not rendered anywhere and there is no reel in /public, so it could never fire |
| Per-call-site contact tracking | 66 links in 16 files | One delegated listener |
| One GA property | Preview test bookings would pollute revenue | Separate properties per environment |
| `payment_failed` covers a closed modal | Dismissing the modal is the commonest exit from a working payment screen | Separate `payment_abandoned` (v1.41) |
| Mount-time events can call `track()` directly | gtag loads `afterInteractive`, so they fire into a no-op | Shared readiness signal (v1.41) |
| `analytics_sent_at` claim column for idempotency | The payment compare-and-swap upstream already admits exactly one caller, and the emails rely on it | Column dropped; reuse that gate (v1.42) |
| One analytics module | A React hook in it fails the build when a route handler imports it | Readiness split into `analytics-ready.ts` (v1.42) |
| `faq_open` needs onToggle on each item | That turns a zero-JS `<details>` accordion into a client component on two pages | Delegated `toggle` listener in capture phase (v1.43) |
| `gallery_open { source }` | `page_type` already tells the mosaic and the gallery page apart | Reuse `page_type` (v1.43) |
| Reconcile GA4 against bookings by hand | The month boundary has to be the villa's, not UTC, or late-evening bookings land in the wrong month | `scripts/analytics-reconcile.mjs` (v1.44) |
