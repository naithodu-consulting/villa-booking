-- 00060: short captions for every gallery photo.
--
-- alt_text is written for screen readers: full sentences that describe the
-- photo. The gallery grid needs a label that fits one line under a tile, so
-- these are separate. alt_text stays the accessible description; caption is
-- the visible label. The viewer shows alt_text, where there is room for it.
--
-- Matched on url rather than id: the file path is the same in every
-- environment, where ids are only identical because these rows happen to be
-- seeded explicitly (00055 shipped broken by assuming ids match).

UPDATE property_images AS i
   SET caption = v.caption
  FROM (VALUES
         ('/gallery/villa-facade.jpg',          'Front view'),
         ('/gallery/villa-gate.jpg',            'Entrance gate'),
         ('/gallery/driveway-house.jpg',        'Driveway'),
         ('/gallery/living-room.jpg',           'Living room'),
         ('/gallery/lounge.jpg',                'Private lounge'),
         ('/gallery/hall-staircase.jpg',        'Hall and staircase'),
         ('/gallery/kitchen.jpg',               'Kitchen'),
         ('/gallery/bedroom-brown.jpg',         'Room 1 · King bed'),
         ('/gallery/bedroom-white.jpg',         'Room 2 · Queen bed'),
         ('/gallery/bedroom-plum.jpg',          'Room 3 · Queen bed'),
         ('/gallery/bedroom-blue.jpg',          'Room 4 · King bed'),
         ('/gallery/bathroom.jpg',              'Bathroom'),
         ('/gallery/washbasin.jpg',             'Washbasin nook'),
         ('/gallery/driveway.jpg',              'Open parking'),
         ('/gallery/villa-front.jpg',           'Covered parking'),
         ('/gallery/outdoor-garden.jpg',        'Lawn (representative)'),
         ('/gallery/around-sultan-bathery.jpg', 'Sultan Bathery Fort · 1.7 km'),
         ('/gallery/around-tannirbavi.jpg',     'Tannirbhavi Beach · 8.8 km'),
         ('/gallery/around-panambur.jpg',       'Panambur Beach · 7.3 km'),
         ('/gallery/around-kudroli.jpg',        'Kudroli Temple · 2.9 km'),
         ('/gallery/around-mangaladevi.jpg',    'Mangaladevi Temple'),
         ('/gallery/around-kadri-park.jpg',     'Kadri Park'),
         ('/gallery/around-kadri.jpg',          'Kadri Manjunatha Temple · 4.2 km'),
         ('/gallery/around-st-aloysius.jpg',    'St Aloysius Chapel'),
         ('/gallery/around-milagres.jpg',       'Milagres Church'),
         ('/gallery/around-pilikula.jpg',       'Pilikula Park · 14 km'),
         ('/gallery/around-pabbas.jpg',         'Pabbas · 2.2 km'),
         ('/gallery/around-naturals.jpg',       'Naturals · 1.2 km')
       ) AS v(url, caption)
 WHERE i.url = v.url
   AND i.property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
