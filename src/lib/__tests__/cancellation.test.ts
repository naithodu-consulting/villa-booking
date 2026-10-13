import { describe, it, expect } from 'vitest';
import { cancellationOutlook } from '@/lib/cancellation';

/**
 * Check-in 16 Oct 2026. Tiers at 30 and 15 days, and each deadline is the end
 * of the day before the day it counts back to, so:
 *
 *   100% through 15 Sep 23:59:59 IST (18:29:59 UTC)
 *    50% through 30 Sep 23:59:59 IST (18:29:59 UTC)
 *
 * These decide whether a guest is told money can come back, so the boundaries
 * matter: the bug this replaced advertised a refund to guests who never had one.
 */
const CHECK_IN = '2026-10-16';
const TOTAL = 10_000_00; // ₹10,000 in paise

const fmt = {
  long: (iso: string) => iso,
  short: (iso: string) => iso,
};

const outlook = (bookedAt: string) =>
  cancellationOutlook(CHECK_IN, TOTAL, bookedAt, fmt);

describe('cancellationOutlook', () => {
  it('is fully refundable when booked before the 30-day deadline', () => {
    const o = outlook('2026-08-01T06:00:00Z');
    expect(o.state).toBe('full');
    // Both refundable tiers, plus the closing no-refund row.
    expect(o.rows).toHaveLength(3);
    expect(o.rows[0].refundPaise).toBe(TOTAL);
    expect(o.rows[1].refundPaise).toBe(TOTAL / 2);
    expect(o.rows[2].refundPaise).toBe(0);
  });

  it('is partially refundable between the two deadlines', () => {
    const o = outlook('2026-09-20T06:00:00Z');
    expect(o.state).toBe('partial');
    expect(o.rows).toHaveLength(2);
    expect(o.rows[0].refundPaise).toBe(TOTAL / 2);
    expect(o.rows[1].refundPaise).toBe(0);
  });

  it('relabels the surviving top row as "Until", not a mid-ladder window', () => {
    const o = outlook('2026-09-20T06:00:00Z');
    expect(o.rows[0].when).toMatch(/^Until /);
  });

  it('is non-refundable when booked inside the final window', () => {
    const o = outlook('2026-10-13T06:00:00Z');
    expect(o.state).toBe('none');
    expect(o.rows).toEqual([]);
    expect(o.lastRefundableAt).toBeUndefined();
  });

  it('keeps the top tier through the whole of its last day', () => {
    // 15 Sep 23:59:59 IST is 18:29:59 UTC.
    expect(outlook('2026-09-15T18:29:00Z').state).toBe('full');
    // Past midnight IST the top tier has gone.
    expect(outlook('2026-09-15T18:31:00Z').state).toBe('partial');
  });

  it('drops to non-refundable once the last day has ended', () => {
    expect(outlook('2026-09-30T18:29:00Z').state).toBe('partial');
    expect(outlook('2026-09-30T18:31:00Z').state).toBe('none');
  });

  it('states deadlines as the end of the previous day, never the check-in time', () => {
    const o = outlook('2026-08-01T06:00:00Z');
    expect(o.rows[0].when).toBe('Until 2026-09-15, 11:59 pm');
    expect(o.lastRefundableAt).toBe('2026-09-30, 11:59 pm');
  });

  it('closes with what happens after the last refundable deadline', () => {
    const o = outlook('2026-09-20T06:00:00Z');
    expect(o.rows[o.rows.length - 1].when).toBe('After 2026-09-30, 11:59 pm');
  });
});
