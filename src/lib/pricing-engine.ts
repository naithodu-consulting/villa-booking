import { Property, PricingRule, PricingBreakdown } from '@/types';

/**
 * All monetary values are stored and calculated in INTEGER PAISE (₹1 = 100 paise).
 * Never use floating-point arithmetic for financial calculations.
 *
 * Display conversion: divide by 100 for rupee display only, never for computation.
 */

function toInt(value: number): number {
  return Math.round(value); // guard against any fractional paise reaching here
}

export function calculateBookingPrice(
  property: Property,
  pricingRules: PricingRule[],
  checkInDateStr: string,
  checkOutDateStr: string,
  numAdults: number,
  numChildren: number
): PricingBreakdown {
  const checkIn = new Date(checkInDateStr + 'T00:00:00Z');
  const checkOut = new Date(checkOutDateStr + 'T00:00:00Z');

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut <= checkIn) {
    throw new Error('INVALID_DATE_RANGE: Check-out must be after check-in date.');
  }

  const totalGuests = numAdults + numChildren;
  if (totalGuests > property.max_occupancy) {
    throw new Error(
      `MAX_OCCUPANCY: Guest count (${totalGuests}) exceeds property maximum (${property.max_occupancy}).`
    );
  }

  const MS_PER_DAY = 86_400_000;
  const numNights = Math.round((checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY);

  // Check min_stay against any seasonal rule that covers the entire stay
  for (const rule of pricingRules) {
    const rStart = new Date(rule.start_date + 'T00:00:00Z');
    const rEnd = new Date(rule.end_date + 'T00:00:00Z');
    // Rule is "active" if it overlaps the stay
    if (checkIn < rEnd && checkOut > rStart) {
      if (rule.min_stay_nights > 0 && numNights < rule.min_stay_nights) {
        throw new Error(
          `MIN_STAY: A minimum stay of ${rule.min_stay_nights} nights is required for "${rule.rule_name}".`
        );
      }
    }
  }

  // Build per-night breakdown, all amounts in paise (integers)
  let baseAmountPaise = 0;
  const nightlyDetails: PricingBreakdown['nightly_details'] = [];

  const curr = new Date(checkIn);
  while (curr < checkOut) {
    const dateStr = curr.toISOString().split('T')[0];
    const dayOfWeek = curr.getUTCDay(); // 0=Sun, 5=Fri, 6=Sat
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

    const matchedRule = pricingRules.find((rule) => {
      const rStart = new Date(rule.start_date + 'T00:00:00Z');
      const rEnd = new Date(rule.end_date + 'T00:00:00Z');
      return curr >= rStart && curr < rEnd;
    });

    // All rates are stored in paise; toInt() guards against DB DECIMAL → JS float drift
    const ratePaise = matchedRule
      ? toInt(matchedRule.nightly_rate)
      : isWeekend
      ? toInt(property.weekend_nightly_rate)
      : toInt(property.base_nightly_rate);

    baseAmountPaise += ratePaise;
    nightlyDetails.push({
      date: dateStr,
      rate: ratePaise,
      is_weekend: isWeekend,
      rule_applied: matchedRule?.rule_name,
    });

    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  // Extra guests (adults + children above base occupancy) — all in paise
  const extraGuestsCount = Math.max(0, totalGuests - property.base_occupancy);
  const extraGuestAmountPaise = extraGuestsCount * toInt(property.extra_guest_rate) * numNights;

  const subtotalPaise = baseAmountPaise + extraGuestAmountPaise;

  // 18% GST — multiply first, then integer divide to avoid floating point
  // (subtotal * 18) / 100, rounded to nearest paise
  const taxAmountPaise = Math.round((subtotalPaise * 18) / 100);

  const totalAmountPaise = subtotalPaise + taxAmountPaise;

  return {
    num_nights: numNights,
    base_amount: baseAmountPaise,
    extra_guests_count: extraGuestsCount,
    extra_guest_amount: extraGuestAmountPaise,
    subtotal: subtotalPaise,
    tax_amount: taxAmountPaise,
    total_amount: totalAmountPaise,
    nightly_details: nightlyDetails,
  };
}
