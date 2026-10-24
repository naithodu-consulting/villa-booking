# Airbnb calendar sync - plan

Status: proposed, not started. Written 2026-10-22 after reading the real export
Airbnb produced for this listing (`airbnb-calendar.ics`, downloaded 2026-10-22).

---

## 1. What Airbnb actually offers

Airbnb has no public booking API. For anyone who is not a certified channel
manager, the only two-way sync is **iCalendar (.ics) link exchange**, which is
what the "Connect to another website" screen does:

- **Step 1** gives us *Airbnb's* export URL (`https://www.airbnb.co.in/calendar/ical/...ics`).
  We fetch it. It tells us which nights Airbnb considers taken.
- **Step 2** asks for *our* export URL, ending in `.ics`. Airbnb fetches it on
  its own schedule and blocks those nights on the listing.

Two consequences that shape everything below:

- **It is availability only.** No prices, no minimum stay, no guest details, no
  payouts. Rates stay managed separately on each side, by hand.
- **It is polling, not push.** Airbnb refreshes an imported calendar roughly
  every few hours and publishes no guarantee. A night booked on one side can
  stay open on the other for hours. Double booking is not eliminated, it is made
  rare (see §7).

The `.ics` extension in Step 2 is a real constraint in Airbnb's UI validation, so
our export URL must end in `.ics` on the path, not in a query string.

---

## 2. What the real file tells us

```
BEGIN:VEVENT
DTSTAMP:20261022T123454Z
DTSTART;VALUE=DATE:20261022
DTEND;VALUE=DATE:20261023
SUMMARY:Airbnb (Not available)
UID:7f662ec65913-06e45b4dfbddf8fce396407ebb876b03@airbnb.com
END:VEVENT
```

Findings, each of which removes guesswork from the implementation:

1. **All-day `VALUE=DATE` events, `DTEND` exclusive.** One night = DTSTART
   2026-10-22, DTEND 2026-10-23. Our `blocked_dates` is already half-open:
   `check_availability` tests `p_check_in < end_date AND p_check_out > start_date`
   (`00097_booking_cutoff_date.sql`). So `DTSTART -> start_date` and
   `DTEND -> end_date` map **directly**, with no off-by-one correction. Any code
   that adds or subtracts a day here is a bug.
2. **No `VTIMEZONE`, no time component.** These are floating calendar dates.
   Nothing to convert; store the literal date. This dodges the UTC/IST class of
   bug entirely, provided nothing on our side ever puts these through `new Date()`
   and back.
3. **`SUMMARY` is generic.** "Airbnb (Not available)" covers both a real
   reservation and a host-applied block, and carries no guest name. We cannot
   turn an Airbnb reservation into a `bookings` row with any real content, so we
   should not try. Airbnb entries become `blocked_dates`, nothing more.
4. **`UID` is stable per entry.** It is the dedupe and reconciliation key.
5. **The second event is a six-month span: 2027-04-20 -> 2027-10-23.** That is
   almost certainly Airbnb's own availability-window edge, not a booking.
   Importing it blindly would close our calendar for half a year. This is the
   single most important safety case in the whole feature (see §6.3).

Both snapshots are committed as parser fixtures - `airbnb-2026-10-22.ics` and
`airbnb-2026-10-23.ics` in `src/lib/__tests__/fixtures/` - so the parser is
tested against real output rather than a hand-written sample. Neither contains
the feed token; the listing id in the UIDs is already public.

### 2.1 What the live feed added, 24 hours later

Fetched 2026-10-23 10:20 UTC. The feed had changed completely, and the
differences settle two design questions and overturn two decisions.

Today's events:

| Range | Nights | What it is |
|---|---|---|
| 2026-10-23 -> 2026-11-01 | 9 | real block or booking |
| 2026-11-06 -> 2026-11-08 | 2 | real block or booking |
| 2026-12-26 -> 2026-12-28 | 2 | real block or booking |
| 2027-01-21 -> 2027-10-24 | 276 | **not a block - see below** |

**1. The trailing span is the availability-window edge. Proven, not guessed.**

