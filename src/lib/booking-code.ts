/**
 * Guest-facing booking codes, e.g. "V19-7KQ-M4X".
 *
 *   V19   villa prefix (properties.booking_code_prefix)
 *   7KQM4 five random characters, Crockford Base32 (no I, L, O, U)
 *   X     check character: sum(value[i] * (i + 1)) mod 31, as a Base32 symbol
 *
 * Codes are generated in the database (generate_booking_code, migration 00023)
 * when a booking becomes confirmed. This module mirrors that algorithm so a
 * code typed by a guest or staff member can be normalised and validated before
 * any lookup. Keep the two in step: the tests check them against each other.
 *
 * A code is a label, not a secret. It must never be the only key to a booking.
 */

export const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function checkChar(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const v = CROCKFORD.indexOf(body[i]);
    if (v < 0) throw new Error(`Not a Crockford Base32 character: ${body[i]}`);
    sum += v * (i + 1);
  }
  return CROCKFORD[sum % 31];
}

export function formatBookingCode(prefix: string, body: string): string {
  const full = body + checkChar(body);
  return `${prefix}-${full.slice(0, 3)}-${full.slice(3)}`;
}

/**
 * Accepts what people actually type: any case, with or without hyphens or
 * spaces, O for 0 and I or L for 1. Returns the canonical "V19-7KQ-M4X" form,
 * or null when the input is not a valid code.
 */
export function normalizeBookingCode(input: string): string | null {
  const compact = input.toUpperCase().replace(/[\s-]/g, '');
  const m = /^([A-Z][A-Z0-9]{1,3})([A-Z0-9]{6})$/.exec(compact);
  if (!m) return null;
  const [, prefix, tail] = m;
  const fixed = tail.replace(/O/g, '0').replace(/[IL]/g, '1');
  if ([...fixed].some((c) => !CROCKFORD.includes(c))) return null;
  const body = fixed.slice(0, 5);
  if (checkChar(body) !== fixed[5]) return null;
  return formatBookingCode(prefix, body);
}
