# Villa 19 by Habbaa — Master Plan

**Version:** 2.0.0
**Date:** 2026-09-02
**Supersedes:** the brand/IA/design portions of `PRODUCT_REQUIREMENTS.md` and `MVP_SCOPE.md` v1.0.
The booking-engine, security and testing requirements in those documents remain in force.

---

## 0. Executive summary

The existing codebase is a **single-page, OTA-style listing** — one long `page.tsx` that reads like an
Airbnb detail page. The new brief asks for something categorically different: a **photography-led,
multi-page brand site** for a private villa, with the booking engine as one surface inside it rather
than the whole product.

So this is not a redesign. It is a re-architecture of the public site, reusing roughly 60% of what
exists underneath (pricing engine, atomic booking function, webhook, Supabase schema, admin shell)
and rebuilding the guest-facing layer.

Three things must happen before anything else, because the current build will mislead or expose guests:

1. `/book` tells guests **"Payment Verified — Booking Confirmed"** without ever opening Razorpay.
2. `bookings` and `payments` have **no RLS** but are granted to `anon`/`authenticated`.
3. Payment confirmation is **structurally broken** — no `payments` row is ever written, so the
   webhook updates nothing and no booking ever legitimately reaches `confirmed`.

These are Phase 0. Nothing ships until they are closed.

---

## 1. Decisions locked

| # | Decision | Choice | Implication |
|---|---|---|---|
| D-01 | Domain | **villa19.in** | Single site. Villa 19 is the content at root. Habbaa is the operator brand. |
| D-02 | Brand hierarchy | **Villa 19** primary, *managed by Habbaa* secondary | Villa 19 owns the hero, the title tag, the OG image. Habbaa owns the footer, the About section, the operator trust signals. |
| D-03 | Multi-property | **Structurally ready, not exposed** | Internally every route is property-scoped from day one. Villa 19 renders at `/`. Property #2 flips a config flag, not a rewrite. |
| D-04 | Booking model | **Direct online payment is the primary CTA** | Razorpay checkout is finished properly. OTA links are secondary trust signals, not the conversion path. |
| D-05 | Availability truth | **External channel manager is master** | Our DB is a synced cache. This is the single biggest architectural change in this plan — see §7. |
| D-06 | CMS | **Extend the existing Supabase admin** | No headless CMS. All content, pricing, media and availability edited in `/admin`. |

### 1.1 Assumptions I am proceeding on (flag if wrong)

- **A-01** villa19.in is registered or will be; DNS is controllable. Hosting stays Vercel.
- **A-02** The villa facts in `URWA_VILLA_KNOWLEDGE.md` still hold: 4 bedrooms, max 12 guests, base
  occupancy 8, private lawn, **no pool**, **no in-house chef**, **no private beach**, beach 1.5 km.
  The new brief does not contradict any of these; it also does not confirm them. Everything in the
  build treats them as authoritative until told otherwise.
- **A-03** "Villa 19" is the final name and the property is in Urwa, Mangalore, 575006.
- **A-04** Real photography will be commissioned. The plan is designed so that photography is the
  long-pole dependency and everything else can proceed in parallel behind placeholders.
- **A-05** GST applies (₹12,000–14,000/night is above the ₹7,500 threshold), so 18% GST as currently
  coded is correct — but the GSTIN and the legal invoicing entity are still open (`OPEN_BUSINESS_DECISIONS.md` T-01..T-04, L-01..L-02).

---

## 2. Brand & positioning

### 2.1 Positioning statement

> **Villa 19** — a private holiday villa in Mangalore. Not a hotel. Not a resort.
> The whole house, the whole lawn, the whole time. Managed by **Habbaa**.

The distinction from a hotel is the product. Every piece of copy must reinforce exclusive use:
"the entire villa", "your own lawn", "no shared spaces", "no reception desk", "no other guests".

### 2.2 The "19" story

**KA-19** is Mangalore's vehicle registration code (Dakshina Kannada). Anyone who has driven the
coast knows the plate. The story writes itself and it is local, not manufactured:

> Every car that belongs to this coast carries KA 19. We borrowed the number.
> Villa 19 is our address in Mangalore, and now yours.

Use this once — a short, quiet block on the About/Story section. Do **not** repeat it on every page;
the charm dies on the second telling. It is also a natural OG-image and social hook.

### 2.3 Personality and voice

| Do | Don't |
|---|---|
| Warm, plain, confident sentences | Superlative stacking ("luxurious opulent premium") |
| Specifics: "1.5 km to the beach", "parking for four cars" | Vague resort-speak: "unparalleled coastal experience" |
| Address the group: "space to spread out", "everyone under one roof" | Address a generic "traveller" |
| Short paragraphs; the photographs carry the weight | Long descriptive prose competing with the images |

**Forbidden words** (enforce in review): *oceanfront, beachfront, pool, poolside, resort, chef,
five-star, world-class, nestled*. The first four are factually false for this property; the rest are
the generic register the brief explicitly rejects.

### 2.4 Habbaa's role

Habbaa appears in exactly four places: the header lockup ("Villa 19 · by Habbaa"), a short
**About Habbaa** section on the About page, the footer, and the legal/invoice entity. It never
competes with Villa 19 for attention. When property #2 arrives, Habbaa's footprint grows — a
`/habbaa` page and a `/stays` index — without touching Villa 19's pages.

---

## 3. Information architecture

### 3.1 Public routes

```
/                        Villa 19 homepage
/rooms                   All four bedrooms, overview grid
/rooms/[slug]            Individual bedroom page
/gallery                 Full gallery, category-filtered
/the-villa               Spaces: living, dining, kitchen, outdoor, parking + full amenity matrix
/experience              "The Villa 19 experience" — narrative, who it's for, a day here
/mangalore               Location guide: beaches, food, temples, shopping, day trips, map
/availability            Live calendar + rate chart + booking entry point
/book                    Checkout (dates → guests → details → payment)
/booking/[reference]     Post-payment confirmation + manage booking
/guest-information       Check-in/out, house rules, ID, parking, smoking, pets, events, kitchen, housekeeping
/faq                     FAQs (also embedded as an accordion on /guest-information)
/offers                  Seasonal offers and packages (admin-published)
/events                  Events & happenings at the villa (admin-published, dated)
/about                   The Villa 19 story (KA-19) + About Habbaa
/contact                 WhatsApp, phone, email, map, enquiry
/reviews                 Guest testimonials + outbound links to Google / Tripadvisor
/legal/terms
/legal/privacy
/legal/cancellation
/admin/*                 Operator CMS (noindex, auth-gated)
```

### 3.2 Multi-property readiness (D-03)

The mistake to avoid is hardcoding Villa 19 into the route tree. The structure that survives
property #2 without a migration:

```
src/
  app/
    (site)/                     ← public site, renders the "primary property"
      page.tsx                  ← homepage for PRIMARY_PROPERTY_SLUG
      rooms/…  gallery/…  etc.
    stays/[propertySlug]/       ← identical section tree, property-scoped (dormant at launch)
    admin/[propertySlug]/…      ← admin is property-scoped from day one
  lib/
    property-context.ts         ← resolves slug → property; `(site)` passes PRIMARY_PROPERTY_SLUG
```

