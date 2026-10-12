-- Seed: Villa 19 by Habbaa — local development data
-- All monetary values in PAISE (₹1 = 100 paise)
-- Fixed UUIDs so this file is idempotent on repeated resets

-- ─────────────────────────────────────────────────────────
-- Property
-- ─────────────────────────────────────────────────────────
INSERT INTO properties (
  id, slug, name, tagline, description, long_description,
  address, city, state, pincode,
  geo_lat, geo_lng,
  base_occupancy, max_occupancy, ideal_occupancy,
  extra_guest_rate, extra_guest_tier2_from, extra_guest_tier2_rate,
  base_nightly_rate, weekend_nightly_rate,
  check_in_time, check_out_time,
  is_active
) VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'villa-19',
  'Villa 19',
  'Premium 4-Bedroom Private Urban Villa',
  E'**Villa 19** is a spacious **4-bedroom private villa in Mangalore**, thoughtfully designed for families and groups seeking comfort, privacy and space to be together. Set amidst lush greenery in Urwa, the villa features generous living spaces, a manicured lawn, balconies across every floor, and ample private parking.

Set in **Urwa,** one of Mangalore\'s well-connected residential neighbourhoods, Villa 19 is tucked away in a peaceful setting yet close to the heart of the city. Just minutes from the main road, local markets, shops and everyday conveniences, its location makes it easy to explore Mangalore while giving you a quiet space to return to at the end of the day.

Designed with a relaxed, contemporary character, Villa 19 brings together the comforts of a well-appointed home with the space and privacy of a private getaway. The spacious lounge is made for conversations, family time and unwinding together, while the bedrooms offer a comfortable retreat after a day out in the city.

**Ideal for 8 guests** and **comfortably accommodating up to 14**, Villa 19 is designed for families and groups to come together, slow down, and enjoy their own private space in Mangalore. For larger groups, the spacious lounge can also be used as additional sleeping space with its convertible sofas.

Whether it is a family gathering, a weekend with friends, a milestone celebration, or simply a few days away together, Villa 19 offers the space, privacy and convenience to make the stay feel like your own.',
  E'**A private space to stay together**

Villa 19 is designed around a simple idea - **when you travel together, you shouldn\'t have to stay apart.**

**The entire villa is yours for the duration of your stay** - a place to slow down, settle in and enjoy time together, without the schedules and shared spaces of a hotel.

With four comfortable air-conditioned bedrooms, generous living and dining spaces, a fully equipped kitchen and plenty of room to relax, Villa 19 brings together the comfort of a well-appointed home with the privacy of an entire villa.

The shared spaces are made for easy, unhurried moments - enjoy a meal together, pick up a book, challenge each other to a board game, or simply unwind after a day exploring Mangalore. There\'s room for everyone to find their own corner, while still coming together when it matters.

A landscaped lawn, balconies across the floors and ample private parking add to the sense of space, making Villa 19 feel less like a place to simply stay and more like a home that\'s yours for a while.

**Your space. Your people. Your stay.**',
  'Urwa', 'Mangalore', 'Karnataka', '575006',
  12.895188, 74.830676,
  8, 14, 8,  -- base 8 included, hard cap 14, ideal party size 8
  100000,   -- ₹1,000/extra guest per night, guests 9-11
  12, 70000, -- ₹700/extra guest per night from guest 12
  1400000,  -- ₹14,000/night base
  1600000,  -- ₹16,000/night weekend
  '14:00:00', '10:00:00',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug, name = EXCLUDED.name, tagline = EXCLUDED.tagline, description = EXCLUDED.description, long_description = EXCLUDED.long_description, max_occupancy = EXCLUDED.max_occupancy, ideal_occupancy = EXCLUDED.ideal_occupancy, base_occupancy = EXCLUDED.base_occupancy, extra_guest_rate = EXCLUDED.extra_guest_rate, extra_guest_tier2_from = EXCLUDED.extra_guest_tier2_from, extra_guest_tier2_rate = EXCLUDED.extra_guest_tier2_rate, base_nightly_rate = EXCLUDED.base_nightly_rate, weekend_nightly_rate = EXCLUDED.weekend_nightly_rate, is_active = EXCLUDED.is_active;

