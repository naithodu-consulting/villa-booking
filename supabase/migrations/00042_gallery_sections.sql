-- 00042: gallery sections, per the operator 2026-09-28.
--
-- The Villa, Living & Dining, Bedrooms, Bathrooms, Outdoor Spaces, Parking and
-- Around Villa 19, in that order (src/lib/gallery.ts holds the labels).
-- Old -> new: hero and exterior -> villa; living, dining and kitchen ->
-- living_dining; surroundings -> around. The outdoor dining and balcony shots
-- move to outdoor.
--
-- Alt text is corrected at the same time. Screen readers and search engines read
-- it, and several descriptions claimed what the villa does not have: an ensuite
-- for Room 2 (only Room 1 has one), twin beds, and "coastal cuisine" (no cook).
-- Bedroom photos are named for the room they are linked to, with its real bed.
--
-- All current images are stock placeholders. Bathrooms, Parking and Around
-- Villa 19 stay hidden until photos exist: the gallery only shows sections that
-- have images.

ALTER TABLE property_images DROP CONSTRAINT IF EXISTS property_images_category_check;

UPDATE property_images SET category = 'villa', alt_text = 'Villa 19 exterior with garden' WHERE id = 'a1b2c3d4-0000-0000-0000-000000000021';
UPDATE property_images SET category = 'living_dining', alt_text = 'Living room with natural light' WHERE id = 'a1b2c3d4-0000-0000-0000-000000000022';
UPDATE property_images SET category = 'bedroom', alt_text = 'Room 1 - King Bed' WHERE id = 'a1b2c3d4-0000-0000-0000-000000000023';
UPDATE property_images SET category = 'bedroom', alt_text = 'Room 2 - Queen Bed' WHERE id = 'a1b2c3d4-0000-0000-0000-000000000024';
UPDATE property_images SET category = 'living_dining', alt_text = 'Dining area' WHERE id = 'a1b2c3d4-0000-0000-0000-000000000025';
UPDATE property_images SET category = 'bedroom', alt_text = 'Room 3 - Queen Bed' WHERE id = 'a1b2c3d4-0000-0000-0000-000000000026';
UPDATE property_images SET category = 'living_dining', alt_text = 'Living room in the evening' WHERE id = 'a1b2c3d4-0000-0000-0000-000000000027';
UPDATE property_images SET category = 'bedroom', alt_text = 'Room 4 - King Bed' WHERE id = 'a1b2c3d4-0000-0000-0000-000000000028';
UPDATE property_images SET category = 'villa', alt_text = 'Villa exterior and garden' WHERE id = 'a1b2c3d4-0000-0000-0000-000000000029';
UPDATE property_images SET category = 'living_dining', alt_text = 'Open living area' WHERE id = 'a1b2c3d4-0000-0000-0000-00000000002a';
UPDATE property_images SET category = 'outdoor', alt_text = 'Outdoor seating area' WHERE id = 'a1b2c3d4-0000-0000-0000-00000000002b';
UPDATE property_images SET category = 'outdoor', alt_text = 'Balcony with garden views' WHERE id = 'a1b2c3d4-0000-0000-0000-00000000002c';

-- Any rows not covered above (e.g. added by Ooruda Villa) follow the same mapping.
UPDATE property_images SET category = 'villa'         WHERE category IN ('hero', 'exterior');
UPDATE property_images SET category = 'living_dining' WHERE category IN ('living', 'dining', 'kitchen');
UPDATE property_images SET category = 'around'        WHERE category = 'surroundings';

ALTER TABLE property_images ADD CONSTRAINT property_images_category_check
  CHECK (category IN ('villa', 'living_dining', 'bedroom', 'bathroom', 'outdoor', 'parking', 'around'));
