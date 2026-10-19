-- 00094: set the villa's tagline, which no database built from migrations has.
--
-- 00026 sets it:
--
--   UPDATE properties SET tagline = 'Premium 4-Bedroom Private Urban Villa'
--    WHERE slug = 'villa-19';
--
-- but the properties row is not INSERTed until 00028, two migrations later. On
-- a database built from migrations in order, 00026 therefore matches zero rows.
-- An UPDATE that matches nothing still succeeds, so the migration reported no
-- problem and nobody noticed.
--
-- It went unnoticed for a second reason: every existing database got its
-- tagline from supabase/seed.sql, and the remote was built when the row already
-- existed. Only a genuinely fresh build from migrations alone is affected,
-- which is exactly what the new production project will be.
--
-- The visible consequence is not subtle. The home page renders the tagline as a
-- section heading:
--
--   src/app/(site)/page.tsx:227
--   <h2 ...>{property.tagline}</h2>
--
-- so a fresh production database would serve an empty <h2> on the home page.
--
-- Checked the rest of the same class before writing this: 00015, 00016, 00021,
-- 00023, 00025 and 00027 also UPDATE properties before 00028 inserts the row.
-- Every column they touch is re-set by a later migration (coordinates in 00034,
-- occupancy in 00035, the description in 00069 and later, the code prefix with
-- the insert itself), so tagline is the only value actually lost. Verified
-- against a database built from migrations alone: tagline NULL, everything else
-- correct.
--
-- Idempotent and safe on a database that already has the value: it writes only
-- where the tagline is missing, so it cannot overwrite a tagline the operator
-- has since changed in Ooruda Villa.

UPDATE properties
   SET tagline    = 'Premium 4-Bedroom Private Urban Villa',
       updated_at = NOW()
 WHERE slug = 'villa-19'
   AND (tagline IS NULL OR tagline = '');
