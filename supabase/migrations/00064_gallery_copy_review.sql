-- 00064: every gallery caption and description rewritten after review.
--
-- The viewer prints alt_text under the photograph, so alt_text is read by
-- guests as well as by screen readers: it has to be a sentence a guest would
-- want to read, and it has to be true. The caption is the one-line label under
-- a tile. Reviewed photograph by photograph against the property record.
--
-- What was wrong, and what it cost:
--
--  * Two bathrooms were photographed, but four tiles said "Bathroom", "Basin
--    and mirror", "Vanity" and "Bathroom", which reads as four bathrooms. The
--    property record says three. Captions now name the fixture instead of
--    counting, and one description states the three plainly.
--  * "Blue hour" and "The villa at dusk" labelled two frames of the same
--    evening from almost the same spot. The duplicate frame is dropped rather
--    than relabelled.
--  * "Prayer niche" asserted a religious use of an alcove with a seated Buddha
--    in it. It is now described as what it is, and placed in the compound
--    rather than in the garden, which is where the daylight frame puts it.
--  * "Reception" suggests a hotel desk. It is where check-in and the ID
--    registration the house rules require are done, so it says that.
--  * "Tea and coffee" reads as a promise that both are stocked for the stay.
--    The photograph shows the equipment and the canisters, so does the caption.
--  * "Landing and carrom" made the carrom board the subject of a photograph
--    that is mostly a landing. The board is at the edge of it, and the caption
--    and description now say so in that order.
--  * The washbasin alcove was described as a bathroom fitting. It is beside
--    the dining area, which two other frames show, and a guest reading
--    "bathroom" would count it as one.
--  * "Double-height hall" and "Living room" named one room twice, as though
--    the villa had two sitting rooms.
--  * Bedroom descriptions listed wall colours and furniture. A guest choosing
--    a room wants the bed, the floor, the air-conditioning and whether the
--    bathroom is attached, which is Room 1 only. They now say that, and match
--    the rooms table rather than restating the decor.
--  * "Covered parking" claimed a car park from a photograph of an empty porch.
--    It is a porch you can park under, which is what it now says.

-- The duplicate evening frame is also removed from 00063's insert, so this is
-- a no-op on a database built from scratch and the removal on one that already
-- has it.
DELETE FROM property_images WHERE url = '/gallery/villa-facade-dusk.jpg';

