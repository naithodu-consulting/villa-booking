-- 00036: "Sultan Battery" -> "Sultan Bathery", per the operator 2026-09-28.
--
-- 00033 inserted the nearby place with the wrong spelling. That migration is
-- already applied, so the correction is a new one rather than an edit.

UPDATE nearby_places
   SET name = 'Sultan Bathery'
 WHERE name = 'Sultan Battery';
