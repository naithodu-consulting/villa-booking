-- Phase 1 seed: amenities, policies, FAQs, nearby places
-- All content is placeholder quality — operator should review and update before launch.
-- Run with (after resolving \set — use the python helper or inline the UUID manually):
--   python3 -c "import re,sys; c=open('supabase/seed_phase1.sql').read(); c=re.sub(r'^\\\\\set.*\n','',c,flags=re.MULTILINE); c=c.replace(\"'a1b2c3d4-0000-0000-0000-000000000001'\",'\'a1b2c3d4-0000-0000-0000-000000000001\''); open('/tmp/s.sql','w').write(c)"; supabase db query --linked --file /tmp/s.sql
-- NOTE: \set is a psql meta-command; supabase db query does NOT support it. UUID is inlined below.

-- Property UUID constant (Villa 19)
-- property_id = 'a1b2c3d4-0000-0000-0000-000000000001'

-- ─────────────────────────────────────────────────────────────────────
-- Amenities (replaces MOCK_AMENITIES hardcoded array)
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO property_amenities (property_id, category, label, icon, is_available, display_order) VALUES
  -- Comfort & Leisure
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Comfort & Leisure', 'Air Conditioning in All Rooms', 'AirVent',      TRUE, 10),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Comfort & Leisure', 'High-Speed Wi-Fi',              'Wifi',          TRUE, 11),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Comfort & Leisure', '55" Smart TV with OTT',         'Tv',            TRUE, 12),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Comfort & Leisure', 'Private Balconies on Every Floor', 'Wind',       TRUE, 13),
  -- Kitchen & Dining
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Kitchen & Dining',  'Fully Equipped Kitchen',        'ChefHat',       TRUE, 20),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Kitchen & Dining',  'BBQ Grill & Bonfire Kit',       'Flame',         TRUE, 21),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Kitchen & Dining',  'Outdoor Dining Area',           'UtensilsCrossed', TRUE, 22),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Kitchen & Dining',  'Dining for up to 12 Guests',    'Users',         TRUE, 23),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Kitchen & Dining',  'Refrigerator & Microwave',      'Refrigerator',  TRUE, 24),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Kitchen & Dining',  'Gas Stove & Cookware',          'Flame',         TRUE, 25),
  -- Outdoor & Location
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoor & Location', 'Spacious Private Lawn',        'Trees',         TRUE, 30),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoor & Location', 'Covered Parking for 4+ Cars',  'Car',           TRUE, 31),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoor & Location', 'Lush Green Surroundings',      'Leaf',          TRUE, 32),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoor & Location', 'Beach 1.5 km Away',            'Waves',         TRUE, 33),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoor & Location', 'Near Main Road, Market & Shops', 'MapPin',      TRUE, 34),
  -- Safety & Hygiene
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Safety & Hygiene',  '24/7 On-Site Caretaker',        'ShieldCheck',   TRUE, 40),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Safety & Hygiene',  'CCTV Security',                 'Camera',        TRUE, 41),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Safety & Hygiene',  '100% Power Backup Generator',   'Zap',           TRUE, 42),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Safety & Hygiene',  'First Aid Kit',                 'HeartPulse',    TRUE, 43)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
-- House Policies
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO property_policies (property_id, key, title, body, category, display_order) VALUES
  -- Check-in / Check-out
  ('a1b2c3d4-0000-0000-0000-000000000001', 'checkin_time',
   'Check-In & Check-Out',
   'Check-in: 14:00 · Check-out: 11:00. Early check-in and late check-out are subject to availability and must be requested at least 24 hours in advance. Additional charges may apply.',
   'checkin', 10),

  -- ID requirements
  ('a1b2c3d4-0000-0000-0000-000000000001', 'id_requirement',
   'Government ID Required',
   'All adult guests must present valid government-issued photo ID at check-in: Aadhaar card, passport, or driving licence. This is a legal requirement under Karnataka state regulations. Soft copies must be shared via WhatsApp before arrival.',
   'id', 20),

  -- House rules
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

  -- Cancellation
  ('a1b2c3d4-0000-0000-0000-000000000001', 'cancellation',
   'Cancellation Policy',
   '30 or more days before check-in: 90% refund. 15 to 30 days before check-in: 50% refund. Less than 15 days before check-in: no refund. The security deposit is refunded within 5 working days of check-out, subject to no damage.',
   'cancellation', 40)

ON CONFLICT (property_id, key) DO UPDATE SET
  title = EXCLUDED.title,
  body  = EXCLUDED.body;

