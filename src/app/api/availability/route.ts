import { NextRequest, NextResponse } from 'next/server';

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
    // TODO: Replace with real Supabase query:
    // const { data, error } = await supabase.rpc('check_availability', {
    //   p_property_id: propertyId,
    //   p_check_in: checkIn,
    //   p_check_out: checkOut,
    // });

    // Mock: always available until Supabase is wired
    return NextResponse.json({
      available: true,
      propertyId,
      checkIn,
      checkOut,
    });
  } catch (err) {
    console.error('[availability] DB error:', err);
    return NextResponse.json({ error: 'Could not check availability. Please try again.' }, { status: 500 });
  }
}
