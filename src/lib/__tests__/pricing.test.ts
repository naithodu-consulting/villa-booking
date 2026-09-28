import { describe, it, expect } from 'vitest';
import { calculateBookingPrice } from '../pricing-engine';
import type { Property, PricingRule } from '@/types';

const VILLA: Property = {
  id: 'test-villa',
  slug: 'test-villa',
  name: 'Test Villa',
  tagline: 'Test',
  description: 'Test',
  address: 'Mangalore',
  city: 'Mangalore',
  state: 'Karnataka',
  pincode: '575001',
  geo_lat: 12.8,
  geo_lng: 74.8,
  base_occupancy: 8,
  ideal_occupancy: 8,
  max_occupancy: 14,
  extra_guest_rate: 50000,       // ₹500 in paise
  base_nightly_rate: 1000000,    // ₹10,000 in paise
  weekend_nightly_rate: 1400000, // ₹14,000 in paise
  check_in_time: '14:00',
  check_out_time: '11:00',
  is_active: true,
};

describe('calculateBookingPrice', () => {
  describe('basic weekday stay', () => {
    it('calculates 2 weekday nights correctly', () => {
      // Monday → Wednesday (2 weekday nights)
      const result = calculateBookingPrice(VILLA, [], '2026-08-24', '2026-08-26', 6, 0);
      expect(result.num_nights).toBe(2);
      expect(result.base_amount).toBe(2_000_000); // 2 × ₹10,000 in paise
      expect(result.extra_guest_amount).toBe(0);
      expect(result.subtotal).toBe(2_000_000);
    });
  });

  describe('weekend pricing', () => {
    it('applies weekend rate for Friday and Saturday nights', () => {
      // Friday → Sunday (2 weekend nights)
      const result = calculateBookingPrice(VILLA, [], '2026-08-21', '2026-08-23', 2, 0);
      expect(result.num_nights).toBe(2);
      expect(result.base_amount).toBe(2_800_000); // 2 × ₹14,000 in paise
    });

    it('applies mixed rates for Thu-Sat stay', () => {
      // Thursday (weekday) + Friday (weekend) + Saturday (weekend) = 3 nights
      const result = calculateBookingPrice(VILLA, [], '2026-08-20', '2026-08-23', 2, 0);
      expect(result.num_nights).toBe(3);
      // 1 weekday + 2 weekend
      expect(result.base_amount).toBe(1_000_000 + 2 * 1_400_000);
    });
  });

  describe('extra guest charges', () => {
    it('charges extra guests above base occupancy', () => {
      // 10 adults, base is 8 → 2 extra guests, ₹500/night × 1 night
      const result = calculateBookingPrice(VILLA, [], '2026-08-24', '2026-08-25', 10, 0);
      expect(result.extra_guests_count).toBe(2);
      expect(result.extra_guest_amount).toBe(2 * 50_000); // 2 guests × 1 night × ₹500 in paise
    });

    it('counts children toward extra guest charge', () => {
      // 8 adults + 2 children = 10 total → 2 extra guests
      const result = calculateBookingPrice(VILLA, [], '2026-08-24', '2026-08-25', 8, 2);
      expect(result.extra_guests_count).toBe(2);
    });

    it('does not charge extras when at base occupancy', () => {
      const result = calculateBookingPrice(VILLA, [], '2026-08-24', '2026-08-25', 8, 0);
      expect(result.extra_guest_amount).toBe(0);
    });

    it('accumulates extra guest charges over multiple nights', () => {
      // 2 extra guests × 2 nights × ₹500 = ₹2,000 (in paise: 200,000)
      const result = calculateBookingPrice(VILLA, [], '2026-08-24', '2026-08-26', 10, 0);
      expect(result.extra_guest_amount).toBe(2 * 2 * 50_000);
    });
  });

  describe('GST calculation', () => {
    it('applies 18% GST on subtotal (rounded to nearest paise)', () => {
      const result = calculateBookingPrice(VILLA, [], '2026-08-24', '2026-08-25', 2, 0);
      const expectedTax = Math.round(result.subtotal * 0.18);
      expect(result.tax_amount).toBe(expectedTax);
      expect(result.total_amount).toBe(result.subtotal + expectedTax);
    });
  });

  describe('seasonal pricing rules', () => {
    const seasonRule: PricingRule = {
      id: 'peak',
      property_id: 'test-villa',
      rule_name: 'Christmas Peak',
      start_date: '2026-12-23',
      end_date: '2026-12-27',
      nightly_rate: 2_000_000, // ₹20,000 in paise
      min_stay_nights: 3,
    };

    it('applies seasonal rate over base rate', () => {
      // 3 nights satisfies the min_stay of 3
      const result = calculateBookingPrice(VILLA, [seasonRule], '2026-12-24', '2026-12-27', 2, 0);
      expect(result.num_nights).toBe(3);
      expect(result.base_amount).toBe(3 * 2_000_000);
      expect(result.nightly_details.every((d) => d.rule_applied === 'Christmas Peak')).toBe(true);
    });

    it('throws when booking is shorter than min_stay_nights during a rule period', () => {
      expect(() =>
        calculateBookingPrice(VILLA, [seasonRule], '2026-12-24', '2026-12-25', 2, 0)
      ).toThrow('MIN_STAY');
    });
  });

  describe('validation', () => {
    it('throws on check-out before check-in', () => {
      expect(() =>
        calculateBookingPrice(VILLA, [], '2026-08-25', '2026-08-24', 2, 0)
      ).toThrow('INVALID_DATE_RANGE');
    });

    it('throws on same-day check-in and check-out', () => {
      expect(() =>
        calculateBookingPrice(VILLA, [], '2026-08-24', '2026-08-24', 2, 0)
      ).toThrow('INVALID_DATE_RANGE');
    });

    it('throws on invalid date strings', () => {
      expect(() =>
        calculateBookingPrice(VILLA, [], 'not-a-date', '2026-08-25', 2, 0)
      ).toThrow('INVALID_DATE_RANGE');
    });

    it('throws when guest count exceeds max occupancy', () => {
      expect(() =>
        calculateBookingPrice(VILLA, [], '2026-08-24', '2026-08-25', 15, 0)
      ).toThrow('MAX_OCCUPANCY');
    });
  });
});