| | Trailing event | Arithmetic |
|---|---|---|
| 22 Oct snapshot | 2027-04-20 -> 2027-10-23 | start = that day **+180**, end = that day **+366** |
| 23 Oct snapshot | 2027-01-21 -> 2027-10-24 | start = that day **+90**, end = that day **+366** |

Both ends sit exactly 366 days out, and both starts sit exactly at the
availability window - which was 6 months on the 22nd and 3 months on the 23rd,
because the host changed the setting between the two fetches. So Airbnb exports
"every night from the end of my booking window to my 12-month horizon" as one
unavailable event. It is a statement about Airbnb's own booking rules, not about
the villa being occupied.

**Importing it blindly would close villa19.in from 90 days out to 12 months
out.** This is no longer a hypothetical to flag for review - it is the feed's
normal, permanent shape, and the importer must drop it every single time.

The rule that does that: **discard any event that both ends on or after today +
300 days and runs longer than 90 nights.**

It takes two conditions, and the first version of this took only one. "Ends at
the horizon" is safe while the channel's window is narrow - at 3 months no real
booking comes near 300 days out. Widen the window to 12 months, which is the
sensible setting and the one recommended below, and a genuine booking can end
at today+353. Dropped as a horizon, its nights stay on sale on villa19.in and
the sync manufactures the double booking it exists to prevent.

Requiring length as well separates them cleanly: the observed edge is 276
nights, and no real stay at this villa approaches 90. At a 12-month window the
edge shrinks to a single night at today+365 and is kept rather than dropped,
which is harmless - the channel does say that night is unavailable.

The span guard in §6.3 stays as a second net for a long event that is *not* at
the horizon.

**2. UIDs are not stable, so they cannot be the identity key.** Every UID in the
23 Oct feed is new; not one survived from the 22nd. The constant `7f662ec65913-`
prefix is the listing, and the 32-hex suffix behaves like a content hash - change
an event's dates and it becomes a different UID. Reconciling by UID would
therefore turn every edit into a delete plus an insert, which is the same thing
as replacing the set. §6.3 is rewritten accordingly.

**3. There is no `ETag` and no `Last-Modified`,** and the response carries
`cache-control: no-cache, no-store`. The conditional-request optimisation is off
the table. Worse, `DTSTAMP` is set to the moment of the request, so **the file
differs on every fetch even when nothing has changed** - hashing the raw body is
useless as a change detector. Hash the parsed event set with `DTSTAMP` excluded.

---

## 3. Where this fits the existing code

| Existing piece | Role in this feature |
|---|---|
| `blocked_dates` | Destination for imported Airbnb nights. Half-open range, already correct. |
| `check_availability()` / `get_unavailable_nights()` | Already consult `blocked_dates`, so an imported block blocks the site with zero changes to the booking path. |
| `/api/availability/calendar` | Picks up imported blocks automatically (60s CDN cache, so a block shows within a minute). |
| `bearerSecretMatches()` in `src/lib/signature.ts` | Constant-time auth for the cron route. Already written and tested. |
| `CRON_SECRET` | Still present in `.env.local`; the route it guarded was removed in v0.4.1. This feature reinstates the pattern. |
| `src/lib/features.ts` | Home for an `ICAL_SYNC_ENABLED` flag, same fail-closed shape as `ONLINE_PAYMENTS_ENABLED`. |

### 3.1 Where this runs, and what schedules it

Decided 2026-10-23. **Production is Hostinger** (`docs/HOSTINGER_GO_LIVE.md`);
Vercel is the development deployment only, on the **Hobby** plan, whose cron is
capped at one run per day. So Vercel Cron is out.

The sync route is nothing but an authenticated HTTP GET, which makes the
scheduler a swappable detail. Ranked:

1. **Hostinger cron job (Business plan) - the choice.** It sits on the same host
   as production, needs no third party, and has no shared-runner queueing. One
   line: `curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://villa19.in/api/cron/ical-sync`.
2. **GitHub Actions `schedule`** - fallback if Hostinger's cron proves awkward.
   Free, and the repo is already there. Two caveats: the repo is **public**, so
   the secret must be a repository Actions secret and must never be echoed in a
   step; and Actions cron is best-effort, routinely late by 5-30 minutes and
   occasionally skipped under load. Tolerable for an hourly sync, not for
   anything tighter.
