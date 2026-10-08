import { describe, it, expect } from 'vitest';
import { planRefreshRequests } from '@/components/guest/useNightCalendar';

/**
 * The calendar endpoint refuses spans over 186 nights (~6 months) and serves
 * one unbroken span per request, so a refresh has to be split on both the
 * length limit and on any gap in the months being reloaded.
 */
describe('planRefreshRequests', () => {
  const months = (...isos: string[]) => isos;

  it('returns nothing for an empty set', () => {
    expect(planRefreshRequests([])).toEqual([]);
  });

  it('keeps a contiguous run within the limit as a single request', () => {
    const plan = planRefreshRequests(
      months('2026-10-01', '2026-11-01', '2026-12-01'),
    );
    expect(plan).toEqual([{ start: '2026-10-01', count: 3 }]);
  });

  it('splits a long contiguous run at the six-month limit', () => {
    // Eight contiguous months would be ~243 nights in one request — a 422.
    const plan = planRefreshRequests(
      months(
        '2026-10-01', '2026-11-01', '2026-12-01', '2027-01-01',
        '2027-02-01', '2027-03-01', '2027-04-01', '2027-05-01',
      ),
    );
    expect(plan).toEqual([
      { start: '2026-10-01', count: 6 },
      { start: '2027-04-01', count: 2 },
    ]);
  });

  it('starts a new request at a gap so distant months are not skipped', () => {
    // The case that matters: six months loaded on mount, plus a stay booked
    // far ahead. A contiguous plan would re-read Oct–Mar and silently leave
    // the August months holding the availability they first loaded with.
    const plan = planRefreshRequests(
      months(
        '2026-10-01', '2026-11-01', '2026-12-01',
        '2027-08-01', '2027-09-01',
      ),
    );
    expect(plan).toEqual([
      { start: '2026-10-01', count: 3 },
      { start: '2027-08-01', count: 2 },
    ]);
  });

  it('covers every month it is given, across gaps and the length limit', () => {
    const input = months(
      '2026-10-01', '2026-11-01', '2026-12-01', '2027-01-01',
      '2027-02-01', '2027-03-01', '2027-04-01',
      '2027-09-01',
    );
    const plan = planRefreshRequests(input);
    // Expand the plan back into the months it would actually fetch.
    const covered = new Set<string>();
    for (const { start, count } of plan) {
      const [y, m] = start.split('-').map(Number);
      for (let i = 0; i < count; i++) {
        covered.add(new Date(Date.UTC(y, m - 1 + i, 1)).toISOString().slice(0, 10));
      }
    }
    for (const month of input) expect(covered.has(month)).toBe(true);
    expect(plan.every((r) => r.count <= 6)).toBe(true);
  });

  it('crosses a year boundary without treating it as a gap', () => {
    const plan = planRefreshRequests(months('2026-12-01', '2027-01-01'));
    expect(plan).toEqual([{ start: '2026-12-01', count: 2 }]);
  });
});
