/**
 * Date-range rules for the guest calendar. Dates are "YYYY-MM-DD" strings,
 * which compare correctly as strings, and an unavailable *night* D means the
 * stay [D, D+1) is taken, matching check_availability() in the database.
 *
 * Check-out is exclusive: a guest may check out on the morning of a night
 * someone else has booked, but may not stay that night.
 */

/** Whether every night in [checkIn, checkOut) is free. */
export function isRangeAvailable(unavailable: ReadonlySet<string>, checkIn: string, checkOut: string): boolean {
  for (const night of unavailable) {
    if (night >= checkIn && night < checkOut) return false;
  }
  return true;
}

/**
 * The latest check-out allowed for a given check-in: the first unavailable night
 * on or after check-in. Returns null when nothing ahead is taken, and returns
 * checkIn itself when the check-in night is taken (no valid check-out).
 */
export function latestCheckOut(unavailable: ReadonlySet<string>, checkIn: string): string | null {
  let first: string | null = null;
  for (const night of unavailable) {
    if (night >= checkIn && (first === null || night < first)) first = night;
  }
  return first;
}
