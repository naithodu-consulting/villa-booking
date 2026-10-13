import { describe, it, expect } from 'vitest';
import { cancellationOutlook } from '@/lib/cancellation';

/**
 * Check-in 16 Oct 2026 at 14:00 IST. With tiers at 30 and 15 days, the
 * deadlines are 16 Sep 14:00 and 1 Oct 14:00.
 *
 * These decide whether a guest is told money can come back, so the boundaries
 * matter: the bug this replaced advertised a refund to guests who never had one.
 */
const CHECK_IN = '2026-10-16';
const TIME = '14:00';
const TOTAL = 10_000_00; // ₹10,000 in paise

const fmt = {
  long: (iso: string) => iso,
  short: (iso: string) => iso,
  time: () => '2:00 pm',
};

const outlook = (bookedAt: string) =>
  cancellationOutlook(CHECK_IN, TIME, TOTAL, bookedAt, fmt);

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

  it('pays the better tier on the deadline itself', () => {
    // 16 Sep 14:00 IST is 08:30 UTC. "30 or more days before" includes day 30.
    expect(outlook('2026-09-16T08:30:00Z').state).toBe('full');
    // A minute later the top tier has gone.
    expect(outlook('2026-09-16T08:31:00Z').state).toBe('partial');
  });

  it('drops to non-refundable a minute after the last deadline', () => {
    expect(outlook('2026-10-01T08:30:00Z').state).toBe('partial');
    expect(outlook('2026-10-01T08:31:00Z').state).toBe('none');
  });

  it('reports the last moment a refund is available', () => {
    expect(outlook('2026-08-01T06:00:00Z').lastRefundableAt).toBe('2026-10-01, 2:00 pm');
    expect(outlook('2026-09-20T06:00:00Z').lastRefundableAt).toBe('2026-10-01, 2:00 pm');
  });

  it('closes with what happens after the last refundable deadline', () => {
    const o = outlook('2026-09-20T06:00:00Z');
    expect(o.rows[o.rows.length - 1].when).toBe('After 2026-10-01, 2:00 pm');
  });
});
