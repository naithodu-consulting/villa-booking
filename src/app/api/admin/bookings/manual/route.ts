import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendAdminNewBookingNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, guestName, guestEmail, guestPhone, checkIn, checkOut, adults, children, channel, notes } = body;

    if (!propertyId || !guestName || !checkIn || !checkOut || !adults) {
      return NextResponse.json({ error: 'Missing required fields: propertyId, guestName, checkIn, checkOut, adults.' }, { status: 400 });
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
      return NextResponse.json({ error: 'Check-out must be after check-in.' }, { status: 422 });
    }

    const supabase = createServiceClient();

    // Fetch property for rate calculation
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('id, base_nightly_rate, weekend_nightly_rate, extra_guest_rate, base_occupancy, max_occupancy')
      .eq('id', propertyId)
      .single();

    if (propError || !property) {
      return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    }

    // Calculate nights and a rough total (no pricing rules for manual bookings)
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    const numNights = Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24));
    if (numNights < 1) return NextResponse.json({ error: 'Minimum 1 night required.' }, { status: 422 });

    const numAdults = Number(adults);
    const numChildren = Number(children ?? 0);
    const totalGuests = numAdults + numChildren;

    if (totalGuests > property.max_occupancy) {
      return NextResponse.json({ error: `Exceeds max occupancy of ${property.max_occupancy}.` }, { status: 422 });
    }

    // Estimate nightly rate (average of base and weekend; proper pricing engine not used for manual bookings)
    const avgRate = Math.round((property.base_nightly_rate + property.weekend_nightly_rate) / 2);
    const extraGuests = Math.max(0, totalGuests - property.base_occupancy);
    const extraGuestAmount = extraGuests * numNights * (property.extra_guest_rate ?? 0);
    const baseAmount = avgRate * numNights;
    const taxAmount = Math.round((baseAmount + extraGuestAmount) * 0.12);
    const totalAmount = baseAmount + extraGuestAmount + taxAmount;

    // Use atomic RPC to create booking and check availability
    const { data, error: dbError } = await supabase.rpc('create_booking_atomic', {
      p_property_id: propertyId,
      p_guest_name: guestName,
      p_guest_email: guestEmail ?? '',
      p_guest_phone: guestPhone ?? '',
      p_num_adults: numAdults,
      p_num_children: numChildren,
      p_num_infants: 0,
      p_check_in: checkIn,
      p_check_out: checkOut,
      p_num_nights: numNights,
      p_base_amount: baseAmount,
      p_extra_guest_amount: extraGuestAmount,
      p_tax_amount: taxAmount,
      p_total_amount: totalAmount,
      p_special_requests: notes ?? null,
    });

    if (dbError) {
      const msg = dbError.message ?? '';
      if (msg.startsWith('DATE_UNAVAILABLE') || msg.startsWith('DATE_BLOCKED')) {
        return NextResponse.json({ error: 'Those dates are not available.' }, { status: 409 });
      }
      console.error('[admin/manual] DB error:', msg);
      return NextResponse.json({ error: 'Booking could not be created.' }, { status: 503 });
    }

    const row = (data as { reference_number: string; booking_id: string }[])[0];

    // Immediately confirm manual bookings (no payment flow)
    await supabase
      .from('bookings')
      .update({ status: 'confirmed', payment_status: 'unpaid', booking_channel: channel ?? 'manual' })
      .eq('id', row.booking_id);

    const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    await sendAdminNewBookingNotification({
      bookingRef: row.reference_number,
      guestName,
      guestEmail: guestEmail ?? 'Not provided',
      guestPhone: guestPhone ?? undefined,
      checkIn: fmt(checkIn),
      checkOut: fmt(checkOut),
      guests: totalGuests,
      totalPaise: totalAmount,
      channel: channel === 'whatsapp' ? 'WhatsApp / Manual' : channel ?? 'Manual',
    });

    return NextResponse.json({ created: true, bookingRef: row.reference_number, bookingId: row.booking_id });
  } catch (err) {
    console.error('[admin/manual] unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
