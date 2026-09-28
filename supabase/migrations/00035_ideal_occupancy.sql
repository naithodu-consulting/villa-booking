-- 00035: ideal occupancy, per the operator 2026-09-25.
--
-- "Ideal for 8 guests, accommodates up to 14" is a comfort claim, and it was
-- the one occupancy figure with no home: 8 was already hardcoded in the booking
-- form's default guest count and in the homepage "Ideal For" tile, while 12
-- (base_occupancy) and 14 (max_occupancy) came from here. Copy driven by a
-- literal cannot be corrected without a deploy, which is the same trap the
-- check-in times were in before 00031.
--
-- This is presentational only. base_occupancy stays 12: the base rate still
-- covers 12 guests and the extra-guest charge still starts at 13. Nothing in
-- pricing-engine.ts reads this column.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS ideal_occupancy INT NOT NULL DEFAULT 8;

COMMENT ON COLUMN properties.ideal_occupancy IS
  'Comfort figure for guest-facing copy ("ideal for N guests"). Not a pricing '
  'or enforcement threshold - see base_occupancy and max_occupancy for those.';

UPDATE properties
   SET ideal_occupancy = 8,
       updated_at      = NOW()
 WHERE slug = 'villa-19';

-- The description's capacity paragraph led with the maximum alone, which reads
-- as the intended party size rather than the ceiling.
UPDATE properties
   SET description = replace(
         description,
         'Comfortably **accommodating up to 14 guests**, Villa 19 is designed for families and groups',
         '**Ideal for 8 guests** and comfortably **accommodating up to 14**, Villa 19 is designed for families and groups'
       ),
       updated_at = NOW()
 WHERE slug = 'villa-19';
