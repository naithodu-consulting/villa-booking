import { describe, it, expect } from 'vitest';
import { formatTime12, formatPhone, todayISO, addDaysISO } from '../format';

describe('formatTime12', () => {
  it('converts afternoon times', () => {
    expect(formatTime12('14:00')).toBe('2:00 PM');
    expect(formatTime12('23:59')).toBe('11:59 PM');
  });

  it('converts morning times', () => {
    expect(formatTime12('11:00')).toBe('11:00 AM');
    expect(formatTime12('09:30')).toBe('9:30 AM');
  });

  it('renders midnight and noon as 12, not 0', () => {
    expect(formatTime12('00:00')).toBe('12:00 AM');
    expect(formatTime12('00:15')).toBe('12:15 AM');
    expect(formatTime12('12:00')).toBe('12:00 PM');
    expect(formatTime12('12:45')).toBe('12:45 PM');
  });

  it('accepts the HH:MM:SS shape Postgres returns for a TIME column', () => {
    expect(formatTime12('14:00:00')).toBe('2:00 PM');
  });

  it('returns empty string for nullish input', () => {
    expect(formatTime12(null)).toBe('');
    expect(formatTime12(undefined)).toBe('');
    expect(formatTime12('')).toBe('');
  });

  it('passes through anything it cannot parse rather than inventing a time', () => {
    expect(formatTime12('not a time')).toBe('not a time');
    expect(formatTime12('25:00')).toBe('25:00');
    expect(formatTime12('12:99')).toBe('12:99');
  });
});

describe('formatPhone', () => {
  it('groups an Indian number stored with the country code', () => {
    expect(formatPhone('917760777876')).toBe('+91 77607 77876');
    expect(formatPhone('919876543210')).toBe('+91 98765 43210');
  });

  it('is idempotent on already-formatted input', () => {
    expect(formatPhone('+91 77607 77876')).toBe('+91 77607 77876');
  });

  it('assumes India for a bare 10-digit mobile', () => {
    expect(formatPhone('7760777876')).toBe('+91 77607 77876');
  });

  it('returns empty string for nullish input', () => {
    expect(formatPhone(null)).toBe('');
    expect(formatPhone(undefined)).toBe('');
    expect(formatPhone('')).toBe('');
  });

  it('passes through anything it cannot group, still as a number', () => {
    expect(formatPhone('12345')).toBe('+12345');
    expect(formatPhone('442071234567')).toBe('+442071234567');
  });
});

describe('todayISO / addDaysISO', () => {
  it('returns the property-local date, not the UTC one', () => {
    // 01:30 IST on 10 Sept is still 9 Sept in UTC. The booking calendar must
    // say the 10th, or the pickers offer a check-in that has already passed.
    const realNow = Date.now;
    Date.now = () => new Date('2026-09-10T01:30:00+05:30').getTime();
    const OriginalDate = global.Date;
    // @ts-expect-error - narrow shim for the constructor used inside todayISO
    global.Date = class extends OriginalDate {
      constructor(...a: unknown[]) {
        // @ts-expect-error - passthrough
        super(...(a.length ? a : [Date.now()]));
      }
    };
    try {
      expect(todayISO()).toBe('2026-09-10');
      expect(new OriginalDate('2026-09-10T01:30:00+05:30').toISOString().split('T')[0]).toBe('2026-09-09');
    } finally {
      global.Date = OriginalDate;
      Date.now = realNow;
    }
  });

  it('adds days without drifting across a timezone boundary', () => {
    expect(addDaysISO('2026-09-09', 1)).toBe('2026-09-10');
    expect(addDaysISO('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysISO('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDaysISO('2026-09-09', 0)).toBe('2026-09-09');
  });
});

import { addMonthsISO, formatCompactINR } from '../format';

describe('addMonthsISO', () => {
  it('returns the first of the following month, across year end', () => {
    expect(addMonthsISO('2026-12-15', 1)).toBe('2027-01-01');
    expect(addMonthsISO('2026-01-31', 1)).toBe('2026-02-01');
    expect(addMonthsISO('2026-09-01', 0)).toBe('2026-09-01');
  });
});

describe('formatCompactINR', () => {
  it('shortens thousands for calendar cells', () => {
    expect(formatCompactINR(1_200_000)).toBe('₹12k');
    expect(formatCompactINR(1_450_000)).toBe('₹14.5k');
    expect(formatCompactINR(1_600_000)).toBe('₹16k');
    expect(formatCompactINR(50_000)).toBe('₹500');
  });
});
