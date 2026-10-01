-- 00053: Around Villa 19 gallery section rebuilt to the operator's list
-- (2026-10-01), in their order. Kadri Park and Kadri Manjunatha Temple are
-- separate places and both appear.
--
-- Photos are Wikimedia Commons, all CC BY-SA 4.0, resized to 1600px wide (the
-- Pilikula photo was also cropped on the left to remove a finger over the lens).
-- CC BY-SA requires crediting author, licence and source and noting changes;
-- the credits sit in credit / credit_url but are still not displayed on the
-- site (operator's call, 2026-09-30). Display them or replace these photos with
-- the operator's own before launch.
--
-- Distances come from nearby_places where we have one; places we have no
-- measured distance for are left without one rather than guessed.
--
-- Not included, no usable freely licensed photo exists on Commons:
--   Manasa Water Park, Naturals Sundaes.

-- Re-point the four existing rows: new order, alt text, and credits unchanged.
UPDATE property_images SET display_order = 17, alt_text = 'Sultan Bathery Fort, 1.7 km away'
 WHERE id = 'a1b2c3d4-0000-0000-0000-000000000119';
UPDATE property_images SET display_order = 19, alt_text = 'Panambur Beach at sunset, 7.3 km away'
 WHERE id = 'a1b2c3d4-0000-0000-0000-000000000118';
UPDATE property_images SET display_order = 20, alt_text = 'Kudroli Gokarnanatheshwara Temple, 2.9 km away'
 WHERE id = 'a1b2c3d4-0000-0000-0000-000000000117';
UPDATE property_images SET display_order = 23, alt_text = 'Kadri Manjunatha Temple, 4.2 km away'
 WHERE id = 'a1b2c3d4-0000-0000-0000-000000000120';

INSERT INTO property_images (id, property_id, url, alt_text, category, display_order, room_id, credit, credit_url) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000121', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-tannirbavi.jpg',  'Tannirbhavi Beach, 8.8 km away',              'around', 18, NULL, 'Photo: Aviator423, CC BY-SA 4.0, resized',          'https://commons.wikimedia.org/wiki/File:Tannirbhavi_Beach_in_Mangalore_-_2.jpg'),
  ('a1b2c3d4-0000-0000-0000-000000000122', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-mangaladevi.jpg', 'Mangaladevi Temple, Mangaluru',               'around', 21, NULL, 'Photo: Gopala Krishna A, CC BY-SA 4.0, resized',    'https://commons.wikimedia.org/wiki/File:Mangaladevi_temple_1.jpg'),
  ('a1b2c3d4-0000-0000-0000-000000000123', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-kadri-park.jpg',  'Kadri Park, Mangaluru',                       'around', 22, NULL, 'Photo: Aviator423, CC BY-SA 4.0, resized',          'https://commons.wikimedia.org/wiki/File:Kadri_Park_in_Mangalore_-_1.jpg'),
  ('a1b2c3d4-0000-0000-0000-000000000124', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-st-aloysius.jpg', 'St Aloysius Chapel, Mangaluru',               'around', 24, NULL, 'Photo: Hariprasad Shetty10, CC BY-SA 4.0, resized', 'https://commons.wikimedia.org/wiki/File:St_Aloysius_chapel,_Mangaluru_Front_view.jpg'),
  ('a1b2c3d4-0000-0000-0000-000000000125', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-milagres.jpg',    'Milagres Church, Mangaluru',                  'around', 25, NULL, 'Photo: Robjersey, CC BY-SA 4.0, resized',           'https://commons.wikimedia.org/wiki/File:Milagres_Church_in_Mangalore.jpg'),
  ('a1b2c3d4-0000-0000-0000-000000000126', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-pilikula.jpg',    'Pilikula Nature Park and Zoo, 14 km away',    'around', 26, NULL, 'Photo: Aviator423, CC BY-SA 4.0, cropped and resized', 'https://commons.wikimedia.org/wiki/File:Near_the_entrance_of_the_Pilikula_Biological_Park_in_Mangalore.jpg'),
  ('a1b2c3d4-0000-0000-0000-000000000127', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-pabbas.jpg',      'Marzi paan ice cream at Pabbas, 2.2 km away', 'around', 27, NULL, 'Photo: Harikrishnan N, CC BY-SA 4.0, resized',      'https://commons.wikimedia.org/wiki/File:Marzi_Paan_Ice_Cream_-_Pabbas,_Mangalore_-_Karnataka_-_PXL1306.jpg')
ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, alt_text = EXCLUDED.alt_text, category = EXCLUDED.category,
  display_order = EXCLUDED.display_order, credit = EXCLUDED.credit, credit_url = EXCLUDED.credit_url;
