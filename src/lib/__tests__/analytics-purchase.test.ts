import { describe, it, expect } from 'vitest';

import {
  buildPurchasePayload,
  syntheticClientId,
  type PurchaseBooking,
} from '@/lib/analytics-server';
import { safeGaId } from '@/lib/analytics';

/**
 * The server-sent purchase is the only event the browser never checks, and
 * GA4 answers a malformed Measurement Protocol body with the same 204 it
 * answers a good one. So the payload is asserted here, in full: a mistake in
 * it is otherwise invisible until someone notices revenue missing from a
 * report weeks later.
 */
const booking: PurchaseBooking = {
  booking_code: 'V19/26-27/BKG/000001',
  reference_number: 'REF-1',
  total_amount: 1_652_000, // paise
  tax_amount: 252_000,
  discount_code: null,
  check_in: '2026-12-20',
  check_out: '2026-12-23',
  num_adults: 8,
  num_children: 0,
  created_at: '2026-12-01T09:15:00.000Z',
  property_name: 'Villa 19',
};

const ga = { clientId: '123456789.1700000000', sessionId: '1700000001' };

describe('buildPurchasePayload', () => {
  it('reports money in rupees, not paise', () => {
    // Everything else in the app keeps integer paise. Sending paise here would
    // report a three-night stay as ₹16.5 lakh.
    const payload = buildPurchasePayload(booking, ga);
    const params = (payload.events as [{ params: Record<string, unknown> }])[0].params;
    expect(params.value).toBe(16_520);
    expect(params.tax).toBe(2_520);
    expect(params.currency).toBe('INR');
  });

  it('uses the booking code as the transaction id', () => {
    const payload = buildPurchasePayload(booking, ga);
    const params = (payload.events as [{ params: Record<string, unknown> }])[0].params;
    expect(params.transaction_id).toBe('V19/26-27/BKG/000001');
  });

  it('falls back to the reference number when there is no booking code', () => {
    const payload = buildPurchasePayload({ ...booking, booking_code: null }, ga);
    const params = (payload.events as [{ params: Record<string, unknown> }])[0].params;
    expect(params.transaction_id).toBe('REF-1');
  });

  it('counts nights and lead time from the booking itself', () => {
    const payload = buildPurchasePayload(booking, ga);
    const params = (payload.events as [{ params: Record<string, unknown> }])[0].params;
    expect(params.nights).toBe(3);
    expect(params.lead_time_days).toBe(19);
  });

  it('carries the session id, without which the purchase has no source', () => {
    const payload = buildPurchasePayload(booking, ga);
    const params = (payload.events as [{ params: Record<string, unknown> }])[0].params;
    expect(payload.client_id).toBe('123456789.1700000000');
    expect(params.session_id).toBe('1700000001');
    expect(payload.non_personalized_ads).toBe(false);
  });

  it('still reports a booking from a guest who declined cookies', () => {
    // Counted, but with nothing to attribute it to, and not profiled for ads.
    const payload = buildPurchasePayload(booking, { clientId: null, sessionId: null }, 1_700_000_000_000);
    const params = (payload.events as [{ params: Record<string, unknown> }])[0].params;
    expect(payload.client_id).toMatch(/^\d+\.\d+$/);
    expect(params.session_id).toBeUndefined();
    expect(payload.non_personalized_ads).toBe(true);
  });

  it('omits coupon entirely when no code was used', () => {
    // GA4 reads the presence of `coupon` as "a discount was used", so an empty
    // string would report every full-price booking as discounted.
    const payload = buildPurchasePayload(booking, ga);
    const params = (payload.events as [{ params: Record<string, unknown> }])[0].params;
    expect('coupon' in params).toBe(false);
  });

  it('includes the coupon when one was used', () => {
    const payload = buildPurchasePayload({ ...booking, discount_code: 'VILLA19' }, ga);
    const params = (payload.events as [{ params: Record<string, unknown> }])[0].params;
    expect(params.coupon).toBe('VILLA19');
  });

  it('sends one item, so the e-commerce reports have something to show', () => {
    const payload = buildPurchasePayload(booking, ga);
    const params = (payload.events as [{ params: Record<string, unknown> }])[0].params;
    expect(params.items).toEqual([
      { item_id: 'villa-stay', item_name: 'Villa 19', item_category: 'stay', price: 16_520, quantity: 1 },
    ]);
  });

  it('carries engagement time, without which the hit sits outside its session', () => {
    const payload = buildPurchasePayload(booking, ga);
    const params = (payload.events as [{ params: Record<string, unknown> }])[0].params;
    expect(params.engagement_time_msec).toBe(1);
  });

  it('names the event purchase, exactly', () => {
    // A GA4 recommended name used with its real meaning; a typo here silently
    // loses every e-commerce report.
    const payload = buildPurchasePayload(booking, ga);
    expect((payload.events as [{ name: string }])[0].name).toBe('purchase');
  });

  it('carries no guest name, email, phone or address', () => {
    const serialised = JSON.stringify(buildPurchasePayload(booking, ga));
    for (const forbidden of ['guest_name', 'guest_email', 'guest_phone', '@', 'Test Guest']) {
      expect(serialised).not.toContain(forbidden);
    }
  });

  it('survives a booking with no created_at rather than reporting NaN', () => {
    const payload = buildPurchasePayload({ ...booking, created_at: null }, ga);
    const params = (payload.events as [{ params: Record<string, unknown> }])[0].params;
    expect(params.lead_time_days).toBe(0);
  });
});

