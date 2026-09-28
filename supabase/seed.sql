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
  base_occupancy, max_occupancy, ideal_occupancy,
  extra_guest_rate, base_nightly_rate, weekend_nightly_rate,
  check_in_time, check_out_time,
  is_active
) VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'villa-19',
  'Villa 19',
  'Premium 4-Bedroom Private Urban Villa',
  E'**Villa 19 by Habbaa** is a spacious **4-bedroom private urban villa** set amidst lush greenery in Urwa, Mangalore. Spread across **5,000 sq. ft.**, it offers generous living spaces, a manicured lawn, balconies across every floor, and ample private parking.

Tucked away in a peaceful setting yet close to the heart of the city, the villa is just minutes from the main road, local markets, shops, and everyday conveniences. Its location makes it easy to explore Mangalore while giving you a quiet space to return to at the end of the day.

Designed with a relaxed, contemporary character, Villa 19 brings together the comforts of a well-appointed home with the space and privacy of a private getaway. The spacious lounge is made for conversations, family time and unwinding together, while the bedrooms offer a comfortable retreat after a day out in the city.

**Ideal for 8 guests** and comfortably **accommodating up to 14**, Villa 19 is designed for families and groups to come together, slow down, and enjoy their own private space in Mangalore.

Whether it is a family gathering, a weekend with friends, a milestone celebration, or simply a few days away together, Villa 19 offers the space, privacy and convenience to make the stay feel like your own.',
  'Urwa', 'Mangalore', 'Karnataka', '575006',
  12.895188, 74.830676,
  12, 14, 8,  -- base 12 included, hard cap 14, ideal party size 8
  100000,   -- ₹1,000/extra guest per night
  1200000,  -- ₹12,000/night base
  1400000,  -- ₹14,000/night weekend
  '14:00:00', '11:00:00',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug, name = EXCLUDED.name, tagline = EXCLUDED.tagline, description = EXCLUDED.description, max_occupancy = EXCLUDED.max_occupancy, ideal_occupancy = EXCLUDED.ideal_occupancy, is_active = EXCLUDED.is_active;

-- ─────────────────────────────────────────────────────────
-- Rooms (4 bedrooms)
-- ─────────────────────────────────────────────────────────
INSERT INTO rooms (id, property_id, name, slug, room_type, bed_type, bed_count, max_guests, has_ensuite_bathroom, bathroom_type, floor, size_sqft, display_order) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000011', 'a1b2c3d4-0000-0000-0000-000000000001', 'Room 1',         'room-1',         'Bedroom', 'King Size Bed',  1, 3, TRUE,  'Attached', 'Ground Floor', 156, 1),
  ('a1b2c3d4-0000-0000-0000-000000000012', 'a1b2c3d4-0000-0000-0000-000000000001', 'Room 2',         'room-2',         'Bedroom', 'Queen Size Bed', 1, 3, FALSE, 'Shared',   'Ground Floor', 144, 2),
  ('a1b2c3d4-0000-0000-0000-000000000013', 'a1b2c3d4-0000-0000-0000-000000000001', 'Room 3',         'room-3',         'Bedroom', 'Queen Size Bed', 1, 3, FALSE, 'Shared',   'First Floor',  125, 3),
  ('a1b2c3d4-0000-0000-0000-000000000014', 'a1b2c3d4-0000-0000-0000-000000000001', 'Room 4',         'room-4',         'Bedroom', 'King Size Bed',  1, 3, FALSE, 'Shared',   'First Floor',  156, 4),
  ('a1b2c3d4-0000-0000-0000-000000000015', 'a1b2c3d4-0000-0000-0000-000000000001', 'Private Lounge', 'private-lounge', 'Lounge',  'Sofa Cum Bed',   2, 2, FALSE, 'Shared',   'First Floor',  144, 5)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- Property Images (12 Unsplash placeholders)
