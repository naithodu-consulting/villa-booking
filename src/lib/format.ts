/**
 * Display formatters. These convert stored values for reading; they never change
 * the stored shape.
 *
 * Times are held throughout the app as 24-hour "HH:MM" (getProperty normalises to
 * that, and <input type="time"> requires it), but every guest-facing surface reads
 * 12-hour. Format at the point of display rather than converting the data, so the
 * admin form and the API payloads keep the value they need.
 */

/**
 * "14:00" to "2:00 PM". Accepts "HH:MM" or "HH:MM:SS".
 * Returns the input unchanged if it is not a time we recognise, so a bad value
 * shows up as itself rather than as a misleading "12:00 AM".
 */
export function formatTime12(time: string | null | undefined): string {
  if (!time) return '';
  const m = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!m) return time;

  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (hours > 23 || minutes > 59) return time;

  const period = hours < 12 ? 'AM' : 'PM';
  // 0 and 12 both display as 12 (midnight, noon); everything else is hours % 12.
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${display}:${m[2]} ${period}`;
}

/**
 * "917760777876" to "+91 77607 77876".
 *
 * Numbers are stored bare (no punctuation) because wa.me and tel: links need
 * them that way, but pages were printing the raw value, so the Contact page and
 * Stay Guide showed "+917760777876" while the announcement bar showed the
 * grouped form. Only the Indian 91 + 10-digit shape is grouped; anything else is
 * returned with a leading + so an unexpected number still reads as a number.
 */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');

  // A bare 10-digit Indian mobile (starts 6-9) is a plausible way to fill in
  // PROPERTY_PHONE. Without this it rendered as "+7760777876" — a country-code
  // prefix on a number that has no country code.
  const national = /^[6-9]\d{9}$/.test(digits) ? `91${digits}` : digits;

  const m = /^91(\d{5})(\d{5})$/.exec(national);
  return m ? `+91 ${m[1]} ${m[2]}` : `+${national}`;
}

/** The property's timezone. Booking dates are calendar dates in India, not UTC
 *  instants, so "today" must be resolved here rather than from the clock. */
export const PROPERTY_TZ = 'Asia/Kolkata';

/**
 * Today's calendar date at the property, as "YYYY-MM-DD".
 *
 * `new Date().toISOString().split('T')[0]` returns the *UTC* date, which is
 * yesterday in India between 00:00 and 05:30 IST. That let the date pickers
 * offer, and default to, a check-in that had already passed locally.
 *
 * en-CA formats as YYYY-MM-DD, and passing timeZone makes the result identical
 * on the server and in the browser regardless of where either one is running.
 */
export function todayISO(timeZone: string = PROPERTY_TZ): string {
  return new Date().toLocaleDateString('en-CA', { timeZone });
}

/**
 * Shift a "YYYY-MM-DD" date by whole days.
 *
 * Arithmetic is done on the date parts in UTC so it can never be pushed across
 * a boundary by the local offset or by a daylight-saving change.
 */
export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().split('T')[0];
}
