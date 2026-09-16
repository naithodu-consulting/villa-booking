/**
 * Double-booking protection, exercised against a real local Postgres.
 *
 * Unit tests cannot prove this: the guarantee lives in create_booking_atomic's
 * advisory lock, so it is only meaningful with genuinely concurrent
 * transactions. Each RPC below is its own PostgREST request, so they race.
 *
 * Runs only against local Supabase (`npm run supabase:start`). It refuses any
 * non-localhost URL so it can never write test bookings into a hosted project,
 * and it skips cleanly when the local stack is not running.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const TEST_EMAIL = 'concurrency-test@example.invalid';
const TEST_NOTE = 'concurrency-test';

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

function book(checkIn: string, checkOut: string) {
  const nights = (Date.parse(checkOut) - Date.parse(checkIn)) / 86_400_000;
  return db!.rpc('create_booking_atomic', {
    p_property_id: propertyId,
    p_guest_name: 'Concurrency Test',
    p_guest_email: TEST_EMAIL,
    p_guest_phone: '9000000000',
    p_num_adults: 2, p_num_children: 0, p_num_infants: 0,
    p_check_in: checkIn, p_check_out: checkOut, p_num_nights: nights,
    p_base_amount: 100, p_extra_guest_amount: 0, p_tax_amount: 0, p_total_amount: 100,
    p_special_requests: null,
  });
}

async function cleanup() {
  await db!.from('bookings').delete().eq('guest_email', TEST_EMAIL);
  await db!.from('blocked_dates').delete().eq('notes', TEST_NOTE);
}

// 30s per test: 50 concurrent requests through a shared local stack can exceed
// Vitest's 5s default when other test files run alongside. The assertions, not
// the timing, are what these tests prove.
describe.skipIf(!db)('create_booking_atomic under concurrency (local Supabase)', { timeout: 30_000 }, () => {
  beforeAll(cleanup);
  afterAll(cleanup);

  it('50 simultaneous requests for the same dates produce exactly one booking', async () => {
    const results = await Promise.all(Array.from({ length: 50 }, () => book('2031-03-10', '2031-03-13')));

    const ok = results.filter((r) => !r.error);
    const refused = results.filter((r) => r.error?.message.startsWith('DATE_UNAVAILABLE'));
    expect(ok).toHaveLength(1);
    expect(refused).toHaveLength(49);

    const { count } = await db!.from('bookings').select('id', { count: 'exact', head: true })
      .eq('guest_email', TEST_EMAIL).eq('check_in', '2031-03-10');
    expect(count).toBe(1);
  });

  it('staggered overlapping requests never produce two bookings that share a night', async () => {
    // 20 three-night stays starting on consecutive days, all fired at once.
    const stays = Array.from({ length: 20 }, (_, i) => {
      const start = new Date(Date.UTC(2031, 3, 1 + i));
      const end = new Date(Date.UTC(2031, 3, 4 + i));
      return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)] as const;
    });
    const results = await Promise.all(stays.map(([i, o]) => book(i, o)));
    const won = stays.filter((_, idx) => !results[idx].error);

    expect(won.length).toBeGreaterThan(0);
    for (let a = 0; a < won.length; a++) {
      for (let b = a + 1; b < won.length; b++) {
        const overlap = won[a][0] < won[b][1] && won[b][0] < won[a][1];
        expect(overlap, `${won[a].join('..')} overlaps ${won[b].join('..')}`).toBe(false);
      }
    }
    // Every refusal must be a clean availability error, not a crash or deadlock.
    for (const r of results.filter((r) => r.error)) {
      expect(r.error!.message).toMatch(/^DATE_UNAVAILABLE/);
    }
  });

  it('back-to-back stays both succeed (check-out day is free for the next check-in)', async () => {
    const [first, second] = await Promise.all([book('2031-05-01', '2031-05-03'), book('2031-05-03', '2031-05-05')]);
    expect(first.error).toBeNull();
    expect(second.error).toBeNull();
  });

  it('a blocked night refuses bookings that include it, but not a stay that checks out that morning', async () => {
    const { error: blockError } = await db!.from('blocked_dates').insert({
      property_id: propertyId, start_date: '2031-06-10', end_date: '2031-06-11', reason: 'maintenance', notes: TEST_NOTE,
    });
    expect(blockError, 'service_role must be able to write blocked_dates (see 00020)').toBeNull();
    const including = await book('2031-06-09', '2031-06-11');
    const endingThatMorning = await book('2031-06-08', '2031-06-10');
    expect(including.error?.message).toMatch(/^DATE_BLOCKED/);
    expect(endingThatMorning.error).toBeNull();
  });

  it('a lapsed checkout hold no longer blocks the dates', async () => {
    const hold = await book('2031-07-01', '2031-07-03');
    expect(hold.error).toBeNull();
    const bookingId = (hold.data as { booking_id: string }[])[0].booking_id;

    expect((await book('2031-07-01', '2031-07-03')).error?.message).toMatch(/^DATE_UNAVAILABLE/);
    await db!.from('bookings').update({ hold_expires_at: new Date(Date.now() - 60_000).toISOString() }).eq('id', bookingId);
    expect((await book('2031-07-01', '2031-07-03')).error).toBeNull();
  });

  it('get_unavailable_nights reports booked and blocked nights, and not check-out days', async () => {
    const { error: blockError } = await db!.from('blocked_dates').insert({
      property_id: propertyId, start_date: '2031-08-20', end_date: '2031-08-21', reason: 'owner_hold', notes: TEST_NOTE,
    });
    expect(blockError, 'service_role must be able to write blocked_dates (see 00020)').toBeNull();
    const booked = await book('2031-08-10', '2031-08-12');
    expect(booked.error).toBeNull();

    const { data, error } = await db!.rpc('get_unavailable_nights', {
      p_property_id: propertyId, p_from: '2031-08-01', p_to: '2031-09-01',
    });
    expect(error).toBeNull();
    expect(data).toEqual(['2031-08-10', '2031-08-11', '2031-08-20']);
  });
});
