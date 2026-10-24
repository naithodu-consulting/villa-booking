import { addDaysISO } from '@/lib/format';

/**
 * Publishing our calendar to a booking channel.
 *
 * The write half of iCal sync; ical.ts is the read half. Pure functions only,
 * so the whole document can be built and checked in a test without a database
 * or a request - and, more usefully, parsed straight back by our own
 * parseIcal() to prove the two halves agree.
 *
 * ── What a channel does with this, and the one rule that follows ──────────
 *
 * Airbnb fetches this document and blocks the nights it lists. It is not a
 * report; it is an instruction to a live listing that takes real money.
 *
 * Which makes one failure mode far worse than the rest: an EMPTY calendar is
 * a valid instruction meaning "nothing is booked, sell everything". So a
 * caller that cannot work out the real answer - database down, feature
 * switched off, property missing - must refuse to serve rather than serve an
 * empty VCALENDAR. That is the mirror image of the rule in ical.ts, where an
 * unreadable feed raises instead of returning no events. Same principle from
 * the other side: never let "I don't know" be published as "nothing".
 *
 * ── What is deliberately not in here ──────────────────────────────────────
 *
 * No guest names, emails, phone numbers, booking references or amounts. The
 * URL serving this is a bearer token sitting in a third party's database; it
 * leaks occupancy by design and must leak nothing else. Every event says the
 * same seven words.
 */

export interface DateRange {
  /** First night held, YYYY-MM-DD. */
  start: string;
  /** Checkout day, YYYY-MM-DD, exclusive. */
  end: string;
}

/**
 * Consecutive nights into half-open ranges.
 *
 * [2026-11-06, 2026-11-07, 2026-12-26] becomes
 * [{06 -> 08}, {26 -> 27}]: one VEVENT per stay rather than per night, which
 * is both what a channel expects and far smaller to serve.
 *
 * The end is the night after the last one held, which is exactly the checkout
 * day - the same half-open convention as blocked_dates and as DTEND. Input is
 * assumed sorted and unique, which is what get_export_blocked_nights returns.
 */
export function collapseNights(nights: string[]): DateRange[] {
  const runs: DateRange[] = [];

  for (const night of nights) {
    const last = runs[runs.length - 1];
    if (last && last.end === night) {
      // This night begins where the previous run ended, so it continues it.
      last.end = addDaysISO(night, 1);
    } else {
      runs.push({ start: night, end: addDaysISO(night, 1) });
    }
  }

  return runs;
}

/** `2026-11-06` -> `20261106`, the DATE value form. */
function compactDate(iso: string): string {
  return iso.replace(/-/g, '');
}

/** A UTC timestamp in the form DTSTAMP wants: `20261024T084500Z`. */
export function icalTimestamp(when: Date): string {
  return `${when.toISOString().slice(0, 19).replace(/[-:]/g, '')}Z`;
}

/**
 * Escapes a TEXT value. RFC 5545 gives `\`, `;`, `,` and newlines meaning
 * inside one, so a property name containing a comma would otherwise split the
 * value in two for the reader.
 */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Folds a content line to 75 octets, per RFC 5545.
 *
 * Octets, not characters: the limit is on bytes, and a continuation that split
 * a multi-byte character in half would corrupt it. Our own content is ASCII,
 * but the property name is read from the database and a future one may not be,
 * so the byte walk is done properly rather than assumed away.
 *
 * Continuation lines begin with a single space, which the reader removes.
 */
export function foldLine(line: string): string {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;

  const parts: string[] = [];
  let cut = 0;

  while (cut < bytes.length) {
    // 75 on the first line; continuations spend one octet on the leading space.
    const limit = parts.length === 0 ? 75 : 74;
    let take = Math.min(limit, bytes.length - cut);

    // Walk back off a continuation byte (10xxxxxx) so a character is never
    // split across the fold.
    while (take > 1 && (bytes[cut + take] & 0b1100_0000) === 0b1000_0000) take--;

    parts.push(bytes.subarray(cut, cut + take).toString('utf8'));
    cut += take;
  }

  return parts.join('\r\n ');
}

export interface CalendarOptions {
  /** Identifies this property in event UIDs. */
  propertyId: string;
  /** What a channel shows for these dates. Never a guest's name. */
  summary?: string;
  /** Injected so a test is not time-dependent. */
  now?: Date;
}

const PRODID = '-//Villa 19//Booking Calendar 1.0//EN';
const UID_DOMAIN = 'villa19.in';

/**
 * The whole VCALENDAR document.
 *
 * CRLF throughout, because RFC 5545 says so and some readers are strict about
 * it. UIDs are derived from the range rather than random, so re-exporting an
 * unchanged calendar produces an identical document: a channel can then tell a
 * real change from a re-publish, and so can a diff.
 */
export function buildIcalCalendar(runs: DateRange[], options: CalendarOptions): string {
  const stamp = icalTimestamp(options.now ?? new Date());
  const summary = escapeText(options.summary ?? 'Villa 19 (Not available)');

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    `PRODID:${PRODID}`,
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const run of runs) {
    lines.push(
      'BEGIN:VEVENT',
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compactDate(run.start)}`,
      `DTEND;VALUE=DATE:${compactDate(run.end)}`,
      `SUMMARY:${summary}`,
      `UID:villa19-${options.propertyId}-${compactDate(run.start)}-${compactDate(run.end)}@${UID_DOMAIN}`,
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');

  return lines.map(foldLine).join('\r\n') + '\r\n';
}
