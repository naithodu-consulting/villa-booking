import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { nightlyRate } from '@/lib/pricing-engine';
import { addDaysISO } from '@/lib/format';
import type { PricingRule } from '@/types';

/**
 * GET /api/availability/calendar?propertyId=...&from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Every night in [from, to) with its price, whether it can be booked, and the
 * pricing rule name when the price is special, for the date pickers.
 *
 * Everything comes from the database: the property's weekday and weekend rates,
 * pricing_rules, and get_unavailable_nights() (bookings, live checkout holds,
 * blocked dates). Prices come from nightlyRate(), the same function checkout
 * charges with, so the calendar and the charged price cannot disagree.
 *
 * A display aid only: create_booking_atomic still re-checks under a lock, so a
 * night taken in the last minute is refused at checkout, not double-booked.
 *
 * Cached at Vercel's edge for 60s, never in the browser. A calendar a minute
 * stale is fine; the homepage paying for a database round trip on every view is
 * not. Browsers must not cache it: they honour stale-while-revalidate too, so a
 * guest's browser would keep showing a night as free for minutes after Ooruda
 * Villa blocked it. CDN-Cache-Control is read by Vercel's CDN and ignored by
 * browsers, which get no-store.
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NIGHTS = 186;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const propertyId = searchParams.get('propertyId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!propertyId || !from || !to || !ISO_DATE.test(from) || !ISO_DATE.test(to)) {
    return NextResponse.json({ error: 'propertyId, from and to (YYYY-MM-DD) are required.' }, { status: 400 });
  }

  const span = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;
  if (!Number.isInteger(span) || span <= 0 || span > MAX_NIGHTS) {
    return NextResponse.json({ error: `to must be after from, at most ${MAX_NIGHTS} nights later.` }, { status: 422 });
  }

  try {
    const supabase = createServiceClient();
    const [propertyRes, rulesRes, takenRes] = await Promise.all([
      supabase
        .from('properties')
        .select('base_nightly_rate, weekend_nightly_rate')
        .eq('id', propertyId)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('pricing_rules')
        .select('*')
        .eq('property_id', propertyId)
        .lt('start_date', to)
        .gt('end_date', from)
        .order('start_date'),
      supabase.rpc('get_unavailable_nights', { p_property_id: propertyId, p_from: from, p_to: to }),
    ]);

    if (propertyRes.error) throw propertyRes.error;
    if (rulesRes.error) throw rulesRes.error;
    if (takenRes.error) throw takenRes.error;
    if (!propertyRes.data) return NextResponse.json({ error: 'Property not found.' }, { status: 404 });

    const rules = (rulesRes.data ?? []) as PricingRule[];
    const taken = new Set((takenRes.data ?? []) as string[]);

    const nights: { date: string; rate: number; available: boolean; special: string | null }[] = [];
    for (let date = from; date < to; date = addDaysISO(date, 1)) {
      const { rate, rule } = nightlyRate(propertyRes.data, rules, date);
      nights.push({ date, rate, available: !taken.has(date), special: rule?.rule_name ?? null });
    }

    return NextResponse.json(
      { from, to, nights, unavailable: [...taken] },
      {
        headers: {
          'Cache-Control': 'no-store',
          'CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60',
        },
      },
    );
  } catch (err) {
    console.error('[availability/calendar] DB error:', err);
    return NextResponse.json({ error: 'Could not load availability.' }, { status: 500 });
  }
}
