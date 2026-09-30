-- 00046: real photographs replace the stock gallery, per the operator 2026-09-30.
--
-- 15 photos shortlisted from the operator's shoot (23 Sep 2026), cropped to the
-- gallery's 4:3 tiles, resized to 1600x1200, number plates blurred and EXIF
-- (including GPS) stripped. Files live in public/gallery/, so urls are
-- site-relative. Order puts the facade first: the home page hero grid takes the
-- first images by display_order.
--
-- The 19 Unsplash placeholders (00021-era seed ids ...21-...33) are removed.
-- Outdoor Spaces and Around Villa 19 have no real photos yet, so those sections
-- hide until some are added. Bedroom photos are not linked to room numbers:
-- the shoot does not say which room is which.

DELETE FROM property_images
 WHERE property_id = 'a1b2c3d4-0000-0000-0000-000000000001'
   AND url LIKE 'https://images.unsplash.com/%';

INSERT INTO property_images (id, property_id, url, alt_text, category, display_order, room_id) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000101', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/villa-facade.jpg', 'Front view of Villa 19 with its name on the facade', 'villa', 1, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000102', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/living-room.jpg', 'Living room with sofas, carved wooden door and display cabinet', 'living_dining', 2, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000103', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-blue.jpg', 'Bedroom with a blue feature wall and king-size bed', 'bedroom', 3, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000104', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/lounge.jpg', 'Private lounge with two blue sofa-cum-beds', 'living_dining', 4, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000105', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-plum.jpg', 'Bedroom with a plum feature wall and arched window', 'bedroom', 5, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000106', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/hall-staircase.jpg', 'Hall with the staircase and a washbasin corner', 'living_dining', 6, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000107', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/kitchen.jpg', 'Kitchen with cabinets and refrigerator', 'living_dining', 7, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000108', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-brown.jpg', 'Bedroom with built-in wardrobes and air conditioning', 'bedroom', 8, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000109', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-white.jpg', 'Bedroom with a brown feature wall', 'bedroom', 9, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000110', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bathroom.jpg', 'Bathroom with vessel basin and rain shower', 'bathroom', 10, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000111', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/washbasin.jpg', 'Washbasin nook with a tiled wall', 'bathroom', 11, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000112', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/villa-gate.jpg', 'Entrance gate with the Villa 19 sign', 'villa', 12, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000113', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/driveway-house.jpg', 'Villa and paved driveway from the gate', 'villa', 13, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000114', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/driveway.jpg', 'Paved driveway with space for several cars', 'parking', 14, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000115', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/villa-front.jpg', 'Covered parking in front of the villa', 'parking', 15, NULL)
ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, alt_text = EXCLUDED.alt_text,
  category = EXCLUDED.category, display_order = EXCLUDED.display_order, room_id = EXCLUDED.room_id;