UPDATE property_images AS i
   SET caption = v.caption, alt_text = v.alt_text
  FROM (VALUES
  -- The Villa
  ('/gallery/villa-facade-night.jpg', 'Villa 19 at night',
   'Villa 19 lit up after dark, with the porch and the tiled driveway in front'),
  ('/gallery/villa-facade.jpg', 'Front of the villa',
   'The front of Villa 19 in daylight, with the villa name across the first-floor balcony'),
  ('/gallery/villa-garden.jpg', 'Lawn and frontage',
   'The villa seen across the front lawn, with potted palms along the path'),
  ('/gallery/villa-nameboard.jpg', 'Villa 19 nameboard',
   'The Villa 19 nameboard across the first-floor balcony, framed by the garden trees'),
  ('/gallery/villa-gate.jpg', 'Entrance gate',
   'The roofed entrance gate and the tiled forecourt inside it, shaded by mature trees'),
  ('/gallery/villa-sign.jpg', 'Villa 19, Urwa',
   'The Villa 19, Urwa, Mangalore sign beside the front door'),
  ('/gallery/villa-shrine.jpg', 'Buddha alcove',
   'A lit alcove in the villa compound, with a seated Buddha, a painted backdrop and potted plants'),
  ('/gallery/driver-room.jpg', 'Driver room',
   'The separate driver room in the compound, with its own entrance and an attached bathroom'),
  ('/gallery/reception-desk.jpg', 'Check-in desk',
   'The check-in desk, where arrival formalities and guest ID registration are completed'),

  -- Living & Dining
  ('/gallery/hall-double-height.jpg', 'Living hall',
   'The double-height living hall, with the first-floor balcony above it, a television and a display cabinet'),
  ('/gallery/living-room.jpg', 'Living hall seating',
   'The living hall from the other end, with two sofas and the arched teak front door'),
  ('/gallery/dining-room.jpg', 'Dining area',
   'The dining area, with its eight-seat table, the staircase and the washbasin alcove beside it'),
  ('/gallery/dining-table.jpg', 'Dining table',
   'The dining table laid for eight, under a tall window'),
  ('/gallery/dining-table-laid.jpg', 'Place settings',
   'Place settings, glasses and a bowl of fruit on the dining table, with the washbasin alcove behind'),
  ('/gallery/kitchen.jpg', 'Kitchen',
   'The kitchen, with a granite counter, a gas hob and the sink under the window'),
  ('/gallery/kitchen-appliances.jpg', 'Kitchen, other side',
   'The other side of the kitchen, with the refrigerator and overhead cabinets'),
  ('/gallery/coffee-station.jpg', 'Coffee corner',
   'A filter coffee maker, a kettle, cups and tea, coffee and sugar canisters on the kitchen counter'),
  ('/gallery/lounge.jpg', 'Private lounge',
   'The private first-floor lounge, with two sofa-cum-beds, a bookcase and an arched window'),
  ('/gallery/lounge-seating.jpg', 'Lounge, from the door',
   'The lounge from the doorway, with the arched window, a low table and a wall-mounted television'),
  ('/gallery/landing-carrom.jpg', 'First-floor landing',
   'The first-floor landing and staircase, with a carrom board set up to one side'),

  -- Bedrooms
  ('/gallery/bedroom-1.jpg', 'Room 1 · King bed',
   'Room 1: a king bed on the ground floor, air-conditioned, with an attached bathroom, a wardrobe and loft storage'),
  ('/gallery/bedroom-1-wardrobe.jpg', 'Room 1 · Wardrobe',
   'Room 1''s mirrored wardrobe, with loft cabinets above it'),
  ('/gallery/bedroom-2.jpg', 'Room 2 · Queen bed',
   'Room 2: a queen bed on the ground floor, air-conditioned, with a framed print on the side wall'),
  ('/gallery/bedroom-2-window.jpg', 'Room 2 · Wardrobe side',
   'Room 2 from the window side, with the wardrobe built into the wall'),
  ('/gallery/bedroom-2-cabinet.jpg', 'Room 2 · Other end',
   'Room 2 from the other end, with its glass-fronted cabinet and a bedside table'),
  ('/gallery/bedroom-3.jpg', 'Room 3 · Queen bed',
   'Room 3: a queen bed on the first floor, air-conditioned, with a door onto the balcony'),
  ('/gallery/bedroom-3-balcony.jpg', 'Room 3 · Balcony door',
   'Room 3 with the balcony door open onto the trees, and a mirrored wardrobe by the window'),
  ('/gallery/bedroom-4.jpg', 'Room 4 · King bed',
   'Room 4: a king bed on the first floor, air-conditioned, with a teak wardrobe beside it'),
  ('/gallery/bedroom-4-window.jpg', 'Room 4 · Window side',
   'Room 4 from the other side, with the grilled window and a bedside table'),

  -- Bathrooms
  ('/gallery/bathroom-shower.jpg', 'Rain shower',
   'One of the villa''s three bathrooms, with a rain shower, a vessel basin and a mirror'),
  ('/gallery/bathroom-basin.jpg', 'Basin and mirror',
   'A vessel basin, mirror and towel rail against grey marble-effect tile'),
  ('/gallery/bathroom-vanity.jpg', 'Vanity and mirror',
   'Another of the bathrooms, with a lit mirror over a shaped basin and a recessed shelf'),
  ('/gallery/bathroom-wc.jpg', 'Shower and WC',
   'A wall-hung WC, rain shower and health faucet, with an opening window for ventilation'),
  ('/gallery/washbasin.jpg', 'Washbasin alcove',
   'The washbasin alcove beside the dining area, set in terracotta brick with rolled towels'),

  -- Outdoor
  ('/gallery/terrace-dusk.jpg', 'Terrace at dusk',
   'The covered rooftop terrace at dusk, with a table and four chairs under the tiled roof'),
  ('/gallery/terrace.jpg', 'Rooftop terrace',
   'The covered rooftop terrace in daylight, looking out over the treetops'),
  ('/gallery/terrace-view.jpg', 'Open terrace',
   'The open part of the terrace, with two chairs and a table beside the tiled roof'),
  ('/gallery/terrace-tea.jpg', 'Tea on the terrace',
   'A tray of tea and cups on the terrace table'),
  ('/gallery/garden.jpg', 'Lawn and courtyard',
   'The lawn, the planted border and the tiled courtyard, seen from the floor above'),
  ('/gallery/garden-night.jpg', 'Garden at night',
   'The garden lit at night, with uplighters along the boundary wall and potted plants'),
  ('/gallery/courtyard-night.jpg', 'Courtyard at night',
   'The tiled courtyard lit at night, under the trees'),

  -- Parking
  ('/gallery/parking-covered.jpg', 'Covered porch',
   'The covered porch beside the entrance, deep enough to park a car under'),
  ('/gallery/parking-courtyard.jpg', 'Open parking',
   'The open tiled courtyard, which holds most of the villa''s private parking'),
  ('/gallery/entrance-night.jpg', 'Entrance at night',
   'The lit porch and driveway at night, seen from the gate')
       ) AS v(url, caption, alt_text)
 WHERE i.url = v.url
   AND i.property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
