-- 00089: the operator's 2026-10-16 delivery replaces every villa photograph.
--
-- 39 photographs in five folders, each folder a gallery section and each file
-- numbered with its place in that section. Headings_Photos.docx gives one
-- label per photograph, in the same order, and those labels are the captions
-- below: the operator's wording, not a rewrite of it. alt_text stays what it
-- has been since 00066, the plain-English sentence the viewer prints under the
-- photograph and a screen reader reads, written here to match the new frames
-- and to use the operator's names for the rooms and areas.
--
-- Every frame is landscape 3:2 at 1600x1067, saved without EXIF (so without
-- GPS). Eight arrived at 16:9 and were cropped to 3:2 with the crop window
-- chosen by hand, one photograph at a time (the operator, 2026-10-16: this is
-- delicate work). The three aerials and both wide living-room frames are
-- cropped off-centre on purpose: the aerials drop the neighbouring apartment
-- block on the right, the arched hall frame is right-aligned so the arch and
-- both pillars stay whole, and the dining frame drops a blank wall. The Buddha
-- alcove is symmetrical and is cropped dead centre.
--
-- Room identity, per the operator 2026-10-16, which reverses 00063: Room 1 is
-- the terracotta room with the attached bathroom and the glass display
-- cabinet; Room 2 is the terracotta room with the bird print and the windows.
-- 00063 had these the other way round. Room 1 is the only room with an
-- attached bathroom, so a guest booking it was being shown the wrong room.
--
-- Three things change shape as well as content:
--
--  * Bathrooms returns. 00067 emptied the section because every bathroom frame
--    in the old shoot was vertical. The three new ones are landscape, each a
--    pair of vertical frames joined into one, which the operator confirmed is
--    intended.
--  * Parking goes. Its one photograph in the new delivery ("Closed Parking")
--    is filed under Outdoor Spaces, so the section is folded into Outdoor and
--    dropped from src/lib/gallery.ts. The category remains in the check
--    constraint, which other properties on this database may still use.
--  * Twelve photographs have no counterpart in the delivery and are gone with
--    it: the coffee station, the landing and its carrom board, the garden and
--    courtyard at night, the entrance gate, the open parking courtyard, the
--    lounge seating detail and four others.
--
-- The eleven "Around Villa 19" photographs are untouched: they are of the
-- neighbourhood, not the villa, and no replacements were supplied.
--
-- Two new columns replace two pieces of guesswork:
--
--  * home_order. The homepage mosaic took the first four photographs by
--    display_order, so 00063 had to interleave low display_orders into the
--    sections to control it, which fought with the section ordering. The
--    operator named the four (Home Page Thumbnails/), so they are named here
--    and display_order is free to be nothing but gallery order.
--  * is_room_cover. The Rooms page took whichever linked photograph happened
--    to sort first. The operator named one per room (Room Thumbnails/), so the
--    choice is recorded rather than incidental.

ALTER TABLE property_images
  ADD COLUMN IF NOT EXISTS home_order    INT,
  ADD COLUMN IF NOT EXISTS is_room_cover BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN property_images.home_order IS
  'Position in the homepage mosaic, 1-4; NULL for every other photograph.';
COMMENT ON COLUMN property_images.is_room_cover IS
  'The one photograph the Rooms page shows for this row''s room_id.';

-- Out with the old shoot. The neighbourhood photographs are not part of it.
DELETE FROM property_images
 WHERE property_id = 'a1b2c3d4-0000-0000-0000-000000000001'
   AND url NOT LIKE '/gallery/around-%';

