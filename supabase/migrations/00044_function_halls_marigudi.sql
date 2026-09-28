-- 00044: function halls and Urwa Marigudi Temple, per the operator 2026-09-28.
--
-- Function halls get their own category, listed first under Location & Nearby
-- (display_order 1-3): guests attending a wedding nearby are a core audience.
-- Distances are Google Maps driving distances from the villa (12.895188,
-- 74.830676), measured 2026-09-28:
--   Gokula Kalyana Mantapa   VRWJ+87V, Ashok Nagar Rd         77 m,  1 min
--   Daivajna Kalyana Mantapa VRVJ+Q39, Boloor Marigudi Rd    100 m,  1 min
--   Sanghaniketan Hall       Mannagudda Rd, Gandhinagar      1.8 km, 5 min
--   Shri Mariamma Temple     VRRJ+C8H, Urwa Marigudi Rd      550 m,  2 min by car
-- (Google gave 8 min for the temple, its walking time; the other rows are driving.)
-- The temple sorts ahead of the other temples as the nearest.

INSERT INTO nearby_places (property_id, name, category, distance_km, travel_minutes, note, display_order, is_published) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Gokul Kalyana Mantapa', 'function_hall', 0.08, 1, 'Wedding and function hall on Ashok Nagar Road', 1, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Daivajna Kalyana Mantapa', 'function_hall', 0.1, 1, 'Wedding and function hall on Boloor Marigudi Road', 2, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Sanghaniketan Hall', 'function_hall', 1.8, 5, 'Large hall on Mannagudda Road, Gandhinagar', 3, TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Urwa Marigudi Temple', 'temple', 0.55, 2, 'Shri Mariamma Temple, Urwa Marigudi Road', 45, TRUE)
ON CONFLICT ON CONSTRAINT uq_nearby_property_name DO UPDATE
  SET category = EXCLUDED.category, distance_km = EXCLUDED.distance_km,
      travel_minutes = EXCLUDED.travel_minutes, note = EXCLUDED.note,
      display_order = EXCLUDED.display_order, is_published = EXCLUDED.is_published;
