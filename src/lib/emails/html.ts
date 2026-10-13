/**
 * Small helpers shared by the email templates.
 *
 * Email clients are a decade behind browsers: these render with tables and
 * inline styles, and the formatting here is deliberately plain text rather
 * than anything that needs CSS to read correctly.
 */

/** Guest-supplied text (name, email, phone) must not become markup in an email. */
export function esc(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Paise to "₹70,092". Amounts are whole rupees on every guest-facing surface. */
export function inr(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

const IST = 'Asia/Kolkata';

/**
 * A stored "YYYY-MM-DD" is a calendar date at the property, not an instant.
 * Reading it at noon UTC keeps it on the same day in IST however the server
 * is configured.
 */
function istNoon(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

/** "20 Nov 2026" */
export function dateMedium(iso: string): string {
  return istNoon(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: IST,
  });
}

/**
 * "Fri, 20 Nov 2026".
 *
 * en-GB, not en-IN: both render Indian date order, but en-IN puts a second
 * comma before the year ("Mon, 23 Nov, 2026").
 */
export function dateWithWeekday(iso: string): string {
  return istNoon(iso).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: IST,
  });
}

/**
 * One stay as a single phrase: "Fri 20 to Mon 23 Nov 2026", collapsing the
 * month and year when both ends share them.
 */
export function stayRange(checkIn: string, checkOut: string): string {
  const part = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    istNoon(iso).toLocaleDateString('en-GB', { ...opts, timeZone: IST });

  const sameMonth =
    part(checkIn, { month: 'short', year: 'numeric' }) ===
    part(checkOut, { month: 'short', year: 'numeric' });

  const from = sameMonth
    ? part(checkIn, { weekday: 'short', day: 'numeric' })
    : `${part(checkIn, { weekday: 'short', day: 'numeric' })} ${part(checkIn, { month: 'short' })}`;

  return `${from} to ${part(checkOut, { weekday: 'short', day: 'numeric' })} ${part(checkOut, { month: 'short', year: 'numeric' })}`;
}

/**
 * A timestamp as the calendar date it falls on in India, "7 Oct 2026".
 *
 * A booking paid at 1:00 am IST is stored as the previous day in UTC, so the
 * zone has to be applied rather than slicing the ISO string.
 */
export function timestampDate(ts: string): string {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: IST,
  });
}

/** A timestamp as "7 Oct 2026, 4:32 pm" in India. */
export function dateTimeMedium(ts: string): string {
  const d = new Date(ts);
  const clock = d
    .toLocaleTimeString('en-GB', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: IST,
    })
    .toLowerCase()
    .replace(/\s+/g, ' ');
  return `${timestampDate(ts)}, ${clock}`;
}

/** "Wed 21 Oct" */
export function dateDayMonth(iso: string): string {
  const d = istNoon(iso);
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: IST });
  return `${weekday} ${dateShort(iso)}`;
}

/** "21 Oct" */
export function dateShort(iso: string): string {
  return istNoon(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', timeZone: IST,
  });
}

/**
 * "14:00" to "2:00 pm". Lowercase: the meridiem reads as a unit next to a
 * time rather than as shouting, and every email surface uses this form.
 */
export function time12(time: string | null | undefined): string {
  if (!time) return '';
  const m = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!m) return time;
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (hours > 23 || minutes > 59) return time;
  const period = hours < 12 ? 'am' : 'pm';
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${display}:${m[2]} ${period}`;
}

/** "6 adults, 2 children", dropping a count of zero and singularising. */
export function guestLine(adults: number, children: number): string {
  const parts = [`${adults} ${adults === 1 ? 'adult' : 'adults'}`];
  if (children > 0) parts.push(`${children} ${children === 1 ? 'child' : 'children'}`);
  return parts.join(', ');
}
