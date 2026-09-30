-- 00048: Outdoor Spaces and Around Villa 19 photos, with image credits.
--
-- The operator's shoot has no outdoor or neighbourhood photos. Outdoor Spaces
-- gets one Unsplash photo (free licence, no attribution required). Around
-- Villa 19 gets one Wikimedia Commons photo per nearby place. All five are
-- temporary placeholders until the operator supplies real photos.
--
-- The Commons photos are CC BY-SA, which requires crediting author, licence and
-- source and noting changes (all were cropped). The credits are recorded in the
-- new credit / credit_url columns, but the operator chose not to display them
-- for now (2026-09-30): replace these photos, or show the credits, before launch.
-- Distances in the alt text match nearby_places.

ALTER TABLE property_images
  ADD COLUMN IF NOT EXISTS credit     TEXT,
  ADD COLUMN IF NOT EXISTS credit_url TEXT;

INSERT INTO property_images (id, property_id, url, alt_text, category, display_order, room_id, credit, credit_url) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000116', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/outdoor-garden.jpg', 'Tropical lawn with coconut palms (representative image)', 'outdoor', 16, NULL, 'Representative image', NULL),
  ('a1b2c3d4-0000-0000-0000-000000000117', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-kudroli.jpg', 'Kudroli Gokarnanatheshwara Temple, 2.9 km away', 'around', 17, NULL, 'Photo: Yakshitha, CC BY-SA 4.0, cropped', 'https://commons.wikimedia.org/wiki/File:Kudroli_temple.jpg'),
  ('a1b2c3d4-0000-0000-0000-000000000118', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-panambur.jpg', 'Sunset at Panambur Beach, 7.3 km away', 'around', 18, NULL, 'Photo: Avinash Bhat, CC BY-SA 2.0, cropped', 'https://commons.wikimedia.org/wiki/File:Panambur_Beach,_Mangalore_-_24792281798.jpg'),
  ('a1b2c3d4-0000-0000-0000-000000000119', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-sultan-bathery.jpg', 'Sultan Bathery watchtower, 1.7 km away', 'around', 19, NULL, 'Photo: Athulvis, CC BY-SA 4.0, cropped', 'https://commons.wikimedia.org/wiki/File:Sultan_Battery,_Mangaluru_3.jpg'),
  ('a1b2c3d4-0000-0000-0000-000000000120', 'a1b2c3d4-0000-0000-0000-000000000001', '/gallery/around-kadri.jpg', 'Kadri Manjunatha Temple, 4.2 km away', 'around', 20, NULL, 'Photo: Yakshitha, CC BY-SA 4.0, cropped', 'https://commons.wikimedia.org/wiki/File:Kadri_Manjunatha_Temple.jpg')
ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, alt_text = EXCLUDED.alt_text, category = EXCLUDED.category,
  display_order = EXCLUDED.display_order, credit = EXCLUDED.credit, credit_url = EXCLUDED.credit_url;
