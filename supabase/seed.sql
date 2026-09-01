-- Seed: Coastal Haven Villa — local development data
-- All monetary values in PAISE (₹1 = 100 paise)
-- Fixed UUIDs so this file is idempotent on repeated resets

-- ─────────────────────────────────────────────────────────
-- Property
-- ─────────────────────────────────────────────────────────
INSERT INTO properties (
  id, slug, name, tagline, description,
  address, city, state, pincode,
  geo_lat, geo_lng,
  base_occupancy, max_occupancy,
  extra_guest_rate, base_nightly_rate, weekend_nightly_rate,
  check_in_time, check_out_time,
  is_active
) VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'coastal-haven-mangalore',
  'Coastal Haven Villa',
  'Premium 4-Bedroom Private Villa in Urwa, Mangalore',
  'Escape to Coastal Haven - a premium 4-bedroom private villa nestled in lush green surroundings in Urwa, Mangalore. Spread across a spacious property with a manicured lawn, private balconies on every floor, and ample covered parking, this villa comfortably hosts up to 12 guests. The beach is just 1.5 km away. Main road, local market and shops are within easy reach. Perfect for family reunions, group getaways and milestone celebrations.',
  'Urwa', 'Mangalore', 'Karnataka', '575006',
  12.8634, 74.8422,
  8, 12,
  75000,    -- ₹750/extra guest
  1200000,  -- ₹12,000/night base
  1400000,  -- ₹14,000/night weekend
  '14:00:00', '11:00:00',
  TRUE
) ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- Rooms (4 bedrooms)
-- ─────────────────────────────────────────────────────────
INSERT INTO rooms (id, property_id, name, room_type, bed_type, bed_count, max_guests, has_ensuite_bathroom, display_order) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000011', 'a1b2c3d4-0000-0000-0000-000000000001', 'Garden View Master Suite', 'Master Suite',    'King Size Bed',    1, 3, TRUE, 1),
  ('a1b2c3d4-0000-0000-0000-000000000012', 'a1b2c3d4-0000-0000-0000-000000000001', 'Lawn View Bedroom',        'Luxury Bedroom',  'Queen Size Bed',   1, 2, TRUE, 2),
  ('a1b2c3d4-0000-0000-0000-000000000013', 'a1b2c3d4-0000-0000-0000-000000000001', 'Sunset Balcony Suite',     'Balcony Suite',   'King Size Bed',    1, 3, TRUE, 3),
  ('a1b2c3d4-0000-0000-0000-000000000014', 'a1b2c3d4-0000-0000-0000-000000000001', 'Heritage Courtyard Room',  'Standard Room',   'Twin Double Beds', 2, 4, TRUE, 4)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- Property Images (12 Unsplash placeholders)
-- ─────────────────────────────────────────────────────────
INSERT INTO property_images (id, property_id, url, alt_text, category, display_order) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000021', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=1600&q=80', 'Coastal Haven Villa - Main Exterior with Tropical Garden', 'hero',     1),
  ('a1b2c3d4-0000-0000-0000-000000000022', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80', 'Bright Living Room with Natural Light',                    'living',   2),
  ('a1b2c3d4-0000-0000-0000-000000000023', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80', 'Garden View Master Suite - King Bed',                      'bedroom',  3),
  ('a1b2c3d4-0000-0000-0000-000000000024', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', 'Lawn View Bedroom - Queen Bed & Ensuite',                  'bedroom',  4),
  ('a1b2c3d4-0000-0000-0000-000000000025', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80', 'Dining - Fresh Coastal Cuisine',                           'dining',   5),
  ('a1b2c3d4-0000-0000-0000-000000000026', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80', 'Sunset Balcony Suite - King Bed',                          'bedroom',  6),
  ('a1b2c3d4-0000-0000-0000-000000000027', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80', 'Living Room - Evening Ambience',                           'living',   7),
  ('a1b2c3d4-0000-0000-0000-000000000028', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80', 'Heritage Courtyard Room - Twin Beds',                      'bedroom',  8),
  ('a1b2c3d4-0000-0000-0000-000000000029', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80', 'Villa Exterior - Garden & Green Surroundings',             'exterior', 9),
  ('a1b2c3d4-0000-0000-0000-00000000002a', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80', 'Open Living Area - Warm Evening Light',                    'living',   10),
  ('a1b2c3d4-0000-0000-0000-00000000002b', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80', 'Outdoor Dining - BBQ and Bonfire Evenings',                'dining',   11),
  ('a1b2c3d4-0000-0000-0000-00000000002c', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1475855581690-80accde3ae2b?auto=format&fit=crop&w=1200&q=80', 'Villa Balcony - Lush Green Views',                         'exterior', 12)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- Pricing Rules (Diwali & New Year seasonal examples)
-- ─────────────────────────────────────────────────────────
INSERT INTO pricing_rules (property_id, rule_name, start_date, end_date, nightly_rate, min_stay_nights) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Diwali Peak',      '2026-10-17', '2026-10-21', 1800000, 2),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'New Year Peak',    '2026-12-29', '2027-01-02', 2000000, 3),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Summer Holidays',  '2026-05-01', '2026-05-31', 1500000, 2)
ON CONFLICT DO NOTHING;