Every data function already takes a `propertyId` — that part of the existing code is right. The work
is making the *route layer* pass it explicitly instead of `getProperty()` fetching a module-level
constant. When property #2 launches: seed the row, publish `/stays/<slug>`, add a `/stays` index,
and Villa 19 keeps its root URLs and its rankings. No redirects, no lost SEO.

`src/lib/data.ts` currently hardcodes `const PROPERTY_SLUG = 'coastal-haven-mangalore'`. That
constant moves to env (`PRIMARY_PROPERTY_SLUG`) and the slug is corrected to `villa-19`.

### 3.3 Navigation

**Desktop header** (sticky, transparent over hero, solid on scroll):
`Villa 19 · by Habbaa` (left) — `The Villa · Rooms · Gallery · Mangalore · Guest Info` — `Book Your Stay` (right, always visible, filled maroon).

**Mobile:** logo + a persistent `Book` pill; hamburger opens a full-screen sheet. A bottom sticky bar
carries `Book Your Stay` and a WhatsApp icon at all times below the fold. Keep the current
`MobileNav.tsx` pattern — it works — but restyle it.

Footer: four columns — Villa 19 (nav) · Stay (policies, FAQ, offers) · Habbaa (about, contact, other
properties) · Connect (WhatsApp, phone, email, Instagram, Google, Tripadvisor, OTA badges) + legal row.

---

## 4. Design system

### 4.1 Palette

The brief specifies off-white and maroon. The current code carries maroon `#562424` plus a gold and
a teal accent — three accents is one too many for the "minimal, lots of whitespace" brief. **The teal
goes.** Gold is demoted to a hairline/detail accent only.

```css
/* Ground */
--paper:        #FBF8F3;   /* page background — warm off-white, replaces #FFFCF0 */
--paper-sunk:   #F2EDE4;   /* recessed panels, image placeholders */
--surface:      #FFFFFF;   /* cards */

/* Brand */
--maroon:       #5A2626;   /* primary brand, headers, dark sections */
--maroon-deep:  #3C1717;   /* hover, footer */
--maroon-tint:  rgba(90,38,38,0.06);

/* Accent — used sparingly: rules, small caps, active states */
--brass:        #A87432;
--brass-light:  #C9944A;

/* Ink */
--ink:          #1A1208;   /* body */
--ink-muted:    #6E6257;   /* secondary — warm grey, replaces the cool #6B7A8A */
--ink-faint:    #9A8F84;

/* Functional only — never decorative */
--ok:           #2E7D5B;
--warn:         #A9701A;
--error:        #B3261E;
```

Contrast: `--ink` on `--paper` is ~14:1, `--ink-muted` on `--paper` ~5.3:1, white on `--maroon`
~10:1. All clear AA; the muted/paper pair clears AA for body text but **not** AAA, so do not use it
below 14px. `--brass` on `--paper` is ~4.0:1 — **fails AA for body text**; restrict it to large text,
icons, and borders, or darken to `#8A5E22` (~5.6:1) when it carries words. This is a real constraint
the current code violates in several places (11px brass eyebrows).

### 4.2 Typography

- **Display / headings:** an elegant serif. **Cormorant Garamond** (high contrast, coastal-elegant,
  excellent at 48px+) or **Fraunces** (more characterful, better at mid sizes). Recommend Cormorant
  Garamond for the hero and section titles.
- **Body / UI:** a clean humanist sans. **Inter** or **Söhne**-alike. Recommend **Inter** — already
  effectively what Geist gives us, but with better Indic-adjacent fallback coverage.
- Drop `Playfair_Display` (currently used italic-bold for the hero — it reads dated) and drop the
  bundled `Airwaves-ScriptOne.ttf` script face, which has no role in a minimal system.
- Load exactly two families, `display: swap`, subset `latin` + `latin-ext`. Two families, five
  weights total — every extra weight is ~15KB of render-blocking-adjacent cost.

Scale (fluid, `clamp()`):

| Token | Mobile → Desktop | Use |
|---|---|---|
| `display` | 40px → 84px | Hero only |
| `h1` | 32px → 56px | Page titles |
| `h2` | 26px → 38px | Section titles |
| `h3` | 20px → 24px | Card titles |
| `body-lg` | 17px → 19px | Lead paragraphs |
| `body` | 16px → 17px | Default — **never below 16px for body on mobile** |
| `caption` | 13px → 14px | Meta, captions |
| `eyebrow` | 12px, `.14em` tracking, uppercase | Section labels |

The current build uses `text-xs` (12px) for large amounts of body copy and form labels. That is too
small for a premium site and hurts both readability and mobile-Safari zoom behaviour. Raise it.

### 4.3 Layout, space and motion

- Content max-width **1280px**; editorial text columns capped at **68ch**.
- Spacing scale 4/8/12/16/24/32/48/64/96/128. Section rhythm: 96px mobile, 128–160px desktop.
  The brief asks for "lots of whitespace" — the current page runs at roughly half this.
- Radii: 2px on inputs/buttons (crisper, more editorial), 12px on cards, 0 on full-bleed images.
  The current 16–24px radii everywhere reads consumer-app, not premium-editorial.
- Shadows: almost none. Use `--paper-sunk` fills and hairline borders instead. One soft shadow is
  permitted, on the sticky booking bar.
- Motion: fade-and-rise 16px, 400ms, `cubic-bezier(.16,1,.3,1)`, once per element on scroll.
  Image hover: 1.03 scale over 600ms. **Everything wrapped in `prefers-reduced-motion`.**

### 4.4 Component inventory

Build these as real components in `src/components/`, not inline in pages — the current 500-line
`page.tsx` is the thing to stop repeating.

`ui/`: Button (primary/secondary/ghost/link), Input, Select, DateRangePicker, GuestCounter, Badge,
Accordion, Tabs, Dialog, Toast, Skeleton, Rule, Eyebrow.

`site/`: Header, MobileNavSheet, StickyBookBar, Footer, SectionHeading, FullBleedImage,
ImagePair, EditorialBlock, StatRow, QuoteBlock, MapEmbed, WhatsAppFab, OtaBadgeRow.

`property/`: HeroMedia, FeatureGrid, RoomCard, RoomDetail, AmenityMatrix, SpaceSection,
GalleryGrid, Lightbox, LocationGuide, DistanceList, ReviewCard, ReviewSummary, FaqAccordion,
PolicyTable, OfferCard, EventCard.

`booking/`: AvailabilityCalendar, RateChart, BookingWidget, PriceBreakdown, GuestDetailsForm,
PaymentStep, BookingConfirmation, EnquiryPanel.

`admin/`: DataTable, CalendarEditor, MediaManager, RichTextField, RateEditor, EntityForm, AuditTrail.

---

## 5. Page specifications

### 5.1 Homepage

Ordered exactly as the brief requests, with the section contract for each.

