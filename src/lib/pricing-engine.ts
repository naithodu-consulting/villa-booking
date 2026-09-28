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

/**
 * The rate for a single night, in paise: a pricing rule covering that night
 * (start_date inclusive, end_date exclusive), else the weekend rate for Friday
 * and Saturday nights, else the weekday rate.
 *
 * Shared by calculateBookingPrice and the price calendar, so the price a guest
 * sees on a date is the price checkout charges for it.
 */
export function nightlyRate(
  property: Pick<Property, 'base_nightly_rate' | 'weekend_nightly_rate'>,
  pricingRules: PricingRule[],
  dateStr: string
): { rate: number; isWeekend: boolean; rule?: PricingRule } {
  const dayOfWeek = new Date(dateStr + 'T00:00:00Z').getUTCDay(); // 0=Sun, 5=Fri, 6=Sat
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
  const rule = pricingRules.find((r) => dateStr >= r.start_date && dateStr < r.end_date);
  // All rates are stored in paise; toInt() guards against DB DECIMAL → JS float drift
  const rate = rule
    ? toInt(rule.nightly_rate)
    : isWeekend
    ? toInt(property.weekend_nightly_rate)
    : toInt(property.base_nightly_rate);
  return { rate, isWeekend, rule };
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
    const { rate: ratePaise, isWeekend, rule: matchedRule } = nightlyRate(property, pricingRules, dateStr);

    baseAmountPaise += ratePaise;
    nightlyDetails.push({
      date: dateStr,
      rate: ratePaise,
      is_weekend: isWeekend,
      rule_applied: matchedRule?.rule_name,
    });

    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  // Extra guests (adults + children above base occupancy), all in paise.
  // Two tiers: guests from extra_guest_tier2_from onwards pay extra_guest_tier2_rate,
  // the ones before that pay extra_guest_rate. For Villa 19 (00039): 8 included,
  // guests 9-11 at Rs 1,000 and 12-14 at Rs 700, per guest per night. Without a
  // second tier configured, every extra guest pays extra_guest_rate.
  const extraGuestsCount = Math.max(0, totalGuests - property.base_occupancy);
  const tier2From = property.extra_guest_tier2_from;
  const tier2Count = tier2From != null && property.extra_guest_tier2_rate != null
    ? Math.min(extraGuestsCount, Math.max(0, totalGuests - tier2From + 1))
    : 0;
  const tier1Count = extraGuestsCount - tier2Count;
  const extraPerNightPaise =
    tier1Count * toInt(property.extra_guest_rate) +
    tier2Count * toInt(property.extra_guest_tier2_rate ?? 0);
  const extraGuestAmountPaise = extraPerNightPaise * numNights;

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