-- ─────────────────────────────────────────────────────────
INSERT INTO property_images (id, property_id, url, alt_text, category, display_order, room_id) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000021', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=1600&q=80', 'Villa 19 - Main Exterior with Tropical Garden', 'hero',     1, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000022', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80', 'Bright Living Room with Natural Light',                    'living',   2, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000023', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80', 'Garden View Master Suite - King Bed',                      'bedroom',  3, 'a1b2c3d4-0000-0000-0000-000000000011'),
  ('a1b2c3d4-0000-0000-0000-000000000024', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', 'Lawn View Bedroom - Queen Bed & Ensuite',                  'bedroom',  4, 'a1b2c3d4-0000-0000-0000-000000000012'),
  ('a1b2c3d4-0000-0000-0000-000000000025', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80', 'Dining - Fresh Coastal Cuisine',                           'dining',   5, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000026', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80', 'Sunset Balcony Suite - King Bed',                          'bedroom',  6, 'a1b2c3d4-0000-0000-0000-000000000013'),
  ('a1b2c3d4-0000-0000-0000-000000000027', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80', 'Living Room - Evening Ambience',                           'living',   7, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000028', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80', 'Heritage Courtyard Room - Twin Beds',                      'bedroom',  8, 'a1b2c3d4-0000-0000-0000-000000000014'),
  ('a1b2c3d4-0000-0000-0000-000000000029', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80', 'Villa Exterior - Garden & Green Surroundings',             'exterior', 9, NULL),
  ('a1b2c3d4-0000-0000-0000-00000000002a', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80', 'Open Living Area - Warm Evening Light',                    'living',   10, NULL),
  ('a1b2c3d4-0000-0000-0000-00000000002b', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80', 'Outdoor Dining Area',                'dining',   11, NULL),
  ('a1b2c3d4-0000-0000-0000-00000000002c', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1475855581690-80accde3ae2b?auto=format&fit=crop&w=1200&q=80', 'Villa Balcony - Lush Green Views',                         'exterior', 12, NULL)
ON CONFLICT (id) DO UPDATE SET room_id = EXCLUDED.room_id;

-- ─────────────────────────────────────────────────────────
-- Pricing Rules (see 00021). end_date is exclusive: the last priced night is 1 Jan.
-- Other seasonal prices are set by the operator in Ooruda Villa, not seeded.
-- ─────────────────────────────────────────────────────────
INSERT INTO pricing_rules (property_id, rule_name, start_date, end_date, nightly_rate, min_stay_nights) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'New Year''s Eve and New Year''s Day', '2026-12-31', '2027-01-02', 1600000, 1)
ON CONFLICT ON CONSTRAINT uq_pricing_property_rule DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- Amenities
-- ─────────────────────────────────────────────────────────
INSERT INTO property_amenities (property_id, category, label, icon, is_available, is_featured, display_order) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Living & Dining', 'Spacious living room', 'Sofa', TRUE, TRUE , 10),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Living & Dining', '8-seater dining area', 'UtensilsCrossed', TRUE, FALSE, 11),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Living & Dining', '2 convertible sofas', 'BedDouble', TRUE, FALSE, 12),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Living & Dining', '50" Smart TV with OTT apps', 'Tv', TRUE, FALSE, 13),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Living & Dining', 'Indoor games', 'Gamepad2', TRUE, FALSE, 14),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Bedrooms & Comfort', '4 well-appointed bedrooms', 'Bed', TRUE, TRUE , 20),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Bedrooms & Comfort', 'Air conditioning in all bedrooms', 'AirVent', TRUE, TRUE , 21),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Bedrooms & Comfort', 'Comfortable king & queen beds', 'BedDouble', TRUE, FALSE, 22),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Bedrooms & Comfort', 'Plush mattresses & pillows', 'Moon', TRUE, FALSE, 23),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Bedrooms & Comfort', 'Fresh linen & towels', 'Layers', TRUE, FALSE, 24),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Bedrooms & Comfort', 'Modern, well-equipped bathrooms', 'Bath', TRUE, FALSE, 25),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoors & Spaces', 'Private manicured lawn', 'Trees', TRUE, TRUE , 30),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoors & Spaces', 'Covered rooftop terrace', 'Sun', TRUE, FALSE, 31),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoors & Spaces', 'Outdoor seating', 'Armchair', TRUE, FALSE, 32),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoors & Spaces', 'Private parking for up to 10 vehicles', 'Car', TRUE, TRUE , 33),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoors & Spaces', 'Lush green surroundings', 'Leaf', TRUE, FALSE, 34),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoors & Spaces', 'Dedicated driver''s room with bathroom', 'BedSingle', TRUE, FALSE, 35),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoors & Spaces', 'CCTV surveillance in common outdoor areas', 'Camera', TRUE, FALSE, 36),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Convenience & Essentials', 'Fully equipped kitchen', 'ChefHat', TRUE, TRUE , 40),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Convenience & Essentials', 'High-speed Wi-Fi', 'Wifi', TRUE, TRUE , 41),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Convenience & Essentials', 'Washing machine & refrigerator', 'WashingMachine', TRUE, FALSE, 42),
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
   'Check-in: 2:00 PM · Check-out: 11:00 AM. Early check-in and late check-out are subject to availability and must be requested at least 24 hours in advance. Additional charges may apply.',
   'checkin', 10),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'id_requirement',
   'Government ID Required',
   'Government photo ID is mandatory at check-in for all guests: Aadhaar card, passport, or driving licence. This is a legal requirement under Karnataka state regulations. Soft copies must be shared via WhatsApp before arrival.',
   'id', 20),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'quiet_hours',
   'Quiet Hours',
   'Quiet hours are observed from 10 PM to 7 AM. Music or amplified sound outside the villa is not permitted after 10 PM, out of respect for neighbours.',
   'rules', 30),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'no_smoking',
   'No Smoking Indoors',
   'Smoking is strictly prohibited inside the villa, including all bedrooms, living areas and kitchen. Designated smoking areas are available on the lawn. Please dispose of cigarette butts responsibly.',
   'smoking', 31),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'pets_policy',
   'Pets Are Not Entertained',
   'Pets are not entertained at the villa. Please make alternative arrangements for your animals before booking.',
   'pets', 32),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'events_policy',
   'Events & Gatherings',
   'The villa is well suited for private family gatherings and milestone celebrations. Outside guests are not allowed beyond the booked group. Loud DJ music is not permitted. Contact us before booking for event enquiries.',
   'events', 33),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'kitchen_policy',
   'Kitchen Use',
   'The fully equipped kitchen is available for self-catering throughout your stay. Guests are welcome to bring their own groceries. Please clean up after cooking and leave the kitchen as you found it. The kitchen is not staffed - no in-house cook is provided.',
   'kitchen', 34),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'housekeeping_policy',
   'Housekeeping',
   'The villa is professionally cleaned before each check-in. Mid-stay housekeeping is available on request and may carry an additional charge for stays beyond 3 nights.',
   'housekeeping', 35),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'cancellation',
   'Cancellation Policy',
   '30 or more days before check-in: 90% refund. 15 to 29 days before check-in: 50% refund. Under 15 days before check-in: no refund. The security deposit is refunded within 5 working days of check-out, subject to no damage.',
   'cancellation', 40)
