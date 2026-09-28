/**
 * GSTIN shape: 2-digit state code, 10-character PAN, entity number, 'Z', check
 * character. Kept in step with the bookings_guest_gstin_format constraint (00038).
 * Shape only: the check character is not verified, so a typo that keeps the
 * shape still passes. The GST portal is the authority on whether it is real.
 */
export const GSTIN_PATTERN = '[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]';
export const GSTIN_RE = new RegExp(`^${GSTIN_PATTERN}$`);