-- ─────────────────────────────────────────────────────────────────────
-- FAQs
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO faqs (property_id, question, answer, category, display_order, is_published) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001',
   'What is included in the base booking price?',
   'The base price covers exclusive use of the entire villa: all 4 bedrooms, private lawn, balconies, covered parking, high-speed Wi-Fi, and 24/7 caretaker service. Cooking gas and kitchen basics are also included.',
   'general', 10, TRUE),

  ('a1b2c3d4-0000-0000-0000-000000000001',
   'Is there a kitchen available for guests?',
   'Yes. The villa has a fully equipped kitchen: gas stove, refrigerator, microwave, cookware and utensils. Guests are welcome to bring groceries or order from nearby restaurants and food delivery services. No in-house cook is provided.',
   'general', 20, TRUE),

  ('a1b2c3d4-0000-0000-0000-000000000001',
   'What are the check-in and check-out times?',
   'Standard check-in is at 14:00 and check-out is at 11:00. Early check-in and late check-out are available on request (subject to availability). Please contact us at least 24 hours in advance.',
   'general', 30, TRUE),

  ('a1b2c3d4-0000-0000-0000-000000000001',
   'How far is the beach from the villa?',
   'The nearest beach is approximately 1.5 km from the villa, about a 5-minute drive or a leisurely 15 to 20 minute walk. The villa is also close to the main road, local market and everyday shops.',
   'location', 40, TRUE),

  ('a1b2c3d4-0000-0000-0000-000000000001',
   'Is the property suitable for events or large gatherings?',
   'Yes. The villa is well suited for private family gatherings, milestone celebrations and corporate offsites. The spacious lawn is ideal for outdoor celebrations. Please contact us before booking for event enquiries - special terms and event-specific pricing may apply.',
   'general', 50, TRUE),

  ('a1b2c3d4-0000-0000-0000-000000000001',
   'What is the cancellation policy?',
   'Cancellations 30 or more days before check-in receive a 90% refund. 15 to 30 days: 50% refund. Less than 15 days before check-in: no refund. The security deposit is refunded within 5 working days of check-out.',
   'policies', 60, TRUE),

  ('a1b2c3d4-0000-0000-0000-000000000001',
   'Is government ID required at check-in?',
   'Yes. All adult guests must present valid government-issued photo ID: Aadhaar card, passport or driving licence, at check-in. This is a legal requirement. We request that soft copies be shared via WhatsApp before arrival for faster check-in.',
   'general', 70, TRUE),

  ('a1b2c3d4-0000-0000-0000-000000000001',
   'How many cars can be parked at the villa?',
   'The villa has covered parking for 4 or more cars within the property. Street parking is also available nearby.',
   'general', 80, TRUE),

  ('a1b2c3d4-0000-0000-0000-000000000001',
   'Is there a caretaker on site?',
   'Yes. A caretaker is available on site 24/7 throughout your stay to assist with any needs. They will greet you at check-in and are reachable at any hour during your stay.',
   'general', 90, TRUE),

  ('a1b2c3d4-0000-0000-0000-000000000001',
   'Can I book just a single bedroom?',
   'No. Villa 19 is booked exclusively as a whole property. All 4 bedrooms, the lawn, and all common spaces are reserved for your group only. Individual room bookings are not available.',
   'booking', 100, TRUE)

ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
-- Nearby Places
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO nearby_places (property_id, name, category, distance_km, travel_minutes, note, display_order, is_published) VALUES
  -- Beach
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Panambur Beach',       'beach',      1.5,  5,  'Popular sandy beach, clean and family-friendly', 10, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Tannirbhavi Beach',    'beach',      4.0,  12, 'Quieter, less crowded: good for morning walks',  11, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Someshwar Beach',      'beach',      6.0,  18, 'Scenic; near Someshwar temple',                   12, TRUE),

  -- Temples & Culture
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Kadri Manjunath Temple', 'temple',   3.5,  10, '11th century temple, one of Mangalore''s oldest', 20, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Sharavu Mahaganapathi Temple', 'temple', 4.0, 12, 'Famous Ganesha temple in city centre',        21, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'St. Aloysius Chapel',  'temple',     4.5,  15, 'Stunning Italian-style frescos, 1880',           22, TRUE),

  -- Food & Restaurants
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Ideal Ice Cream',      'food',       3.0,  10, 'Mangalore institution: cashew, tender coconut', 30, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Machali Restaurant',   'food',       2.5,  8,  'Local seafood: Mangalorean fish curry',         31, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Hotel Srinivas',       'food',       2.0,  7,  'Udupi vegetarian breakfast: set dosa, idli',    32, TRUE),

  -- Shopping
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Big Bazaar (Mangalore)', 'shopping', 5.0,  15, 'Supermarket for groceries and supplies',         40, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Urwa Market',          'shopping',   0.8,  3,  'Local market: fresh produce, daily needs',      41, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Forum Fiza Mall',      'shopping',   7.0,  20, 'Largest mall in Mangalore',                     42, TRUE),

  -- Transport
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Mangalore Central Station', 'transport', 6.0, 20, 'Main railway station',                      50, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Bajpe Airport (IXE)',  'transport',  15.0, 35, 'Mangalore International Airport',               51, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'KSRTC Bus Stand',      'transport',  5.0,  15, 'State bus terminus for inter-city travel',      52, TRUE),

  -- Attractions
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Pilikula Nisarga Dhama', 'attraction', 14.0, 30, 'Nature park, zoo, science centre: great for families', 60, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Sultan Battery',       'attraction',  8.0, 22,  'Historic watch tower at Gurupur river mouth',   61, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Mangaladevi Temple',   'attraction',  5.0, 15,  'City''s patron goddess: gives Mangalore its name', 62, TRUE)

ON CONFLICT DO NOTHING;

-- Update rooms with slugs (needed for Phase 2 room detail pages)
UPDATE rooms SET slug = 'garden-view-master-suite'  WHERE id = 'a1b2c3d4-0000-0000-0000-000000000011';
UPDATE rooms SET slug = 'lawn-view-bedroom'          WHERE id = 'a1b2c3d4-0000-0000-0000-000000000012';
UPDATE rooms SET slug = 'sunset-balcony-suite'       WHERE id = 'a1b2c3d4-0000-0000-0000-000000000013';
UPDATE rooms SET slug = 'heritage-courtyard-room'    WHERE id = 'a1b2c3d4-0000-0000-0000-000000000014';

-- Update property with new fields
UPDATE properties SET
  descriptor       = 'by Habbaa',
  bathroom_count   = 4,
  bedroom_count    = 4,
  parking_spaces   = 4,
  has_power_backup = TRUE,
  has_wifi         = TRUE
WHERE id = 'a1b2c3d4-0000-0000-0000-000000000001';
