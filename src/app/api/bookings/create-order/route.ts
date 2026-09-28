import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { calculateBookingPrice } from '@/lib/pricing-engine';
import { createServiceClient } from '@/lib/supabase/server';
import type { Property, PricingRule } from '@/types';
import { GSTIN_RE } from '@/lib/gstin';

// Deferred so build-time static analysis doesn't throw when env vars are absent
function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      propertyId, checkIn, checkOut, adults, children,
      guestName, guestEmail, guestPhone, specialRequests,
      guestCompany, guestGstin,
    } = body;

    // Input validation
    if (!propertyId || !checkIn || !checkOut || !guestName || !guestEmail || !guestPhone) {
      return NextResponse.json({ error: 'Missing required booking fields.' }, { status: 400 });
    }
    if (!/^[6-9][0-9]{9}$/.test(guestPhone)) {
      return NextResponse.json({ error: 'Invalid Indian mobile number.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }
    // Optional business details for the GST invoice: both or neither.
    const company = typeof guestCompany === 'string' ? guestCompany.trim().slice(0, 120) : '';
    const gstin = typeof guestGstin === 'string' ? guestGstin.trim().toUpperCase() : '';
    if ((company || gstin) && !(company && GSTIN_RE.test(gstin))) {
      return NextResponse.json({ error: 'For a company invoice, enter the company name and a valid 15-character GSTIN.' }, { status: 400 });
    }

    // Fetch property + active pricing rules from DB — never trust client amounts
    const supabase = createServiceClient();
    const today = new Date().toISOString().slice(0, 10);

    const [{ data: propertyData, error: propError }, { data: rulesData }] = await Promise.all([
      supabase.from('properties').select('*').eq('id', propertyId).eq('is_active', true).single(),
      supabase.from('pricing_rules').select('*').eq('property_id', propertyId).gte('end_date', today),
    ]);

    if (propError || !propertyData) {
      return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    }

    const property: Property = {
      ...propertyData,
      check_in_time: propertyData.check_in_time?.slice(0, 5) ?? '14:00',
      check_out_time: propertyData.check_out_time?.slice(0, 5) ?? '11:00',
      whatsapp_number: process.env.PROPERTY_WHATSAPP,
    };
    const pricingRules: PricingRule[] = rulesData ?? [];

    let breakdown;
    try {
      breakdown = calculateBookingPrice(property, pricingRules, checkIn, checkOut, adults ?? property.ideal_occupancy, children ?? 0);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Invalid booking dates.' },
        { status: 422 }
      );
    }

    // Persist booking as 'pending' via atomic DB function (advisory lock prevents
    // double-booking). This runs before the Razorpay order so unavailable dates
    // are rejected without leaving an orphan order behind.
    const { data, error: dbError } = await supabase.rpc('create_booking_atomic', {
      p_property_id: propertyId,
      p_guest_name: guestName,
      p_guest_email: guestEmail,
      p_guest_phone: guestPhone,
      p_num_adults: adults ?? property.ideal_occupancy,
      p_num_children: children ?? 0,
      p_num_infants: 0,
      p_check_in: checkIn,
      p_check_out: checkOut,
      p_num_nights: breakdown.num_nights,
      p_base_amount: breakdown.base_amount,
      p_extra_guest_amount: breakdown.extra_guest_amount,
      p_tax_amount: breakdown.tax_amount,
      p_total_amount: breakdown.total_amount,
      p_special_requests: specialRequests ?? null,
    });

    if (dbError) {
      const msg = dbError.message ?? '';
      if (msg.startsWith('DATE_UNAVAILABLE') || msg.startsWith('DATE_BLOCKED')) {
        return NextResponse.json({ error: msg }, { status: 409 });
      }
      console.error('[create-order] DB error creating booking:', msg);
      return NextResponse.json({ error: 'Booking could not be created. Please try again.' }, { status: 503 });
    }

    const row = (data as { reference_number: string; booking_id: string }[])[0];
    const bookingReference = row.reference_number;
    const bookingId = row.booking_id;

    if (company) {
      const { error: gstError } = await supabase
        .from('bookings')
        .update({ guest_company: company, guest_gstin: gstin })
        .eq('id', bookingId);
      if (gstError) console.error(`[create-order] Could not save GST details for ${bookingReference}:`, gstError.message);
    }

    // Create Razorpay order — amount is already in paise (integer). If this
    // fails, release the hold at once rather than blocking the dates for 15 min.
    let razorpayOrder;
    try {
      razorpayOrder = await getRazorpay().orders.create({
        amount: breakdown.total_amount,
        currency: 'INR',
        receipt: bookingReference,
        notes: {
          property_id: propertyId,
          booking_reference: bookingReference,
          check_in: checkIn,
          check_out: checkOut,
          guest_name: guestName,
          guest_email: guestEmail,
        },
      });
    } catch (err) {
      console.error('[create-order] Razorpay order failed, releasing hold:', err);
      await supabase
        .from('bookings')
        .update({ status: 'expired', hold_expires_at: null })
        .eq('id', bookingId)
        .eq('status', 'pending');
      return NextResponse.json({ error: 'Payment could not be started. Please try again.' }, { status: 503 });
    }

    // Insert payments row so the webhook can find it by razorpay_order_id
    const { error: paymentError } = await supabase.from('payments').insert({
      booking_id: bookingId,
      razorpay_order_id: razorpayOrder.id,
      amount: breakdown.total_amount,
      currency: 'INR',
      status: 'created',
    });

    if (paymentError) {
      console.error('[create-order] Failed to insert payments row:', paymentError.message);
      return NextResponse.json({ error: 'Booking could not be created. Please try again.' }, { status: 503 });
    }

    // The private link the guest lands on after paying. Only this browser, which
    // created the booking, receives it.
    const { data: tokenRow, error: tokenError } = await supabase
      .from('bookings').select('access_token').eq('id', bookingId).single();
    if (tokenError || !tokenRow) {
      console.error('[create-order] Could not read booking token:', tokenError?.message);
      return NextResponse.json({ error: 'Booking could not be created. Please try again.' }, { status: 503 });
    }

    return NextResponse.json({
      bookingToken: tokenRow.access_token,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      amount: breakdown.total_amount,
      currency: 'INR',
      breakdown: {
        num_nights: breakdown.num_nights,
        base_amount: breakdown.base_amount,
        extra_guest_amount: breakdown.extra_guest_amount,
        tax_amount: breakdown.tax_amount,
        total_amount: breakdown.total_amount,
      },
    });
  } catch (err) {
    console.error('[create-order] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}