-- ─────────────────────────────────────────────────────────
-- Rooms (4 bedrooms)
-- ─────────────────────────────────────────────────────────
INSERT INTO rooms (id, property_id, name, slug, room_type, bed_type, bed_count, max_guests, has_ensuite_bathroom, bathroom_type, floor, size_sqft, display_order, has_ac) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000011', 'a1b2c3d4-0000-0000-0000-000000000001', 'Room 1',         'room-1',         'Bedroom', 'King Size Bed',  1, 3, TRUE,  'Attached', 'Ground Floor', 156, 1, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000012', 'a1b2c3d4-0000-0000-0000-000000000001', 'Room 2',         'room-2',         'Bedroom', 'Queen Size Bed', 1, 3, FALSE, 'Shared',   'Ground Floor', 144, 2, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000013', 'a1b2c3d4-0000-0000-0000-000000000001', 'Room 3',         'room-3',         'Bedroom', 'Queen Size Bed', 1, 2, FALSE, 'Shared',   'First Floor',  125, 3, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000014', 'a1b2c3d4-0000-0000-0000-000000000001', 'Room 4',         'room-4',         'Bedroom', 'King Size Bed',  1, 3, FALSE, 'Shared',   'First Floor',  156, 4, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000015', 'a1b2c3d4-0000-0000-0000-000000000001', 'Private Lounge', 'private-lounge', 'Lounge',  'Sofa Cum Bed',   2, 3, FALSE, 'Shared',   'First Floor',  144, 5, FALSE)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- Property Images (12 Unsplash placeholders)
-- ─────────────────────────────────────────────────────────
INSERT INTO property_images (id, property_id, url, alt_text, caption, category, display_order, room_id, credit, credit_url) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000101', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/villa-facade.jpg', 'Front view of Villa 19 with its name on the facade', 'Front view', 'villa', 1, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000102', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/living-room.jpg', 'Living room with sofas, carved wooden door and display cabinet', 'Living room', 'living_dining', 2, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000103', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-blue.jpg', 'Room 4: king bed with a blue feature wall', 'Room 4 · King bed', 'bedroom', 9, 'a1b2c3d4-0000-0000-0000-000000000014', NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000104', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/lounge.jpg', 'Private lounge with two blue sofa-cum-beds', 'Private lounge', 'living_dining', 4, 'a1b2c3d4-0000-0000-0000-000000000015', NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000105', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-plum.jpg', 'Room 3: queen bed with a plum feature wall and arched window', 'Room 3 · Queen bed', 'bedroom', 8, 'a1b2c3d4-0000-0000-0000-000000000013', NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000106', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/hall-staircase.jpg', 'Hall with the staircase and a washbasin corner', 'Hall and staircase', 'living_dining', 6, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000107', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/kitchen.jpg', 'Kitchen with cabinets and refrigerator', 'Kitchen', 'living_dining', 7, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000108', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-brown.jpg', 'Room 1: king bed, built-in wardrobes and air conditioning', 'Room 1 · King bed', 'bedroom', 3, 'a1b2c3d4-0000-0000-0000-000000000011', NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000109', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-white.jpg', 'Room 2: queen bed with a brown feature wall', 'Room 2 · Queen bed', 'bedroom', 5, 'a1b2c3d4-0000-0000-0000-000000000012', NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000110', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bathroom.jpg', 'Bathroom with vessel basin and rain shower', 'Bathroom', 'bathroom', 10, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000111', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/washbasin.jpg', 'Washbasin nook with a tiled wall', 'Washbasin nook', 'bathroom', 11, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000112', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/villa-gate.jpg', 'Entrance gate with the Villa 19 sign', 'Entrance gate', 'villa', 12, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000113', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/driveway-house.jpg', 'Villa and paved driveway from the gate', 'Driveway', 'villa', 13, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000114', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/driveway.jpg', 'Paved driveway with space for several cars', 'Open parking', 'parking', 14, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000115', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/villa-front.jpg', 'Covered parking in front of the villa', 'Covered parking', 'parking', 15, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000116', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/outdoor-garden.jpg', 'Tropical lawn with coconut palms (representative image)', 'Lawn (representative)', 'outdoor', 16, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000119', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-sultan-bathery.jpg', 'Sultan Bathery Fort, Mangaluru', 'Sultan Bathery Fort', 'around', 17, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000121', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-tannirbavi.jpg', 'Tannirbhavi Beach, Mangaluru', 'Tannirbhavi Beach', 'around', 18, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000118', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-panambur.jpg', 'Panambur Beach at sunset', 'Panambur Beach', 'around', 19, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000117', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-kudroli.jpg', 'Kudroli Gokarnanatheshwara Temple, Mangaluru', 'Kudroli Temple', 'around', 20, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000122', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-mangaladevi.jpg', 'Mangaladevi Temple, Mangaluru', 'Mangaladevi Temple', 'around', 21, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000123', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-kadri-park.jpg', 'Kadri Park, Mangaluru', 'Kadri Park', 'around', 22, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000120', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-kadri.jpg', 'Kadri Manjunatha Temple, Mangaluru', 'Kadri Manjunatha Temple', 'around', 23, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000124', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-st-aloysius.jpg', 'St Aloysius Chapel, Mangaluru', 'St Aloysius Chapel', 'around', 24, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000125', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-milagres.jpg', 'Milagres Church, Mangaluru', 'Milagres Church', 'around', 25, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000126', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-pilikula.jpg', 'Pilikula Nature Park and Zoo', 'Pilikula Park', 'around', 26, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000127', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-pabbas.jpg', 'Gudbad ice cream at Pabbas', 'Pabbas', 'around', 27, NULL, NULL, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000128', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-naturals.jpg', 'Naturals Sundaes ice cream', 'Naturals', 'around', 28, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET room_id = EXCLUDED.room_id, category = EXCLUDED.category, alt_text = EXCLUDED.alt_text, caption = EXCLUDED.caption, url = EXCLUDED.url, display_order = EXCLUDED.display_order, credit = EXCLUDED.credit, credit_url = EXCLUDED.credit_url;

