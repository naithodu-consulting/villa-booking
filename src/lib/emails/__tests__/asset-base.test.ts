import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * EMAIL_ASSET_BASE is resolved once at import, so each case re-imports the
 * module with its own environment.
 *
 * This exists because the badge shipped broken twice, both times because the
 * image host was derived from APP_URL. APP_URL is the canonical address, not a
 * promise that anything is serving it: once it was localhost, which webmail's
 * image proxy can never reach, and once it was a domain still parked at the
 * registrar, which answered 200 with HTML for every path. The rule these lock
 * in is that APP_URL must never reach an image URL.
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
  it('never uses APP_URL, even when it looks like a healthy public domain', async () => {
    const base = await baseWith({ APP_URL: 'https://villa19.in' });
    expect(base).not.toContain('villa19.in');
  });

  it('never emits a localhost image host, which webmail cannot fetch', async () => {
    const base = await baseWith({ APP_URL: 'http://localhost:3000' });
    expect(base).not.toContain('localhost');
  });

  it('uses the running deployment, which is guaranteed to serve the asset', async () => {
    const base = await baseWith({
      APP_URL: 'https://villa19.in',
      VERCEL_URL: 'villa-booking-abc123.vercel.app',
    });
    expect(base).toBe('https://villa-booking-abc123.vercel.app');
  });

  it('adds a scheme to VERCEL_URL, which Vercel supplies bare', async () => {
    const base = await baseWith({ VERCEL_URL: 'x.vercel.app' });
    expect(base).toBe('https://x.vercel.app');
  });

  it('lets an explicit override win over the deployment', async () => {
    const base = await baseWith({
      VERCEL_URL: 'x.vercel.app',
      EMAIL_ASSET_BASE_URL: 'https://cdn.example.com',
    });
    expect(base).toBe('https://cdn.example.com');
  });

  it('ignores an empty override rather than building a schemeless URL', async () => {
    const base = await baseWith({ EMAIL_ASSET_BASE_URL: '', VERCEL_URL: 'x.vercel.app' });
    expect(base).toBe('https://x.vercel.app');
  });

  it('always resolves to an absolute https base', async () => {
    for (const env of [{}, { APP_URL: 'http://localhost:3000' }, { VERCEL_URL: 'x.vercel.app' }]) {
      expect(await baseWith(env)).toMatch(/^https:\/\/[^/]+$/);
    }
  });
});
