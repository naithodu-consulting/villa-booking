-- 00026: shorter villa tagline, per the operator 2026-09-24.

UPDATE properties
   SET tagline    = 'Premium 4-Bedroom Private Urban Villa',
       updated_at = NOW()
 WHERE slug = 'villa-19';