-- ─────────────────────────────────────────────────────────
-- Pricing Rules (see 00070). end_date is exclusive.
-- Oct/Nov: weekday (₹14,000) and weekend (₹16,000) base rates apply — no rules needed.
-- ─────────────────────────────────────────────────────────
INSERT INTO pricing_rules (property_id, rule_name, start_date, end_date, nightly_rate, min_stay_nights) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'December',                     '2026-12-01', '2026-12-24', 2000000, 1),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Christmas to New Year''s Eve', '2026-12-24', '2026-12-31', 3000000, 1),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'New Year''s Eve and Day',      '2026-12-31', '2027-01-02', 4000000, 1),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'January 2027',                 '2027-01-02', '2027-04-01', 1600000, 1)
ON CONFLICT ON CONSTRAINT uq_pricing_property_rule DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- Amenities
-- ─────────────────────────────────────────────────────────
INSERT INTO property_amenities (property_id, category, label, icon, is_available, is_featured, display_order) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Living & Dining', 'Spacious living room', 'Sofa', TRUE, TRUE , 10),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Living & Dining', '8-seater dining area', 'UtensilsCrossed', TRUE, FALSE, 11),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Living & Dining', 'Living room with plush sofas', 'BedDouble', TRUE, FALSE, 12),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Living & Dining', 'Lounge with convertible sofas', 'BedDouble', TRUE, FALSE, 13),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Living & Dining', '50" Smart TV with OTT apps', 'Tv', TRUE, FALSE, 14),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Living & Dining', 'Books & Board Games', 'Gamepad2', TRUE, FALSE, 15),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Bedrooms & Comfort', '4 well-appointed bedrooms', 'Bed', TRUE, TRUE , 20),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Bedrooms & Comfort', 'Air conditioning in all bedrooms', 'AirVent', TRUE, TRUE , 21),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Bedrooms & Comfort', 'Comfortable King & Queen beds', 'BedDouble', TRUE, FALSE, 22),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Bedrooms & Comfort', 'Plush mattresses & pillows', 'Moon', TRUE, FALSE, 23),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Bedrooms & Comfort', 'Fresh linen & towels', 'Layers', TRUE, FALSE, 24),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Bedrooms & Comfort', 'Modern, well-equipped bathrooms', 'Bath', TRUE, FALSE, 25),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoors & Spaces', 'Private manicured lawn', 'Trees', TRUE, TRUE , 30),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoors & Spaces', 'Covered rooftop terrace', 'Sun', TRUE, FALSE, 31),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoors & Spaces', 'Outdoor seating', 'Armchair', TRUE, FALSE, 32),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoors & Spaces', 'Private parking for up to 8 vehicles', 'Car', TRUE, TRUE , 33),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoors & Spaces', 'Lush green surroundings', 'Leaf', TRUE, FALSE, 34),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoors & Spaces', 'Driver''s room with bathroom (Upon Request)', 'BedSingle', TRUE, FALSE, 35),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoors & Spaces', 'CCTV surveillance in common outdoor areas', 'Camera', TRUE, FALSE, 36),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Convenience & Essentials', 'Fully equipped kitchen', 'ChefHat', TRUE, TRUE , 40),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Convenience & Essentials', 'High-speed Wi-Fi', 'Wifi', TRUE, TRUE , 41),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Convenience & Essentials', 'Washing machine & Refrigerator', 'WashingMachine', TRUE, FALSE, 42),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Convenience & Essentials', '24/7 hot water', 'Droplets', TRUE, FALSE, 43),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Convenience & Essentials', 'Inverter power backup', 'Zap', TRUE, FALSE, 44),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Convenience & Essentials', 'Premium toiletries', 'Sparkles', TRUE, FALSE, 45),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Convenience & Essentials', 'Fire extinguishers', 'FireExtinguisher', TRUE, FALSE, 48),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Convenience & Essentials', 'First aid kit', 'HeartPulse', TRUE, FALSE, 49)
ON CONFLICT ON CONSTRAINT uq_amenity_property_label DO UPDATE SET
  category      = EXCLUDED.category,
  icon          = EXCLUDED.icon,
  is_featured   = EXCLUDED.is_featured,
  display_order = EXCLUDED.display_order;

