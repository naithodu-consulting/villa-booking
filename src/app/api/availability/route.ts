import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/availability?propertyId=...&checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
 *
 * Returns whether the requested date range is available.
 * This is the authoritative server-side check — the UI never trusts its own state.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const propertyId = searchParams.get('propertyId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  if (!propertyId || !checkIn || !checkOut) {
    return NextResponse.json({ error: 'propertyId, checkIn, and checkOut are required.' }, { status: 400 });
  }

  const checkInDate = new Date(checkIn + 'T00:00:00Z');
  const checkOutDate = new Date(checkOut + 'T00:00:00Z');

  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
    return NextResponse.json({ available: false, reason: 'Invalid date range.' }, { status: 422 });
  }

  try {
    const supabase = createServiceClient();

    // Check overlapping active bookings
    const { count: bookingCount, error: bookingError } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('property_id', propertyId)
      .in('status', ['pending', 'confirmed'])
      .lt('check_in', checkOut)
      .gt('check_out', checkIn);

    if (bookingError) throw bookingError;

    if ((bookingCount ?? 0) > 0) {
      return NextResponse.json({ available: false, reason: 'DATE_UNAVAILABLE' });
    }

    // Check overlapping blocked dates
    const { count: blockedCount, error: blockedError } = await supabase
      .from('blocked_dates')
      .select('id', { count: 'exact', head: true })
      .eq('property_id', propertyId)
      .lt('start_date', checkOut)
      .gt('end_date', checkIn);

    if (blockedError) throw blockedError;

    if ((blockedCount ?? 0) > 0) {
      return NextResponse.json({ available: false, reason: 'DATE_BLOCKED' });
    }

    return NextResponse.json({ available: true, propertyId, checkIn, checkOut });
  } catch (err) {
    console.error('[availability] DB error:', err);
    return NextResponse.json({ error: 'Could not check availability. Please try again.' }, { status: 500 });
  }
}
