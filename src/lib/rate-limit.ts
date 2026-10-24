import 'server-only';

/**
 * A small fixed-window rate limiter, keyed by client IP.
 *
 * ── What this is for ──────────────────────────────────────────────────────
 *
 * /api/bookings/create-order takes no authentication and writes a `pending`
 * booking that holds its dates for 15 minutes before any payment exists
 * (create_booking_atomic, 00092). check_availability() counts a live hold as
 * blocking, so a hold is indistinguishable from a confirmed booking as far as
 * availability goes. A stay is capped at 10 nights, so roughly 19 non-
 * overlapping requests blanket the six-month calendar the site loads, and
 * repeating that every 15 minutes keeps the villa fully "booked" for about 76
 * requests an hour. Nothing in the request is hard to produce: propertyId is
 * public, and the phone and email only have to match a shape.
 *
 * /api/discount/validate is the other unauthenticated endpoint, and it is an
 * enumeration oracle over a 3-20 character code space.
 *
 * ── What this is NOT ──────────────────────────────────────────────────────
 *
 * The counters live in the memory of one serverless instance. Vercel runs
 * several and recycles them, so the effective allowance is higher than the
 * numbers below and resets unpredictably. This blunts a single-source flood;
 * it does not stop a distributed one, and it is not a substitute for a real
 * limiter at the edge.
 *
 * The durable fix is a Vercel Firewall rate-limit rule on these two paths, or a
 * shared counter in Postgres or Upstash. This exists because an in-process
 * limiter that ships today is worth more than an edge rule that is still a
 * plan, and because it fails closed on the one case that matters most: a
 * single script hammering one path.
 */

interface Window {
  count: number;
  /** Epoch ms when this window resets. */
  resetAt: number;
}

/** Keyed "<bucket>:<ip>". */
const windows = new Map<string, Window>();

/**
 * Drop windows that have already reset, so an instance that lives a long time
 * does not accumulate one entry per IP it has ever seen. Called on each check,
 * which is cheap: the map only holds the current window's callers.
 */
function sweep(now: number) {
  if (windows.size < 1000) return;
  for (const [key, win] of windows) {
    if (win.resetAt <= now) windows.delete(key);
  }
}

/**
 * The caller's IP, as far as it can be known.
 *
 * On Vercel, x-forwarded-for is set by the proxy and its first entry is the
 * client. The header is client-settable in general, so a determined caller can
 * rotate it; that is a reason not to rely on this as a security boundary, not a
 * reason to skip it. Returns a fixed key when no header is present, so requests
 * with no identifiable origin share one bucket rather than each getting their
 * own fresh allowance.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  return headers.get('x-real-ip')?.trim() || 'unknown';
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets. For the Retry-After header. */
  retryAfter: number;
}

/**
 * Counts this request against `bucket` for this IP.
 *
 * `limit` requests are allowed per `windowMs`. The window is fixed rather than
 * sliding: simpler, and the imprecision at a boundary does not matter when the
 * allowance is already approximate for the reasons in the header.
 */
export function rateLimit(
  headers: Headers,
  bucket: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const key = `${bucket}:${clientIp(headers)}`;
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  return { ok: true, retryAfter: 0 };
}

/**
 * Limits chosen so a real guest never meets them.
 *
 * A guest sends one create-order per payment attempt, plus a few only if the
 * price changed under them, a card was declined, or they went back and changed
 * dates. Four in a session is already unusual.
 *
 * The number is 10 rather than 4 because of who shares an IP. Indian mobile
 * carriers run large-scale CGNAT, so many subscribers leave through one public
 * address, and `clientIp` cannot tell them apart. The two failure modes are not
 * symmetric: throttling an attacker costs nothing, while throttling a real
 * guest mid-booking loses the sale outright and tells them to phone instead.
 * Ten leaves room for two or three genuine guests behind one carrier address
 * while still stopping a naive flood well short of the roughly 19 requests per
 * 15 minutes needed to hold the whole six-month calendar.
 *
 * Tune it here if the villa ever sees a legitimate guest hit it; the logs will
 * show a 429 with a real booking behind it. A distributed flood needs the
 * Vercel Firewall rule described above, not a smaller number here.
 *
 * Promo codes are typed by hand, so ten attempts in five minutes covers every
 * typo a person makes and stops a script enumerating the code space.
 */
export const LIMITS = {
  createOrder: { bucket: 'create-order', limit: 10, windowMs: 10 * 60_000 },
  discountValidate: { bucket: 'discount-validate', limit: 10, windowMs: 5 * 60_000 },
  // The channel calendar export. Deliberately loose: a booking channel polls a
  // handful of times a day and a leaked URL is read-only, so this is here to
  // stop a leaked link becoming free database load, not to ration a legitimate
  // caller. Set far above any plausible polling rate - locking Airbnb out of
  // our calendar would be a worse failure than serving it too often.
  icalExport: { bucket: 'ical-export', limit: 30, windowMs: 10 * 60_000 },
} as const;

/** The 429 body and headers, shared so both routes answer identically. */
export function tooManyRequests(retryAfter: number, message: string) {
  return Response.json(
    { error: message },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  );
}