INSERT INTO property_images
  (id, property_id, url, alt_text, caption, category, display_order, room_id, width, height, home_order, is_room_cover) VALUES

  -- ── The Villa ───────────────────────────────────────────────────────────
  ('a1b2c3d4-0000-0000-0000-000000000301', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/villa-facade-night.jpg',
   'The front of the villa lit up at night, with the porch and the driveway in front of it',
   'Front view at night', 'villa', 1, NULL, 1600, 1067, 1, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000302', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/villa-front-day.jpg',
   'The front of the villa in daylight, with the Villa 19 name on the first-floor balcony and palms on either side',
   'Front view', 'villa', 2, NULL, 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000303', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/villa-facade.jpg',
   'The villa from the side of the front yard, showing the porch, the tiled roof and the balcony',
   'Front view', 'villa', 3, NULL, 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000304', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/villa-aerial.jpg',
   'The villa from above, with the first-floor sit-out, the tiled roof and the trees around the compound',
   'Aerial view', 'villa', 4, NULL, 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000305', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/villa-aerial-night.jpg',
   'The villa from above after dark, lit from inside, with lamps along the compound wall',
   'Aerial view at night', 'villa', 5, NULL, 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000306', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/villa-aerial-night-trees.jpg',
   'The compound from above at night, with the lit boundary wall and the trees over the front yard',
   'Aerial view at night', 'villa', 6, NULL, 1600, 1067, NULL, FALSE),

  -- ── Living & Dining ─────────────────────────────────────────────────────
  ('a1b2c3d4-0000-0000-0000-000000000311', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/living-room.jpg',
   'The living room, with a sofa, a television and a glass display cabinet against the wall',
   'Living Room', 'living_dining', 11, NULL, 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000312', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/living-room-arch.jpg',
   'The living room from further back, with the arch and pillars that open onto the staircase and the dining area',
   'Living Room', 'living_dining', 12, NULL, 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000313', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/dining-room.jpg',
   'The dining area, with the table set for eight beside the staircase',
   'Dining Area', 'living_dining', 13, NULL, 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000314', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/dining-table.jpg',
   'The dining table laid for eight, seen from the end of the room',
   'Dining Area', 'living_dining', 14, NULL, 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000315', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/dining-table-setting.jpg',
   'Plates, glasses, flowers and a tray of fruit on the dining table, with the wash basin behind',
   'Dining Area with wash basin', 'living_dining', 15, NULL, 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000316', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/dining-washbasin.jpg',
   'The dining table along the room, with the wash basin and mirror in the brick alcove beside it',
   'Dining Area with wash basin', 'living_dining', 16, NULL, 1600, 1067, 2, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000317', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/lounge.jpg',
   'The private lounge, with two blue sofa-cum-beds, a bookcase and an arched window',
   'Private Lounge', 'living_dining', 17, 'a1b2c3d4-0000-0000-0000-000000000015', 1600, 1067, 4, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000318', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/lounge-window.jpg',
   'The private lounge from the other end, with the windows and the arched window above the seating',
   'Private Lounge', 'living_dining', 18, 'a1b2c3d4-0000-0000-0000-000000000015', 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000319', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/kitchen.jpg',
   'The kitchen, with a granite counter, a sink under the window and cupboards below',
   'Kitchen', 'living_dining', 19, NULL, 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000320', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/kitchen-appliances.jpg',
   'The other side of the kitchen, with the gas stove, the refrigerator and overhead cupboards',
   'Kitchen', 'living_dining', 20, NULL, 1600, 1067, NULL, FALSE),

  -- ── Bedrooms ────────────────────────────────────────────────────────────
  ('a1b2c3d4-0000-0000-0000-000000000321', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-1.jpg',
   'Room 1: a king bed against a terracotta wall, with a wooden wardrobe beside it',
   'Bedroom 1, Ground floor', 'bedroom', 21, 'a1b2c3d4-0000-0000-0000-000000000011', 1600, 1067, NULL, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000322', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-1-wardrobe.jpg',
   'Room 1 from the side, with the wardrobe and the storage cabinets above it',
   'Bedroom 1, Ground floor', 'bedroom', 22, 'a1b2c3d4-0000-0000-0000-000000000011', 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000323', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-1-cabinet.jpg',
   'Room 1 from the foot of the bed, with the glass display cabinet and the curtained window',
   'Bedroom 1, Ground floor', 'bedroom', 23, 'a1b2c3d4-0000-0000-0000-000000000011', 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000324', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-2-window.jpg',
   'Room 2: a queen bed against a terracotta wall, with the window on the right',
   'Bedroom 2, Ground floor', 'bedroom', 24, 'a1b2c3d4-0000-0000-0000-000000000012', 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000325', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-2.jpg',
   'Room 2 with the wardrobe and a framed bird print above the bed',
   'Bedroom 2, Ground floor', 'bedroom', 25, 'a1b2c3d4-0000-0000-0000-000000000012', 1600, 1067, NULL, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000326', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-2-wardrobe.jpg',
   'Room 2 from the head of the bed, with the wardrobe, the storage above it and the bird print',
   'Bedroom 2, Ground floor', 'bedroom', 26, 'a1b2c3d4-0000-0000-0000-000000000012', 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000327', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-3.jpg',
   'Room 3: a queen bed against a maroon wall, with the door to the balcony open',
   'Bedroom 3, First floor', 'bedroom', 27, 'a1b2c3d4-0000-0000-0000-000000000013', 1600, 1067, NULL, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000328', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-3-window.jpg',
   'Room 3 from the head of the bed, with the window and the wardrobe',
   'Bedroom 3, First floor', 'bedroom', 28, 'a1b2c3d4-0000-0000-0000-000000000013', 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000329', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-3-balcony.jpg',
   'Room 3 with the balcony door open onto the trees outside, and the mirrored wardrobe alongside',
   'Bedroom 3, First floor', 'bedroom', 29, 'a1b2c3d4-0000-0000-0000-000000000013', 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000330', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-4.jpg',
   'Room 4: a king bed against a blue wall, with the wardrobe beside the door',
   'Bedroom 4, First floor', 'bedroom', 30, 'a1b2c3d4-0000-0000-0000-000000000014', 1600, 1067, NULL, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000331', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-4-window.jpg',
   'Room 4 from the foot of the bed, with the grilled window and the wardrobe',
   'Bedroom 4, First floor', 'bedroom', 31, 'a1b2c3d4-0000-0000-0000-000000000014', 1600, 1067, 3, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000332', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-4-wardrobe.jpg',
   'Room 4 from the head of the bed, with the window, the wardrobe and the storage above it',
   'Bedroom 4, First floor', 'bedroom', 32, 'a1b2c3d4-0000-0000-0000-000000000014', 1600, 1067, NULL, FALSE),

  -- ── Bathrooms ───────────────────────────────────────────────────────────
  -- Each file is two upright photographs of the same bathroom side by side.
  ('a1b2c3d4-0000-0000-0000-000000000341', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bathroom-1.jpg',
   'The first-floor bathroom: a basin and mirror on one side, a rain shower and toilet on the other',
   'Bathroom 1, First floor', 'bathroom', 41, NULL, 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000342', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bathroom-2.jpg',
   'A ground-floor bathroom: a basin, mirror and towel rail, with the rain shower and toilet alongside',
   'Bathroom 2, Ground floor', 'bathroom', 42, NULL, 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000343', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bathroom-3.jpg',
   'The other ground-floor bathroom: a basin and mirror, with the rain shower and toilet alongside',
   'Bathroom 3, Ground floor', 'bathroom', 43, NULL, 1600, 1067, NULL, FALSE),

  -- ── Outdoor Spaces ──────────────────────────────────────────────────────
  ('a1b2c3d4-0000-0000-0000-000000000351', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/outside-night.jpg',
   'The villa at night from outside the compound, with the lit boundary wall along the road',
   'Outside view at night', 'outdoor', 51, NULL, 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000352', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/entrance-night.jpg',
   'The entrance at night, with the lit porch and the driveway leading up to it',
   'Entrance', 'outdoor', 52, NULL, 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000353', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/villa-lawn.jpg',
   'The villa in the evening seen across the lawn, with the covered porch on the left',
   'Front view with Lawn', 'outdoor', 53, NULL, 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000354', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/buddha-corner.jpg',
   'A corner of the entrance area with a seated Buddha, a painted wall and potted plants',
   'Buddha at entrance area', 'outdoor', 54, NULL, 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000355', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/garden.jpg',
   'The front yard from above, with the tiled courtyard, the planted border and the lawn',
   'Front yard & landscaped garden', 'outdoor', 55, NULL, 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000356', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/parking-covered.jpg',
   'The covered parking beside the entrance, deep enough to park under',
   'Closed Parking', 'outdoor', 56, NULL, 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000357', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/sitout-second-floor.jpg',
   'The second-floor sit-out at dusk, with a table and four chairs under the tiled roof',
   'Sit-out Area, Second floor', 'outdoor', 57, NULL, 1600, 1067, NULL, FALSE),
  ('a1b2c3d4-0000-0000-0000-000000000358', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/sitout-first-floor.jpg',
   'The first-floor sit-out, with a table and chairs looking out over the trees and the gate',
   'Sit-out Area, First floor', 'outdoor', 58, NULL, 1600, 1067, NULL, FALSE)

ON CONFLICT (id) DO UPDATE SET
  url = EXCLUDED.url, alt_text = EXCLUDED.alt_text, caption = EXCLUDED.caption,
  category = EXCLUDED.category, display_order = EXCLUDED.display_order,
  room_id = EXCLUDED.room_id, width = EXCLUDED.width, height = EXCLUDED.height,
  home_order = EXCLUDED.home_order, is_room_cover = EXCLUDED.is_room_cover;

-- The neighbourhood photographs keep their place at the end of the gallery.
UPDATE property_images
   SET display_order = 100 + display_order % 100,
       home_order = NULL,
       is_room_cover = FALSE
 WHERE property_id = 'a1b2c3d4-0000-0000-0000-000000000001'
   AND url LIKE '/gallery/around-%';
