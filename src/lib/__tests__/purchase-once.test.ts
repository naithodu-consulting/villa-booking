/**
 * The server-sent `purchase`, exercised against a real local Postgres.
 *
 * Two things here cannot be proved by a unit test.
 *
 * The first is that the purchase is sent exactly once. Both confirmation paths
 * — the verify-payment call and the Razorpay webhook — run for an ordinary
 * booking, and Razorpay retries webhooks, so "once" rests entirely on the
 * compare-and-swap on `payments.status` that both paths perform. That is a
 * claim about Postgres row locking under genuine concurrency, so it is tested
 * against genuine concurrency. The confirmation emails rest on the same gate,
 * which is why it is worth a test of its own.
 *
 * The second is that `reportPurchase` reads the right columns. It selects from
 * two tables and a join; a renamed column would be caught here and nowhere
 * else, because GA4 answers a malformed event with the same 204 it answers a
 * good one.
 *
 * Runs only against local Supabase (`npm run supabase:start`). It refuses any
 * non-localhost URL so it can never write test rows into a hosted project, and
 * it skips cleanly when the local stack is not running.
 *
 * The dates below are in 2032 because booking-concurrency.test.ts books 2031
 * against the same database: two files booking the same villa for the same
 * night is a real double-booking, and the loser fails for the right reason at
 * the wrong time.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { reportPurchase } from '@/lib/analytics-server';

const TEST_EMAIL = 'purchase-analytics-test@example.invalid';

/**
 * Supabase talks over fetch too, so a blanket stub would cut the test off from
 * its own database. Only calls to Google are answered by the mock; everything
 * else goes to the real one.
 */
const realFetch = globalThis.fetch;

function stubGoogleFetch(respond: () => Promise<unknown>) {
  const toGoogle = vi.fn();
  vi.stubGlobal('fetch', (...args: Parameters<typeof fetch>) => {
    const target = String(args[0]);
    if (!target.includes('google-analytics.com')) return realFetch(...args);
    toGoogle(...args);
    return respond();
  });
  return toGoogle;
}

function localEnv(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  try {
    const line = readFileSync('.env.local', 'utf8').split('\n').find((l) => l.startsWith(`${name}=`));
    return line?.slice(name.length + 1).trim().replace(/^"|"$/g, '');
  } catch {
    return undefined;
  }
}