3. **Supabase `pg_cron` + `pg_net`** - works on Pro and is the most reliable
   timer of the three, but it puts the schedule in a third system with its own
   copy of the secret. Only worth it if the first two disappoint.

Not an option: doing the fetch and the ICS parsing inside Postgres. The parser
belongs in TypeScript where it can be unit-tested against the fixture.

### 3.2 Which database, confirmed

Settled 2026-10-23, and it lines up cleanly:

| | Site | Database | Who writes bookings |
|---|---|---|---|
| **Production** | Hostinger | `wnmrxuggtfeaunacmztv` (per `.env.hostinger`) | guests, **and Ooruda admin** |
| **Development** | Vercel | `hlmqcdzazbrztfovixjk` | test data only |

Ooruda writes to production, and the production site reads the same project, so
the admin's entries and the public calendar are already one calendar. **The
importer and the export both belong on production.** The development project is
full of test rows (Santa Claus, Saturo Gojo, a run of one-night bookings) and
would tell us nothing about a real sync.

Note for anyone reading `DEPLOYMENT.md` alongside this: its claim that the
development project is "what guests read" predates the Hostinger go-live and no
longer matches `.env.hostinger`. Trust the table above.

**The importer runs against production only.** Dev may run it too if useful -
Airbnb's feed is read-only, so importing into the staging database is harmless -
but the **export URL given to Airbnb must point at production**, never at the
Vercel dev deployment, whose database is a different calendar.

Admin UI is out of scope for this repo by standing decision - admin lives in the
Ooruda Villa project. This repo exposes the data and the trigger; Ooruda renders
the screens.

---

## 4. Schema changes

One migration, `00102_ical_sync.sql`. (It was numbered 00101 when this was
written; another branch took that number first.)

```sql
CREATE TABLE ical_feeds (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name           text NOT NULL,              -- 'Airbnb'
  url            text NOT NULL,              -- the Step 1 link; secret, never served to a browser
  is_active      boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  last_status    text,                       -- 'ok' | 'fetch_failed' | 'parse_failed' | 'held_for_review'
  last_error     text,
  last_etag      text,
  events_applied int,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE blocked_dates
  ADD COLUMN source       text NOT NULL DEFAULT 'manual',   -- 'manual' | 'ical'
  ADD COLUMN feed_id      uuid REFERENCES ical_feeds(id) ON DELETE CASCADE,
  ADD COLUMN external_uid text;

CREATE INDEX blocked_dates_feed ON blocked_dates (feed_id) WHERE feed_id IS NOT NULL;
```

`external_uid` is stored for tracing only and is deliberately **not** unique:
Airbnb reissues UIDs whenever an event changes (§2.1), so a uniqueness
constraint would buy nothing and could reject a legitimate replace. `last_etag`
is kept in the table for a future feed that supports conditional requests;
Airbnb's does not, and for Airbnb it holds the event-set hash from §6.3 instead.

RLS: `ical_feeds` gets RLS enabled with **no public read policy** - the feed URL
is a secret token in URL form. Service role only, matching
`00020_service_role_write_grants.sql`.

The `source` column is what keeps the two directions from feeding each other
(§5.2).

---

## 5. Export: Villa 19 -> Airbnb

### 5.1 Route

`GET /api/ical/[token]/villa19.ics`

- Path ends in `.ics` so Airbnb's Step 2 validation accepts it.
- `token` is 32 random hex characters from `ICAL_EXPORT_TOKEN`, compared in
  constant time. Wrong token -> 404, not 403: a 403 confirms the route exists.
- `Content-Type: text/calendar; charset=utf-8`.
- `Cache-Control: no-store`, `CDN-Cache-Control: public, s-maxage=300`. Five
  minutes of CDN cache is invisible next to Airbnb's own multi-hour poll and
  keeps a leaked URL from being a free database load generator.
- Rate limit by IP using the existing limiter.

### 5.2 What goes in it - and what must not

Export nights that are genuinely occupied **by us**:

