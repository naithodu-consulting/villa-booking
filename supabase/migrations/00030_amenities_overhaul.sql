-- 00030: amenities overhaul, per the operator 2026-09-25.
--
-- Replaces all 19 placeholder amenities with the villa's real inventory (26).
-- The four categories are renamed and re-scoped, so this is a full replacement
-- rather than a set of edits:
--
--   Comfort & Leisure   ->  Living & Dining
--   Kitchen & Dining    ->  Bedrooms & Comfort
--   Outdoor & Location  ->  Outdoors & Spaces
--   Safety & Hygiene    ->  Convenience & Essentials
--
-- Location entries ("Beach 8 km Away", "Near Main Road") are dropped: they
-- duplicate nearby_places, which drives the Location section already.
--
-- parking_spaces moves 4 -> 10 to agree with the new parking amenity.
--
-- is_featured picks six spanning all four categories; they drive the curated
-- highlights on the homepage before the "show all" sheet is opened.

DELETE FROM property_amenities
 WHERE property_id = 'a1b2c3d4-0000-0000-0000-000000000001';

INSERT INTO property_amenities (property_id, category, label, icon, is_featured, display_order) VALUES
  -- Living & Dining
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Living & Dining', 'Spacious living room',                 'Sofa',            TRUE,  10),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Living & Dining', '8-seater dining area',                 'UtensilsCrossed', FALSE, 11),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Living & Dining', '2 convertible sofas',                  'BedDouble',       FALSE, 12),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Living & Dining', '50" Smart TV with OTT apps',           'Tv',              FALSE, 13),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Living & Dining', 'Indoor games',                         'Gamepad2',        FALSE, 14),

  -- Bedrooms & Comfort
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Bedrooms & Comfort', '4 well-appointed bedrooms',         'Bed',             TRUE,  20),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Bedrooms & Comfort', 'Air conditioning in all bedrooms',  'AirVent',         TRUE,  21),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Bedrooms & Comfort', 'Comfortable king & queen beds',     'BedDouble',       FALSE, 22),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Bedrooms & Comfort', 'Plush mattresses & pillows',        'Moon',            FALSE, 23),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Bedrooms & Comfort', 'Fresh linen & towels',              'Layers',          FALSE, 24),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Bedrooms & Comfort', 'Modern, well-equipped bathrooms',   'Bath',            FALSE, 25),

  -- Outdoors & Spaces
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoors & Spaces', 'Private manicured lawn',             'Trees',           TRUE,  30),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoors & Spaces', 'Covered rooftop terrace',            'Sun',             FALSE, 31),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoors & Spaces', 'Outdoor seating',                    'Armchair',        FALSE, 32),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoors & Spaces', 'Private parking for up to 10 vehicles', 'Car',          TRUE,  33),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Outdoors & Spaces', 'Lush green surroundings',            'Leaf',            FALSE, 34),

  -- Convenience & Essentials
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Convenience & Essentials', 'Fully equipped kitchen',      'ChefHat',         TRUE,  40),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Convenience & Essentials', 'High-speed Wi-Fi',            'Wifi',            TRUE,  41),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Convenience & Essentials', 'Washing machine & refrigerator', 'WashingMachine', FALSE, 42),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Convenience & Essentials', '24/7 hot water',              'Droplets',        FALSE, 43),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Convenience & Essentials', 'Inverter power backup',       'Zap',             FALSE, 44),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Convenience & Essentials', 'Premium toiletries',          'Sparkles',        FALSE, 45),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Convenience & Essentials', 'Dedicated driver''s room with bathroom', 'BedSingle', FALSE, 46),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Convenience & Essentials', 'CCTV surveillance in common outdoor areas', 'Camera', FALSE, 47),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Convenience & Essentials', 'Fire extinguishers',          'FireExtinguisher', FALSE, 48),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Convenience & Essentials', 'First aid kit',               'HeartPulse',      FALSE, 49)
ON CONFLICT ON CONSTRAINT uq_amenity_property_label DO UPDATE SET
  category      = EXCLUDED.category,
  icon          = EXCLUDED.icon,
  is_featured   = EXCLUDED.is_featured,
  display_order = EXCLUDED.display_order;

-- Parking now stated as 10 vehicles across the site.
UPDATE properties
   SET parking_spaces = 10,
       updated_at     = NOW()
 WHERE slug = 'villa-19';
