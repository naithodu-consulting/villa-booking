import { describe, it, expect } from 'vitest';
import { idShareWhatsAppUrl } from '../whatsapp';

describe('idShareWhatsAppUrl', () => {
  const url = new URL(idShareWhatsAppUrl('91 98450 00000', 'V19-7KQ-M4X', 8));
  const text = url.searchParams.get('text') ?? '';

  it('targets the business number with digits only', () => {
    expect(url.origin + url.pathname).toBe('https://wa.me/919845000000');
  });

  it('names the booking and the number of adults', () => {
    expect(text).toContain('V19-7KQ-M4X');
    expect(text).toContain('8 adults');
  });

  it('uses the singular for one adult', () => {
    const one = new URL(idShareWhatsAppUrl('919845000000', 'V19-7KQ-M4X', 1)).searchParams.get('text');
    expect(one).toContain('(1 adult)');
  });

  it('carries no guest name, email, phone or dates', () => {
    expect(text).not.toMatch(/@|\d{4}-\d{2}-\d{2}|\d{10}/);
  });
});
