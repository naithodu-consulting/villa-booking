-- 00032: move two amenities from Convenience & Essentials to Outdoors & Spaces,
-- per the operator 2026-09-25.
--
-- Both describe the grounds rather than an in-house essential: the driver's
-- room is a separate outbuilding, and the CCTV covers the common outdoor areas
-- (its own label says so). They sat under Convenience & Essentials only because
-- 00030 carried them over from the old "Safety & Hygiene" bucket.
--
-- display_order 35/36 places them after "Lush green surroundings" (34) and
-- before the Convenience block (40+). The UI groups by category in the order
-- rows arrive, sorted by display_order, so the numbering is what keeps each
-- amenity inside its own card.

UPDATE property_amenities
   SET category      = 'Outdoors & Spaces',
       display_order = 35
 WHERE property_id = 'a1b2c3d4-0000-0000-0000-000000000001'
   AND label = 'Dedicated driver''s room with bathroom';

UPDATE property_amenities
   SET category      = 'Outdoors & Spaces',
       display_order = 36
 WHERE property_id = 'a1b2c3d4-0000-0000-0000-000000000001'
   AND label = 'CCTV surveillance in common outdoor areas';
