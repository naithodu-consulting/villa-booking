import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/availability/calendar?propertyId=...&from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Nights in [from, to) that cannot be booked, for greying out the date pickers.
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

  const nights = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;
  if (!Number.isInteger(nights) || nights <= 0 || nights > MAX_NIGHTS) {
    return NextResponse.json({ error: `to must be after from, at most ${MAX_NIGHTS} nights later.` }, { status: 422 });
  }

  try {
    const { data, error } = await createServiceClient().rpc('get_unavailable_nights', {
      p_property_id: propertyId,
      p_from: from,
      p_to: to,
    });
    if (error) throw error;

    return NextResponse.json(
      { from, to, unavailable: (data ?? []) as string[] },
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
