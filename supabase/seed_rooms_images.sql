-- Seed rooms and property_images for Villa 19
-- Run against staging: supabase db query --linked --file supabase/seed_rooms_images.sql

DO $$
DECLARE
  v_property_id UUID;
  r1_id UUID := gen_random_uuid();
  r2_id UUID := gen_random_uuid();
  r3_id UUID := gen_random_uuid();
  r4_id UUID := gen_random_uuid();
BEGIN
  SELECT id INTO v_property_id FROM properties WHERE slug = 'villa-19' LIMIT 1;
  IF v_property_id IS NULL THEN
    RAISE EXCEPTION 'Property villa-19 not found — run seed_phase1.sql first';
  END IF;

  -- ── Rooms ────────────────────────────────────────────────────────────────────
  -- Skip if already seeded
  IF NOT EXISTS (SELECT 1 FROM rooms WHERE property_id = v_property_id) THEN
    INSERT INTO rooms (id, property_id, name, room_type, bed_type, bed_count, max_guests, has_ensuite_bathroom, display_order)
    VALUES
      (r1_id, v_property_id, 'Garden View Master Suite',  'Master Suite',    'King Size Bed',    1, 3, true, 1),
      (r2_id, v_property_id, 'Lawn View Bedroom',         'Luxury Bedroom',  'Queen Size Bed',   1, 2, true, 2),
      (r3_id, v_property_id, 'Sunset Balcony Suite',      'Balcony Suite',   'King Size Bed',    1, 3, true, 3),
      (r4_id, v_property_id, 'Heritage Courtyard Room',   'Standard Room',   'Twin Double Beds', 2, 4, true, 4);
    RAISE NOTICE 'Inserted 4 rooms';
  ELSE
    -- Just capture existing room IDs for use in images
    SELECT id INTO r1_id FROM rooms WHERE property_id = v_property_id ORDER BY display_order LIMIT 1 OFFSET 0;
    SELECT id INTO r2_id FROM rooms WHERE property_id = v_property_id ORDER BY display_order LIMIT 1 OFFSET 1;
    SELECT id INTO r3_id FROM rooms WHERE property_id = v_property_id ORDER BY display_order LIMIT 1 OFFSET 2;
    SELECT id INTO r4_id FROM rooms WHERE property_id = v_property_id ORDER BY display_order LIMIT 1 OFFSET 3;
    RAISE NOTICE 'Rooms already seeded — skipping rooms insert';
  END IF;

  -- ── Property Images ──────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM property_images WHERE property_id = v_property_id) THEN
    INSERT INTO property_images (property_id, url, alt_text, category, display_order, room_id)
    VALUES
      (v_property_id,
       'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=1600&q=80',
       'Villa 19 — Main Exterior with Tropical Garden', 'hero', 1, NULL),

      (v_property_id,
       'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
       'Villa Exterior — Garden & Green Surroundings', 'exterior', 2, NULL),

      (v_property_id,
       'https://images.unsplash.com/photo-1475855581690-80accde3ae2b?auto=format&fit=crop&w=1200&q=80',
       'Villa Balcony — Lush Green Views', 'exterior', 3, NULL),

      (v_property_id,
       'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
       'Bright Living Room with Natural Light', 'living', 4, NULL),

      (v_property_id,
       'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
       'Living Room — Evening Ambience', 'living', 5, NULL),

      (v_property_id,
       'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80',
       'Open Living Area — Warm Evening Light', 'living', 6, NULL),

      (v_property_id,
       'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
       'Garden View Master Suite — King Bed', 'bedroom', 7, r1_id),

      (v_property_id,
       'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
       'Lawn View Bedroom — Queen Bed & Ensuite', 'bedroom', 8, r2_id),

      (v_property_id,
       'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
       'Sunset Balcony Suite — King Bed', 'bedroom', 9, r3_id),

      (v_property_id,
       'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
       'Heritage Courtyard Room — Twin Beds', 'bedroom', 10, r4_id),

      (v_property_id,
       'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
       'Dining — Fresh Coastal Cuisine', 'dining', 11, NULL),

      (v_property_id,
       'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
       'Outdoor Dining — BBQ and Bonfire Evenings', 'dining', 12, NULL);

    RAISE NOTICE 'Inserted 12 property images';
  ELSE
    RAISE NOTICE 'Property images already seeded — skipping';
  END IF;
END $$;
