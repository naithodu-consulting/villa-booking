-- 00043: photos for the Bathrooms, Parking and Around Villa 19 gallery sections.
--
-- Stock placeholders (Unsplash), like every other gallery image, until real
-- photographs of the villa exist. Chosen not to over-promise: no freestanding
-- bathtubs, no public car park, nothing identifiable as somewhere other than
-- coastal Karnataka. Alt text describes only what is visible, not a named place.
-- Replace these rows (same ids, new url and alt_text) when real photos arrive.

INSERT INTO property_images (id, property_id, url, alt_text, category, display_order, room_id) VALUES
  ('a1b2c3d4-0000-0000-0000-00000000002d', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=80', 'Bathroom with washbasin', 'bathroom', 13, NULL),
  ('a1b2c3d4-0000-0000-0000-00000000002e', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80', 'Bathroom with glass shower', 'bathroom', 14, NULL),
  ('a1b2c3d4-0000-0000-0000-00000000002f', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1200&q=80', 'Driveway and parking in front of the house', 'parking', 15, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000030', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80', 'Paved parking area at the entrance', 'parking', 16, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000031', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', 'Beach at sunset', 'around', 17, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000032', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80', 'South Indian temple tower', 'around', 18, NULL),
  ('a1b2c3d4-0000-0000-0000-000000000033', 'a1b2c3d4-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80', 'City lights at night', 'around', 19, NULL)
ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, alt_text = EXCLUDED.alt_text,
  category = EXCLUDED.category, display_order = EXCLUDED.display_order;
