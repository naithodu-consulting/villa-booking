-- 00028: real room breakdown, per the operator 2026-09-25.
--
-- Replaces the placeholder room names with the villa's actual layout: four
-- bedrooms plus the private lounge, which sleeps 2 on sofa-cum-beds and so
-- counts toward the 14-guest cap (3+3+3+3+2 = 14).
--
-- Rooms keep their existing ids so the property_images.room_id links survive.
-- `floor` is new: the layout spans the ground and first floors, which guests
-- ask about before booking.
--
-- Ensuite: only Room 1 is flagged, matching the operator's breakdown. Verify
-- before launch if the other bedrooms also have attached baths.

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS floor TEXT;

UPDATE rooms SET
  name = 'Room 1', slug = 'room-1', room_type = 'Bedroom',
  bed_type = 'King Size Bed', bed_count = 1, max_guests = 3,
  has_ensuite_bathroom = TRUE, floor = 'Ground Floor', size_sqft = 156
 WHERE id = 'a1b2c3d4-0000-0000-0000-000000000011';

UPDATE rooms SET
  name = 'Room 2', slug = 'room-2', room_type = 'Bedroom',
  bed_type = 'Queen Size Bed', bed_count = 1, max_guests = 3,
  has_ensuite_bathroom = FALSE, floor = 'Ground Floor', size_sqft = 144
 WHERE id = 'a1b2c3d4-0000-0000-0000-000000000012';

UPDATE rooms SET
  name = 'Room 3', slug = 'room-3', room_type = 'Bedroom',
  bed_type = 'Queen Size Bed', bed_count = 1, max_guests = 3,
  has_ensuite_bathroom = FALSE, floor = 'First Floor', size_sqft = 125
 WHERE id = 'a1b2c3d4-0000-0000-0000-000000000013';

UPDATE rooms SET
  name = 'Room 4', slug = 'room-4', room_type = 'Bedroom',
  bed_type = 'King Size Bed', bed_count = 1, max_guests = 3,
  has_ensuite_bathroom = FALSE, floor = 'First Floor', size_sqft = 156
 WHERE id = 'a1b2c3d4-0000-0000-0000-000000000014';

INSERT INTO rooms (
  id, property_id, name, slug, room_type,
  bed_type, bed_count, max_guests,
  has_ensuite_bathroom, floor, size_sqft, display_order
) VALUES (
  'a1b2c3d4-0000-0000-0000-000000000015',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Private Lounge', 'private-lounge', 'Lounge',
  'Sofa Cum Bed', 2, 2,
  FALSE, NULL, 144, 5
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, room_type = EXCLUDED.room_type,
  bed_type = EXCLUDED.bed_type, bed_count = EXCLUDED.bed_count,
  max_guests = EXCLUDED.max_guests,
  has_ensuite_bathroom = EXCLUDED.has_ensuite_bathroom,
  floor = EXCLUDED.floor, size_sqft = EXCLUDED.size_sqft,
  display_order = EXCLUDED.display_order;