-- ─────────────────────────────────────────────────────────
-- House Policies
-- ─────────────────────────────────────────────────────────
INSERT INTO property_policies (property_id, key, title, body, category, display_order) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'checkin_time',
   'Check-In & Check-Out',
   'Check-in: 2:00 PM · Check-out: 10:00 AM. Early check-in and late check-out are subject to availability and must be requested at least 24 hours in advance. Additional charges may apply.',
   'checkin', 10),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'id_requirement',
   'Registered Guests Only',
   'Government photo ID is required at check-in for every guest: Aadhaar, passport or driving licence. Please share copies on WhatsApp before arrival for a faster check-in.',
   'id', 20),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'visitors',
   'Visitors',
   'Unregistered visitors are not permitted on the premises.',
   'rules', 21),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'occupancy',
   'Occupancy',
   'Up to 14 guests are permitted, with charges applicable beyond 8 guests.',
   'rules', 22),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'events_policy',
   'No Parties',
   'Parties, loud gatherings and commercial activities are not permitted.',
   'events', 23),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'quiet_hours',
   'Quiet Hours: 10 PM to 7 AM',
   'Please keep noise to a minimum and respect the neighbourhood.',
   'rules', 24),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'no_smoking',
   'No Smoking Indoors',
   'Smoking is prohibited inside the villa. Cleaning and restoration charges apply for violations.',
   'smoking', 25),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'pets_policy',
   'No Pets',
   'Pets are not permitted anywhere on the property.',
   'pets', 26),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'property_care',
   'Care for the Property',
   'Guests are responsible for using the villa, furnishings and amenities responsibly.',
   'rules', 27),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'kitchen_policy',
   'Kitchen Use',
   'The fully equipped kitchen is available for self-catering throughout your stay. Guests are welcome to bring their own groceries. Please clean up after cooking and leave the kitchen as you found it. The kitchen is not staffed - no in-house cook is provided.',
   'kitchen', 30),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'housekeeping_policy',
   'Housekeeping',
   'The villa is professionally cleaned before each check-in. Mid-stay housekeeping is available on request and may carry an additional charge for stays beyond 3 nights.',
   'housekeeping', 31),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'cancellation',
   'Cancellation Policy',
   '30 or more days before check-in: 100% refund. 15 to 29 days before check-in: 50% refund. Under 15 days before check-in: no refund. A security deposit, where applicable, will be collected at check-in. Subject to property inspection following check-out, the refundable deposit will be processed within 5 working days and returned to the original payment method.',
   'cancellation', 40)
