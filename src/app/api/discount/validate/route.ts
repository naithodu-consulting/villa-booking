import { NextRequest, NextResponse } from 'next/server';

import { applyDiscount, calculateBookingPrice } from '@/lib/pricing-engine';
import { createServiceClient } from '@/lib/supabase/server';
import type { Property, PricingRule } from '@/types';

/**
 * POST /api/discount/validate
 *
 * Validates a promo code for a pending booking and returns the discount amount
 * in paise. Re-validation also happens server-side inside create-order (defense
 * in depth), so this endpoint may return an optimistic "valid" that create-order
 * later rejects in a race condition — that is fine; the guest sees the
 * create-order error at payment time.
 *
 * Body: { code, propertyId, checkIn, checkOut, adults, children, guestPhone }
 * 200:  { valid: true, code, discountAmountPaise, message }
 * 200:  { valid: false, error }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, propertyId, checkIn, checkOut, adults, children, guestPhone } = body;

    if (!code || !propertyId || !checkIn || !checkOut) {
      return NextResponse.json({ valid: false, error: 'Missing required fields.' });
    }

    const normalizedCode = String(code).toUpperCase().trim();
    if (!/^[A-Z0-9]{3,20}$/.test(normalizedCode)) {
      return NextResponse.json({ valid: false, error: 'Invalid promo code format.' });
    }

    const supabase = createServiceClient();
    const today = new Date().toISOString().slice(0, 10);

    const [{ data: dc }, { data: propData }, { data: rulesData }] = await Promise.all([
      supabase
        .from('discount_codes')
        .select('*')
        .eq('code', normalizedCode)
        .eq('property_id', propertyId)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('pricing_rules')
        .select('*')
        .eq('property_id', propertyId)
        .gte('end_date', today),
    ]);

    if (!dc) {
      return NextResponse.json({ valid: false, error: 'Promo code not found or not active.' });
    }
    if (!propData) {
      return NextResponse.json({ valid: false, error: 'Property not found.' });
    }

    if (today < dc.valid_from || today > dc.valid_to) {
      return NextResponse.json({ valid: false, error: 'This promo code has expired.' });
    }

    // Compute breakdown server-side — never trust client amounts
    const property = {
      ...(propData as Property),
      check_in_time: propData.check_in_time?.slice(0, 5) ?? '14:00',
      check_out_time: propData.check_out_time?.slice(0, 5) ?? '10:00',
    } as Property;
    const rules: PricingRule[] = (rulesData as PricingRule[]) ?? [];

    let breakdown;
    try {
      breakdown = calculateBookingPrice(
        property,
        rules,
        checkIn,
        checkOut,
        adults ?? property.ideal_occupancy,
        children ?? 0,
      );
    } catch {
      return NextResponse.json({ valid: false, error: 'Invalid booking dates.' });
    }

    const subtotalPaise = breakdown.base_amount + breakdown.extra_guest_amount;

    if (breakdown.num_nights < dc.min_nights) {
      return NextResponse.json({
        valid: false,
        error: `This code requires a minimum stay of ${dc.min_nights} night${dc.min_nights === 1 ? '' : 's'}.`,
      });
    }

    if (subtotalPaise < (Number(dc.min_booking_value) * 100)) {
      return NextResponse.json({
        valid: false,
        error: `This code requires a minimum booking value of ₹${Number(dc.min_booking_value).toLocaleString('en-IN')}.`,
      });
    }

    // Blackout check (end-exclusive ranges)
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const blackouts: Array<{ start: string; end: string }> = Array.isArray(dc.blackouts)
      ? (dc.blackouts as Array<{ start: string; end: string }>)
      : [];

    for (const b of blackouts) {
      if (checkInDate < new Date(b.end) && checkOutDate > new Date(b.start)) {
        return NextResponse.json({
          valid: false,
          error: 'This code is not valid for the selected check-in dates.',
        });
      }
    }

    // Global max uses
    if (dc.max_uses != null) {
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('discount_code', normalizedCode)
        .eq('property_id', propertyId)
        .in('status', ['confirmed', 'completed']);
      if ((count ?? 0) >= dc.max_uses) {
        return NextResponse.json({
          valid: false,
          error: 'This code has reached its maximum number of uses.',
        });
      }
    }

    // Per-guest max uses — only check if phone is provided; enforce at create-order
    if (guestPhone && typeof guestPhone === 'string' && guestPhone.trim()) {
      const { count: guestCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('discount_code', normalizedCode)
        .eq('property_id', propertyId)
        .eq('guest_phone', guestPhone.trim())
        .in('status', ['confirmed', 'completed']);
      if ((guestCount ?? 0) >= dc.max_uses_per_guest) {
        return NextResponse.json({
          valid: false,
          error: "You've already used this code the maximum number of times.",
        });
      }
    }

    // Calculate discount amount in paise
    let discountAmountPaise: number;
    if (dc.discount_type === 'percent') {
      discountAmountPaise = Math.floor((subtotalPaise * Number(dc.discount_value)) / 100);
      if (dc.max_discount != null) {
        discountAmountPaise = Math.min(
          discountAmountPaise,
          Math.floor(Number(dc.max_discount) * 100),
        );
      }
    } else {
      discountAmountPaise = Math.floor(Number(dc.discount_value) * 100);
    }
    // The discount comes off the taxable value, so re-price the stay rather
    // than subtracting it from the gross total: GST follows the discount.
    const priced = applyDiscount(breakdown, discountAmountPaise);
    discountAmountPaise = priced.discount_amount;

    const message =
      dc.discount_type === 'percent'
        ? `${dc.discount_value}% off applied`
        : `₹${Number(dc.discount_value).toLocaleString('en-IN')} off applied`;

    return NextResponse.json({
      valid: true,
      code: normalizedCode,
      discountAmountPaise,
      // So the checkout can show the reduced GST and total without
      // recomputing the tax rule in the browser.
      taxAmountPaise: priced.tax_amount,
      totalAmountPaise: priced.total_amount,
      message,
    });
  } catch (err) {
    console.error('[discount/validate]', err);
    return NextResponse.json(
      { valid: false, error: 'Could not validate code. Please try again.' },
      { status: 500 },
    );
  }
}
