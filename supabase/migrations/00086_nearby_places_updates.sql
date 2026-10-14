-- Rename/remove nearby places and add Naturals Sundaes
-- Transport renames
UPDATE nearby_places SET name = 'Mangalore Railway Station'
  WHERE name = 'Mangalore Central Station';

UPDATE nearby_places SET name = 'Mangalore Airport'
  WHERE name = 'Mangalore International Airport (IXE)';

-- Temple: rename and remove Sharavu
UPDATE nearby_places SET name = 'Kadri Manjunatha Temple'
  WHERE name = 'Kadri Manjunath Temple';

DELETE FROM nearby_places WHERE name = 'Sharavu Mahaganapathi Temple';

-- Shopping: rename store, remove Nilgiris
UPDATE nearby_places SET name = 'SuperMarkets'
  WHERE name = 'Super Market';

DELETE FROM nearby_places WHERE name = 'Nilgiris';

-- Function hall rename
UPDATE nearby_places SET name = 'Gokula Kalyana Mantapa'
  WHERE name = 'Gokul Kalyana Mantapa';

-- Add Naturals Sundaes (food)
INSERT INTO nearby_places (property_id, name, category, distance_km, travel_minutes, note, display_order, is_published)
SELECT
  id,
  'Naturals Sundaes',
  'food',
  3.8,
  9,
  NULL,
  85,
  TRUE
FROM properties
WHERE slug = 'villa-19'
ON CONFLICT ON CONSTRAINT uq_nearby_property_name DO NOTHING;
