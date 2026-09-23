import crypto from 'crypto';

/**
 * Constant-time comparison of two hex-encoded HMAC digests.
 *
 * Never throws. `Buffer.from(x, 'hex')` silently truncates at the first non-hex
 * character, so a same-length but malformed signature produced buffers of
 * different lengths and made `timingSafeEqual` throw, turning a forged request
 * into a 500 instead of a 400.
 */
export function hexSignatureMatches(expected: string, received: unknown): boolean {
  if (typeof received !== 'string') return false;
  if (received.length !== expected.length || !/^[0-9a-f]+$/i.test(received)) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Constant-time comparison of a shared secret sent as a bearer token.
 * Both sides are hashed first so their lengths always match and the length of
 * the real secret does not leak through timing.
 */
export function bearerSecretMatches(secret: string | undefined, authorization: string | null): boolean {
  if (!secret || !authorization?.startsWith('Bearer ')) return false;
  const digest = (v: string) => crypto.createHash('sha256').update(v).digest();
  return crypto.timingSafeEqual(digest(secret), digest(authorization.slice('Bearer '.length)));
}
