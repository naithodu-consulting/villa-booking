import { SITE_URL } from '@/lib/seo';

/**
 * The host a guest booked from, when we are willing to put it in an email.
 *
 * Guest links have to work on whichever deployment the booking was made on:
 * villa19.in in production, a *.vercel.app preview while testing, localhost in
 * development. The browser knows which, so create-order records it.
 *
 * The Origin header is set by the caller, so it is never trusted as given. An
 * unchecked value would let anyone POST `Origin: https://evil.example` and have
 * the confirmation email, sent from our own verified domain, carry a link to
 * their site. Only hosts on this allowlist are stored; everything else falls
 * back to APP_URL.
 */

/** Preview deployments. A suffix match is safe only with the leading dot. */
const ALLOWED_SUFFIXES = ['.vercel.app'];
const ALLOWED_DEV_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

export function isAllowedOrigin(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }

  // Anything other than a bare scheme://host[:port] is not an origin, and
  // credentials in the authority are a classic way to disguise a host.
  if (url.pathname !== '/' || url.search || url.hash || url.username || url.password) return false;

  const isDev = ALLOWED_DEV_HOSTS.includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isDev)) return false;
  if (isDev) return true;

  const site = (() => {
    try {
      return new URL(SITE_URL).hostname;
    } catch {
      return null;
    }
  })();

  if (site && (url.hostname === site || url.hostname === `www.${site}`)) return true;
  return ALLOWED_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix));
}

/**
 * An allowlisted origin as "scheme://host[:port]", or null. Null means the
 * caller should fall back to APP_URL rather than trust what it was handed.
 */
export function safeOrigin(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length > 200) return null;
  return isAllowedOrigin(trimmed) ? new URL(trimmed).origin : null;
}

/** The base every guest-facing link in an email is built from. */
export function guestLinkBase(storedOrigin: string | null | undefined): string {
  return safeOrigin(storedOrigin) ?? SITE_URL;
}
