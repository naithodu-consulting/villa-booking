-- 00034: corrected villa coordinates, per the operator 2026-09-25.
--
-- 12.8892951, 74.8298580 -> 12.895188, 74.830676, about 661 m north-east.
--
-- These drive the "Open in Maps" links on the home and The Villa pages and the
-- GeoCoordinates in the LodgingBusiness structured data, so a stale pair sends
-- guests and search engines to the wrong spot.
--
-- The static map at public/villa-map.jpg is a build asset, not a database
-- value: it is regenerated separately with scripts/make-map.py, whose own
-- LAT/LON constants move with this migration.

UPDATE properties
   SET geo_lat    = 12.895188,
       geo_lng    = 74.830676,
       updated_at = NOW()
 WHERE slug = 'villa-19';