| # | Section | Contract |
|---|---|---|
| 1 | **Hero** | Full-viewport image or muted autoplay video. `Villa 19` in display serif, `A private stay in Mangalore` beneath, `Check Availability` as the single primary CTA. Video: ≤6s loop, ≤2MB, poster frame required, `playsinline muted loop preload="none"`, static image fallback on `prefers-reduced-motion` and on connections reporting `saveData`. The LCP element must be the poster image, not the video. |
| 2 | **Introduction** | 60–90 words. Whole-house framing, capacity, the lawn, the coast. One `Read the story` link to `/about`. |
| 3 | **Key features** | 6 tiles, icon + label + one line: 4 Bedrooms · Up to 12 Guests · Private Lawn · Parking for 4+ · Full Kitchen · Power Backup + Wi-Fi. No numbers not confirmed by §1.1 A-02. |
| 4 | **Rooms showcase** | Horizontal scroll on mobile, 2×2 grid on desktop. One image, name, bed config, occupancy per card → `/rooms/[slug]`. |
| 5 | **Living & dining** | Full-bleed image left, editorial text right; reverses on the next block. |
| 6 | **Outdoor** | Full-bleed lawn/balcony image with an overlaid caption. The strongest photograph on the site goes here or in the hero. |
| 7 | **The Villa 19 experience** | Narrative: mornings on the lawn, the drive to the beach, everyone under one roof. Three-panel layout, image-led. |
| 8 | **Mangalore** | Teaser: 4 distance chips + one map thumbnail → `/mangalore`. |
| 9 | **Gallery preview** | Asymmetric 5-image mosaic → `/gallery`. Reuse the current `GalleryModal` grid logic; restyle. |
| 10 | **Availability & rates** | Live 2-month calendar + a 12-month "from ₹X" rate chart. See §7.4. |
| 11 | **Reviews** | 3 testimonials + aggregate rating + outbound Google/Tripadvisor buttons. **Must be real** — see §5.9. |
| 12 | **Offers / events** | Renders only when the admin has published something current. Silently absent otherwise. |
| 13 | **Closing CTA** | Full-bleed dark maroon band. `Book Your Stay` + WhatsApp + phone. |

A sticky `Book Your Stay` bar appears once the hero scrolls out, on all breakpoints.

### 5.2 Property information (`/the-villa`)

Every field from the brief becomes a structured, admin-editable row — not prose:

Bedrooms · beds · guest capacity · bedroom configuration · bathrooms · living/lounge · dining ·
kitchen · outdoor/yard · private parking · AC · Wi-Fi · power backup · entertainment · housekeeping
and services · other amenities.

Rendered as an **amenity matrix** grouped by category, with a "what this place doesn't have" honesty
block (no pool, no chef, not beachfront). That block converts better than hiding the gaps, and it
prevents the review damage that comes from mismatched expectations.

**Schema work:** amenities are currently a hardcoded `MOCK_AMENITIES` array in `src/lib/mock-data.ts`
— and the internal notes record that a lint pass silently deleted three of the four Kitchen & Dining
items, which are still missing today. Amenities move to `property_amenities` (see §6).

### 5.3 Rooms (`/rooms`, `/rooms/[slug]`)

Index: 4 cards. Detail page per bedroom: image gallery (4–6 photos), bed configuration, max
occupancy, ensuite/shared bathroom detail, AC, 3–5 key features as chips, 40–60 words maximum, and
prev/next room navigation. Short and visual, as the brief requires.

Requires a `rooms.slug`, `rooms.description`, `rooms.features[]`, `rooms.bathroom_type` and
`rooms.has_ac` — none of which exist in the schema today (`src/types/index.ts` `Room` has no slug,
no description, no features, no AC flag).

### 5.4 Gallery (`/gallery`)

Categories exactly as briefed: **Villa exterior · Living room · Bedrooms · Bathrooms · Dining ·
Kitchen · Outdoor · Surroundings**.

The current `PropertyImage.category` union is `hero | exterior | bedroom | pool | dining | living` —
it has a **`pool` category for a villa with no pool**, and is missing bathroom, kitchen, outdoor and
surroundings. This union is corrected in both TypeScript and the DB CHECK constraint.

Implementation: masonry grid, `next/image` with `sizes` set per breakpoint, AVIF/WebP, blur
placeholders from a stored `blur_data_url` column, lazy below the fold, `priority` on the first two.
Lightbox: full-screen, keyboard (←/→/Esc), swipe, focus trap, `role="dialog"` + `aria-modal`,
counter, and a category filter. Preload neighbours ±1. The existing lightbox already does ESC and
arrows and scroll-lock — extend it rather than rewriting.

### 5.5 Mangalore (`/mangalore`)

Sections: why this is a good base · central location · parking · beaches · food & restaurants ·
temples & culture · shopping & city · nearby attractions · day trips · map.

Distances render from a `nearby_places` table (name, category, distance_km, travel_minutes, note) so
they are admin-editable. **Every distance ships as `TBC` until measured** — the current homepage
already asserts "~20 min" to the airport and "~15 min" to the city centre with no stated source. Do
not guess travel times on a page that also sells a booking.

### 5.6 Booking (`/availability`, `/book`)

- `Book Your Stay` present in the header, the sticky bar, the closing band, and every section CTA.
- Check-in/check-out via a real date-range calendar showing blocked, booked and minimum-stay dates —
  not the two bare `<input type="date">` fields the current widget uses.
- Guest counter with adults/children/infants and live max-occupancy enforcement.
- Transparent price breakdown before any payment step: per-night rate, extra guests, GST, total.
- "From ₹X per night" shown wherever a rate is teased.
- Direct booking is the primary path; WhatsApp and phone sit beside it, never instead of it.
- No long enquiry form. Four fields at checkout: name, mobile, email, optional requests. That is
  what the current form collects, which is correct — keep it.

### 5.7 Guest information (`/guest-information`)

Check-in/check-out times · house rules · cancellation policy · guest capacity · ID requirements ·
parking · smoking · pets · events and parties · kitchen usage · housekeeping · FAQs.

All of it moves from the hardcoded arrays in `page.tsx` into `property_policies` and `faqs` tables.

> **Not carried out, for policies.** The `faqs` half shipped. The `property_policies` half did not:
> rows were seeded and several migrations updated them, but no reader was ever built, in this app or
> in Ooruda (verified 2026-10-25). The cancellation tiers and house rules are still TypeScript
> constants, and that is now the intended design. Treat this paragraph as history, not as a plan.
Today the cancellation windows (14/7 days), the house rules and all seven FAQs are literal strings in
the page component — the operator cannot change a refund window without a deploy, which for a legally
binding policy is unacceptable.

### 5.8 Habbaa (`/about`)

The Villa 19 story (KA-19), then a short **About Habbaa** block: who operates the villa, the standard
of care, contact. Structured so a `/stays` index and a `/habbaa` page can be added later without
restructuring.

### 5.9 Reviews — a hard constraint

