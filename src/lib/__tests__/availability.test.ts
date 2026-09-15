import { describe, it, expect } from 'vitest';
import { isRangeAvailable, latestCheckOut } from '../availability';

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
