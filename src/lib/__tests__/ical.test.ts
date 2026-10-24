import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseIcal,
  classifyEvents,
  nightsBetween,
  eventSetFingerprint,
  IcalParseError,
} from '@/lib/ical';

/**
 * The two fixtures are real Airbnb output for listing 1802144971592949978,
 * fetched a day apart. Keeping both is the point: the differences between them
 * are what proved the availability-window edge is not a booking, and a
 * hand-written sample would have hidden that.
 */
const fixture = (name: string) =>
  readFileSync(join(__dirname, 'fixtures', name), 'utf8');

const OCT_22 = fixture('airbnb-2026-10-22.ics');
const OCT_23 = fixture('airbnb-2026-10-23.ics');

describe('parseIcal', () => {
  it('reads the 22 October snapshot exactly', () => {
    const { events, skipped } = parseIcal(OCT_22);

    expect(skipped).toBe(0);
    expect(events).toEqual([
      {
        uid: '7f662ec65913-06e45b4dfbddf8fce396407ebb876b03@airbnb.com',
        summary: 'Airbnb (Not available)',
        start: '2026-10-22',
        end: '2026-10-23',
      },
      {
        uid: '7f662ec65913-bfaca8a5c4a344a77f5f045c7d36c0fd@airbnb.com',
        summary: 'Airbnb (Not available)',
        start: '2027-04-20',
        end: '2027-10-23',
      },
    ]);
  });

  it('reads the 23 October snapshot exactly', () => {
    const { events, skipped } = parseIcal(OCT_23);

    expect(skipped).toBe(0);
    expect(events.map((e) => [e.start, e.end])).toEqual([
      ['2026-10-23', '2026-11-01'],
      ['2026-11-06', '2026-11-08'],
      ['2026-12-26', '2026-12-28'],
      ['2027-01-21', '2027-10-24'],
    ]);
  });

  it('treats DTEND as exclusive, so a one-night block is one night', () => {
    const [first] = parseIcal(OCT_22).events;
    expect(nightsBetween(first.start, first.end)).toBe(1);
  });

  it('confirms no UID survived between the two fetches', () => {
    // This is why reconciliation replaces rather than upserts: matching on UID
    // would treat every edit as a new event and orphan the old one.
    const before = new Set(parseIcal(OCT_22).events.map((e) => e.uid));
    const after = parseIcal(OCT_23).events.map((e) => e.uid);
    expect(after.some((uid) => before.has(uid))).toBe(false);
  });

  it('throws rather than returning nothing when the body is not a calendar', () => {
    // The distinction that matters most in the whole feature: an error page
    // must never be read as "no bookings", which would free every night.
    expect(() => parseIcal('<html><body>502 Bad Gateway</body></html>')).toThrow(IcalParseError);
    expect(() => parseIcal('')).toThrow(IcalParseError);
  });

  it('returns an empty list for a calendar that genuinely has no events', () => {
    const { events } = parseIcal('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n');
    expect(events).toEqual([]);
  });

  it('unfolds continuation lines', () => {
    const folded =
      'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20261106\r\nDTEND;VALUE=DATE:20261108\r\n' +
      'SUMMARY:A very long summary that Airbnb\r\n  split across two lines\r\n' +
      'UID:folded@example.com\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';

    const [event] = parseIcal(folded).events;
    expect(event.summary).toBe('A very long summary that Airbnb split across two lines');
    expect(event.start).toBe('2026-11-06');
  });

  it('survives LF-only bodies', () => {
    const { events } = parseIcal(OCT_23.replace(/\r\n/g, '\n'));
    expect(events).toHaveLength(4);
  });

  it('defaults a missing DTEND to one night, per RFC 5545', () => {
    const body =
      'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20261226\r\nUID:x@y\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
    expect(parseIcal(body).events[0].end).toBe('2026-12-27');
  });

  it('keeps the date part of a DATE-TIME value', () => {
    const body =
      'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART:20261226T100000Z\r\nDTEND:20261228T100000Z\r\nUID:x@y\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
    const [event] = parseIcal(body).events;
    expect([event.start, event.end]).toEqual(['2026-12-26', '2026-12-28']);
  });

  it('skips impossible and backwards dates instead of rolling them over', () => {
    // 31 February would become 3 March via Date arithmetic and block the wrong
    // nights. It has to be refused, not corrected.
    const body =
      'BEGIN:VCALENDAR\r\n' +
      'BEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20260231\r\nDTEND;VALUE=DATE:20260301\r\nUID:a@y\r\nEND:VEVENT\r\n' +
      'BEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20261108\r\nDTEND;VALUE=DATE:20261106\r\nUID:b@y\r\nEND:VEVENT\r\n' +
      'BEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20261106\r\nDTEND;VALUE=DATE:20261108\r\nUID:c@y\r\nEND:VEVENT\r\n' +
      'END:VCALENDAR\r\n';

    const { events, skipped } = parseIcal(body);
    expect(skipped).toBe(2);
    expect(events.map((e) => e.uid)).toEqual(['c@y']);
  });

  it('ignores DTSTAMP, so an unchanged calendar fingerprints the same', () => {
    // Airbnb stamps every response with the current time. If DTSTAMP reached
    // the parsed shape, no two fetches would ever compare equal.
    const a = parseIcal(OCT_23);
    const b = parseIcal(OCT_23.replace(/DTSTAMP:\d{8}T\d{6}Z/g, 'DTSTAMP:20270101T000000Z'));
    expect(eventSetFingerprint(a.events)).toBe(eventSetFingerprint(b.events));
  });
});

