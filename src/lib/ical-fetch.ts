import 'server-only';

/**
 * Fetching a channel's .ics feed.
 *
 * Kept apart from ical.ts so the parser stays pure and testable. Everything
 * here is about treating a third party's response as hostile input.
 *
 * The rule this file exists to enforce: a fetch that did not plainly succeed
 * must raise, never return an empty calendar. The importer replaces a feed's
 * blocked_dates wholesale, so "I could not read it" arriving as "nothing is
 * booked" would free every imported night at once. That is the single worst
 * failure this feature can have, and it is prevented here rather than at the
 * call site.
 */

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 1_000_000;

export class IcalFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IcalFetchError';
  }
}

export interface FetchedCalendar {
  body: string;
  bytes: number;
  status: number;
}

export async function fetchIcal(url: string): Promise<FetchedCalendar> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new IcalFetchError('Feed URL is not a URL.');
  }

  if (parsed.protocol !== 'https:') {
    throw new IcalFetchError('Feed URL must be https.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(parsed, {
      signal: controller.signal,
      // Airbnb sets three cookies on this response and needs none of them.
      // Sending or storing them would be a way for a feed to follow us around.
      credentials: 'omit',
      // 'error' rather than 'follow': a redirect is how an https feed would
      // walk us somewhere else, and this feed has never needed one.
      redirect: 'error',
      headers: { Accept: 'text/calendar, text/plain;q=0.5' },
      // Next caches fetches in some contexts; a calendar read must always be
      // the live one.
      cache: 'no-store',
    });
  } catch (err) {
    const reason = err instanceof Error && err.name === 'AbortError'
      ? `no response in ${TIMEOUT_MS / 1000}s`
      : 'network error';
    throw new IcalFetchError(`Could not reach the feed: ${reason}.`);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new IcalFetchError(`Feed returned HTTP ${response.status}.`);
  }

  // Length is checked before reading where the server declares it, and again
  // after, because Content-Length is a claim rather than a fact.
  const declared = Number(response.headers.get('content-length') ?? '0');
  if (declared > MAX_BYTES) {
    throw new IcalFetchError(`Feed is ${declared} bytes, over the ${MAX_BYTES} limit.`);
  }

  const body = await response.text();
  const bytes = Buffer.byteLength(body, 'utf8');
  if (bytes > MAX_BYTES) {
    throw new IcalFetchError(`Feed is ${bytes} bytes, over the ${MAX_BYTES} limit.`);
  }
  if (bytes === 0) {
    throw new IcalFetchError('Feed returned an empty body.');
  }

  return { body, bytes, status: response.status };
}

/**
 * Strips the credential from a feed URL so it can appear in a log or an error.
 *
 * Airbnb's link carries its secret in `?t=`, and the whole URL is effectively a
 * bearer token: anyone holding it can read the villa's occupancy. It must never
 * reach a log line, an error message or an API response intact.
 */
export function redactFeedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return '[unparseable feed url]';
  }
}
