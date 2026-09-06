-- Seed: Villa 19 by Habbaa — local development data
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
  'villa-19',
  'Villa 19',
  'Premium 4-Bedroom Private Villa in Urwa, Mangalore',
  'Villa 19 is a premium 4-bedroom private villa nestled in lush green surroundings in Urwa, Mangalore. Spread across a spacious property with a manicured lawn, private balconies on every floor, and ample covered parking, this villa comfortably hosts up to 12 guests. The beach is just 1.5 km away. Main road, local market and shops are within easy reach. Perfect for family reunions, group getaways and milestone celebrations.',
  'Urwa', 'Mangalore', 'Karnataka', '575006',
  12.8634, 74.8422,
  8, 12,
  75000,    -- ₹750/extra guest
  1200000,  -- ₹12,000/night base
  1400000,  -- ₹14,000/night weekend
  '14:00:00', '11:00:00',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug, name = EXCLUDED.name, tagline = EXCLUDED.tagline, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

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
  ('a1b2c3d4-0000-0000-0000-000000000021', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=1600&q=80', 'Villa 19 - Main Exterior with Tropical Garden', 'hero',     1),
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

-- ─────────────────────────────────────────────────────────
-- Amenities
-- ─────────────────────────────────────────────────────────
INSERT INTO property_amenities (property_id, category, label, icon, is_available, display_order) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Comfort & Leisure', 'Air Conditioning in All Rooms',    'AirVent',         TRUE, 10),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Comfort & Leisure', 'High-Speed Wi-Fi',                 'Wifi',            TRUE, 11),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Comfort & Leisure', '55" Smart TV with OTT',            'Tv',              TRUE, 12),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Comfort & Leisure', 'Private Balconies on Every Floor', 'Wind',            TRUE, 13),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Kitchen & Dining',  'Fully Equipped Kitchen',           'ChefHat',         TRUE, 20),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Kitchen & Dining',  'BBQ Grill & Bonfire Kit',          'Flame',           TRUE, 21),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Kitchen & Dining',  'Outdoor Dining Area',              'UtensilsCrossed', TRUE, 22),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Kitchen & Dining',  'Dining for up to 12 Guests',       'Users',           TRUE, 23),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Kitchen & Dining',  'Refrigerator & Microwave',         'Refrigerator',    TRUE, 24),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Kitchen & Dining',  'Gas Stove & Cookware',             'Flame',           TRUE, 25),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoor & Location','Spacious Private Lawn',            'Trees',           TRUE, 30),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoor & Location','Covered Parking for 4+ Cars',      'Car',             TRUE, 31),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoor & Location','Lush Green Surroundings',          'Leaf',            TRUE, 32),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoor & Location','Beach 1.5 km Away',                'Waves',           TRUE, 33),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoor & Location','Near Main Road, Market & Shops',   'MapPin',          TRUE, 34),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Safety & Hygiene',  '24/7 On-Site Caretaker',           'ShieldCheck',     TRUE, 40),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Safety & Hygiene',  'CCTV Security',                    'Camera',          TRUE, 41),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Safety & Hygiene',  '100% Power Backup Generator',      'Zap',             TRUE, 42),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Safety & Hygiene',  'First Aid Kit',                    'HeartPulse',      TRUE, 43)
ON CONFLICT ON CONSTRAINT uq_amenity_property_label DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- House Policies
-- ─────────────────────────────────────────────────────────
INSERT INTO property_policies (property_id, key, title, body, category, display_order) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'checkin_time',
   'Check-In & Check-Out',
   'Check-in: 14:00 · Check-out: 11:00. Early check-in and late check-out are subject to availability and must be requested at least 24 hours in advance. Additional charges may apply.',
   'checkin', 10),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'id_requirement',
   'Government ID Required',
   'All adult guests must present valid government-issued photo ID at check-in: Aadhaar card, passport, or driving licence. This is a legal requirement under Karnataka state regulations. Soft copies must be shared via WhatsApp before arrival.',
   'id', 20),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'quiet_hours',
   'Quiet Hours',
   'Quiet hours are observed from 11 PM to 7 AM. Music or amplified sound outside the villa is not permitted after 11 PM, out of respect for neighbours.',
   'rules', 30),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'no_smoking',
   'No Smoking Indoors',
   'Smoking is strictly prohibited inside the villa, including all bedrooms, living areas and kitchen. Designated smoking areas are available on the lawn. Please dispose of cigarette butts responsibly.',
   'smoking', 31),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'pets_policy',
   'No Pets',
   'We regret that pets are not permitted at the villa at this time. Please make alternative arrangements for your animals before booking.',
   'pets', 32),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'events_policy',
   'Events & Gatherings',
   'The villa is well suited for private family gatherings and milestone celebrations. Events with outside guests (beyond the booked group) require prior written approval and may be subject to additional terms. Loud DJ music is not permitted. Contact us before booking for event enquiries.',
   'events', 33),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'kitchen_policy',
   'Kitchen Use',
   'The fully equipped kitchen is available for self-catering throughout your stay. Guests are welcome to bring their own groceries. Please clean up after cooking and leave the kitchen as you found it. The kitchen is not staffed - no in-house cook is provided.',
   'kitchen', 34),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'housekeeping_policy',
   'Housekeeping',
   'The villa is professionally cleaned before each check-in. Mid-stay housekeeping is available on request and may carry an additional charge for stays beyond 3 nights. The on-site caretaker is available 24/7 for assistance.',
   'housekeeping', 35),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'cancellation',
   'Cancellation Policy',
   '30 or more days before check-in: 90% refund. 15 to 30 days before check-in: 50% refund. Less than 15 days before check-in: no refund. The security deposit is refunded within 5 working days of check-out, subject to no damage.',
   'cancellation', 40)
