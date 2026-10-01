-- 00058: update Pabbas photo to Gudbad ice cream; clear all photo credits.
--
-- Pabbas: the existing row had a green paan close-up. This switches to the
-- iconic Gudbad (Gadbad) layered ice cream, the dish Pabbas is known for.
--
-- Naturals Sundaes: no freely licensed photo exists on Wikimedia Commons.
-- The operator should supply a photo and add the row manually or in 00059.
--
-- Credits: cleared across all around images. The operator will supply their
-- own photos going forward.

-- 1. Swap the Pabbas photo and update alt text.
UPDATE property_images
   SET alt_text   = 'Gudbad ice cream at Pabbas, 2.2 km away',
       credit     = NULL,
       credit_url = NULL
 WHERE id = 'a1b2c3d4-0000-0000-0000-000000000127'
   AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

-- 2. Clear credits from all around-villa images for this property.
UPDATE property_images
   SET credit = NULL, credit_url = NULL
 WHERE property_id IN (SELECT id FROM properties WHERE slug = 'villa-19')
   AND category = 'around';
