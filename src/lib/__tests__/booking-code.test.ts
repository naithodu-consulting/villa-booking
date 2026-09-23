import { describe, it, expect } from 'vitest';
import { CROCKFORD, checkChar, formatBookingCode, normalizeBookingCode } from '../booking-code';

describe('booking codes', () => {
  it('formats prefix, body and check character in 3-3 groups', () => {
    const code = formatBookingCode('V19', '7KQM4');
    expect(code).toMatch(/^V19-7KQ-M4[0-9A-Z]$/);
    expect(normalizeBookingCode(code)).toBe(code);
  });

  it('accepts lower case, spaces, missing hyphens and look-alike letters', () => {
    const code = formatBookingCode('V19', '10A0B');
    const body = code.replace(/^V19-/, '').replace('-', '');
    expect(normalizeBookingCode(code.toLowerCase())).toBe(code);
    expect(normalizeBookingCode(`V19 ${body}`)).toBe(code);
    expect(normalizeBookingCode(`v19${body.replace(/1/g, 'l').replace(/0/g, 'o')}`)).toBe(code);
  });

  it('rejects every single-character typo in the random part', () => {
    const body = '7KQM4';
    const code = formatBookingCode('V19', body);
    for (let i = 0; i < 5; i++) {
      for (const c of CROCKFORD) {
        if (c === body[i]) continue;
        const typo = body.slice(0, i) + c + body.slice(i + 1);
        const typed = `V19-${typo.slice(0, 3)}-${typo.slice(3)}${code.slice(-1)}`;
        expect(normalizeBookingCode(typed)).toBeNull();
      }
    }
  });

  it('rejects swapped neighbouring characters', () => {
    const body = '7KQM4';
    const check = checkChar(body);
    for (let i = 0; i < 4; i++) {
      const swapped = body.slice(0, i) + body[i + 1] + body[i] + body.slice(i + 2);
      if (swapped === body) continue;
      expect(normalizeBookingCode(`V19${swapped}${check}`)).toBeNull();
    }
  });

  it('rejects malformed input', () => {
    for (const bad of ['', 'V19', 'V19-7KQ', 'V19-7KQ-M4XX', '19-7KQ-M4X', 'V19-7KQ-M4!', 'MNG-3F9A2C']) {
      expect(normalizeBookingCode(bad)).toBeNull();
    }
  });
});