`src/app/page.tsx` currently ships **three fabricated testimonials** with named people, cities, dates
and a "Verified Stay" badge, and computes an aggregate rating from them. One of them is dated
"Auguest 2026". These must be removed before launch. Publishing invented reviews with verification
badges is a consumer-protection problem, not a copy problem, and `AggregateRating` schema built on
them would be structured-data spam that risks a manual action from Google.

Replacement path: (a) collect real reviews from actual stays via the post-stay email, moderated
through the existing `reviews` table which already has `is_approved`; (b) until there are ≥3 real
ones, the homepage shows outbound Google/Tripadvisor buttons and no testimonial block; (c) emit
`AggregateRating` **only** when backed by real, on-site, moderated reviews.

---

## 6. Content model

### 6.1 Existing tables (keep)

`properties` · `rooms` · `property_images` · `pricing_rules` · `blocked_dates` · `bookings` ·
`payments` · `addon_services` · `profiles` · `reviews` · `audit_logs` · `notification_templates`

### 6.2 New tables

| Table | Purpose |
|---|---|
| `property_amenities` | category, label, icon, is_available, display_order — replaces `MOCK_AMENITIES` |
| `property_policies` | key, title, body, category (rules/cancellation/checkin/id/pets/smoking/events/kitchen/housekeeping) |
| `faqs` | question, answer, category, display_order, is_published |
| `nearby_places` | name, category, distance_km, travel_minutes, note, display_order |
| `offers` | title, slug, body, image, valid_from, valid_to, discount_type/value, is_published |
| `events` | title, slug, body, image, event_date, is_published — the brief's "events and calendar" |
| `page_sections` | Editable homepage/section copy keyed by `page` + `section_key` |
| `channel_sync_log` | Every push/pull to the channel manager, with payload and outcome (§7) |
| `external_reservations` | OTA reservations pulled from the channel manager, mapped onto our calendar |
| `enquiries` | Contact-form and WhatsApp-initiated enquiries |

### 6.3 Schema corrections to existing tables

- `property_images.category` — drop `pool`, add `bathroom`, `kitchen`, `outdoor`, `surroundings`.
  Add `blur_data_url`, `width`, `height`, `caption`, `room_id` (exists in the TS type, confirm in DB).
- `rooms` — add `slug`, `description`, `features TEXT[]`, `bathroom_type`, `has_ac`, `size_sqft`.
- `properties` — add `descriptor` ('by Habbaa'), `bathroom_count`, `bedroom_count`, `parking_spaces`,
  `has_power_backup`, `has_wifi`, `google_place_id`, `ota_links JSONB`, `review_links JSONB`.
- `bookings` — add `source` ('direct' | 'booking_com' | 'airbnb' | 'mmt' | 'goibibo' | 'agoda' |
  'manual'), `channel_reservation_id`, `expires_at` (for the unpaid-hold sweeper).
- `property_images` storage moves from Unsplash URLs to **Supabase Storage** with a signed-upload
  path from the admin. `next.config.ts` `remotePatterns` currently only allows
  `images.unsplash.com` — it must be updated or every real photo 404s through the optimizer.

### 6.4 Row Level Security — mandatory

Currently **no RLS exists on any table in `00001`**, while `00004_grants.sql` grants
`SELECT ON bookings TO authenticated` and `INSERT ON bookings, payments TO anon`. Combined, that
means any account can read every guest's name, email, phone and amount, and an anonymous caller can
insert bookings at arbitrary prices or fill the calendar with `pending` rows through PostgREST.

Migration `00006_rls.sql` must:
- Enable RLS on every table in `00001`.
- **Revoke** `INSERT ON bookings, payments FROM anon, authenticated` — booking creation goes only
  through `create_booking_atomic` (`SECURITY DEFINER`, called with the service role).
- Restrict `SELECT ON bookings` to `auth.uid() = user_id` (add `bookings.user_id`) plus an admin role.
- Public read on `properties/rooms/property_images/pricing_rules/blocked_dates/addon_services/
  amenities/policies/faqs/nearby_places` filtered to `is_active`/`is_published`.
- Admin-role policies via a `profiles.role` claim, for every write path.

---

## 7. Booking & availability architecture

### 7.1 The consequence of choosing a channel manager

With Booking.com, MMT/Goibibo, Airbnb and Agoda selling the same four bedrooms, **our database can no
longer be the source of truth for availability**. A channel manager (CM) becomes the master calendar;
our site becomes one more connected channel.

This inverts the current design, in which `create_booking_atomic` treats our `bookings` table as
authoritative. That function is still correct and still needed — it just now guards a *cache*, and a
second guard is required against the CM.

### 7.2 Vendor selection — needs verification before committing

| Vendor | Notes |
|---|---|
| **Beds24** | Cheapest, genuinely good REST API and webhooks, strong Booking.com/Airbnb/Agoda coverage. MMT/Goibibo connectivity is the open question. |
| **STAAH** | India-first, well-established MMT/Goibibo connectivity, used widely by Indian villas and boutique properties. |
| **eZee (Yanolja)** | India-first, broad Indian OTA coverage, heavier product than a 4-bedroom villa needs. |
| **Hostaway** | Best-in-class for vacation rentals, strongest API, most expensive; Indian OTA coverage is the weak point. |

**Recommendation:** shortlist **STAAH** and **Beds24**, and make the decision on one question —
*does it have a live, two-way MMT and Goibibo connection, and does it expose an API with webhooks?*
Both matter: MMT/Goibibo are where Indian domestic villa demand actually is, and without webhooks we
are stuck polling. I have not verified current pricing or connector lists for any of these; treat
this table as a shortlist to validate in a demo call, not as a finding.

**Decision required before Phase 3 begins.** It does not block Phases 0–2.

### 7.3 Sync design

```
                    ┌──────────────────────┐
   Booking.com ─────┤                      │
   MMT / Goibibo ───┤   Channel Manager    │◄──── master calendar + rates
   Airbnb ──────────┤   (STAAH / Beds24)   │
   Agoda ───────────┤                      │
                    └──────┬───────────▲───┘
                  webhook  │           │  push reservation
                  + poll   ▼           │
                    ┌──────────────────┴───┐
                    │ villa19.in (Supabase)│
                    │  availability cache  │
                    └──────────────────────┘
```

**Inbound** — CM webhook on reservation/cancellation → upsert into `external_reservations` →
recompute the availability cache. Plus a 15-minute reconciliation poll as a safety net, because
webhooks get dropped and this is money.

**Outbound** — on a confirmed direct booking, push the reservation to the CM immediately and record
the result in `channel_sync_log`. Retry with exponential backoff; alert the operator on final failure.

**The oversell window.** Between a guest starting checkout and the CM confirming our push, another
channel can sell the same dates. Mitigations, in order:

1. Re-check availability against the **CM API** (not our cache) at the moment the Razorpay order is
   created — the last possible instant before money moves.
2. Keep the hold window tight: `bookings.expires_at = now() + 15 minutes` for unpaid holds, swept by
   `pg_cron`.
3. If the CM rejects the push after a successful capture, **auto-refund in full within the hour** and
   alert the operator by email and WhatsApp. Write this into the T&Cs as the documented remedy.