// Villa 19's live configuration from 00039: 8 guests included, guests 9-11 at
// Rs 1,000 and 12-14 at Rs 700 per person per night, capped at 14, and Rs 16,000
// on New Year's Eve and New Year's Day.
describe('Villa 19 pricing (00039)', () => {
  const VILLA_19: Property = {
    ...VILLA,
    base_occupancy: 8,
    max_occupancy: 14,
    extra_guest_rate: 100_000,       // ₹1,000, guests 9-11
    extra_guest_tier2_from: 12,
    extra_guest_tier2_rate: 70_000,  // ₹700, guests 12-14
    base_nightly_rate: 1_200_000,    // ₹12,000
    weekend_nightly_rate: 1_400_000, // ₹14,000
  };
  const NEW_YEAR: PricingRule = {
    id: 'ny', property_id: 'test-villa', rule_name: "New Year's Eve and New Year's Day",
    start_date: '2026-12-31', end_date: '2027-01-02', nightly_rate: 1_600_000, min_stay_nights: 1,
  };
  // One weekday night (Mon 14 Dec) so the extra per night is the whole extra.
  const extraFor = (guests: number) =>
    calculateBookingPrice(VILLA_19, [], '2026-12-14', '2026-12-15', guests, 0).extra_guest_amount;

  it('includes 8 guests in the nightly rate', () => {
    const r = calculateBookingPrice(VILLA_19, [NEW_YEAR], '2026-12-28', '2026-12-29', 8, 0);
    expect(r.extra_guests_count).toBe(0);
    expect(r.base_amount).toBe(1_200_000);
  });

  it('charges ₹1,000 each for guests 9 to 11 and ₹700 each for 12 to 14, stepwise', () => {
    expect(extraFor(9)).toBe(100_000);
    expect(extraFor(11)).toBe(300_000);
    expect(extraFor(12)).toBe(370_000);  // 3 × 1,000 + 1 × 700
    expect(extraFor(14)).toBe(510_000);  // 3 × 1,000 + 3 × 700
  });

  it('never makes a bigger group cheaper', () => {
    for (let g = 8; g < 14; g++) expect(extraFor(g + 1)).toBeGreaterThan(extraFor(g));
  });

  it('counts children, multiplies by nights and taxes the extra', () => {
    // Mon 14 Dec to Thu 17 Dec: 3 weekday nights, 10 adults + 2 children = 12 guests
    const r = calculateBookingPrice(VILLA_19, [NEW_YEAR], '2026-12-14', '2026-12-17', 10, 2);
    expect(r.extra_guests_count).toBe(4);
    expect(r.extra_guest_amount).toBe(370_000 * 3);
    expect(r.tax_amount).toBe(Math.round(((1_200_000 * 3 + 370_000 * 3) * 18) / 100));
  });

  it('falls back to one flat rate when no second tier is set', () => {
    const flat = { ...VILLA_19, extra_guest_tier2_from: null, extra_guest_tier2_rate: null };
    expect(calculateBookingPrice(flat, [], '2026-12-14', '2026-12-15', 14, 0).extra_guest_amount).toBe(6 * 100_000);
  });

  it('refuses a 15th guest', () => {
    expect(() => calculateBookingPrice(VILLA_19, [], '2026-12-14', '2026-12-15', 15, 0)).toThrow('MAX_OCCUPANCY');
  });

  it("prices 31 Dec and 1 Jan at ₹16,000, overriding the Friday weekend rate, and 2 Jan at the weekend rate", () => {
    // Wed 30 Dec to Sun 3 Jan
    const r = calculateBookingPrice(VILLA_19, [NEW_YEAR], '2026-12-30', '2027-01-03', 8, 0);
    expect(r.nightly_details.map((n) => [n.date, n.rate])).toEqual([
      ['2026-12-30', 1_200_000], // Wed
      ['2026-12-31', 1_600_000], // Thu, New Year's Eve
      ['2027-01-01', 1_600_000], // Fri, New Year's Day
      ['2027-01-02', 1_400_000], // Sat, weekend
    ]);
    expect(r.base_amount).toBe(5_800_000);
    expect(r.tax_amount).toBe(1_044_000);
    expect(r.total_amount).toBe(6_844_000);
  });

  it('allows a single night on New Year\'s Eve (no minimum stay)', () => {
    const r = calculateBookingPrice(VILLA_19, [NEW_YEAR], '2026-12-31', '2027-01-01', 12, 0);
    expect(r.num_nights).toBe(1);
    expect(r.base_amount).toBe(1_600_000);
  });
});

