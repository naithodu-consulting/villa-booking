-- 00063: the professional shoot replaces every villa photograph.
--
-- 44 photos shortlisted from the operator's shoot (received 2026-10-10, 121
-- frames), each kept whole: no photograph is cropped. Only the long side is
-- bounded, at 1600px, so landscape frames are 1600x1067 and portrait ones
-- 1067x1600, and they are saved without EXIF (so without GPS). Files live in
-- public/gallery/, so urls are site-relative.
--
-- An earlier pass cut every frame to the 4:3 tile and chopped beds, chairs,
-- the nameplate and a washbasin in half. The tiles and the homepage mosaic
-- now letterbox instead (object-contain), and width/height below are each
-- photo's own.
--
-- The 16 photographs from the 2026-09-23 shoot (00046) are removed: the new
-- frames cover the same spaces and are better in every case. The 12 "Around
-- Villa 19" photographs are untouched, as is outdoor-garden.jpg's replacement:
-- the lawn now has real photographs, so the representative stand-in goes too.
--
-- Room identity is the operator's (2026-10-10): the room with the loft
-- cabinets above the wardrobe is Room 1, and the terracotta room photographed
-- from both ends (bird print at one end, display cabinet at the other) is
-- Room 2. Room 3 is the maroon room with the balcony door, Room 4 the blue one.
--
-- Two frames are the weakest of the set and were lifted slightly (histogram
-- clip, shadows opened) at the operator's request: the driver room and the
-- reception desk. No good alternative exists for either.
--
-- display_order interleaves the first five: the homepage hero grid shows
-- image 1 large with the next four beside it, so those five are a spread
-- rather than five facades. All five are landscape frames, because that
-- mosaic's cells are wide and a portrait photograph sits in them as a narrow
-- strip once nothing is allowed to be cropped.

DELETE FROM property_images
 WHERE property_id = 'a1b2c3d4-0000-0000-0000-000000000001'
   AND url NOT LIKE '/gallery/around-%';