describe('classifyEvents', () => {
  const on23rd = { today: '2026-10-23' };

  it('keeps the three real blocks and drops the window edge', () => {
    const { apply, dropped, heldForReview } = classifyEvents(parseIcal(OCT_23).events, on23rd);

    expect(apply.map((e) => [e.start, e.end])).toEqual([
      ['2026-10-23', '2026-11-01'],
      ['2026-11-06', '2026-11-08'],
      ['2026-12-26', '2026-12-28'],
    ]);
    expect(dropped).toHaveLength(1);
    expect(dropped[0].reason).toBe('window_edge');
    expect(dropped[0].event.start).toBe('2027-01-21');
    expect(heldForReview).toBe(false);
  });

  it('drops the 22 October window edge too, though the window was twice as wide', () => {
    // Same rule, a 180-day window instead of 90. This is the evidence that the
    // rule keys on the horizon and not on the span.
    const { apply, dropped } = classifyEvents(parseIcal(OCT_22).events, { today: '2026-10-22' });

    expect(apply.map((e) => e.start)).toEqual(['2026-10-22']);
    expect(dropped[0].reason).toBe('window_edge');
    expect(dropped[0].event.end).toBe('2027-10-23');
  });

  it('counts only the nights it would actually block', () => {
    // 9 + 2 + 2, with the 276-night horizon excluded.
    expect(classifyEvents(parseIcal(OCT_23).events, on23rd).totalNights).toBe(13);
  });

  it('drops events that are already over', () => {
    const { apply, dropped } = classifyEvents(parseIcal(OCT_22).events, { today: '2026-10-23' });
    expect(apply).toEqual([]);
    expect(dropped.map((d) => d.reason)).toEqual(['past', 'window_edge']);
  });

  it('keeps an event whose last night is tonight', () => {
    // Ends tomorrow, so tonight is still held. An off-by-one here frees an
    // occupied night on the day a guest is in the villa.
    const events = [{ uid: 'a', summary: '', start: '2026-10-20', end: '2026-10-24' }];
    expect(classifyEvents(events, on23rd).apply).toHaveLength(1);
  });

  it('holds the run for review when a surviving event is too long', () => {
    const events = [{ uid: 'a', summary: '', start: '2026-11-01', end: '2027-03-01' }];
    const result = classifyEvents(events, on23rd);

    expect(result.apply).toEqual([]);
    expect(result.dropped[0].reason).toBe('too_long');
    expect(result.heldForReview).toBe(true);
    expect(result.reviewReasons[0]).toContain('120 nights');
  });

  it('holds the run for review when the total is implausible', () => {
    const events = Array.from({ length: 10 }, (_, i) => ({
      uid: `e${i}`,
      summary: '',
      start: addMonths('2026-11-01', i),
      end: addMonths('2026-11-21', i),
    }));

    const result = classifyEvents(events, on23rd);
    expect(result.heldForReview).toBe(true);
    expect(result.reviewReasons.join(' ')).toContain('in total');
  });

  it('keeps a real far-future booking at a 12-month channel window', () => {
    // The regression this rule was rewritten for. With Airbnb's window at 12
    // months a genuine booking can end past today + 300 days. Dropping it as a
    // horizon would leave those nights on sale here and manufacture a double
    // booking. Short stay, so it is not the edge, so it is kept.
    const events = [{ uid: 'real', summary: 'Airbnb (Not available)', start: '2027-10-05', end: '2027-10-09' }];
    const { apply, dropped } = classifyEvents(events, on23rd);

    expect(dropped).toEqual([]);
    expect(apply).toHaveLength(1);
  });

  it('still drops the horizon when it sits beside a real far-future booking', () => {
    // Both reach past today + 300. Only the long one is the channel's edge.
    const events = [
      { uid: 'real', summary: '', start: '2027-10-05', end: '2027-10-09' },
      { uid: 'edge', summary: '', start: '2027-01-21', end: '2027-10-24' },
    ];
    const { apply, dropped } = classifyEvents(events, on23rd);

    expect(apply.map((e) => e.uid)).toEqual(['real']);
    expect(dropped.map((d) => [d.event.uid, d.reason])).toEqual([['edge', 'window_edge']]);
  });

  it('keeps a one-night edge, which is what a 12-month window produces', () => {
    // At a 12-month window the edge shrinks to the single night between the
    // window and the horizon. Harmless to apply, and the channel does say it
    // is unavailable.
    const events = [{ uid: 'edge', summary: '', start: '2027-10-23', end: '2027-10-24' }];
    expect(classifyEvents(events, on23rd).apply).toHaveLength(1);
  });

  it('finds nothing to drop when the channel has no availability window', () => {
    // If the host switches Airbnb to "all future dates" the trailing event
    // disappears. The rule must not then start eating real bookings.
    const events = parseIcal(OCT_23).events.filter((e) => e.start !== '2027-01-21');
    const { apply, dropped } = classifyEvents(events, on23rd);

    expect(apply).toHaveLength(3);
    expect(dropped).toEqual([]);
  });
});

/** Crude month shift, good enough for building test spans. */
function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, d));
  return date.toISOString().slice(0, 10);
}