4. Log every oversell to `channel_sync_log` and review weekly.

There is no way to make this window zero without the CM owning our checkout too. A 15-minute hold
plus a pre-payment re-check reduces it to a genuinely rare event; the refund policy handles the rest.

### 7.4 The public availability calendar and rate chart

The brief asks for a **live availability calendar and pricing chart visible on the homepage**. Design
notes that matter:

- Serve from a **materialised availability cache** (`property_id, date, is_available, rate_paise,
  min_stay`), refreshed on sync. Never query `bookings` + `blocked_dates` + `external_reservations`
  live per page view — that is three joins on every homepage render.
- Cache the endpoint at the edge for 60s with `stale-while-revalidate`. Availability that is 60
  seconds stale is fine; a slow homepage is not.
- The rate chart shows **"from ₹X"** per month across 12 months, derived from `pricing_rules` and the
  base/weekend rates. It is a teaser, not a quote — the authoritative price only ever comes from the
  server-side `calculateBookingPrice`.
- Show blocked and minimum-stay dates visually. Nothing frustrates like picking dates that silently fail.

### 7.5 Payment flow — corrected

The current flow is broken end to end. The corrected sequence:

```
1. Guest submits dates + guests + details on /book
2. POST /api/bookings/create-order
   a. Re-validate everything server-side (never trust client amounts) ✅ already correct
   b. Re-check availability against the CM API                        ← NEW
   c. create_booking_atomic() → booking (status=pending, expires_at=+15m) ✅ exists
   d. Razorpay order created                                          ✅ exists
   e. INSERT payments row (booking_id, razorpay_order_id, status='created')  ← MISSING TODAY
3. Client opens Razorpay Checkout with the returned order_id          ← MISSING TODAY
4. Razorpay webhook → verify HMAC ✅ → payments.status='captured'
   → bookings.status='confirmed' → push to CM → send confirmation email
5. Redirect to /booking/[reference] which reads real state from the DB ← NOT a client-side flag
```

Three defects this closes:

- **`/book` fakes success.** `handlePayment` creates the order then immediately sets `isSuccess`,
  rendering "Payment Verified", "Booking Confirmed!", "Total Paid ₹X" and "A confirmation receipt has
  been sent" — none of which happened. Razorpay Checkout is never opened. This must be fixed before
  anything is shown to a real guest.
- **No `payments` row is ever inserted**, so the webhook's `.eq('razorpay_order_id', orderId)`
  matches zero rows and no booking can ever legitimately become `confirmed`.
- **`create-order` invents a reference on DB failure** — `bookingReference = 'MNG-' + random` with
  only a `console.warn`. A guest can be handed a booking reference for a booking that does not exist.
  On DB failure the correct behaviour is a 503 and no order.

Also: `/book` computes its price from `MOCK_MANGALORE_VILLA` with an empty pricing-rules array, so
the price the guest sees can differ from the server's. It must render the breakdown the server
returns. And its property id `'v101-mangalore-coastal'` is not a UUID and will not match any DB row.

### 7.6 Additional booking work

- Booking reference format `V19-YYMM-XXX` (currently `MNG-XXXXXX` in `00002`).
- `pg_cron` sweeper: expire unpaid `pending` bookings past `expires_at`.
- Confirmation email via Resend; admin notification on every booking.
- Refunds: Razorpay refund API + a `refunds` table + the `refund.processed` webhook branch, which is
  currently a `TODO` that only logs.
- Rate-limit `/api/bookings/create-order` and `/api/availability` (Upstash or Vercel KV).
- `/api/availability` is currently **dead code — nothing in the app calls it**. It becomes the
  calendar's data source.

---

## 8. Admin CMS (D-06)

`/admin` today is a **fully mocked client component** — `MOCK_BOOKINGS`, blocked dates in
`useState`, nothing persisted, no server data. It is a UI sketch, and should be treated as one.

Scope, in build order:

**Content:** property fields · rooms (CRUD, slug, features) · images (drag-drop upload to Supabase
Storage, reorder, categorise, alt text, blur generation) · amenities · policies · FAQs · nearby
places · homepage section copy · offers · events.

**Commercial:** base/weekend rates · seasonal rules · minimum stay · extra-guest charge · taxes ·
add-on services · **push rate changes to the CM**.

**Operations:** availability calendar (block/unblock, see OTA reservations inline) · bookings list
with filters · booking detail · manual booking · cancel + refund · mark offline payment · guest
registry with ID status · enquiries inbox · channel sync log with retry.

**Platform:** roles (Super Admin / Property Admin / Ops Staff — Ops must not see financials, per the
PRD persona) · audit log viewer · media library.

**Security fix:** `middleware.ts` guards an explicit *allowlist* (`ADMIN_ROUTES = ['/admin/dashboard',
'/admin/bookings', '/admin/property', '/admin/calendar']`) while the matcher covers `/admin/:path*`.
Any admin route not on that list — every new one in this section — is **public by default**. Invert
it: protect everything under `/admin` except `/admin/login`. It also short-circuits and allows the
request through entirely when Supabase env vars are absent, which is a dev convenience that must not
reach production.

---

## 9. SEO

### 9.1 Target phrases → page mapping

| Phrase | Primary page |
|---|---|
| villa in Mangalore | `/` |
| private villa in Mangalore | `/` |
| holiday villa Mangalore | `/` (H2), `/experience` |
| family villa Mangalore | `/experience` |
| villa for groups in Mangalore | `/experience`, `/rooms` |
| holiday home Mangalore | `/about` |

Naturally placed. No phrase repeated more than twice on a page, none in a sentence that reads like it
was written for a crawler.

### 9.2 Metadata

`layout.tsx` metadata is currently **wrong and harmful**: title "Coastal Haven Private Villa —
Mangalore" (dead brand), description advertising a **"Private pool"** the property does not have, and
keywords including `private pool villa mangalore` and `beach villa karnataka`. Selling a pool the
villa lacks is the single fastest route to one-star reviews and chargebacks. Rewrite:

```
title.default:  "Villa 19 — A Private Holiday Villa in Mangalore"
title.template: "%s | Villa 19"
description:    "Villa 19 is a private 4-bedroom holiday villa in Mangalore, Karnataka.
                 The whole house for up to 12 guests — private lawn, full kitchen,
                 parking for four. Managed by Habbaa. Book direct."
```

Per-page titles and descriptions for all 15 public routes, unique, 50–60 / 140–160 chars.
Canonicals on every page. `alternates.canonical` + `metadataBase` from `APP_URL`.

### 9.3 Structured data

`LodgingBusiness` (name, description, address, geo, image[], amenityFeature, numberOfRooms,
petsAllowed, checkinTime, checkoutTime, priceRange, telephone, sameAs → Instagram/Google/Tripadvisor/
OTA listings) · `BreadcrumbList` · `FAQPage` on `/faq` · `ImageObject` on gallery ·
`Offer` on `/offers` · `Event` on `/events` · `AggregateRating` **only once real reviews exist** (§5.9).

### 9.4 Technical SEO