- `confirmed` bookings,
- `pending` bookings whose hold is still live (decided 2026-10-23; reasoning
  below),
- `blocked_dates` where `source = 'manual'`.

**Why live holds are included.** The question is which error to prefer when
Airbnb's poll happens to land inside the 15 minutes a checkout holds a night.
Include them, and an abandoned checkout can show that night as unavailable on
Airbnb until the next poll, a few hours of a sellable night lost. Exclude them,
and a checkout that *completes* leaves the night sellable on Airbnb until the
next poll, which is a double booking waiting to happen. Both cases need the same
unlucky timing, so the probabilities are roughly equal and the decision comes
down to which failure costs more: a few hours of lost listing versus two guests
holding the same night. A lost night is recoverable. Include them.

Deliberately **excluded**, each for a reason worth keeping:

- **`source = 'ical'` rows.** Exporting Airbnb's own blocks back to Airbnb is a
  feedback loop; it would also make a cancelled Airbnb booking un-free itself.
- **Nights beyond `properties.booking_cutoff_date`.** The cutoff is our
  commercial limit on direct bookings, not a statement that the villa is
  occupied. `get_unavailable_nights()` returns those nights as unavailable, so
  **reusing that function for the export would block Airbnb's entire future
  calendar.** The export needs its own query, not `get_unavailable_nights`.

So: a new `get_export_blocked_nights(p_property_id, p_from, p_to)` SQL function,
deliberately separate from `get_unavailable_nights`, with a comment in both
saying why they differ.

### 5.3 Shape

Window: today to today + 18 months. Contiguous unavailable nights collapse into
one `VEVENT` per run.

```
BEGIN:VCALENDAR
PRODID:-//Villa 19//Booking Calendar 1.0//EN
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTAMP:<now, UTC>
DTSTART;VALUE=DATE:20261101
DTEND;VALUE=DATE:20261104
SUMMARY:Villa 19 (Not available)
UID:villa19-<property>-<start>-<end>@villa19.in
END:VEVENT
END:VCALENDAR
```

- CRLF line endings, lines folded at 75 octets per RFC 5545.
- **No guest names, emails, phone numbers or amounts.** The URL is a bearer
  token in a third party's database; it leaks occupancy by design and must leak
  nothing else.
- `UID` derived deterministically from the range so a re-export of an unchanged
  calendar is byte-stable.

---

## 6. Import: Airbnb -> Villa 19

### 6.1 Route and schedule

`GET /api/cron/ical-sync`, `Authorization: Bearer $CRON_SECRET`, via
`bearerSecretMatches`. Same route serves the Ooruda admin's "Sync now" button,
so there is one code path and one secret.

Scheduled from Hostinger's cron, not `vercel.json` (§3.1):

```
17 * * * * curl -fsS -m 60 -H "Authorization: Bearer $CRON_SECRET" https://villa19.in/api/cron/ical-sync
```

Hourly, offset off the hour so it does not land with every other job on a shared
host. Our side can afford to be fresher than Airbnb's; there is no reason to
match their slower cadence.

The route must be safe to call twice at once and safe to call by hand, since a
cron line and an Ooruda "Sync now" button can overlap. A Postgres advisory lock
on the feed id around the apply step is enough; a second caller that cannot take
the lock returns "already running" and does nothing.

### 6.2 Parser

`src/lib/ical.ts`, hand-written, no dependency. The grammar we need is small and
every ICS library on npm is far larger than the ~80 lines this takes:

1. Normalise CRLF, unfold continuation lines (`\r\n` followed by space or tab).
2. Split on `BEGIN:VEVENT` / `END:VEVENT`.
3. Per event read `UID`, `SUMMARY`, `DTSTART`, `DTEND`, ignoring unknown
   properties and parameters other than `VALUE=DATE`.
4. Missing `DTEND` -> `DTSTART + 1 day` (RFC 5545 default for DATE values).
5. Reject the event if `DTEND <= DTSTART`, or if either date fails to parse.

Return `{ uid, summary, start, end }[]` as plain ISO date strings. The parser
never touches `Date` arithmetic beyond that single +1 day, done on the string.