ON CONFLICT (property_id, key) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body;

-- ─────────────────────────────────────────────────────────
-- FAQs
-- ─────────────────────────────────────────────────────────
INSERT INTO faqs (property_id, question, answer, category, display_order, is_published) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'What is included in the base booking price?', 'The base price covers exclusive use of the entire villa: all 4 bedrooms, private lawn, covered parking and high-speed Wi-Fi. Cooking gas and kitchen basics are also included.', 'general', 10, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is there a kitchen available for guests?', 'Yes. The villa has a fully equipped kitchen: gas stove, refrigerator, microwave, cookware and utensils. Guests are welcome to bring groceries or order from nearby restaurants and food delivery services. No in-house cook is provided.', 'general', 20, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'What are the check-in and check-out times?', 'Standard check-in is at 2:00 PM and check-out is at 11:00 AM. Early check-in and late check-out are available on request (subject to availability). Please contact us at least 24 hours in advance.', 'general', 30, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'How far is the beach from the villa?', 'The nearest beach, Panambur, is about 7.6 km from the villa, roughly a 15-minute drive. Tannirbhavi Beach is about 8.8 km. The villa is also close to the main road, local market and everyday shops.', 'location', 40, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is the property suitable for events or large gatherings?', 'Yes. The villa is well suited for private family gatherings, milestone celebrations and corporate offsites. The spacious lawn is ideal for outdoor celebrations. Please contact us before booking for event enquiries - special terms and event-specific pricing may apply.', 'general', 50, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'What is the cancellation policy?', 'Cancellations 30 or more days before check-in receive a 90% refund. 15 to 29 days: 50% refund. Under 15 days before check-in: no refund. The security deposit is refunded within 5 working days of check-out.', 'policies', 60, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Is government ID required at check-in?', 'Government photo ID is mandatory at check-in for all guests: Aadhaar card, passport or driving licence. This is a legal requirement. We request that soft copies be shared via WhatsApp before arrival for faster check-in.', 'general', 70, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'How many cars can be parked at the villa?', 'The villa has covered parking for 4 or more cars within the property. Street parking is also available nearby.', 'general', 80, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Can I book just a single bedroom?', 'No. Villa 19 is booked exclusively as a whole property. All 4 bedrooms, the lawn, and all common spaces are reserved for your group only. Individual room bookings are not available.', 'booking', 100, TRUE)
ON CONFLICT ON CONSTRAINT uq_faq_property_question DO NOTHING;

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
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Sultan Battery', 'attraction', 1.7, 5, NULL, 160, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Kudroli Temple', 'temple', 2.9, 8, NULL, 170, TRUE)
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
