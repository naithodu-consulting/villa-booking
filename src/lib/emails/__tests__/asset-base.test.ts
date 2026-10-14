import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * EMAIL_ASSET_BASE is resolved once at import, so each case re-imports the
 * module with its own environment.
 *
 * The badge shipped broken three times, each time because the image host was
 * taken from a value that is not guaranteed to be publicly fetchable:
 *   1. APP_URL as localhost, which webmail's proxy can never reach.
 *   2. APP_URL as a domain still parked at the registrar, which answers 200
 *      with HTML for every path.
 *   3. VERCEL_URL, the deployment-specific host, which Vercel's deployment
 *      protection puts behind a login, so the proxy gets an auth page.
 * Case 3 is the subtle one: that host definitely has the file, and it loads
 * fine in a browser that already holds the session.
 */
async function baseWith(env: Record<string, string | undefined>): Promise<string> {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return (await import('@/lib/emails/html')).EMAIL_ASSET_BASE;
}

const KEYS = ['APP_URL', 'VERCEL_URL', 'EMAIL_ASSET_BASE_URL'] as const;
let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  for (const k of KEYS) delete process.env[k];
});

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe('EMAIL_ASSET_BASE', () => {
  it('never emits a loopback host, which webmail cannot fetch', async () => {
    for (const url of ['http://localhost:3000', 'https://127.0.0.1:3000', 'https://box.local']) {
      expect(await baseWith({ APP_URL: url })).toBe('https://villa-booking-psi.vercel.app');
    }
  });

  it('never uses VERCEL_URL, which deployment protection puts behind a login', async () => {
    const base = await baseWith({ VERCEL_URL: 'villa-booking-abc123-naithodu.vercel.app' });
    expect(base).not.toContain('abc123');
    expect(base).toBe('https://villa-booking-psi.vercel.app');
  });

  it('does not inherit the canonical default when APP_URL is simply unset', async () => {
    // SITE_URL supplies villa19.in as a default for sitemaps. An image must not
    // be addressed to a domain nobody configured and which may serve nothing.
    expect(await baseWith({})).toBe('https://villa-booking-psi.vercel.app');
    expect(await baseWith({ APP_URL: '   ' })).toBe('https://villa-booking-psi.vercel.app');
  });

  it('does not let VERCEL_URL override a configured public address', async () => {
    const base = await baseWith({
      APP_URL: 'https://villa-booking-psi.vercel.app',
      VERCEL_URL: 'villa-booking-abc123-naithodu.vercel.app',
    });
    expect(base).toBe('https://villa-booking-psi.vercel.app');
  });

  it('uses a configured https address', async () => {
    expect(await baseWith({ APP_URL: 'https://villa19.in' })).toBe('https://villa19.in');
  });

  it('ignores a plain-http address rather than emit a mixed-content image', async () => {
    const base = await baseWith({ APP_URL: 'http://example.com' });
    expect(base).toBe('https://villa-booking-psi.vercel.app');
  });

  it('lets an explicit override win over everything', async () => {
    const base = await baseWith({
      APP_URL: 'https://villa19.in',
      VERCEL_URL: 'x.vercel.app',
      EMAIL_ASSET_BASE_URL: 'https://cdn.example.com',
    });
    expect(base).toBe('https://cdn.example.com');
  });

  it('ignores an empty override rather than building a schemeless URL', async () => {
    const base = await baseWith({ EMAIL_ASSET_BASE_URL: '', APP_URL: 'https://villa19.in' });
    expect(base).toBe('https://villa19.in');
  });

  it('never leaves a trailing slash to double up on the image path', async () => {
    const base = await baseWith({ APP_URL: 'https://villa19.in/' });
    expect(base).toBe('https://villa19.in');
  });

  it('always resolves to an absolute https base with no path', async () => {
    for (const env of [
      {}, { APP_URL: 'http://localhost:3000' }, { APP_URL: 'https://villa19.in' },
      { VERCEL_URL: 'x.vercel.app' }, { APP_URL: 'not-a-url' },
    ]) {
      expect(await baseWith(env)).toMatch(/^https:\/\/[^/]+$/);
    }
  });
});
