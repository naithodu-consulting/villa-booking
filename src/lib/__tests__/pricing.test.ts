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
