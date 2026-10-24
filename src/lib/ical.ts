import { addDaysISO, todayISO } from '@/lib/format';

/**
 * Reading an iCalendar (.ics) feed from a booking channel.
 *
 * Deliberately hand-written rather than a dependency. The grammar we need is a
 * handful of properties on all-day VEVENTs, and every ICS library on npm is
 * orders of magnitude larger than this file while also parsing recurrence
 * rules, alarms and timezones that no channel feed uses for availability.
 *
 * Pure functions only: no fetching, no database, no `server-only`. The fetch
 * lives in ical-fetch.ts so that everything decision-shaped here can be unit
 * tested against the committed fixtures in __tests__/fixtures/.
 *
 * ── The one thing to understand before changing anything here ──────────────
 *
 * DTEND is EXCLUSIVE. An entry of DTSTART 2026-10-23 / DTEND 2026-11-01 means
 * the nights of 23 October through 31 October, with the villa free on the 1st.
 * This is also exactly how blocked_dates and check_availability() treat
 * start_date and end_date (00097_booking_cutoff_date.sql), so the mapping is
 * direct and no day is ever added or subtracted. Any "+1" introduced here is a
 * bug, and it will be the kind that only shows up on the last night of a stay.
 *
 * See docs/AIRBNB_ICAL_SYNC.md for the feed analysis this is built from.
 */

export interface IcalEvent {
  uid: string;
  summary: string;
  /** First night held, YYYY-MM-DD. */
  start: string;
  /** Checkout day, YYYY-MM-DD, exclusive. */
  end: string;
}

export class IcalParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IcalParseError';
  }
}

/**
 * RFC 5545 line unfolding.
 *
 * A long property is split across lines by inserting CRLF followed by a single
 * space or tab, which the reader must remove. Airbnb's feed is short enough
 * today that nothing folds, which is precisely why this has to be handled on
 * purpose: the first guest with a long name on some future channel would
 * otherwise silently break a date.
 */
function unfold(body: string): string[] {
  return body
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n[ \t]/g, '')
    .split('\n');
}

/**
 * `20261023` -> `2026-10-23`.
 *
 * Returns null for anything that is not a real calendar date, which includes
 * the shapes that look plausible and are not: `20260231`, `20261301`. A silent
 * Date rollover here would turn 31 February into 3 March and block the wrong
 * nights, so the round trip back to a string is the check.
 *
 * A DATE-TIME value (`20261023T100000Z`) keeps only its date part. Airbnb does
 * not emit those, but other channels do, and for a whole-night block the time
 * carries no information we can act on.
 */
