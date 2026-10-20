-- Move "Front view at night" out of the mosaic tiles (it is now the hero
-- image) and put "Room 3" in its place.
UPDATE property_images SET home_order = NULL
 WHERE id = 'a1b2c3d4-0000-0000-0000-000000000301';

UPDATE property_images SET home_order = 1
 WHERE id = 'a1b2c3d4-0000-0000-0000-000000000327';
