-- 00029: bathroom layout and the lounge's floor, per the operator 2026-09-25.
--
-- The villa has three bathrooms, not the four previously recorded:
--   1. attached to Room 1
--   2. a common bathroom on the ground floor
--   3. a common bathroom on the first floor
-- Every room other than Room 1 uses the common bathroom on its own floor, so
-- the cards must say "shared" rather than fall silent, which read as "none".

UPDATE properties
   SET bathroom_count = 3,
       updated_at     = NOW()
 WHERE slug = 'villa-19';

-- Room 1: the only attached bath.
UPDATE rooms
   SET bathroom_type = 'Attached', has_ensuite_bathroom = TRUE
 WHERE id = 'a1b2c3d4-0000-0000-0000-000000000011';

-- Everything else shares the common bathroom on its floor.
UPDATE rooms
   SET bathroom_type = 'Shared', has_ensuite_bathroom = FALSE
 WHERE property_id = 'a1b2c3d4-0000-0000-0000-000000000001'
   AND id <> 'a1b2c3d4-0000-0000-0000-000000000011';

-- The lounge sits on the first floor.
UPDATE rooms
   SET floor = 'First Floor'
 WHERE id = 'a1b2c3d4-0000-0000-0000-000000000015';
