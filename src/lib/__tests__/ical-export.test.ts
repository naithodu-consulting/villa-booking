import { describe, it, expect } from 'vitest';
import { collapseNights, buildIcalCalendar, foldLine, icalTimestamp } from '@/lib/ical-export';
import { parseIcal, nightsBetween } from '@/lib/ical';

const PROPERTY = 'a1b2c3d4-0000-0000-0000-000000000001';
const NOW = new Date('2026-10-24T08:45:00.000Z');

const build = (nights: string[]) =>
  buildIcalCalendar(collapseNights(nights), { propertyId: PROPERTY, now: NOW });

describe('collapseNights', () => {
  it('joins consecutive nights into one half-open range', () => {
    // Three nights held means check-out on the fourth day.
    expect(collapseNights(['2026-11-06', '2026-11-07', '2026-11-08'])).toEqual([
      { start: '2026-11-06', end: '2026-11-09' },
    ]);
  });

  it('splits on a gap', () => {
    expect(collapseNights(['2026-11-06', '2026-11-07', '2026-12-26'])).toEqual([
      { start: '2026-11-06', end: '2026-11-08' },
      { start: '2026-12-26', end: '2026-12-27' },
    ]);
  });

  it('turns a single night into a one-night range', () => {
    expect(collapseNights(['2026-11-06'])).toEqual([{ start: '2026-11-06', end: '2026-11-07' }]);
  });

  it('returns nothing for no nights', () => {
    expect(collapseNights([])).toEqual([]);
  });

  it('does not join across a month or year boundary incorrectly', () => {
    expect(collapseNights(['2026-12-31', '2027-01-01'])).toEqual([
      { start: '2026-12-31', end: '2027-01-02' },
    ]);
  });
});

describe('buildIcalCalendar', () => {
  it('uses CRLF line endings throughout', () => {
    const ics = build(['2026-11-06']);
    expect(ics.includes('\r\n')).toBe(true);
    // No bare LF anywhere: every \n must be preceded by \r.
    expect(/[^\r]\n/.test(ics)).toBe(false);
    expect(ics.endsWith('\r\n')).toBe(true);
  });

  it('writes DTEND as the checkout day, not the last night', () => {
    const ics = build(['2026-11-06', '2026-11-07']);
    expect(ics).toContain('DTSTART;VALUE=DATE:20261106');
    expect(ics).toContain('DTEND;VALUE=DATE:20261108');
  });

  it('carries no guest data of any kind', () => {
    const ics = build(['2026-11-06']);
    for (const leak of ['@gmail', 'guest', 'phone', 'MNG-', 'INR', '+91']) {
      expect(ics.toLowerCase()).not.toContain(leak.toLowerCase());
    }
    expect(ics).toContain('SUMMARY:Villa 19 (Not available)');
  });

  it('is byte-identical when the calendar has not changed', () => {
    // UIDs are derived from the range, not random, so a channel and a diff can
    // both tell a real change from a re-publish.
    expect(build(['2026-11-06', '2026-12-26'])).toBe(build(['2026-11-06', '2026-12-26']));
  });

  it('still produces a valid empty calendar, for the caller to refuse to serve', () => {
    // Valid, and dangerous: to a channel this means "sell everything". The
    // route is what must never serve it by accident; the builder stays honest.
    const ics = build([]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).not.toContain('BEGIN:VEVENT');
  });

  it('escapes a property name that would otherwise split the value', () => {
    const ics = buildIcalCalendar([{ start: '2026-11-06', end: '2026-11-07' }], {
      propertyId: PROPERTY,
      summary: 'Villa 19, Urwa; not available',
      now: NOW,
    });
    expect(ics).toContain('SUMMARY:Villa 19\\, Urwa\\; not available');
  });
});

describe('round trip through our own parser', () => {
  it('parses back to exactly the ranges it was built from', () => {
    // The strongest check available: the export and the import agree about
    // what a night is. If either side ever drifts on the exclusive-end rule,
    // this fails rather than quietly shifting someone's last night.
    const nights = ['2026-11-06', '2026-11-07', '2026-12-26', '2026-12-27'];
    const { events, skipped } = parseIcal(build(nights));

    expect(skipped).toBe(0);
    expect(events.map((e) => [e.start, e.end])).toEqual([
      ['2026-11-06', '2026-11-08'],
      ['2026-12-26', '2026-12-28'],
    ]);
    expect(events.reduce((n, e) => n + nightsBetween(e.start, e.end), 0)).toBe(nights.length);
  });

  it('survives a long run', () => {
    const nights = Array.from({ length: 40 }, (_, i) => {
      const d = new Date(Date.UTC(2026, 10, 1 + i));
      return d.toISOString().slice(0, 10);
    });
    const { events } = parseIcal(build(nights));

    expect(events).toHaveLength(1);
    expect(nightsBetween(events[0].start, events[0].end)).toBe(40);
  });
});

describe('foldLine', () => {
  it('leaves a short line alone', () => {
    expect(foldLine('DTSTART;VALUE=DATE:20261106')).toBe('DTSTART;VALUE=DATE:20261106');
  });

  it('folds at 75 octets with a leading space on continuations', () => {
    const folded = foldLine('UID:' + 'a'.repeat(200));
    const parts = folded.split('\r\n');

    expect(parts.length).toBeGreaterThan(1);
    expect(Buffer.byteLength(parts[0], 'utf8')).toBe(75);
    for (const part of parts.slice(1)) expect(part.startsWith(' ')).toBe(true);
    // Unfolding returns the original.
    expect(folded.replace(/\r\n /g, '')).toBe('UID:' + 'a'.repeat(200));
  });

  it('never splits a multi-byte character across the fold', () => {
    // Every continuation byte that started a line would corrupt the character.
    const folded = foldLine('SUMMARY:' + 'é'.repeat(80));
    for (const part of folded.split('\r\n')) {
      expect(part.includes('�')).toBe(false);
    }
    expect(folded.replace(/\r\n /g, '')).toBe('SUMMARY:' + 'é'.repeat(80));
  });
});

describe('icalTimestamp', () => {
  it('writes a compact UTC stamp', () => {
    expect(icalTimestamp(NOW)).toBe('20261024T084500Z');
  });
});
