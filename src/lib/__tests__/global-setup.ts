import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

/**
 * Suspends the booking cutoff for the whole test run, and puts it back after.
 *
 * ── Why this exists ───────────────────────────────────────────────────────
 *
 * properties.booking_cutoff_date (00097) is a commercial limit on public
 * sales: "take no new guest bookings with a check-in after date X". It is
 * checked inside check_availability() ahead of the occupancy test, so a stay
 * past it is refused with DATE_BLOCKED whether or not the villa is free.
 *
 * The database-backed suites are about occupancy - advisory locks, overlaps,
 * lapsed holds, booking codes - and they deliberately use dates years out to
 * stay clear of real bookings. Any realistic cutoff is earlier than that, so
 * with one set every RPC in those suites is refused and they fail having
 * tested nothing. They passed originally only because no database had a
 * cutoff yet; once every environment acquired one, they broke.
 *
 * ── Why it is global rather than per-file ─────────────────────────────────
 *
 * It was per-file first, and that is a race: Vitest runs test files in
 * parallel, so the first suite to finish restored the cutoff while the second
 * was still booking, and the second failed with the very error this is meant
 * to prevent. The cutoff is one row shared by every suite, so it has to be
 * suspended once for the whole run and restored once at the end.
 *
 * ── Safety ────────────────────────────────────────────────────────────────
 *
 * Localhost only. The URL is checked here as well as in each suite, so a
 * misconfigured .env.local cannot have the test run disable a cutoff on a
 * hosted project. Silently does nothing when the local stack is not running,
 * which is how these suites already skip.
 *
 * If a run is killed between setup and teardown, the local cutoff stays NULL.
 * That only affects a developer machine, and the next full run puts back
 * whatever it finds.
 */

function localEnv(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  try {
    const line = readFileSync('.env.local', 'utf8').split('\n').find((l) => l.startsWith(`${name}=`));
    return line?.slice(name.length + 1).trim().replace(/^"|"$/g, '');
  } catch {
    return undefined;
  }
}

export async function setup() {
  const url = localEnv('NEXT_PUBLIC_SUPABASE_URL') ?? '';
  const key = localEnv('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url) || !key) return;

  try {
    const db = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await db
      .from('properties')
      .select('id, booking_cutoff_date')
      .eq('slug', 'villa-19')
      .single();

    if (!data?.id) return;

    const saved = (data.booking_cutoff_date as string | null) ?? null;
    await db.from('properties').update({ booking_cutoff_date: null }).eq('id', data.id);

    // Vitest runs the returned function once every file has finished.
    return async () => {
      await db.from('properties').update({ booking_cutoff_date: saved }).eq('id', data.id);
    };
  } catch {
    // Local stack not running. The suites that need it skip themselves.
  }
}