describe('syntheticClientId', () => {
  it('looks like a real GA client id, which GA4 requires', () => {
    expect(syntheticClientId(1_700_000_000_000)).toMatch(/^\d+\.1700000000$/);
  });

  it('differs between bookings, so they are not all one visitor', () => {
    const ids = new Set(Array.from({ length: 50 }, () => syntheticClientId()));
    expect(ids.size).toBeGreaterThan(1);
  });
});

describe('safeGaId', () => {
  it('accepts the two real shapes', () => {
    expect(safeGaId('123456789.1700000000')).toBe('123456789.1700000000');
    expect(safeGaId('1700000001')).toBe('1700000001');
  });

  it('trims surrounding whitespace', () => {
    expect(safeGaId('  1700000001  ')).toBe('1700000001');
  });

  it('refuses anything that is not an identifier', () => {
    // These arrive from the client and are later put into a request to Google.
    expect(safeGaId('abc')).toBeNull();
    expect(safeGaId('1; DROP TABLE payments')).toBeNull();
    expect(safeGaId('<script>alert(1)</script>')).toBeNull();
    expect(safeGaId('123.456.789')).toBeNull();
    expect(safeGaId('')).toBeNull();
    expect(safeGaId('   ')).toBeNull();
  });

  it('refuses a long string rather than parking it in the database', () => {
    expect(safeGaId('1'.repeat(65))).toBeNull();
  });

  it('refuses non-strings', () => {
    expect(safeGaId(undefined)).toBeNull();
    expect(safeGaId(null)).toBeNull();
    expect(safeGaId(12345)).toBeNull();
    expect(safeGaId({ toString: () => '123.456' })).toBeNull();
  });
});

describe('the sample payload in scripts/check-ga4-purchase.mjs', () => {
  it('has exactly the fields the real builder sends', async () => {
    // The script is what gets run against GA4's validation endpoint. If it
    // drifts from the real payload, it validates something we never send and
    // the check becomes theatre.
    const { buildSamplePayload } = await import('../../../scripts/check-ga4-purchase.mjs');

    const sample = buildSamplePayload();
    const real = buildPurchasePayload(booking, ga);

    expect(Object.keys(sample).sort()).toEqual(Object.keys(real).sort());

    type MpEvent = { name: string; params: Record<string, unknown> };
    const sampleEvent = (sample.events as unknown as MpEvent[])[0];
    const realEvent = (real.events as unknown as MpEvent[])[0];

    expect(sampleEvent.name).toBe(realEvent.name);
    expect(Object.keys(sampleEvent.params).sort()).toEqual(Object.keys(realEvent.params).sort());
  });
});