ON CONFLICT (property_id, key) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body;

-- ─────────────────────────────────────────────────────────
-- FAQs
-- ─────────────────────────────────────────────────────────
INSERT INTO faqs (property_id, question, answer, category, display_order, is_published) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'What is included in the base booking price?', 'The base price covers exclusive use of the entire villa: all 4 bedrooms, private lawn, balconies, covered parking, high-speed Wi-Fi, and 24/7 caretaker service. Cooking gas and kitchen basics are also included.', 'general', 10, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is there a kitchen available for guests?', 'Yes. The villa has a fully equipped kitchen: gas stove, refrigerator, microwave, cookware and utensils. Guests are welcome to bring groceries or order from nearby restaurants and food delivery services. No in-house cook is provided.', 'general', 20, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'What are the check-in and check-out times?', 'Standard check-in is at 14:00 and check-out is at 11:00. Early check-in and late check-out are available on request (subject to availability). Please contact us at least 24 hours in advance.', 'general', 30, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'How far is the beach from the villa?', 'The nearest beach is approximately 1.5 km from the villa, about a 5-minute drive or a leisurely 15 to 20 minute walk. The villa is also close to the main road, local market and everyday shops.', 'location', 40, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is the property suitable for events or large gatherings?', 'Yes. The villa is well suited for private family gatherings, milestone celebrations and corporate offsites. The spacious lawn is ideal for outdoor celebrations. Please contact us before booking for event enquiries - special terms and event-specific pricing may apply.', 'general', 50, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'What is the cancellation policy?', 'Cancellations 30 or more days before check-in receive a 90% refund. 15 to 30 days: 50% refund. Less than 15 days before check-in: no refund. The security deposit is refunded within 5 working days of check-out.', 'policies', 60, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is government ID required at check-in?', 'Yes. All adult guests must present valid government-issued photo ID: Aadhaar card, passport or driving licence, at check-in. This is a legal requirement. We request that soft copies be shared via WhatsApp before arrival for faster check-in.', 'general', 70, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'How many cars can be parked at the villa?', 'The villa has covered parking for 4 or more cars within the property. Street parking is also available nearby.', 'general', 80, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is there a caretaker on site?', 'Yes. A caretaker is available on site 24/7 throughout your stay to assist with any needs. They will greet you at check-in and are reachable at any hour during your stay.', 'general', 90, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Can I book just a single bedroom?', 'No. Villa 19 is booked exclusively as a whole property. All 4 bedrooms, the lawn, and all common spaces are reserved for your group only. Individual room bookings are not available.', 'booking', 100, TRUE)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- Nearby Places
-- ─────────────────────────────────────────────────────────
INSERT INTO nearby_places (property_id, name, category, distance_km, travel_minutes, note, display_order, is_published) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Panambur Beach',              'beach',       1.5,  5,  'Popular sandy beach, clean and family-friendly',              10, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Tannirbhavi Beach',           'beach',       4.0,  12, 'Quieter, less crowded: good for morning walks',               11, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Someshwar Beach',             'beach',       6.0,  18, 'Scenic; near Someshwar temple',                               12, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Kadri Manjunath Temple',      'temple',      3.5,  10, '11th century temple, one of Mangalore''s oldest',            20, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Sharavu Mahaganapathi Temple','temple',      4.0,  12, 'Famous Ganesha temple in city centre',                        21, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'St. Aloysius Chapel',         'temple',      4.5,  15, 'Stunning Italian-style frescos, 1880',                        22, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Ideal Ice Cream',             'food',        3.0,  10, 'Mangalore institution: cashew, tender coconut',               30, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Machali Restaurant',          'food',        2.5,  8,  'Local seafood: Mangalorean fish curry',                       31, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Hotel Srinivas',              'food',        2.0,  7,  'Udupi vegetarian breakfast: set dosa, idli',                  32, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Big Bazaar (Mangalore)',      'shopping',    5.0,  15, 'Supermarket for groceries and supplies',                      40, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Urwa Market',                 'shopping',    0.8,  3,  'Local market: fresh produce, daily needs',                   41, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Forum Fiza Mall',             'shopping',    7.0,  20, 'Largest mall in Mangalore',                                   42, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Mangalore Central Station',   'transport',   6.0,  20, 'Main railway station',                                        50, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Bajpe Airport (IXE)',         'transport',   15.0, 35, 'Mangalore International Airport',                             51, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'KSRTC Bus Stand',             'transport',   5.0,  15, 'State bus terminus for inter-city travel',                    52, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Pilikula Nisarga Dhama',      'attraction',  14.0, 30, 'Nature park, zoo, science centre: great for families',        60, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Sultan Battery',              'attraction',  8.0,  22, 'Historic watch tower at Gurupur river mouth',                 61, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Mangaladevi Temple',          'attraction',  5.0,  15, 'City''s patron goddess: gives Mangalore its name',            62, TRUE)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- Room slugs & property extended fields
-- ─────────────────────────────────────────────────────────
UPDATE rooms SET slug = 'garden-view-master-suite' WHERE id = 'a1b2c3d4-0000-0000-0000-000000000011';
UPDATE rooms SET slug = 'lawn-view-bedroom'         WHERE id = 'a1b2c3d4-0000-0000-0000-000000000012';
UPDATE rooms SET slug = 'sunset-balcony-suite'      WHERE id = 'a1b2c3d4-0000-0000-0000-000000000013';
UPDATE rooms SET slug = 'heritage-courtyard-room'   WHERE id = 'a1b2c3d4-0000-0000-0000-000000000014';

UPDATE properties SET
  descriptor       = 'by Habbaa',
  bathroom_count   = 4,
  bedroom_count    = 4,
  parking_spaces   = 4,
  has_power_backup = TRUE,
  has_wifi         = TRUE
WHERE id = 'a1b2c3d4-0000-0000-0000-000000000001';