- `sitemap.ts` currently lists **two URLs** (`/` and `/book`) — it must be generated from the route
  tree plus dynamic room/offer/event slugs.
- `robots.ts` already disallows `/admin/` and `/api/` — correct. Both files read `process.env.APP_URL`
  and fall back to **`https://villamangalore.com`**, which is not the domain. Fix the fallback to
  `https://villa19.in` and set `APP_URL` in Vercel.
- **Env var mismatch:** `.env.example` documents `NEXT_PUBLIC_APP_URL` and
  `NEXT_PUBLIC_PROPERTY_WHATSAPP`; the code reads `APP_URL` and `PROPERTY_WHATSAPP`. `.env.local` uses
  the code's names. Anyone deploying from `.env.example` gets the wrong domain in the sitemap and the
  **placeholder WhatsApp number `919876543210`** on every CTA. Reconcile the names and document one set.
- OG image: a designed 1200×630 (static, per-page for key routes).
- Google Business Profile: claim, link `sameAs`, embed reviews, keep NAP identical to the footer.
- Search Console + Bing Webmaster: verify, submit sitemap, monitor.
- Alt text on every image, written by a human, describing the actual room — sourced from
  `property_images.alt_text`, which already exists in the schema and is currently Unsplash-generic.

---

## 10. Performance

Targets (mobile, 4G, p75): **LCP < 2.0s · INP < 200ms · CLS < 0.05 · TTFB < 600ms**.
These are tighter than the PRD's 2.5s LCP because this is a photography-led site — if images are the
product, image delivery is the product.

- `next/image` everywhere with explicit `sizes`; AVIF then WebP (already configured in
  `next.config.ts`); `priority` only on the hero.
- Source photography at 3000px longest edge; ship 640/960/1280/1920/2560 variants.
  Budget: hero ≤200KB AVIF, gallery thumbs ≤60KB, full-screen ≤300KB.
- `blur_data_url` on every image row; explicit width/height to hold layout (CLS).
- Gallery paginates at 24 images with an intersection-observer load-more.
- Static-render every marketing page; ISR at 1h; only `/availability`, `/book` and `/admin` are dynamic.
- Two font families, `display: swap`, preload the display face only.
- Route-level code splitting; the lightbox, date picker and Razorpay SDK all lazy-loaded.
- JS budget: **< 120KB gzipped** on first load for marketing routes.
- Lighthouse CI in the pipeline with a hard gate at 90 performance / 95 SEO / 95 a11y.
- Hero video (if used) never blocks LCP: poster image is the LCP element, video `preload="none"`.

---

## 11. Accessibility (WCAG 2.2 AA)

- Semantic landmarks, one `h1` per page, ordered headings.
- Full keyboard path through the booking flow, including the date picker and guest counter.
- Lightbox: focus trap, `Esc`, restore focus to the trigger, announce position.
- Calendar: `role="grid"`, arrow-key navigation, `aria-disabled` on unavailable dates, live region on
  selection.
- Visible focus rings — 2px brass at 3:1 against both `--paper` and `--maroon`.
- Touch targets ≥44×44 (the current 12px text buttons fail this).
- `prefers-reduced-motion` respected everywhere, including the hero video.
- Contrast verified per §4.1; the brass-on-paper combination fixed at small sizes.
- Forms: labels bound, errors in text not colour alone, `aria-describedby` and `aria-invalid`.
- Test with VoiceOver/Safari and NVDA/Chrome, plus axe in CI.

---

## 12. Integrations

| Integration | Approach |
|---|---|
| **GTM / GA4** | GTM container via `@next/third-parties`, loaded after interactive. Events: `view_hero`, `check_availability`, `select_dates`, `begin_checkout`, `purchase` (with value + reference), `whatsapp_click`, `call_click`, `gallery_open`, `ota_click`. Consent Mode v2 default-denied. |
| **WhatsApp** | `wa.me` deep link with a context-aware prefilled message (page + selected dates). Floating FAB + inline CTAs. **The number is currently the placeholder `919876543210`** — real number required. |
| **Social** | Instagram primary. Footer icons. `sameAs` in schema. |
| **Reviews** | Outbound Google + Tripadvisor buttons; Google Place ID stored on the property. |
| **OTA badges** | Booking.com / MMT / Goibibo / Airbnb / Agoda logos in the footer as trust signals, linking to the live listings. Deliberately *below* the direct-booking CTA — they are proof, not a conversion path. |
| **Email** | Resend. Templates: booking confirmation, payment receipt, cancellation, pre-arrival (48h), post-stay review request, admin new-booking alert. |
| **Maps** | Google Maps embed on `/mangalore` and `/contact`, lazy-loaded behind a click-to-load facade (a raw embed costs ~900KB and leaks a cookie before consent). |
| **Error tracking** | Sentry on both runtimes; source maps uploaded; PII scrubbed. |

---

## 13. Security, legal and compliance

- RLS on every table (§6.4) — **the top security item in this plan.**
- Middleware default-deny on `/admin` (§8).
- All money in integer paise; never floats. The existing `pricing-engine.ts` does this correctly and
  is unit-tested — protect that property in review.
- Server-side price calculation only; client amounts never trusted. Already correct in `create-order`.
- Razorpay HMAC verification on every webhook — already correct; never relax it.
- `SUPABASE_SERVICE_ROLE_KEY` and `RAZORPAY_KEY_SECRET` server-only.
- Rate limiting on booking, availability and auth endpoints.
- CSP, HSTS, plus the four headers already in `next.config.ts`.
- **Legal pages required before launch:** Terms, Privacy, Cancellation/Refund. India's DPDP Act 2023
  applies — publish a privacy notice, name a grievance contact, collect explicit consent for
  marketing email, and support deletion requests.
- GST: 18% is coded and correct for this rate band, but the **GSTIN and invoicing entity are still
  open** (`OPEN_BUSINESS_DECISIONS.md` T-01…T-04, L-01…L-02). Tax invoices cannot be issued without them.
- Guest ID: mandatory at check-in under Karnataka rules. Collect at check-in, record in the guest
  registry. **Do not accept ID uploads over WhatsApp** (as the old internal notes proposed) — that
  puts Aadhaar images in a third-party consumer chat with no retention control. Use a signed-upload
  link to private Supabase Storage with a defined retention period, or paper at check-in only.
- PCI: card data never touches our servers — Razorpay Checkout only, no custom card fields.

---

## 14. Testing

| Layer | Coverage |
|---|---|
| Unit (Vitest) | Pricing engine (exists — extend for seasonal overlap, min-stay, extra-guest, GST rounding), availability math, date utils, reference generation |
| Integration | `create-order` (validation, availability, atomic insert, payments row), webhook (valid/invalid/replayed signature, all event types), CM sync push/pull/retry |
| **Concurrency** | Two simultaneous bookings for the same dates → exactly one succeeds. Load-test `create_booking_atomic` under 50 parallel requests. Non-negotiable before launch. |
| Channel | Simulated OTA reservation during checkout → oversell path → auto-refund fires |
| E2E (Playwright) | Full booking flow with Razorpay test mode; admin login → block dates → verify guest-side; gallery keyboard nav; mobile viewport |
| Visual regression | Homepage, rooms, gallery at 375 / 768 / 1440 |
| A11y | axe-core in CI + manual screen-reader pass on the booking flow |
| Performance | Lighthouse CI gate on every PR |
| Devices | iOS Safari 17+ (iPhone SE, 15, 15 Pro Max), Android Chrome (Pixel, Samsung mid-range), iPad, Chrome/Safari/Firefox/Edge desktop |
| Payments | Razorpay test cards: success, failure, timeout, webhook replay, refund |

