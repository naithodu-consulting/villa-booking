-- 00028: real room breakdown, per the operator 2026-09-25.
--
-- Replaces the placeholder room names with the villa's actual layout: four
-- bedrooms plus the private lounge, which sleeps 2 on sofa-cum-beds and so
-- counts toward the 14-guest cap (3+3+3+3+2 = 14).
--
-- Rooms keep their existing ids so the property_images.room_id links survive.
-- They are upserted rather than updated: on a deployed database the rows are
-- already there and this behaves exactly as the UPDATEs did, but on one built
-- from scratch the rows do not exist yet (seed.sql runs after migrations), and
-- a later migration linking photos to a room id would fail its foreign key.
-- `floor` is new: the layout spans the ground and first floors, which guests
-- ask about before booking.
--
-- Ensuite: only Room 1 is flagged, matching the operator's breakdown. Verify
-- before launch if the other bedrooms also have attached baths.

-- The villa itself, so the data migrations from here on have something to hang
-- off. Supabase applies migrations before seed.sql, and seed.sql is what
-- creates this property, so on a database built from scratch every later
-- migration that inserts rooms, images or amenities failed its foreign key and
-- aborted the reset at this point: 00028 onward never applied locally, and the
-- DB-backed tests silently skipped as a result.
--
-- A no-op everywhere the property already exists, which is every deployed
-- environment. The columns here are only the ones the table requires; seed.sql
-- upserts the real values by id immediately afterwards.
-- booking_code_prefix is set here too, not left to 00023: that migration runs
-- before this one, so on a database built from scratch it finds no property to
-- update and every booking code would fall back to the 'HB' default.
INSERT INTO properties (id, slug, name, description, address, booking_code_prefix)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'villa-19',
  'Villa 19',
  'Placeholder, replaced by seed.sql or by the live row.',
  'Urwa',
  'V19'
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS floor TEXT;

INSERT INTO rooms (id, property_id, name, slug, room_type, bed_type, bed_count, max_guests, has_ensuite_bathroom, floor, size_sqft)
VALUES ('a1b2c3d4-0000-0000-0000-000000000011', 'a1b2c3d4-0000-0000-0000-000000000001', 'Room 1', 'room-1', 'Bedroom', 'King Size Bed', 1, 3, TRUE, 'Ground Floor', 156)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, room_type = EXCLUDED.room_type, bed_type = EXCLUDED.bed_type, bed_count = EXCLUDED.bed_count, max_guests = EXCLUDED.max_guests, has_ensuite_bathroom = EXCLUDED.has_ensuite_bathroom, floor = EXCLUDED.floor, size_sqft = EXCLUDED.size_sqft;

INSERT INTO rooms (id, property_id, name, slug, room_type, bed_type, bed_count, max_guests, has_ensuite_bathroom, floor, size_sqft)
VALUES ('a1b2c3d4-0000-0000-0000-000000000012', 'a1b2c3d4-0000-0000-0000-000000000001', 'Room 2', 'room-2', 'Bedroom', 'Queen Size Bed', 1, 3, FALSE, 'Ground Floor', 144)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, room_type = EXCLUDED.room_type, bed_type = EXCLUDED.bed_type, bed_count = EXCLUDED.bed_count, max_guests = EXCLUDED.max_guests, has_ensuite_bathroom = EXCLUDED.has_ensuite_bathroom, floor = EXCLUDED.floor, size_sqft = EXCLUDED.size_sqft;

INSERT INTO rooms (id, property_id, name, slug, room_type, bed_type, bed_count, max_guests, has_ensuite_bathroom, floor, size_sqft)
VALUES ('a1b2c3d4-0000-0000-0000-000000000013', 'a1b2c3d4-0000-0000-0000-000000000001', 'Room 3', 'room-3', 'Bedroom', 'Queen Size Bed', 1, 3, FALSE, 'First Floor', 125)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, room_type = EXCLUDED.room_type, bed_type = EXCLUDED.bed_type, bed_count = EXCLUDED.bed_count, max_guests = EXCLUDED.max_guests, has_ensuite_bathroom = EXCLUDED.has_ensuite_bathroom, floor = EXCLUDED.floor, size_sqft = EXCLUDED.size_sqft;

INSERT INTO rooms (id, property_id, name, slug, room_type, bed_type, bed_count, max_guests, has_ensuite_bathroom, floor, size_sqft)
VALUES ('a1b2c3d4-0000-0000-0000-000000000014', 'a1b2c3d4-0000-0000-0000-000000000001', 'Room 4', 'room-4', 'Bedroom', 'King Size Bed', 1, 3, FALSE, 'First Floor', 156)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, room_type = EXCLUDED.room_type, bed_type = EXCLUDED.bed_type, bed_count = EXCLUDED.bed_count, max_guests = EXCLUDED.max_guests, has_ensuite_bathroom = EXCLUDED.has_ensuite_bathroom, floor = EXCLUDED.floor, size_sqft = EXCLUDED.size_sqft;

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
