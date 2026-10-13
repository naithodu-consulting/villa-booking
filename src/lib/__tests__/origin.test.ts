import { describe, it, expect } from 'vitest';
import { safeOrigin, guestLinkBase } from '@/lib/origin';

/**
 * These links go into an email sent from a verified domain, so a host that
 * slips through the allowlist is a phishing vector, not a cosmetic bug.
 */
describe('safeOrigin', () => {
  it('accepts the production site and its www form', () => {
    expect(safeOrigin('https://habbaa.in')).toBe('https://habbaa.in');
    expect(safeOrigin('https://www.habbaa.in')).toBe('https://www.habbaa.in');
  });

  it('accepts Vercel preview deployments', () => {
    expect(safeOrigin('https://villa-booking-abc123.vercel.app'))
      .toBe('https://villa-booking-abc123.vercel.app');
  });

  it('accepts local development over http, with a port', () => {
    expect(safeOrigin('http://localhost:3000')).toBe('http://localhost:3000');
    expect(safeOrigin('http://127.0.0.1:3000')).toBe('http://127.0.0.1:3000');
  });

  it('rejects an unrelated host', () => {
    expect(safeOrigin('https://evil.example')).toBeNull();
  });

  it('rejects a lookalike that merely ends with the allowed suffix', () => {
    // "notvercel.app" ends with "vercel.app" but is a different registrable
    // domain; only a leading dot makes the suffix match meaningful.
    expect(safeOrigin('https://notvercel.app')).toBeNull();
    expect(safeOrigin('https://evil.app')).toBeNull();
  });

  it('rejects a host that only prefixes the real one', () => {
    expect(safeOrigin('https://habbaa.in.evil.example')).toBeNull();
  });

  it('rejects credentials in the authority', () => {
    expect(safeOrigin('https://habbaa.in@evil.example')).toBeNull();
  });

  it('rejects plain http for a non-local host', () => {
    expect(safeOrigin('http://habbaa.in')).toBeNull();
  });

  it('rejects anything carrying a path, query or fragment', () => {
    expect(safeOrigin('https://habbaa.in/evil')).toBeNull();
    expect(safeOrigin('https://habbaa.in?x=1')).toBeNull();
  });

  it('rejects non-http schemes', () => {
    expect(safeOrigin('javascript:alert(1)')).toBeNull();
    expect(safeOrigin('data:text/html,hi')).toBeNull();
  });

  it('rejects junk and empty values', () => {
    expect(safeOrigin('not a url')).toBeNull();
    expect(safeOrigin('')).toBeNull();
    expect(safeOrigin(null)).toBeNull();
    expect(safeOrigin('https://' + 'a'.repeat(300) + '.vercel.app')).toBeNull();
  });
});

describe('guestLinkBase', () => {
  it('falls back to the configured site when nothing was stored', () => {
    expect(guestLinkBase(null)).toBe('https://habbaa.in');
  });

  it('falls back rather than trusting a host that is not allowlisted', () => {
    expect(guestLinkBase('https://evil.example')).toBe('https://habbaa.in');
  });

  it('uses the stored origin when it is allowed', () => {
    expect(guestLinkBase('https://villa-booking-xyz.vercel.app'))
      .toBe('https://villa-booking-xyz.vercel.app');
  });
});
