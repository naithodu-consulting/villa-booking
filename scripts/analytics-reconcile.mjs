#!/usr/bin/env node
/**
 * The Supabase side of the monthly reconciliation in docs/ANALYTICS_PLAN.md §8.
 *
 * GA4 is for behaviour and acquisition; the database is the record for money.
 * The two should agree on how many bookings were confirmed and what they were
 * worth, and when they do not, the gap is the measure of how much of the
 * server-sent `purchase` path is being lost. A gap above about 5% means
 * something is wrong with it, and nothing else will tell you: Google answers a
 * malformed or dropped event exactly as it answers a good one.
 *
 * Read-only. It makes no writes and takes no arguments it could act on.
 *
 *   node scripts/analytics-reconcile.mjs            # last complete month
 *   node scripts/analytics-reconcile.mjs 2026-10    # a specific month
 *
 * Credentials come from the environment, or from .env.local when run from a
 * developer's machine. To reconcile production, pass production's URL and
 * service-role key in the environment for the one command:
 *
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/analytics-reconcile.mjs 2026-10
 *
 * It prints which host it read from, because a reconciliation against the
 * wrong database is worse than none: it looks like an answer.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

/** The villa's own timezone. GA4 reports in the property's timezone, so a
 *  month boundary taken in UTC would move bookings made late in the evening
 *  into the wrong month and invent a discrepancy that is not there. */
const TZ = 'Asia/Kolkata';
const TZ_OFFSET = '+05:30';

function fromEnvFile(name) {
  if (process.env[name]) return process.env[name];
  try {
    const line = readFileSync('.env.local', 'utf8')
      .split('\n')
      .find((l) => l.startsWith(`${name}=`));
    return line?.slice(name.length + 1).trim().replace(/^"|"$/g, '');
  } catch {
    return undefined;
  }
}

/** "2026-10" → the half-open range covering that month in IST. */
function monthRange(month) {
  const [year, m] = month.split('-').map(Number);
  const start = `${month}-01T00:00:00${TZ_OFFSET}`;
  const nextMonth = m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, '0')}`;
  return { start, end: `${nextMonth}-01T00:00:00${TZ_OFFSET}`, nextMonth };
}

/** The last complete month, in the villa's timezone. */
function previousMonth() {
  const here = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
  const [year, m] = here.split('-').map(Number);
  return m === 1 ? `${year - 1}-12` : `${year}-${String(m - 1).padStart(2, '0')}`;
}

const rupees = (paise) =>
  `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const month = process.argv[2] ?? previousMonth();
if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
  // Checked here rather than left to Postgres, which answers "2026-13" with a
  // range error about a timestamp the caller never typed.
  console.error(`Not a month: "${month}". Use YYYY-MM, e.g. 2026-10.`);
  process.exit(2);
}

const url = fromEnvFile('NEXT_PUBLIC_SUPABASE_URL');
const key = fromEnvFile('SUPABASE_SERVICE_ROLE_KEY');
if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or run from the repo root with .env.local present).');
  process.exit(2);
}

const { start, end } = monthRange(month);
const db = createClient(url, key, { auth: { persistSession: false } });

// confirmed_at, not created_at: GA4 records the purchase when the booking is
// confirmed, so grouping by when it was started would disagree with GA4 for
// every booking that was paid for after midnight.
const { data, error } = await db
  .from('bookings')
  .select('booking_code, reference_number, total_amount, tax_amount, num_nights, discount_code, check_in, confirmed_at, created_at')
  .eq('status', 'confirmed')
  .eq('payment_status', 'paid')
  .gte('confirmed_at', start)
  .lt('confirmed_at', end)
  .order('confirmed_at', { ascending: true });

if (error) {
  console.error(`Could not read bookings: ${error.message}`);
  process.exit(1);
}

const bookings = data ?? [];
const gross = bookings.reduce((sum, b) => sum + b.total_amount, 0);
const tax = bookings.reduce((sum, b) => sum + (b.tax_amount ?? 0), 0);
const nights = bookings.reduce((sum, b) => sum + (b.num_nights ?? 0), 0);
const discounted = bookings.filter((b) => b.discount_code).length;

console.log();
console.log(`  Reconciliation for ${month}  (confirmed bookings, ${TZ})`);
console.log(`  Database: ${new URL(url).host}`);
console.log();
console.log(`  Bookings confirmed   ${bookings.length}`);
console.log(`  Gross value          ${rupees(gross)}`);
console.log(`  Of which GST         ${rupees(tax)}`);
console.log(`  Nights sold          ${nights}`);
if (bookings.length > 0) {
  console.log(`  Average booking      ${rupees(Math.round(gross / bookings.length))}`);
  console.log(`  With a promo code    ${discounted}`);
}
console.log();

if (bookings.length > 0) {
  console.log('  Each booking, to match against GA4 purchase transaction ids:');
  console.log();
  for (const b of bookings) {
    const reference = b.booking_code ?? b.reference_number ?? '(no code)';
    const when = new Date(b.confirmed_at).toLocaleDateString('en-CA', { timeZone: TZ });
    console.log(`    ${when}  ${reference.padEnd(24)} ${rupees(b.total_amount).padStart(14)}`);
  }
  console.log();
}

console.log('  Compare with GA4: Reports > Monetisation > Ecommerce purchases, or an');
console.log(`  exploration of the purchase event for ${month}. Expect the same count and`);
console.log('  the same total. GA4 counts a purchase when the booking is confirmed, which');
console.log('  is the date used here.');
console.log();
console.log('  A gap means the server-sent purchase is being lost, not that a booking is');
console.log('  missing: the database above is the record. Check GA4_API_SECRET is set on');
console.log('  the host, and the [analytics] lines in the server log.');
console.log();