ON CONFLICT (property_id, key) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, category = EXCLUDED.category, display_order = EXCLUDED.display_order;

-- ─────────────────────────────────────────────────────────
-- FAQs
-- ─────────────────────────────────────────────────────────
INSERT INTO faqs (property_id, question, answer, category, display_order, is_published, is_featured) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is Villa 19 booked as an entire villa?', 'Yes. Villa 19 is available exclusively as a private whole-villa stay. Individual rooms cannot be booked separately.', 'About Villa 19', 10, TRUE, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'How many guests can Villa 19 accommodate?', 'Villa 19 is designed for 8 guests comfortably and can accommodate up to 14 guests with additional sleeping arrangements and applicable charges.', 'About Villa 19', 20, TRUE, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'What is included in the base booking price?', 'The base price includes exclusive use of the entire villa, including all 4 bedrooms, private lounge, lawn, rooftop terrace, parking and shared spaces. The base rate is for up to 8 guests.', 'About Villa 19', 30, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'How many bedrooms and bathrooms are there?', 'Villa 19 has 4 bedrooms, 3 bathrooms and a private lounge.', 'About Villa 19', 40, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is the villa suitable for families and groups?', 'Yes. Villa 19 is designed for families, groups of friends, family gatherings and relaxed group stays.', 'About Villa 19', 50, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Can I book Villa 19 for more than 8 guests?', 'Villa 19 comfortably accommodates 8 guests and can host up to 14. Additional guests are accommodated on extra mattresses in three bedrooms and the lounge.', 'Booking & Guests', 60, TRUE, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are children counted towards occupancy?', 'Yes. Children are included in the total occupancy. Children below 5 years stay free. Children aged 5-12 years are charged at 50% of the applicable guest rate, while guests above 12 years are charged at the full rate.', 'Booking & Guests', 70, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is government ID required at check-in?', 'Yes. A valid government-issued photo ID is required for all registered guests at check-in. Sharing ID details in advance can help make the check-in process faster.', 'Booking & Guests', 80, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are visitors allowed at the villa?', 'Only guests included in the booking are permitted within the premises. Unregistered outside visitors are not allowed.', 'Booking & Guests', 90, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is a security deposit required?', 'A refundable security deposit may be collected at check-in, depending on the booking. Subject to property inspection after check-out, it will be refunded to the original payment method within 5 working days.', 'Booking & Guests', 100, TRUE, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are unmarried couples allowed to stay at Villa 19?', 'Villa 19 is primarily intended for families and family groups. Stays by unmarried couples are not encouraged. All guests must provide valid government-issued photo identification at check-in.', 'Booking & Guests', 110, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'What are the check-in and check-out timings?', 'Standard check-in is at 2:00 PM and check-out is at 10:00 AM. Early check-in and late check-out may be available on request, subject to availability.', 'Check-in & Check-out', 120, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Can I request early check-in or late check-out?', 'Yes. Requests can be made in advance and will be accommodated wherever possible, subject to availability and applicable charges.', 'Check-in & Check-out', 130, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Can someone else check in on my behalf?', 'The person making the booking should normally be present at check-in. Alternative arrangements should be confirmed with Villa 19 in advance.', 'Check-in & Check-out', 140, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is a kitchen available for guests?', 'Yes. The villa has a fully equipped kitchen with a refrigerator, cutlery, cookware, crockery and basic cooking essentials.', 'Kitchen & Amenities', 150, TRUE, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Can guests cook at the villa?', 'The kitchen is available for preparing simple meals. To keep the villa comfortable for everyone, we request that guests avoid foods with strong or lingering odours.', 'Kitchen & Amenities', 160, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is Wi-Fi available?', 'Yes. High-speed Wi-Fi is available throughout the villa.', 'Kitchen & Amenities', 170, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is there a TV?', 'Yes. The lounge has a 50-inch Smart TV with OTT apps.', 'Kitchen & Amenities', 180, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are indoor games available?', 'Yes. A selection of indoor games is available in the lounge.', 'Kitchen & Amenities', 190, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is power backup available?', 'Yes. The villa has inverter power backup for essential loads including fans, lighting, Wi-Fi and other selected equipment.', 'Kitchen & Amenities', 200, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is hot water available?', 'Yes. 24/7 hot water is available.', 'Kitchen & Amenities', 210, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are all bedrooms air-conditioned?', 'Yes. All 4 bedrooms have air conditioning.', 'Bedrooms & Bathrooms', 220, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'What type of beds are available?', 'Villa 19 has a combination of King and Queen beds, with two guests comfortably accommodated in each bedroom.', 'Bedrooms & Bathrooms', 230, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are bed linen and towels provided?', 'Yes. Fresh bed linen, pillows, bath towels and hand towels are provided.', 'Bedrooms & Bathrooms', 240, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are toiletries provided?', 'Yes. Premium basic toiletries are provided for guests.', 'Bedrooms & Bathrooms', 250, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are additional sleeping arrangements available?', 'Yes. Additional sleeping arrangements are available for larger groups, allowing the villa to accommodate up to 14 guests.', 'Bedrooms & Bathrooms', 260, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'How many cars can be parked at the villa?', 'Villa 19 has private parking for up to 8 vehicles within the property, subject to vehicle size and parking arrangement.', 'Parking & Outdoor Spaces', 270, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Does Villa 19 have outdoor spaces?', 'Yes. The property includes a private lawn, outdoor seating and a covered rooftop terrace.', 'Parking & Outdoor Spaces', 280, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is the rooftop terrace private?', 'Yes. The covered rooftop terrace is exclusively available to guests staying at Villa 19.', 'Parking & Outdoor Spaces', 290, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are parties or events allowed?', 'No. Parties, events, loud gatherings and commercial activities are not permitted.', 'House Rules', 300, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'What are the quiet hours?', 'Guests are requested to maintain low noise levels between 10:00 PM and 7:00 AM, out of consideration for the neighbourhood.', 'House Rules', 310, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is smoking allowed?', 'Smoking is not permitted inside the villa, including bedrooms and bathrooms. Cleaning and restoration charges apply for violations.', 'House Rules', 320, TRUE, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are pets allowed?', 'No. Pets are not permitted at Villa 19.', 'House Rules', 330, TRUE, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are unregistered guests allowed?', 'No. Only guests included in the booking are permitted within the premises.', 'House Rules', 340, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is the property monitored by CCTV?', 'Yes. CCTV surveillance is provided in common outdoor areas for property security. There are no cameras in private guest areas.', 'Safety & Security', 350, TRUE, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Are fire extinguishers available?', 'Yes. Fire extinguishers are provided at appropriate locations within the property.', 'Safety & Security', 360, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is a first-aid kit available?', 'Yes. A first-aid kit is available at the villa.', 'Safety & Security', 370, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Where is Villa 19 located?', 'Villa 19 is located in Urwa, Mangalore, in a peaceful residential setting with convenient access to the main road, local markets, shops and everyday amenities.', 'Location', 380, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is Villa 19 close to the city?', 'Yes. The villa offers a quiet setting while remaining conveniently connected to Mangalore''s key areas.', 'Location', 390, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is the villa suitable as a base for exploring Mangalore?', 'Yes. Its location in Urwa provides convenient access to the city, while the private villa offers a relaxed space to return to after exploring Mangalore.', 'Location', 400, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is the driver room included in the four bedrooms?', 'No. The dedicated Driver Room is separate from the four guest bedrooms and is intended for driver/staff accommodation.', 'Additional Accommodation', 410, TRUE, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Can the driver stay at the property?', 'Yes. A driver room with an attached bathroom is available separately from the guest accommodation. It can be arranged upon prior request.', 'Additional Accommodation', 420, TRUE, FALSE)
ON CONFLICT ON CONSTRAINT uq_faq_property_question DO UPDATE SET answer = EXCLUDED.answer, category = EXCLUDED.category, display_order = EXCLUDED.display_order, is_featured = EXCLUDED.is_featured;

