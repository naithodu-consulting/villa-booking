import { describe, it, expect } from 'vitest';
import { isRangeAvailable, latestCheckOut, firstAvailableNight } from '../availability';

const taken = new Set(['2026-10-10', '2026-10-11', '2026-10-20']);

describe('isRangeAvailable', () => {
  it('is true when no taken night falls inside the stay', () => {
    expect(isRangeAvailable(taken, '2026-10-01', '2026-10-05')).toBe(true);
  });

  it('allows checking out on the morning of a taken night', () => {
    expect(isRangeAvailable(taken, '2026-10-08', '2026-10-10')).toBe(true);
  });

  it('allows checking in on the morning the previous stay checks out', () => {
    expect(isRangeAvailable(taken, '2026-10-12', '2026-10-15')).toBe(true);
  });

  it('is false when the stay includes a taken night', () => {
    expect(isRangeAvailable(taken, '2026-10-09', '2026-10-11')).toBe(false);
    expect(isRangeAvailable(taken, '2026-10-11', '2026-10-12')).toBe(false);
    expect(isRangeAvailable(taken, '2026-10-15', '2026-10-25')).toBe(false);
  });

  it('is true for an empty set', () => {
    expect(isRangeAvailable(new Set(), '2026-10-01', '2026-12-01')).toBe(true);
  });
});

describe('latestCheckOut', () => {
  it('is the first taken night after check-in', () => {
    expect(latestCheckOut(taken, '2026-10-01')).toBe('2026-10-10');
    expect(latestCheckOut(taken, '2026-10-12')).toBe('2026-10-20');
  });

  it('is null when nothing ahead is taken', () => {
    expect(latestCheckOut(taken, '2026-10-21')).toBeNull();
  });

  it('equals check-in when the check-in night itself is taken', () => {
    expect(latestCheckOut(taken, '2026-10-10')).toBe('2026-10-10');
  });
});

describe('firstAvailableNight', () => {
  it('returns the date itself when that night is free', () => {
    expect(firstAvailableNight(new Set(), '2026-10-13')).toBe('2026-10-13');
  });

  it('skips a run of taken nights', () => {
    const taken = new Set(['2026-10-13', '2026-10-14', '2026-10-15']);
    expect(firstAvailableNight(taken, '2026-10-13')).toBe('2026-10-16');
  });

  it('crosses a month boundary', () => {
    const taken = new Set(['2026-10-30', '2026-10-31']);
    expect(firstAvailableNight(taken, '2026-10-30')).toBe('2026-11-01');
  });

  it('gives up at the horizon rather than guessing past what is loaded', () => {
    // Every night in the window is taken, so there is no verified answer.
    const taken = new Set<string>();
    let d = '2026-10-13';
    for (let i = 0; i <= 10; i++) {
      taken.add(d);
      const [y, m, day] = d.split('-').map(Number);
      d = new Date(Date.UTC(y, m - 1, day + 1)).toISOString().slice(0, 10);
    }
    expect(firstAvailableNight(taken, '2026-10-13', 5)).toBeNull();
  });
});