Tests against the committed fixture: two events, exact dates, the six-month span
preserved, plus folded-line and CRLF variants, and a truncated file.

### 6.3 Applying a feed - the careful part

The fetched body is untrusted input from a third party. Rules:

- Timeout 10s, HTTPS only, no redirect to a non-HTTPS host, body cap 1 MB, and
  send no cookies (Airbnb sets three on this response; none are needed).
- Non-2xx, empty body, or a body not starting with `BEGIN:VCALENDAR` ->
  **abort the whole run, change nothing**, write `last_status` and `last_error`.
  A failed fetch must never be read as "Airbnb has no bookings" and free the
  calendar.
- No conditional requests: the feed sends no `ETag` or `Last-Modified` (§2.1).
  To skip pointless writes, hash the **parsed event set with `DTSTAMP`
  excluded** and compare with the stored hash. Hashing the raw body would never
  match, because `DTSTAMP` is the time of the request.
- Drop events ending before today.
- **Drop the availability-window edge:** any event that both ends at or past
  `today + 300 days` **and** runs over 90 nights (§2.1). Not a guard, a
  permanent rule - this event is in every fetch. Both conditions are required,
  or a real far-future booking is dropped once the channel's window widens.
- **Span guard,** for everything that survives the rule above. An event longer
  than 90 nights, or a run that would newly block more than 120 nights in total,
  is not applied: the feed is stored, `last_status = 'held_for_review'`, and the
  admin is emailed. With the window edge already dropped, this should now fire
  only on something genuinely odd.

Reconciliation, per feed, in one transaction - **replace, do not upsert.**
Because UIDs change whenever an event's dates change (§2.1), matching on them
buys nothing and risks leaving an orphan block behind:

- Delete every `blocked_dates` row for this feed.
- Insert one row per surviving event: `start_date`, `end_date`,
  `source = 'ical'`, `feed_id`, `external_uid` (kept for tracing only, not as
  identity), `reason = 'offline_booking'`, `notes = SUMMARY`.
- Never touch rows with `source = 'manual'`.

Replacing wholesale is **only** safe because of the abort rules above: a failed
or empty fetch must never reach this step, or it would free the whole calendar.
That ordering is the single most important thing to get right in this feature,
and the test for it is worth writing first.

### 6.4 Conflicts

A night Airbnb now blocks that already carries a `confirmed` booking of ours
means the villa is sold twice. The import must not hide it:

- Apply the block anyway (the night is already unavailable; blocking it changes
  nothing for guests).
- Write a row to `ical_conflicts (feed_id, booking_id, check_in, check_out, detected_at, resolved_at)`.
- Email `ADMIN_EMAIL` immediately through the existing `src/lib/emails` path,
  with both ranges and the booking reference. A human has to decide which guest
  to move; no automation should.

---

## 7. Residual double-booking risk, stated plainly

With hourly import and Airbnb's multi-hour poll, the exposure window is roughly
**0-3 hours on the Airbnb side** and up to one hour on ours. A guest booking the
same night on both channels inside that window gets through. This is inherent to
iCal sync and is the same risk every small host on Airbnb carries.

What shrinks it, in order of value for effort:

1. Keep a healthy minimum notice on Airbnb (e.g. same-day bookings off), so the
   riskiest, shortest-horizon bookings cannot happen there at all.
2. Fire an extra import run immediately after any direct booking confirms, which
   at least gets us Airbnb's latest state before the next guest arrives.
3. Accept it and staff the conflict email (§6.4).

What does not fix it: polling faster. Airbnb's own refresh is the long half.

---

## 8. Environment variables

```
# Our export, the URL pasted into Airbnb's Step 2. 32 hex chars: openssl rand -hex 16
ICAL_EXPORT_TOKEN=

# Authenticates /api/cron/ical-sync. openssl rand -hex 32
CRON_SECRET=

# The switch for the whole feature. Fail-closed like ONLINE_PAYMENTS_ENABLED,
# but read at RUNTIME on the server rather than inlined at build time: nothing
# in the browser knows a block came from a channel, so it can be flipped
# without a rebuild. Off means the sync route fetches nothing, writes nothing,
# and says so. Turning it off never frees an already-blocked night.
# Per-channel, there is ical_feeds.is_active.
ICAL_SYNC_ENABLED=
```

