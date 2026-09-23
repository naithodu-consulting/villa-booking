/**
 * Booking codes as the database assigns them (migration 00023), checked
 * against the TypeScript mirror in booking-code.ts.
 *
 * Local Supabase only, same guard as booking-concurrency.test.ts: refuses any
 * non-localhost URL and skips when the local stack is not running.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { normalizeBookingCode } from '../booking-code';

const TEST_EMAIL = 'booking-code-test@example.invalid';

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

async function hold(checkIn: string, checkOut: string) {
  const { data, error } = await db!.rpc('create_booking_atomic', {
    p_property_id: propertyId,
    p_guest_name: 'Booking Code Test',
    p_guest_email: TEST_EMAIL,
    p_guest_phone: '9000000000',
    p_num_adults: 2, p_num_children: 0, p_num_infants: 0,
    p_check_in: checkIn, p_check_out: checkOut, p_num_nights: 2,
    p_base_amount: 100, p_extra_guest_amount: 0, p_tax_amount: 0, p_total_amount: 100,
    p_special_requests: null,
  });
  expect(error).toBeNull();
  return (data as { booking_id: string }[])[0].booking_id;
}

const cleanup = async () => { await db!.from('bookings').delete().eq('guest_email', TEST_EMAIL); };

describe.skipIf(!db)('booking codes in the database (local Supabase)', { timeout: 30_000 }, () => {
  beforeAll(cleanup);
  afterAll(cleanup);

  it('every generated code passes the TypeScript check', async () => {
    // Batches of 20: 200 at once, alongside the concurrency suite, can exhaust
    // the local connection pool and fail for reasons unrelated to the codes.
    const results = [];
    for (let batch = 0; batch < 10; batch++) {
      results.push(...await Promise.all(
        Array.from({ length: 20 }, () => db!.rpc('generate_booking_code', { p_prefix: 'V19' })),
      ));
    }
    for (const { data, error } of results) {
      expect(error).toBeNull();
      expect(normalizeBookingCode(data as string)).toBe(data);
    }
  });

  it('a hold has a private token but no code; confirming assigns one, once', async () => {
    const id = await hold('2032-01-10', '2032-01-12');

    const { data: pending } = await db!.from('bookings')
      .select('booking_code, access_token, confirmed_at').eq('id', id).single();
    expect(pending!.booking_code).toBeNull();
    expect(pending!.confirmed_at).toBeNull();
    expect(pending!.access_token).toMatch(/^[0-9a-f]{64}$/);

    const { data: first } = await db!.from('bookings')
      .update({ status: 'confirmed' }).eq('id', id).select('booking_code, confirmed_at').single();
    expect(first!.booking_code).toMatch(/^V19-/);
    expect(normalizeBookingCode(first!.booking_code)).toBe(first!.booking_code);
    expect(first!.confirmed_at).not.toBeNull();

    // A second confirmation (webhook after verify-payment) must not re-number.
    const { data: again } = await db!.from('bookings')
      .update({ status: 'confirmed' }).eq('id', id).select('booking_code, confirmed_at').single();
    expect(again).toEqual(first);
  });

  it('a booking inserted already confirmed (Ooruda Villa or an OTA import) gets a code', async () => {
    const { data, error } = await db!.from('bookings').insert({
      reference_number: `TEST-${Date.now().toString(36).toUpperCase()}`.slice(0, 20),
      property_id: propertyId,
      guest_name: 'Booking Code Test', guest_email: TEST_EMAIL, guest_phone: '9000000000',
      num_adults: 2, num_children: 0, num_infants: 0,
      check_in: '2032-02-10', check_out: '2032-02-12', num_nights: 2,
      base_amount: 100, extra_guest_amount: 0, tax_amount: 0, total_amount: 100,
      status: 'confirmed',
    }).select('booking_code').single();
    expect(error).toBeNull();
    expect(normalizeBookingCode(data!.booking_code)).toBe(data!.booking_code);
  });

  it('the database refuses a malformed code', async () => {
    const id = await hold('2032-03-10', '2032-03-12');
    const { error } = await db!.from('bookings').update({ booking_code: 'V19-BAD-O0I' }).eq('id', id);
    expect(error?.message).toMatch(/bookings_booking_code_format/);
  });
});