const url = localEnv('NEXT_PUBLIC_SUPABASE_URL') ?? '';
const key = localEnv('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url);

let db: SupabaseClient | null = null;
let propertyId = '';
if (isLocal && key) {
  try {
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await client.from('properties').select('id').eq('slug', 'villa-19').single();
    if (data?.id) { db = client; propertyId = data.id; }
  } catch { /* local stack not running */ }
}

async function cleanup() {
  const { data: rows } = await db!.from('bookings').select('id').eq('guest_email', TEST_EMAIL);
  for (const row of rows ?? []) await db!.from('payments').delete().eq('booking_id', row.id);
  await db!.from('bookings').delete().eq('guest_email', TEST_EMAIL);
}

/** A confirmed booking with a payment row waiting to be captured. */
async function makeBooking(checkIn: string, checkOut: string, orderId: string) {
  const nights = (Date.parse(checkOut) - Date.parse(checkIn)) / 86_400_000;
  const { data, error } = await db!.rpc('create_booking_atomic', {
    p_property_id: propertyId,
    p_guest_name: 'Purchase Analytics Test',
    p_guest_email: TEST_EMAIL,
    p_guest_phone: '9000000001',
    p_num_adults: 8, p_num_children: 0, p_num_infants: 0,
    p_check_in: checkIn, p_check_out: checkOut, p_num_nights: nights,
    p_base_amount: 1_400_000, p_extra_guest_amount: 0,
    p_tax_amount: 252_000, p_total_amount: 1_652_000,
    p_special_requests: null,
  });
  if (error) throw new Error(error.message);

  // The function returns a row (booking_id, reference_number), not a bare id.
  const bookingId = (Array.isArray(data) ? data[0]?.booking_id : data) as string;
  if (!bookingId) throw new Error('create_booking_atomic returned no booking id');

  const { error: payError } = await db!.from('payments').insert({
    booking_id: bookingId,
    razorpay_order_id: orderId,
    amount: 1_652_000,
    currency: 'INR',
    status: 'created',
    ga_client_id: '123456789.1700000000',
    ga_session_id: '1700000001',
  });
  if (payError) throw new Error(payError.message);

  return bookingId;
}

/** The compare-and-swap both confirmation paths perform, verbatim. */
function capturePayment(orderId: string) {
  return db!
    .from('payments')
    .update({ status: 'captured' })
    .eq('razorpay_order_id', orderId)
    .in('status', ['created', 'expired', 'failed'])
    .select('booking_id')
    .maybeSingle();
}

describe.skipIf(!db)('server-sent purchase (local Supabase)', { timeout: 30_000 }, () => {
  beforeAll(cleanup);
  afterAll(async () => {
    await cleanup();
    vi.unstubAllEnvs();
    // Leaving a stubbed fetch behind would cut every later test file off from
    // Supabase, which is a confusing way to fail.
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('only one of many simultaneous confirmations gets through', async () => {
    // This is the whole basis for sending the purchase once, and for sending
    // the confirmation emails once. If it ever stopped holding, every booking
    // would be counted twice and every guest emailed twice.
    const orderId = `order_once_${Date.now()}`;
    await makeBooking('2032-08-01', '2032-08-04', orderId);

    const results = await Promise.all(Array.from({ length: 20 }, () => capturePayment(orderId)));

    const won = results.filter((r) => r.data);
    expect(won).toHaveLength(1);
    expect(results.filter((r) => r.error)).toHaveLength(0);
  });

  it('a webhook redelivery after the browser confirmed finds nothing left to do', async () => {
    const orderId = `order_retry_${Date.now()}`;
    await makeBooking('2032-08-10', '2032-08-13', orderId);

    const browser = await capturePayment(orderId);
    const redelivery = await capturePayment(orderId);

    expect(browser.data).not.toBeNull();
    expect(redelivery.data).toBeNull();
  });

  it('sends one purchase, with the booking and the GA ids read from the database', async () => {
    const orderId = `order_send_${Date.now()}`;
    const bookingId = await makeBooking('2032-09-01', '2032-09-04', orderId);

    vi.stubEnv('NEXT_PUBLIC_GA_ID', 'G-TEST1234PN');
    vi.stubEnv('GA4_API_SECRET', 'test-secret');
    const fetchMock = stubGoogleFetch(async () => ({ ok: true, status: 204 }));

    await reportPurchase(db!, bookingId);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, init] = fetchMock.mock.calls[0];
    expect(calledUrl).toContain('https://www.google-analytics.com/mp/collect');
    expect(calledUrl).toContain('measurement_id=G-TEST1234PN');

    const body = JSON.parse(init.body);
    const params = body.events[0].params;

    expect(body.client_id).toBe('123456789.1700000000');
    expect(params.session_id).toBe('1700000001');
    expect(body.events[0].name).toBe('purchase');
    expect(params.value).toBe(16_520);
    expect(params.tax).toBe(2_520);
    expect(params.nights).toBe(3);
    expect(params.currency).toBe('INR');
    // The booking code comes from a database trigger, so this also proves the
    // transaction id is a real, traceable reference rather than an empty string.
    expect(params.transaction_id).toBeTruthy();
    expect(params.items[0].item_name).toBeTruthy();

    // Nothing identifying the guest may travel to Google.
    expect(init.body).not.toContain(TEST_EMAIL);
    expect(init.body).not.toContain('Purchase Analytics Test');
    expect(init.body).not.toContain('9000000001');
  });

  it('sends nothing at all until GA4 is configured', async () => {
    // The state the site is in today, and will be in on any host where the
    // secret is missing. It must be silent, not an error on every booking.
    const orderId = `order_unset_${Date.now()}`;
    const bookingId = await makeBooking('2032-09-10', '2032-09-13', orderId);

    vi.stubEnv('NEXT_PUBLIC_GA_ID', 'G-TEST1234PN');
    vi.stubEnv('GA4_API_SECRET', '');
    const fetchMock = stubGoogleFetch(async () => ({ ok: true, status: 204 }));

    await reportPurchase(db!, bookingId);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('a booking that cannot be read does not throw at the payment path', async () => {
    vi.stubEnv('NEXT_PUBLIC_GA_ID', 'G-TEST1234PN');
    vi.stubEnv('GA4_API_SECRET', 'test-secret');
    const fetchMock = stubGoogleFetch(async () => ({ ok: true, status: 204 }));

    await expect(
      reportPurchase(db!, '00000000-0000-0000-0000-000000000000'),
    ).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('a refusal from Google never reaches the caller', async () => {
    // The guest has been charged by this point. Nothing here may undo that.
    const orderId = `order_fail_${Date.now()}`;
    const bookingId = await makeBooking('2032-09-20', '2032-09-23', orderId);

    vi.stubEnv('NEXT_PUBLIC_GA_ID', 'G-TEST1234PN');
    vi.stubEnv('GA4_API_SECRET', 'test-secret');
    stubGoogleFetch(() => Promise.reject(new Error('network down')));

    await expect(reportPurchase(db!, bookingId)).resolves.toBeUndefined();
  });
});
