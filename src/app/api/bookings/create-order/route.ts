import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { calculateBookingPrice } from '@/lib/pricing-engine';
import { createServiceClient } from '@/lib/supabase/server';
import type { Property, PricingRule } from '@/types';

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
      whatsapp_number: process.env.NEXT_PUBLIC_PROPERTY_WHATSAPP,
    };
    const pricingRules: PricingRule[] = rulesData ?? [];

    let breakdown;
    try {
      breakdown = calculateBookingPrice(property, pricingRules, checkIn, checkOut, adults ?? 2, children ?? 0);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Invalid booking dates.' },
        { status: 422 }
      );
    }

    // Create Razorpay order — amount is already in paise (integer)
    const razorpayOrder = await getRazorpay().orders.create({
      amount: breakdown.total_amount,
      currency: 'INR',
      notes: {
        property_id: propertyId,
        check_in: checkIn,
        check_out: checkOut,
        guest_name: guestName,
        guest_email: guestEmail,
      },
    });

    // Persist booking as 'pending' via atomic DB function
    // TODO: Replace mock with live Supabase once DB is connected
    let bookingReference: string;
    try {
      const { data, error } = await supabase.rpc('create_booking_atomic', {
        p_property_id: propertyId,
        p_guest_name: guestName,
        p_guest_email: guestEmail,
        p_guest_phone: guestPhone,
        p_num_adults: adults ?? 2,
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

      if (error) throw new Error(error.message);
      bookingReference = (data as { reference_number: string }[])[0].reference_number;
    } catch (dbErr) {
      const msg = dbErr instanceof Error ? dbErr.message : '';
      if (msg.startsWith('DATE_UNAVAILABLE') || msg.startsWith('DATE_BLOCKED')) {
        return NextResponse.json({ error: msg }, { status: 409 });
      }
      // Supabase not yet connected — fall back to mock reference so dev flow keeps working
      console.warn('[create-order] DB unavailable, using mock reference:', msg);
      bookingReference = 'MNG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    return NextResponse.json({
      bookingReference,
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