-- ─────────────────────────────────────────────────────────
-- Nearby Places
-- ─────────────────────────────────────────────────────────
INSERT INTO nearby_places (property_id, name, category, distance_km, travel_minutes, note, display_order, is_published) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Main Road & Bus Stand', 'transport', 0.1, 1, 'Local bus stand and the main road, a two-minute walk', 10, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Super Market', 'shopping', 0.2, 2, 'Everyday groceries and essentials, a short walk away', 20, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Panambur Beach', 'beach', 7.3, 15, 'Popular sandy beach, clean and family-friendly', 30, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Tannirbhavi Beach', 'beach', 8.8, 20, 'Quieter, less crowded: good for morning walks', 40, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Kadri Manjunath Temple', 'temple', 4.2, 10, NULL, 50, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Sharavu Mahaganapathi Temple', 'temple', 4.0, 10, NULL, 60, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Pabbas Ideal Cafe', 'food', 2.2, 5, NULL, 70, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Machali Restaurant', 'food', 3.3, 8, NULL, 80, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Nilgiris', 'shopping', 0.7, 2, NULL, 90, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Urwa Market', 'shopping', 0.8, 3, NULL, 100, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'City Centre Mall', 'shopping', 3.8, 10, NULL, 110, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Mangalore Central Station', 'transport', 5.0, 13, NULL, 120, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Mangalore International Airport (IXE)', 'transport', 11.0, 22, NULL, 130, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'KSRTC Bus Stand', 'transport', 3.3, 10, NULL, 140, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Pilikula Nisarga Dhama', 'attraction', 14.0, 30, NULL, 150, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Sultan Bathery', 'attraction', 1.7, 5, NULL, 160, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Kudroli Temple', 'temple', 2.9, 8, NULL, 170, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Gokul Kalyana Mantapa', 'function_hall', 0.08, 1, 'Wedding and function hall on Ashok Nagar Road', 1, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Daivajna Kalyana Mantapa', 'function_hall', 0.1, 1, 'Wedding and function hall on Boloor Marigudi Road', 2, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Sanghaniketan', 'function_hall', 1.8, 5, 'Large hall on Mannagudda Road, Gandhinagar', 3, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Urwa Marigudi Temple', 'temple', 0.55, 2, 'Shri Mariamma Temple, Urwa Marigudi Road', 45, TRUE)
ON CONFLICT ON CONSTRAINT uq_nearby_property_name DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- Property extended fields
-- ─────────────────────────────────────────────────────────
-- Room slugs are set by the rooms INSERT above; the old per-room UPDATEs here
-- named the retired placeholder rooms and would have undone it.

UPDATE properties SET
  descriptor       = 'by Habbaa',
  -- Three: attached to Room 1, plus one common bathroom per floor.
  bathroom_count   = 3,
  bedroom_count    = 4,
  parking_spaces   = 10,
  has_power_backup = TRUE,
  has_wifi         = TRUE
WHERE id = 'a1b2c3d4-0000-0000-0000-000000000001';
