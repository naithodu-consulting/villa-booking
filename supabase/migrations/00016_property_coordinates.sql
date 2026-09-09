-- Correct the property coordinates to Urwa Mariyamma Circle.
--
-- The pin was 12.8634, 74.8422 — about 3.2 km south-east of the villa. The new
-- values are the place coordinates from the operator's Google Maps link (the
-- !3d/!4d parameters, which identify the place itself rather than the @… map
-- viewport centre).
--
-- This was applied to the local database directly and written into seed.sql,
-- but never captured as a migration, so it did not reach staging. Everything
-- derived from it did: 00015 rewrote the beach distance and every nearby_places
-- row using routing measured from the *new* pin, which left staging holding
-- corrected distances against the old coordinates. Applying this brings the two
-- back into agreement.
--
-- public/villa-map.jpg is rendered from these coordinates. If they change
-- again, regenerate it with scripts/make-map.py.

UPDATE properties
SET geo_lat = 12.8892951,
    geo_lng = 74.8298580
WHERE slug = 'villa-19';
