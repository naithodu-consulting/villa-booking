import { describe, it, expect, vi } from 'vitest';

// server-only throws outside a React Server Component; the module is plain code.
vi.mock('server-only', () => ({}));

const { amountInWords, splitGst, buildInvoicePdf } = await import('@/lib/invoice');

describe('amountInWords', () => {
  it('reads Indian numbering', () => {
    expect(amountInWords(7316000)).toBe('Rupees Seventy Three Thousand One Hundred Sixty Only');
    expect(amountInWords(3068000)).toBe('Rupees Thirty Thousand Six Hundred Eighty Only');
    expect(amountInWords(1234567800)).toBe('Rupees One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight Only');
  });
  it('includes paise and handles round figures', () => {
    expect(amountInWords(100050)).toBe('Rupees One Thousand and Fifty Paise Only');
    expect(amountInWords(10000000)).toBe('Rupees One Lakh Only');
    expect(amountInWords(0)).toBe('Rupees Zero Only');
  });
});

describe('splitGst', () => {
  it('halves the tax and never loses a paisa', () => {
    expect(splitGst(1116000)).toEqual({ cgst: 558000, sgst: 558000 });
    const odd = splitGst(1001);
    expect(odd.cgst + odd.sgst).toBe(1001);
    expect(odd).toEqual({ cgst: 500, sgst: 501 });
  });
});

describe('buildInvoicePdf', () => {
  const base = {
    invoiceNumber: 'V19/26-27/INV/000001', invoiceDate: '2026-09-28', bookingCode: 'V19-4WZ-K0C',
    guestName: 'Test Guest', guestEmail: 'guest@example.com', guestPhone: '9999999999',
    propertyName: 'Villa 19', propertyAddress: 'Urwa, Mangalore, Karnataka 575006',
    checkIn: '2026-09-28', checkOut: '2026-10-03', nights: 5, adults: 8, children: 0,
    baseAmount: 6200000, extraGuestAmount: 0, taxAmount: 1116000, totalAmount: 7316000,
  };
  it('renders a PDF for a personal booking', async () => {
    const pdf = await buildInvoicePdf(base);
    expect(Buffer.from(pdf.slice(0, 5)).toString()).toBe('%PDF-');
  });
  it('renders a PDF for a business booking with extra guests', async () => {
    const pdf = await buildInvoicePdf({ ...base, guestCompany: 'Acme Pvt Ltd', guestGstin: '29ABCDE1234F1Z5', extraGuestAmount: 300000 });
    expect(pdf.length).toBeGreaterThan(1000);
  });
});