---

## 15. Delivery roadmap

### Phase 0 — Stop the bleeding (3–4 days) — *blocks everything*

1. Fix `/book`: open Razorpay Checkout; remove the fake "Payment Verified" state.
2. Insert the `payments` row in `create-order`; make the webhook path actually confirm bookings.
3. Remove the fake-booking-reference fallback; fail closed with a 503.
4. `00006_rls.sql`: RLS on all tables, revoke `anon` INSERT on `bookings`/`payments`.
5. Middleware: default-deny `/admin`; remove the missing-env bypass in production.
6. Remove the three fabricated testimonials and the rating derived from them.
7. Fix `layout.tsx` metadata — no pool, correct brand.
8. Reconcile the env var names; set the real WhatsApp number and `APP_URL`.
9. Restore the amenity items the linter deleted; add a lint rule or test so it cannot recur.

### Phase 1 — Foundation (1.5 weeks)
Design system and tokens · component library · fonts · property-scoped routing (§3.2) ·
schema migrations (§6.2, §6.3) · Supabase Storage + `next.config.ts` remote patterns ·
seed real content · content-model admin scaffolding.

### Phase 2 — Public site (3 weeks)
Homepage (all 13 sections) · `/the-villa` · `/rooms` + detail · `/gallery` + lightbox ·
`/mangalore` · `/experience` · `/guest-information` · `/faq` · `/about` · `/contact` · `/reviews` ·
legal pages · full SEO layer · analytics · performance pass.

### Phase 3 — Booking & channel (2.5 weeks)
CM vendor decision and contract · sync service (webhook + poll + push) · availability cache ·
public calendar + rate chart · date-range picker · corrected checkout · confirmation page ·
email templates · expiry sweeper · refunds · rate limiting.

### Phase 4 — Admin CMS (2.5 weeks)
Replace the mock dashboard with real data · media manager · content editors · rate editor ·
calendar editor · bookings and guest registry · enquiries · roles · audit log · sync log.

### Phase 5 — Hardening & launch (1.5 weeks)
Concurrency and load testing · E2E · a11y audit · Lighthouse gate · security review ·
Search Console + GBP · staging UAT with the operator · soft launch · monitoring.

**Total: ~11 weeks of build**, assuming photography lands by the end of Phase 1 and the CM decision
by the start of Phase 3. Phases 2 and 4 can partially overlap with a second developer.

---

## 16. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Photography slips** | The entire design premise fails; stock photos are explicitly out of scope | Book the shoot in week 1. It is the critical path, not a Phase 5 detail. Brief the photographer on the eight gallery categories. |
| **Channel-manager oversell** | Double booking, refund, reputation | §7.3: pre-payment re-check, 15-min hold, auto-refund, weekly log review |
| **CM lacks MMT/Goibibo** | Largest Indian demand channel unmanaged | Validate connectivity *before* signing (§7.2) |
| **Launching with the current `/book`** | Guests told they paid when they did not | Phase 0 gate; no staging URL shared until closed |
| **Open business decisions unresolved** | Cannot issue tax invoices or publish a binding cancellation policy | `OPEN_BUSINESS_DECISIONS.md` items T-*, L-*, C-* are launch blockers — see §17 |
| **Direct bookings cannibalised by OTAs** | 15–18% commission on volume that could have been direct | Best-rate guarantee on direct, direct-only perks, OTA badges below the fold |
| **Lint pass silently deletes content** | Already happened once — three amenities are missing today | Content moves to the DB in Phase 1; add a snapshot test in the interim |
| **Single-property assumptions harden** | Expensive rewrite for property #2 | §3.2 route structure enforced from day one, reviewed at each phase gate |

---

## 17. What I need from you

### Launch blockers (cannot ship without)
1. **Real photography** — 60–80 images across the eight gallery categories.
2. **WhatsApp Business number** and the public phone number.
3. **Confirmed cancellation policy** — the 14/7-day windows currently coded are placeholders.
4. **GSTIN + legal entity + registered address** for invoices.
5. **Razorpay live credentials** (KYC-completed account).
6. **Channel manager decision** (§7.2) — before Phase 3.
7. **Terms, Privacy and Refund policy** — drafted, legally reviewed.
8. **villa19.in DNS access.**

### Content inputs
9. Confirm the property facts in §1.1 A-02 are still accurate.
10. Actual distances and travel times for `/mangalore` — measured, not estimated.
11. Live OTA listing URLs (Booking.com, MMT, Goibibo, Airbnb, Agoda) + Google Business Profile and
    Tripadvisor links.
12. Bathroom count and per-room bathroom/AC detail — not currently captured anywhere.
13. Instagram handle.
14. Any real reviews already collected on OTAs that we can quote **with attribution to the platform**.

### Worth deciding early
15. **Hero: video or stills?** Video needs a separate shoot and a ~2MB budget. Stills are safer and
    faster; a well-shot still hero outperforms a mediocre video every time.
16. **Events page** — is this "events you can host here" (weddings, birthdays) or "things happening in
    Mangalore"? The brief is ambiguous and they are different features. My read: hostable events,
    which is also the higher-value one commercially.
17. **Best-rate guarantee on direct booking?** The strongest lever you have against OTA commission.
18. Are Villa 19's four bedrooms ever sold **individually** on OTAs, or always as a whole villa?
    This materially changes the channel-manager configuration and the availability model.

---

## Appendix A — Requirement traceability

Every bullet from the brief, its current state, and where this plan handles it.
**Status:** ✅ done · 🟡 partial / needs rework · 🔴 not started · ⛔️ actively wrong today