Airbnb's own feed URL lives in `ical_feeds.url`, not in the environment, so the
operator can rotate it from Ooruda without a redeploy. Airbnb regenerates that
link whenever the host resets it, and a redeploy to change a URL is a trap.

### 8.1 Which host gets which value

Decided 2026-10-23. Both hosts get the variables, with different values and
different intent - not one host only.

| | Local | Vercel (dev) | Hostinger (prod) |
|---|---|---|---|
| `ICAL_SYNC_ENABLED` | `true` | `true` | `true` at go-live, absent until then |
| `CRON_SECRET` | own value | own value | **own value, different from dev** |
| `ICAL_EXPORT_TOKEN` | own value | own value | **own value, different from dev** |
| Airbnb feed row in `ical_feeds` | staging DB | staging DB | production DB |
| URL pasted into Airbnb Step 2 | no | **no** | **yes, this one only** |

The two hosts read different databases, so a shared secret would let a dev
deployment serve a production-looking calendar. Distinct values per host, as
with the Supabase keys already in `.env.hostinger`.

Vercel is where the feature gets exercised before it touches a live listing:
same code, staging database, real Airbnb feed on the read side, nothing handed
to Airbnb on the write side. Keeping the flag absent on Hostinger until Phase 2
is signed off means production carries the code without running it, the same
fail-closed shape as `NEXT_PUBLIC_ONLINE_PAYMENTS_ENABLED`.

Record the Hostinger values in `.env.hostinger` (git-ignored) when they are set,
so that file stays a true mirror of hPanel.

---

## 9. Phased rollout

| Phase | Work | Done when |
|---|---|---|
| **0. Dry run** ✅ | Migration, parser, fixture tests, and the sync **endpoint**, which fetches and **logs** the diff without writing. **No schedule, and no writes** - it is run by hand. | A run against the live feed logs exactly the three real blocks, and reports the window edge as dropped. |
| **1. Import live** ✅ | Enable writes, reconciliation, conflict table, admin email, **and the hourly schedule** (§3.1, §6.1). | **Done 2026-10-24.** Verified against the live feed: 4 blocks written, 1 conflict recorded, a cancellation freeing its nights, a failed fetch leaving the blocks in place. |
| **2. Export** ◐ | Export SQL function, `.ics` route, token. Paste into Airbnb Step 2. | **Built 2026-10-24, not yet pasted into Airbnb.** A direct booking on the site shows as blocked on the Airbnb calendar. |
| **3. Observability** | Feed status surfaced in Ooruda, **"Sync now" button (confirmed wanted, 2026-10-24)**, stale-feed alert when `last_synced_at` is over 6 hours old. | Operator can see the last sync and its result without a database client. |

### 9.1 The "Sync now" button

Confirmed as wanted on 2026-10-24. It does not exist yet, and it cannot be built
in this repository: the admin lives in the Ooruda Villa project.

This side is ready for it. The button needs no new endpoint - it calls the same
`GET /api/cron/ical-sync` with the same `CRON_SECRET` bearer token that the
scheduler uses, deliberately, so there is one code path and one secret rather
than two that drift. `apply_ical_feed()` takes an advisory lock per feed
precisely so a button press during an hourly run is safe: the second caller
waits rather than interleaving its deletes and inserts with the first.

Ooruda needs only the URL and the secret. It should show `ical_feeds.last_status`,
`last_synced_at` and `last_error` beside the button, since a sync that has been
failing for a week otherwise looks exactly like one with nothing to do.

Phase 2 before Phase 1 is the wrong order: import is read-only on Airbnb's side
and reversible, export changes a live listing that takes real money.

---

## 10. Before writing any code

- Read the routing and caching guides in `node_modules/next/dist/docs/` first.
  This Next.js is not the one in training data; route handler, dynamic segment
  and cache-header conventions all need checking against the installed version
  (`AGENTS.md`).
- Confirm Hostinger's cron job UI accepts an hourly `curl` line and what its
  minimum interval is (§3.1). If it does not, fall to GitHub Actions.