import { nightlyRate } from '../pricing-engine';

describe('nightlyRate', () => {
  const rates = { base_nightly_rate: 1_200_000, weekend_nightly_rate: 1_400_000 };
  const newYear: PricingRule = {
    id: 'ny', property_id: 'p', rule_name: 'NY', start_date: '2026-12-31', end_date: '2027-01-02',
    nightly_rate: 1_600_000, min_stay_nights: 1,
  };

  it('uses the weekday rate Sunday to Thursday', () => {
    expect(nightlyRate(rates, [], '2026-12-13').rate).toBe(1_200_000); // Sun
    expect(nightlyRate(rates, [], '2026-12-17').rate).toBe(1_200_000); // Thu
  });

  it('uses the weekend rate on Friday and Saturday nights', () => {
    expect(nightlyRate(rates, [], '2026-12-18')).toMatchObject({ rate: 1_400_000, isWeekend: true }); // Fri
    expect(nightlyRate(rates, [], '2026-12-19').rate).toBe(1_400_000); // Sat
  });

  it('lets a pricing rule override the weekend rate, and excludes the rule end date', () => {
    expect(nightlyRate(rates, [newYear], '2026-12-31').rate).toBe(1_600_000); // Thu
    expect(nightlyRate(rates, [newYear], '2027-01-01')).toMatchObject({ rate: 1_600_000, rule: newYear }); // Fri
    expect(nightlyRate(rates, [newYear], '2027-01-02').rule).toBeUndefined(); // Sat, end date excluded
    expect(nightlyRate(rates, [newYear], '2027-01-02').rate).toBe(1_400_000);
  });
});
