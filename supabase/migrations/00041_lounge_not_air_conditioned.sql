-- 00041: the Private Lounge is not air-conditioned, per the operator 2026-09-28.
--
-- has_ac defaults to TRUE (00007), so the lounge inherited it when it was added
-- and the Rooms page badged it "Air-conditioned". The page now reads has_ac.

UPDATE rooms
   SET has_ac = FALSE
 WHERE slug = 'private-lounge'
   AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
