-- 00066: the photo captions and descriptions in plain English.
--
-- The operator's note, 2026-10-10: keep it simple and understandable for a
-- common person. The previous pass used words a guest should not have to
-- parse to picture a room: frontage, forecourt, vessel basin, alcove,
-- marble-effect tile, uplighters, gas hob, WC. Same facts, ordinary words.
-- The viewer prints alt_text under the photograph, so this is what a guest
-- actually reads.

UPDATE property_images AS i
   SET caption = v.caption, alt_text = v.alt_text
  FROM (VALUES
  -- The Villa
  ('/gallery/villa-facade-night.jpg', 'Villa 19 at night',
   'The villa lit up at night, with the porch and driveway in front'),
  ('/gallery/villa-facade.jpg', 'Front of the villa',
   'The front of the villa in daylight, with the Villa 19 name on the first-floor balcony'),
  ('/gallery/villa-garden.jpg', 'Lawn and garden',
   'The villa seen from across the front lawn, with potted palms along the path'),
  ('/gallery/villa-nameboard.jpg', 'Villa 19 nameboard',
   'The Villa 19 name on the first-floor balcony, with trees around it'),
  ('/gallery/villa-gate.jpg', 'Entrance gate',
   'The entrance gate with its tiled roof, and the open tiled area inside it'),
  ('/gallery/villa-sign.jpg', 'Villa 19, Urwa',
   'The Villa 19, Urwa, Mangalore sign next to the front door'),
  ('/gallery/villa-shrine.jpg', 'Buddha corner',
   'A lit corner in the compound with a seated Buddha, a painted wall and potted plants'),
  ('/gallery/driver-room.jpg', 'Driver room',
   'A separate driver room in the compound, with its own door and an attached bathroom'),
  ('/gallery/reception-desk.jpg', 'Check-in desk',
   'The front desk, where you check in and show ID when you arrive'),

  -- Living & Dining
  ('/gallery/hall-double-height.jpg', 'Living hall',
   'The living hall, with a high ceiling, a balcony above, a TV and a display cabinet'),
  ('/gallery/living-room.jpg', 'Living hall seating',
   'The living hall from the other side, with two sofas and the arched wooden front door'),
  ('/gallery/dining-room.jpg', 'Dining area',
   'The dining area, with a table for eight, the staircase and a wash basin next to it'),
  ('/gallery/dining-table.jpg', 'Dining table',
   'The dining table laid for eight, next to a tall window'),
  ('/gallery/dining-table-laid.jpg', 'Table setting',
   'Plates, glasses and a bowl of fruit on the dining table'),
  ('/gallery/kitchen.jpg', 'Kitchen',
   'The kitchen, with a granite counter, a gas stove and a sink under the window'),
  ('/gallery/kitchen-appliances.jpg', 'Kitchen, other side',
   'The other side of the kitchen, with the fridge and overhead cupboards'),
  ('/gallery/coffee-station.jpg', 'Coffee corner',
   'A coffee maker, kettle, cups and tea, coffee and sugar jars on the kitchen counter'),
  ('/gallery/lounge.jpg', 'Private lounge',
   'The private lounge upstairs, with two sofa-cum-beds, a bookshelf and an arched window'),
  ('/gallery/lounge-seating.jpg', 'Lounge, another view',
   'The lounge from the doorway, with the arched window, a small table and a TV on the wall'),
  ('/gallery/landing-carrom.jpg', 'First-floor landing',
   'The first-floor landing and staircase, with a carrom board on one side'),

  -- Bedrooms
  ('/gallery/bedroom-1.jpg', 'Room 1 · King bed',
   'Room 1: king bed on the ground floor, with air conditioning, an attached bathroom and a wardrobe'),
  ('/gallery/bedroom-1-wardrobe.jpg', 'Room 1 · Wardrobe',
   'The mirrored wardrobe in Room 1, with storage cupboards above it'),
  ('/gallery/bedroom-2.jpg', 'Room 2 · Queen bed',
   'Room 2: queen bed on the ground floor, with air conditioning'),
  ('/gallery/bedroom-2-window.jpg', 'Room 2 · Wardrobe side',
   'Room 2 from the window side, with the wardrobe built into the wall'),
  ('/gallery/bedroom-2-cabinet.jpg', 'Room 2 · Another view',
   'Room 2 from the other side, with a glass-front cabinet and a bedside table'),
  ('/gallery/bedroom-3.jpg', 'Room 3 · Queen bed',
   'Room 3: queen bed on the first floor, with air conditioning and a door to the balcony'),
  ('/gallery/bedroom-3-balcony.jpg', 'Room 3 · Balcony door',
   'Room 3 with the balcony door open to the trees outside'),
  ('/gallery/bedroom-4.jpg', 'Room 4 · King bed',
   'Room 4: king bed on the first floor, with air conditioning and a wooden wardrobe'),
  ('/gallery/bedroom-4-window.jpg', 'Room 4 · Window side',
   'Room 4 from the other side, with the window and a bedside table'),

  -- Bathrooms
  ('/gallery/bathroom-shower.jpg', 'Rain shower',
   'One of the villa''s three bathrooms, with a rain shower, a wash basin and a mirror'),
  ('/gallery/bathroom-basin.jpg', 'Basin and mirror',
   'A wash basin, mirror and towel rail in one of the bathrooms'),
  ('/gallery/bathroom-vanity.jpg', 'Basin and shelf',
   'Another bathroom, with a light above the mirror, a wash basin and a shelf for toiletries'),
  ('/gallery/bathroom-wc.jpg', 'Shower and toilet',
   'A wall-mounted toilet, a rain shower and a health faucet, with a window for air'),
  ('/gallery/washbasin.jpg', 'Wash basin',
   'The wash basin next to the dining area, in a brick-tiled corner with rolled towels'),

  -- Outdoor
  ('/gallery/terrace-dusk.jpg', 'Terrace in the evening',
   'The covered rooftop terrace in the evening, with a table and four chairs'),
  ('/gallery/terrace.jpg', 'Rooftop terrace',
   'The covered rooftop terrace in daylight, looking out over the trees'),
  ('/gallery/terrace-view.jpg', 'Open terrace',
   'The open part of the terrace, with two chairs and a table next to the tiled roof'),
  ('/gallery/terrace-tea.jpg', 'Tea on the terrace',
   'A tray of tea and cups on the terrace table'),
  ('/gallery/garden.jpg', 'Lawn and courtyard',
   'The lawn, the plants and the tiled courtyard, seen from upstairs'),
  ('/gallery/garden-night.jpg', 'Garden at night',
   'The garden at night, with lights along the wall and potted plants'),
  ('/gallery/courtyard-night.jpg', 'Courtyard at night',
   'The tiled courtyard lit up at night, under the trees'),

  -- Parking
  ('/gallery/parking-covered.jpg', 'Covered porch',
   'The covered porch next to the entrance, big enough to park a car under'),
  ('/gallery/parking-courtyard.jpg', 'Open parking',
   'The open tiled courtyard, where most of the parking is'),
  ('/gallery/entrance-night.jpg', 'Entrance at night',
   'The porch and driveway lit up at night, seen from the gate')
       ) AS v(url, caption, alt_text)
 WHERE i.url = v.url
   AND i.property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
