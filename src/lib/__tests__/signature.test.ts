import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { hexSignatureMatches, bearerSecretMatches } from '../signature';

const expected = crypto.createHmac('sha256', 'secret').update('body').digest('hex');

describe('hexSignatureMatches', () => {
  it('accepts the correct signature', () => {
    expect(hexSignatureMatches(expected, expected)).toBe(true);
  });

  it('accepts the correct signature in upper case', () => {
    expect(hexSignatureMatches(expected, expected.toUpperCase())).toBe(true);
  });

  it('rejects a wrong signature of the right length', () => {
    expect(hexSignatureMatches(expected, 'a'.repeat(64))).toBe(false);
  });

  it('rejects a same-length non-hex signature without throwing', () => {
    // Previously: Buffer.from truncated at the first "z", timingSafeEqual threw, route 500'd.
    expect(() => hexSignatureMatches(expected, 'z'.repeat(64))).not.toThrow();
    expect(hexSignatureMatches(expected, 'z'.repeat(64))).toBe(false);
    expect(hexSignatureMatches(expected, expected.slice(0, 63) + 'g')).toBe(false);
  });

  it('rejects wrong lengths, empty strings and non-strings', () => {
    expect(hexSignatureMatches(expected, expected.slice(0, 10))).toBe(false);
    expect(hexSignatureMatches(expected, '')).toBe(false);
    expect(hexSignatureMatches(expected, undefined)).toBe(false);
    expect(hexSignatureMatches(expected, 12345)).toBe(false);
  });
});

describe('bearerSecretMatches', () => {
  const secret = 's3cret-value-for-tests';

  it('accepts the right secret', () => {
    expect(bearerSecretMatches(secret, `Bearer ${secret}`)).toBe(true);
  });

  it('rejects a wrong or partial secret', () => {
    expect(bearerSecretMatches(secret, 'Bearer wrong')).toBe(false);
    expect(bearerSecretMatches(secret, `Bearer ${secret.slice(0, -1)}`)).toBe(false);
    expect(bearerSecretMatches(secret, `Bearer ${secret} `)).toBe(false);
  });

  it('rejects a missing header or a header without the Bearer scheme', () => {
    expect(bearerSecretMatches(secret, null)).toBe(false);
    expect(bearerSecretMatches(secret, secret)).toBe(false);
    expect(bearerSecretMatches(secret, `Basic ${secret}`)).toBe(false);
  });

  it('rejects everything when no secret is configured', () => {
    expect(bearerSecretMatches(undefined, 'Bearer ')).toBe(false);
    expect(bearerSecretMatches('', 'Bearer ')).toBe(false);
  });
});
