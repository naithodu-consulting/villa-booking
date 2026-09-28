-- 00039: tiered extra-guest pricing, per the operator 2026-09-28.
--
-- Was: base rate covers 12 guests, Rs 1,000 per guest per night for 13-14 (00021).
-- Now: base rate covers 8 guests. Guests 9-11 pay Rs 1,000 each per night and
--      guests 12-14 pay Rs 700 each per night, stepwise: a group of 12 pays
--      3 x 1,000 + 1 x 700 = Rs 3,700 a night on top of the base rate.
--
-- The second tier is two columns rather than a hardcoded rule so Ooruda Villa
-- can change it. Both null means one flat extra_guest_rate, as before.
-- Existing bookings keep the amounts they were charged: prices are stored on
-- the booking at creation, never recalculated.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS extra_guest_tier2_from INT,
  ADD COLUMN IF NOT EXISTS extra_guest_tier2_rate BIGINT;

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_extra_guest_tier2_valid;
ALTER TABLE properties ADD CONSTRAINT properties_extra_guest_tier2_valid CHECK (
  (extra_guest_tier2_from IS NULL AND extra_guest_tier2_rate IS NULL)
  OR (extra_guest_tier2_from > base_occupancy + 1 AND extra_guest_tier2_rate >= 0)
);

COMMENT ON COLUMN properties.extra_guest_tier2_from IS
  'First guest (by count) charged extra_guest_tier2_rate rather than extra_guest_rate. NULL: one flat rate.';
COMMENT ON COLUMN properties.extra_guest_tier2_rate IS
  'Paise per guest per night from extra_guest_tier2_from onwards.';

UPDATE properties
   SET base_occupancy         = 8,
       extra_guest_rate       = 100000,  -- Rs 1,000: guests 9-11
       extra_guest_tier2_from = 12,
       extra_guest_tier2_rate = 70000,   -- Rs 700: guests 12-14
       updated_at             = NOW()
 WHERE slug = 'villa-19';