INSERT INTO property_images
  (id, property_id, url, alt_text, caption, category, display_order, room_id, width, height) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000201', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/villa-facade-night.jpg', 'Villa 19 lit up at dusk, with the porch and driveway in front', 'The villa at dusk', 'villa', 1, NULL, 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000202', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/living-room.jpg', 'Living room with two sofas, an arched teak door and curtained windows', 'Living room', 'living_dining', 16, NULL, 1067, 1600),
  ('a1b2c3d4-0000-0000-0000-000000000203', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-1.jpg', 'Room 1: king bed against a terracotta wall, with a wardrobe and loft cabinets', 'Room 1 · King bed', 'bedroom', 3, 'a1b2c3d4-0000-0000-0000-000000000011', 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000204', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/lounge.jpg', 'Private lounge with two blue sofa-cum-beds, a bookcase and an arched window', 'Private lounge', 'living_dining', 4, 'a1b2c3d4-0000-0000-0000-000000000015', 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000205', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/terrace-dusk.jpg', 'Covered rooftop terrace with a table and four chairs, lit at dusk', 'Rooftop terrace at dusk', 'outdoor', 5, NULL, 1600, 1067),

  -- The Villa
  ('a1b2c3d4-0000-0000-0000-000000000206', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/villa-facade.jpg', 'Front of Villa 19 in daylight, with the name on the first-floor balcony', 'Front view', 'villa', 6, NULL, 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000207', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/villa-garden.jpg', 'The villa seen across the lawn and potted palms in the front garden', 'From the garden', 'villa', 7, NULL, 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000209', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/villa-nameboard.jpg', 'The Villa 19 name lettered across the first-floor balcony', 'Nameboard', 'villa', 9, NULL, 1067, 1600),
  ('a1b2c3d4-0000-0000-0000-000000000210', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/villa-gate.jpg', 'Tiled forecourt and the roofed entrance gate under mature trees', 'Entrance gate', 'villa', 10, NULL, 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000211', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/villa-sign.jpg', 'The Villa 19 Urwa Mangalore sign beside the front door', 'Villa 19, Urwa', 'villa', 11, NULL, 1067, 1600),
  ('a1b2c3d4-0000-0000-0000-000000000212', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/villa-shrine.jpg', 'Lit prayer niche in the garden with a seated statue and potted plants', 'Prayer niche', 'villa', 12, NULL, 1067, 1600),
  ('a1b2c3d4-0000-0000-0000-000000000213', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/driver-room.jpg', 'Separate driver room with its own door and attached bathroom', 'Driver room', 'villa', 13, NULL, 1067, 1600),
  ('a1b2c3d4-0000-0000-0000-000000000214', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/reception-desk.jpg', 'Reception desk with two stools, where check-in is completed', 'Reception', 'villa', 14, NULL, 1067, 1600),

  -- Living & Dining
  ('a1b2c3d4-0000-0000-0000-000000000215', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/hall-double-height.jpg', 'Double-height hall with the first-floor balcony, pillars and a display cabinet', 'Double-height hall', 'living_dining', 15, NULL, 1067, 1600),
  ('a1b2c3d4-0000-0000-0000-000000000216', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/dining-room.jpg', 'Dining room with an eight-seat table, the staircase and a washbasin alcove', 'Dining room', 'living_dining', 2, NULL, 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000217', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/dining-table.jpg', 'The dining table laid for eight under a tall window', 'Table for eight', 'living_dining', 17, NULL, 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000218', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/dining-table-laid.jpg', 'Place settings, glasses and a bowl of fruit on the dining table', 'Laid for a meal', 'living_dining', 18, NULL, 1067, 1600),
  ('a1b2c3d4-0000-0000-0000-000000000219', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/kitchen.jpg', 'Fitted kitchen with a granite counter, gas hob and sink under the window', 'Kitchen', 'living_dining', 19, NULL, 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000220', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/kitchen-appliances.jpg', 'The kitchen''s other side, with the refrigerator and overhead cabinets', 'Kitchen appliances', 'living_dining', 20, NULL, 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000221', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/coffee-station.jpg', 'Coffee machine, kettle, cups and tea caddies on the kitchen counter', 'Tea and coffee', 'living_dining', 21, NULL, 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000222', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/lounge-seating.jpg', 'Lounge seating under the arched window, with a low table and magazines', 'Lounge seating', 'living_dining', 22, 'a1b2c3d4-0000-0000-0000-000000000015', 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000223', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/landing-carrom.jpg', 'First-floor landing with a carrom board, chairs and the staircase', 'Landing and carrom', 'living_dining', 23, NULL, 1600, 1067),

  -- Bedrooms
  ('a1b2c3d4-0000-0000-0000-000000000224', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-1-wardrobe.jpg', 'Room 1: mirrored wardrobe with loft cabinets above, beside the bed', 'Room 1 · Wardrobe', 'bedroom', 24, 'a1b2c3d4-0000-0000-0000-000000000011', 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000225', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-2.jpg', 'Room 2: queen bed against a terracotta wall, with a framed print alongside', 'Room 2 · Queen bed', 'bedroom', 25, 'a1b2c3d4-0000-0000-0000-000000000012', 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000226', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-2-window.jpg', 'Room 2 from the window side, with the wardrobe set into the wall', 'Room 2 · Wardrobe', 'bedroom', 26, 'a1b2c3d4-0000-0000-0000-000000000012', 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000227', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-2-cabinet.jpg', 'Room 2 from the other end, with the glass-fronted display cabinet', 'Room 2 · Display cabinet', 'bedroom', 27, 'a1b2c3d4-0000-0000-0000-000000000012', 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000228', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-3.jpg', 'Room 3: queen bed against a maroon wall, with a door to the balcony', 'Room 3 · Queen bed', 'bedroom', 28, 'a1b2c3d4-0000-0000-0000-000000000013', 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000229', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-3-balcony.jpg', 'Room 3 with the balcony door open onto the trees outside', 'Room 3 · Balcony door', 'bedroom', 29, 'a1b2c3d4-0000-0000-0000-000000000013', 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000230', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-4.jpg', 'Room 4: king bed against a blue wall, with a teak wardrobe beside it', 'Room 4 · King bed', 'bedroom', 30, 'a1b2c3d4-0000-0000-0000-000000000014', 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000231', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bedroom-4-window.jpg', 'Room 4 from the other side, with the grilled window and curtains', 'Room 4 · Window', 'bedroom', 31, 'a1b2c3d4-0000-0000-0000-000000000014', 1600, 1067),

  -- Bathrooms
  ('a1b2c3d4-0000-0000-0000-000000000232', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bathroom-shower.jpg', 'Bathroom with a vessel basin, mirror and rain shower in marble-effect tile', 'Bathroom', 'bathroom', 32, NULL, 1067, 1600),
  ('a1b2c3d4-0000-0000-0000-000000000233', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bathroom-basin.jpg', 'Vessel basin and framed mirror with a folded towel on the rail', 'Basin and mirror', 'bathroom', 33, NULL, 1067, 1600),
  ('a1b2c3d4-0000-0000-0000-000000000234', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bathroom-vanity.jpg', 'Bathroom vanity with a shaped basin, towel rail and recessed shelf', 'Vanity', 'bathroom', 34, NULL, 1067, 1600),
  ('a1b2c3d4-0000-0000-0000-000000000235', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/bathroom-wc.jpg', 'Bathroom with a wall-hung WC, health faucet and a shelf of toiletries', 'Bathroom', 'bathroom', 35, NULL, 1067, 1600),
  ('a1b2c3d4-0000-0000-0000-000000000236', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/washbasin.jpg', 'Washbasin alcove in terracotta brick with a mirror and rolled towels', 'Washbasin alcove', 'bathroom', 36, NULL, 1067, 1600),

  -- Outdoor
  ('a1b2c3d4-0000-0000-0000-000000000237', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/terrace.jpg', 'Covered rooftop terrace with a table, four chairs and a view over the treetops', 'Rooftop terrace', 'outdoor', 37, NULL, 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000238', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/terrace-view.jpg', 'Terrace seating beside the tiled roof, looking out over the garden trees', 'Terrace view', 'outdoor', 38, NULL, 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000239', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/terrace-tea.jpg', 'A tray of tea and cups on the terrace table', 'Tea on the terrace', 'outdoor', 39, NULL, 1067, 1600),
  ('a1b2c3d4-0000-0000-0000-000000000240', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/garden.jpg', 'The lawn, planted border and tiled courtyard seen from above', 'Lawn and courtyard', 'outdoor', 40, NULL, 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000241', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/garden-night.jpg', 'The garden at night, with uplighters along the wall and potted plants', 'Garden at night', 'outdoor', 41, NULL, 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000242', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/courtyard-night.jpg', 'The tiled courtyard lit at night under the trees', 'Courtyard at night', 'outdoor', 42, NULL, 1600, 1067),

  -- Parking
  ('a1b2c3d4-0000-0000-0000-000000000243', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/parking-covered.jpg', 'Covered porch beside the entrance, deep enough to park under', 'Covered parking', 'parking', 43, NULL, 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000244', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/parking-courtyard.jpg', 'The open tiled courtyard, with room for several cars', 'Open parking', 'parking', 44, NULL, 1600, 1067),
  ('a1b2c3d4-0000-0000-0000-000000000245', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/entrance-night.jpg', 'The lit porch and driveway at night, seen from the gate', 'Entrance at night', 'parking', 45, NULL, 1600, 1067)
ON CONFLICT (id) DO UPDATE SET
  url = EXCLUDED.url, alt_text = EXCLUDED.alt_text, caption = EXCLUDED.caption,
  category = EXCLUDED.category, display_order = EXCLUDED.display_order,
  room_id = EXCLUDED.room_id, width = EXCLUDED.width, height = EXCLUDED.height;

-- The "Around Villa 19" photographs keep their places at the end of the list.
UPDATE property_images
   SET display_order = display_order + 100
 WHERE property_id = 'a1b2c3d4-0000-0000-0000-000000000001'
   AND url LIKE '/gallery/around-%'
   AND display_order < 100;
