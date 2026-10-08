import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { applyDiscount, calculateBookingPrice } from '@/lib/pricing-engine';
import { createServiceClient } from '@/lib/supabase/server';
import type { Property, PricingRule } from '@/types';
import { GSTIN_RE } from '@/lib/gstin';
import { todayISO } from '@/lib/format';

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
      promoCode,
      expectedTotal,
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
    // The date at the property, not UTC. This gates promo-code valid_from and
    // valid_to below, so between 00:00 and 05:30 IST a UTC date would honour a
    // code a day early or reject one on its last valid day.
    const today = todayISO();

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
      check_out_time: propertyData.check_out_time?.slice(0, 5) ?? '10:00',
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

    // Re-validate promo code server-side if provided (the client-side
    // validate endpoint is advisory; this is the authoritative check).
    let discountCode: string | null = null;
    let discountAmount = 0;
    if (typeof promoCode === 'string' && promoCode.trim()) {
      const normalized = promoCode.toUpperCase().trim();
      const subtotalPaise = breakdown.base_amount + breakdown.extra_guest_amount;

      const { data: dc } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', normalized)
        .eq('property_id', propertyId)
        .eq('is_active', true)
        .maybeSingle();

      if (!dc) {
        return NextResponse.json({ error: 'Promo code is not valid.' }, { status: 422 });
      }

      if (today < dc.valid_from || today > dc.valid_to) {
        return NextResponse.json({ error: 'Promo code has expired.' }, { status: 422 });
      }
      if (breakdown.num_nights < dc.min_nights) {
        return NextResponse.json(
          { error: `Promo code requires a minimum stay of ${dc.min_nights} nights.` },
          { status: 422 },
        );
      }
      if (subtotalPaise < Number(dc.min_booking_value) * 100) {
        return NextResponse.json({ error: 'Booking value does not meet the promo code minimum.' }, { status: 422 });
      }

      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      for (const b of (dc.blackouts as Array<{ start: string; end: string }>) ?? []) {
        if (checkInDate < new Date(b.end) && checkOutDate > new Date(b.start)) {
          return NextResponse.json({ error: 'Promo code is not valid for these dates.' }, { status: 422 });
        }
      }

      if (dc.max_uses != null) {
        const { count } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('discount_code', normalized)
          .eq('property_id', propertyId)
          .in('status', ['confirmed', 'completed']);
        if ((count ?? 0) >= dc.max_uses) {
          return NextResponse.json({ error: 'Promo code has reached its maximum uses.' }, { status: 422 });
        }
      }

      const { count: guestCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('discount_code', normalized)
        .eq('property_id', propertyId)
        .eq('guest_phone', guestPhone)
        .in('status', ['confirmed', 'completed']);
      if ((guestCount ?? 0) >= dc.max_uses_per_guest) {
        return NextResponse.json({ error: "You've already used this promo code the maximum number of times." }, { status: 422 });
      }

      if (dc.discount_type === 'percent') {
        discountAmount = Math.floor((subtotalPaise * Number(dc.discount_value)) / 100);
        if (dc.max_discount != null) {
          discountAmount = Math.min(discountAmount, Math.floor(Number(dc.max_discount) * 100));
        }
      } else {
        discountAmount = Math.floor(Number(dc.discount_value) * 100);
      }
      discountAmount = Math.min(discountAmount, subtotalPaise);
      discountCode = normalized;
    }

    // The discount comes off the taxable value, so GST is charged on what the
    // guest actually pays. `priced.total_amount` is therefore the amount
    // payable, and the booking row records it as such.
    const priced = applyDiscount(breakdown, discountAmount);
    discountAmount = priced.discount_amount;
    const chargeAmount = priced.total_amount;

    // The guest pays what the server works out, not what their page displayed.
    // When the two disagree — a rate changed while the page was open, or the
    // page was loaded before a rate change — stop and show them the new price
    // rather than silently charging a figure they never agreed to. The amount
    // is authoritative either way; this is about consent, so an older client
    // that sends no expectation simply skips the check.
    if (typeof expectedTotal === 'number' && expectedTotal !== chargeAmount) {
      return NextResponse.json(
        {
          error: 'PRICE_CHANGED',
          message:
            'The price for these dates has changed since this page was opened. Please review the updated total and confirm.',
          breakdown: {
            num_nights: breakdown.num_nights,
            base_amount: breakdown.base_amount,
            extra_guest_amount: breakdown.extra_guest_amount,
            tax_amount: priced.tax_amount,
            total_amount: priced.total_amount,
            list_total: breakdown.total_amount,
            discount_code: discountCode,
            discount_amount: discountAmount,
            charge_amount: chargeAmount,
          },
        },
        { status: 409 },
      );
    }

    // Razorpay requires minimum 100 paise. A flat code that covers the full
    // booking value would produce chargeAmount = 0, which Razorpay rejects.
    if (chargeAmount < 100) {
      return NextResponse.json(
        { error: 'This discount code covers the full booking value. Please contact the property to complete your booking.' },
        { status: 422 },
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
      p_tax_amount: priced.tax_amount,
      p_total_amount: priced.total_amount,
      p_special_requests: specialRequests ?? null,
      p_discount_code: discountCode,
      p_discount_amount: discountAmount,
    });

    if (dbError) {
      const msg = dbError.message ?? '';
      if (msg.startsWith('DATE_UNAVAILABLE')) {
        console.error('[create-order] Availability conflict:', msg);
        return NextResponse.json(
          { error: 'These dates are no longer available. Please go back and select different dates.' },
          { status: 409 },
        );
      }
      if (msg.startsWith('DATE_BLOCKED')) {
        console.error('[create-order] Date blocked:', msg);
        return NextResponse.json(
          { error: 'These dates are unavailable. Please go back and select different dates.' },
          { status: 409 },
        );
      }
      if (msg.startsWith('DISCOUNT_')) {
        console.error('[create-order] Discount rejected:', msg);
        // The part after 'CODE: ' is written for the guest. Without a colon
        // the raw message would leak the code itself, so fall back instead.
        const colon = msg.indexOf(': ');
        return NextResponse.json(
          {
            error:
              colon === -1
                ? 'This discount code cannot be used for this booking.'
                : msg.slice(colon + 2),
          },
          { status: 422 },
        );
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
        amount: chargeAmount,
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
      amount: chargeAmount,
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
      amount: chargeAmount,
      currency: 'INR',
      breakdown: {
        num_nights: breakdown.num_nights,
        base_amount: breakdown.base_amount,
        extra_guest_amount: breakdown.extra_guest_amount,
        // Tax and total are after the discount; list_total is the price
        // before it, for showing what the guest saved.
        tax_amount: priced.tax_amount,
        total_amount: priced.total_amount,
        list_total: breakdown.total_amount,
        discount_code: discountCode,
        discount_amount: discountAmount,
        charge_amount: chargeAmount,
      },
    });
  } catch (err) {
    console.error('[create-order] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}