---

## 11. Settled, and still open

**Settled 2026-10-23**

- Production is Hostinger, Vercel is dev on Hobby; the scheduler is a Hostinger
  cron job (§3.1).
- The Airbnb listing is Villa 19 itself, the whole villa - one listing, one
  property.
- Live checkout holds are exported (§5.2).
- Double-booking conflicts go to `ADMIN_EMAIL`.
- Both hosts get their own secrets; only production's URL goes to Airbnb (§8.1).
- Nothing is committed and no migration is pushed without the operator's
  explicit approval, each time.

- The feed URL is in hand and verified live (HTTP 200, `text/calendar`, 921
  bytes). It is a bearer token in URL form: it belongs in `ical_feeds.url` and
  in `.env.local`, never in the repository.
- The trailing multi-month span is Airbnb's availability-window edge, not a
  block, and is dropped on every import (§2.1).

**Still open**

1. ~~**Two near-term blocks still need an explanation.**~~ **Answered
   2026-10-23: both are real Airbnb reservations**, entered into Ooruda after
   the fact. They are exactly the case this feature exists to catch - a booking
   that lived on one channel for days without the other knowing. Once import is
   live, nobody has to remember.

   *Not yet verified in our database.* `blocked_dates` is empty and no booking
   covers 6-7 Nov or 26-27 Dec in the development project
   (`hlmqcdzazbrztfovixjk`), which is the only remote in `.env.local` - the
   production block there is still a `<prod-ref>` placeholder. Either Ooruda
   writes to production (`wnmrxuggtfeaunacmztv`) or the entry did not save.
   Worth settling, because it decides which database the importer points at.

   Original note follows.

   Online bookings open
   **1 November 2026**, which accounts for the first block exactly: 2026-10-23
   -> 11-01 is every night up to and including 31 October, free from the 1st.
   Intentional, confirmed 2026-10-23.

   The other two fall *after* that date and are weekend-shaped, so they are
   either real Airbnb reservations or deliberate owner holds:

   | Nights | Days |
   |---|---|
   | 6-7 Nov 2026 | Friday, Saturday |
   | 26-27 Dec 2026 | Saturday, Sunday (Christmas weekend) |

   The feed cannot tell us which: Airbnb labels reservations and host blocks
   identically as "Airbnb (Not available)" (§2). The host calendar can - a
   reservation shows a guest, a block does not. Worth settling before import
   goes live, because these close the same nights on villa19.in.
2. **The two booking windows differ, and that is fine - with one watch item.**
   Airbnb is on a **3-month rolling** window (today + 90). Our
   `booking_cutoff_date` is a **fixed** date, around mid-January 2027.

   No correctness problem, and the two rules deliberately do not collide:
   an Airbnb reservation imports as a block whatever our cutoff says, and our
   export already excludes beyond-cutoff nights (§5.2) so we never blanket
   Airbnb's sellable window. The window-edge rule in §2.1 also holds for any
   setting the host picks: at 12 months or "all future dates" the trailing event
   shrinks or vanishes, and the rule simply finds nothing to drop.

   **The watch item is drift.** Rolling versus fixed means they separate. Today
   both land on 21 January, by coincidence. A month from now Airbnb sells to
   late February while villa19.in still stops mid-January, and that gap widens
   every day the cutoff is not moved. Nights in it are sellable on Airbnb only -
   so they carry Airbnb's commission, and the direct channel quietly stops
   competing for them.

   Nothing breaks; it just costs margin. Either move the cutoff on a calendar
   reminder, or give `booking_cutoff_date` a rolling mode so it keeps pace on
   its own. Worth deciding before the gap is months wide.
3. Does the Airbnb listing go live before or after villa19.in leaves the parked
   page? The export URL must be on a host Airbnb can fetch and that reads the
   production database. Until DNS moves that is the Hostinger temporary domain,
   and the link has to be re-pasted into Airbnb after the cutover.
4. Are other channels coming (Booking.com, MakeMyTrip)? Everything above is
   per-feed by design, so a second feed is a row, not a rewrite - but the
   conflict volume and the staffing in §7 change with each one added.
