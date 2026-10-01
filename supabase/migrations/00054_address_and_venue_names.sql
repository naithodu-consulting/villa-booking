-- 00054: operator corrections 2026-10-01.
--
-- Full street address (it was just "Urwa"), and the nearby-places wording:
-- "function hall" is trade jargon, so the section reads "Wedding & Event Venues"
-- (label lives in the-villa/page.tsx; the category key is unchanged).

UPDATE properties
   SET address = 'Urwa Marigudi Cross Road, Urwa', updated_at = NOW()
 WHERE slug = 'villa-19';

UPDATE nearby_places
   SET name = 'Sanghaniketan'
 WHERE name = 'Sanghaniketan Hall'
   AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