function toISODate(raw: string): string | null {
  const value = raw.trim().split('T')[0];
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
  if (!m) return null;

  const iso = `${m[1]}-${m[2]}-${m[3]}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso) return null;

  return iso;
}

/** Splits `DTSTART;VALUE=DATE:20261023` into its name and its value. */
function splitProperty(line: string): { name: string; value: string } | null {
  const colon = line.indexOf(':');
  if (colon < 1) return null;
  return {
    // Parameters after the first ';' are not needed: VALUE=DATE is the only one
    // these feeds use, and the value shape is checked directly instead.
    name: line.slice(0, colon).split(';')[0].trim().toUpperCase(),
    value: line.slice(colon + 1),
  };
}

export interface ParseResult {
  events: IcalEvent[];
  /** Events that were present but unusable. Surfaced, never swallowed. */
  skipped: number;
}

/**
 * Parses a calendar body into all-day events.
 *
 * Throws IcalParseError when the body is not a calendar at all. That
 * distinction matters more than it looks: a sync that treats an error page as
 * "a calendar with no events" would free every imported night. The caller must
 * be able to tell "nothing is booked" from "I could not read this", so one is
 * an empty array and the other is an exception.
 */
export function parseIcal(body: string): ParseResult {
  if (!body.trimStart().startsWith('BEGIN:VCALENDAR')) {
    throw new IcalParseError('Body is not an iCalendar document.');
  }

  const events: IcalEvent[] = [];
  let skipped = 0;

  let current: Partial<IcalEvent> | null = null;

  for (const line of unfold(body)) {
    const trimmed = line.trim();

    if (trimmed === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }

    if (trimmed === 'END:VEVENT') {
      if (current) {
        const event = finishEvent(current);
        if (event) events.push(event);
        else skipped++;
      }
      current = null;
      continue;
    }

    if (!current) continue;

    const property = splitProperty(trimmed);
    if (!property) continue;

    switch (property.name) {
      case 'UID':
        current.uid = property.value.trim();
        break;
      case 'SUMMARY':
        current.summary = property.value.trim();
        break;
      case 'DTSTART':
        current.start = toISODate(property.value) ?? undefined;
        break;
      case 'DTEND':
        current.end = toISODate(property.value) ?? undefined;
        break;
      // DTSTAMP is deliberately ignored. Airbnb sets it to the moment of the
      // request, so it differs on every fetch even when the calendar has not
      // changed. Keeping it out of the parsed shape is what lets the caller
      // hash this result to detect real changes.
      default:
        break;
    }
  }

  return { events, skipped };
}

function finishEvent(draft: Partial<IcalEvent>): IcalEvent | null {
  if (!draft.start) return null;

  // RFC 5545: a DATE-valued event with no DTEND lasts exactly one day. This is
  // the only place a day is ever added, and it is the spec's default, not a
  // correction.
  const end = draft.end ?? addDaysISO(draft.start, 1);
  if (end <= draft.start) return null;

  return {
    uid: draft.uid ?? '',
    summary: draft.summary ?? '',
    start: draft.start,
    end,
  };
}

/** Nights held by an event, i.e. the exclusive-end span. */
export function nightsBetween(start: string, end: string): number {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000);
}

export type DropReason = 'past' | 'window_edge' | 'too_long';

export interface DroppedEvent {
  event: IcalEvent;
  reason: DropReason;
  nights: number;
}

export interface Classification {
  /** Events that should become blocked_dates rows. */
  apply: IcalEvent[];
  dropped: DroppedEvent[];
  /** Total nights the surviving events would hold. */
  totalNights: number;
  /**
   * True when something looks wrong enough that nothing should be written and
   * a human should look. The caller must honour this.
   */
  heldForReview: boolean;
  reviewReasons: string[];
}

export interface ClassifyOptions {
  /** IST today. Injected so tests are not time-dependent. */
  today?: string;
  /**
   * Events ending on or after today + this many days are the channel's own
   * availability-window edge, not a booking. See below.
   */
  horizonDays?: number;
  maxSpanNights?: number;
  maxTotalNights?: number;
}

/**
 * Decides which parsed events may be applied.
 *
 * ── Why the window-edge rule exists ────────────────────────────────────────
 *
 * Airbnb exports "every night from the end of my booking window to my 12-month
 * horizon" as a single unavailable event. Two snapshots a day apart proved it:
 * the event ran today+180 -> today+366 on 22 October and today+90 -> today+366
 * on the 23rd, because the host changed the availability window from 6 months
 * to 3 in between. Both ended exactly 366 days out.
 *
 * It is a statement about Airbnb's booking rules, not about the villa being
 * occupied, and importing it would close villa19.in from three months out to a
 * year out. It appears in every single fetch, so this is a permanent rule and
 * not a guard.
 *
 * ── Why it takes two conditions, not one ──────────────────────────────────
 *
 * "Ends at the horizon" alone is not enough, and the first version of this
 * made exactly that mistake. It is safe only while the channel's window is
 * narrow: at a 3-month window no real booking reaches anywhere near 300 days
 * out. Widen the window to 12 months - which is the sensible setting, and the
 * one we recommended - and a genuine booking can end at today+353. Dropped as
 * a horizon, its nights stay on sale here, and the sync invents the double
 * booking it exists to prevent.
 *
 * So an event is the horizon only if it ALSO runs longer than any real stay.
 * The observed edge is 276 nights; the longest plausible stay at this villa is
 * nowhere near 90. A far-future booking is short and survives; the horizon is
 * long and does not.
 *
 * At a 12-month window the edge shrinks to a single night at today+365 and is
 * kept rather than dropped. That is harmless and arguably right: the channel
 * does say the night is unavailable.
 */
export function classifyEvents(events: IcalEvent[], options: ClassifyOptions = {}): Classification {
  const today = options.today ?? todayISO();
  const horizonDays = options.horizonDays ?? 300;
  const maxSpanNights = options.maxSpanNights ?? 90;
  const maxTotalNights = options.maxTotalNights ?? 120;

  const horizon = addDaysISO(today, horizonDays);

  const apply: IcalEvent[] = [];
  const dropped: DroppedEvent[] = [];
  const reviewReasons: string[] = [];

  for (const event of events) {
    const nights = nightsBetween(event.start, event.end);

    // Already over. The last night is end - 1, so an event ending today held
    // its final night yesterday.
    if (event.end <= today) {
      dropped.push({ event, reason: 'past', nights });
      continue;
    }

    // Both conditions, for the reason set out above: reaching the horizon is
    // what makes it the channel's edge, and being longer than any real stay is
    // what makes it safe to drop silently.
    if (event.end >= horizon && nights > maxSpanNights) {
      dropped.push({ event, reason: 'window_edge', nights });
      continue;
    }

    // Second net, for anything long that is not the horizon. Not applied, and
    // loud: a 90-night stay is either a data problem or a booking nobody
    // mentioned, and both want a human.
    if (nights > maxSpanNights) {
      dropped.push({ event, reason: 'too_long', nights });
      reviewReasons.push(`Event ${event.start} to ${event.end} holds ${nights} nights (limit ${maxSpanNights}).`);
      continue;
    }

    apply.push(event);
  }

  const totalNights = apply.reduce((sum, e) => sum + nightsBetween(e.start, e.end), 0);
  if (totalNights > maxTotalNights) {
    reviewReasons.push(`Feed would block ${totalNights} nights in total (limit ${maxTotalNights}).`);
  }

  return {
    apply,
    dropped,
    totalNights,
    heldForReview: reviewReasons.length > 0,
    reviewReasons,
  };
}

/**
 * A stable fingerprint of what a feed says, for skipping no-op writes.
 *
 * Airbnb sends no ETag and no Last-Modified, and sets DTSTAMP to the time of
 * the request, so the raw body differs on every fetch and hashing it would
 * never match. Hashing the parsed events instead compares what the feed means
 * rather than how it was serialised.
 *
 * UID is included even though Airbnb reissues it whenever an event's dates
 * change: a changed UID with unchanged dates still means the channel rebuilt
 * the entry, and noticing that costs nothing.
 */
export function eventSetFingerprint(events: IcalEvent[]): string {
  return events
    .map((e) => `${e.start}/${e.end}/${e.uid}`)
    .sort()
    .join('|');
}