| Brief requirement | Status | Handled in |
|---|---|---|
| **Brand & positioning** | | |
| Brand name "Villa 19" | 🟡 in `page.tsx`, but `layout.tsx` + `data.ts` slug still say Coastal Haven | §2, Phase 0 |
| Descriptor "by Habbaa" | ✅ header/footer lockup exists | §2.4 |
| Private villa, not hotel/resort | 🟡 copy still reads like an OTA listing | §2.1, §2.3 |
| Modern, relaxed, premium-approachable | 🔴 | §2.3, §4 |
| Privacy, comfort, space, staying together | 🔴 | §2.3, §5.1 |
| 19 ↔ Mangalore / KA-19 story | 🔴 | §2.2, §5.8 |
| **Booking platforms** | | |
| Booking.com, MMT/Goibibo, Airbnb, Agoda | 🔴 | §7, §12 (OTA badges) |
| Review links — Tripadvisor, Google | 🔴 | §5.9, §12 |
| **Visual design** | | |
| Contemporary, elegant, minimal | 🔴 current build is dense and card-heavy | §4 |
| Photography-led, large imagery | 🔴 | §4.3, §5.1 |
| Warm, natural, coastal/tropical | 🟡 warm base, but a cool grey + teal fight it | §4.1 |
| Off-white + maroon | 🟡 maroon present; teal must go | §4.1 |
| Elegant serif + clean sans | 🟡 Playfair italic-bold reads dated | §4.2 |
| Lots of whitespace, no clutter | ⛔️ ~half the needed rhythm | §4.3 |
| No generic hotel imagery / stock | ⛔️ 12 Unsplash placeholders | §6.3, §16 |
| Mobile-first, fully responsive | 🟡 responsive, but 12px body copy and sub-44px targets | §4.2, §11 |
| **Homepage** | | |
| Full-screen hero image/video | 🔴 current hero is a boxed gallery grid | §5.1 (1) |
| "Villa 19 — A private stay in Mangalore" | 🔴 | §5.1 (1) |
| Prominent Check Availability / Book Now | 🟡 widget only; no persistent CTA | §3.3, §5.1 |
| Short introduction | 🟡 | §5.1 (2) |
| Key features overview | 🟡 4 tiles | §5.1 (3) |
| Rooms/bedrooms showcase | 🟡 text cards, no photos | §5.1 (4), §5.3 |
| Living/dining spaces | 🔴 | §5.1 (5) |
| Outdoor areas | 🔴 | §5.1 (6) |
| "The Villa 19 experience" | 🔴 | §5.1 (7) |
| Mangalore/location section | 🟡 map is a placeholder; distances unverified | §5.1 (8), §5.5 |
| Gallery preview | ✅ 5-image mosaic exists | §5.1 (9) |
| Guest reviews | ⛔️ three fabricated testimonials | §5.9 |
| Strong booking CTA near bottom | 🔴 | §5.1 (13) |
| Events & calendar, admin-publishable | 🔴 | §6.2 `events`, §8 |
| Live availability calendar + pricing chart | 🔴 no calendar exists anywhere | §7.4 |
| **Property information** | | |
| Bedrooms, beds, capacity, configuration | 🟡 in `rooms`; no bathroom or AC fields | §5.2, §6.3 |
| Bathrooms | 🔴 only an ensuite boolean | §6.3, §17 (12) |
| Living / dining / kitchen | 🔴 | §5.2 |
| Outdoor / yard | 🟡 amenity line only | §5.2 |
| Private parking | ✅ amenity | §5.2 |
| AC / Wi-Fi / power backup | ✅ amenities | §5.2 |
| Entertainment facilities | ✅ amenity | §5.2 |
| Housekeeping / services | 🟡 caretaker only | §5.2, §6.2 |
| **Rooms** | | |
| Page/section per bedroom | 🔴 | §5.3 |
| High-quality photos per room | 🔴 `room_id` unused | §5.3, §6.3 |
| Bed config, max occupancy | ✅ | §5.3 |
| Bathroom info, AC, key features | 🔴 | §6.3 |
| Short, visual descriptions | 🔴 no `description` field | §6.3 |
| **Gallery** | | |
| Dedicated gallery page | 🔴 modal only | §5.4 |
| Eight categories | ⛔️ has `pool`; missing 4 | §5.4, §6.3 |
| Large, fast-loading images | 🟡 next/image, but remote Unsplash | §10 |
| Lightbox / full-screen | ✅ with ESC + arrows | §5.4 |
| Optimised sizes, quality kept | 🟡 AVIF/WebP on; no responsive variants or blur | §10 |
| **Location** | | |
| Why Villa 19 is a good base | 🔴 | §5.5 |
| Central location / parking / beaches | 🟡 distance chips, unverified | §5.5 |
| Food, temples, shopping, attractions, day trips | 🔴 | §5.5, §6.2 |
| Google Maps integration | ⛔️ grey placeholder box | §5.5, §12 |
| Real distances/travel times | ⛔️ asserted without source | §5.5, §17 (10) |
| **Booking** | | |
| Prominent Book Your Stay throughout | 🔴 | §3.3, §5.6 |
| Check-in/out dates | 🟡 bare date inputs | §5.6, §7.4 |
| Number of guests | ✅ | §5.6 |
| Availability | ⛔️ API exists but is dead code | §7.4 |
| Pricing / "starting from" | 🟡 widget only | §7.4 |
| Direct booking / enquiry | ⛔️ checkout fakes success | §7.5, Phase 0 |
| WhatsApp enquiry | 🟡 works, placeholder number | §12 |
| Phone/contact | 🟡 `tel:` uses the WhatsApp number | §12 |
| Proper booking engine later | 🟡 70% built | §7 |
| No complicated enquiry form | ✅ four fields | §5.6 |
| **Guest information** | | |
| Check-in/out timings | ✅ from DB | §5.7 |
| House rules | 🟡 hardcoded in `page.tsx` | §5.7, §6.2 |
| Cancellation policy | 🟡 hardcoded — legally binding text in a component | §5.7, §6.2 |
| Guest capacity | ✅ | §5.7 |
| ID requirements | 🟡 FAQ text only | §5.7, §13 |
| Parking / smoking / pets / events | 🟡 one-line rules | §5.7, §6.2 |
| Kitchen usage / housekeeping | 🟡 FAQ only | §5.7 |
| FAQs | 🟡 7, hardcoded | §5.7, §6.2 |
| **Habbaa integration** | | |
| Villa 19 primary | ✅ | §2 |
| "by Habbaa" visible | ✅ | §2.4 |
| About Habbaa section | 🔴 | §5.8 |
| Future-proof for more properties | ⛔️ single-property hardcoded slug | §3.2 |
| Master-domain structure | 🔴 | §3.1, §3.2 |
| **SEO** | | |
| Six target phrases | ⛔️ targets "private pool villa" | §9.1, §9.2 |
| Page titles & meta descriptions | ⛔️ wrong brand, advertises a pool | §9.2 |
| Accommodation / local-business schema | 🔴 none | §9.3 |
| Image alt text | 🟡 present but Unsplash-generic | §9.4 |
| Page speed / Core Web Vitals | 🟡 untested | §10 |
| Google Business Profile | 🔴 | §9.4 |
| Sitemap + Search Console | 🟡 2-URL sitemap, wrong fallback domain | §9.4 |
| **Tech** | | |
| Fast-loading | 🟡 | §10 |
| SSL | ✅ Vercel | — |
| Fully responsive | 🟡 | §4, §11 |
| Chrome / Safari / mobile | 🟡 untested | §14 |
| CMS: photos, prices, availability, info, offers | ⛔️ admin is entirely mocked | §8 |
| Analytics / GTM | 🔴 | §12 |
| WhatsApp integration | 🟡 placeholder number | §12 |
| Social media links | 🔴 | §12 |
| Easy OTA/booking-platform integration | 🔴 | §7 |
