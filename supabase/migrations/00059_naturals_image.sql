-- 00059: add Naturals Sundaes gallery entry; update Pabbas alt text.
--
-- Operator supplied photos for both. Images processed to 1200×900 (4:3) and
-- saved to public/gallery/. No credits required (operator's own photos).

-- Naturals Sundaes: new around-villa gallery entry.
INSERT INTO property_images (id, property_id, url, alt_text, category, display_order, room_id, credit, credit_url)
SELECT 'a1b2c3d4-0000-0000-0000-000000000128',
       p.id,
       '/gallery/around-naturals.jpg',
       'Naturals Sundaes ice cream, 1.2 km away',
       'around',
       28,
       NULL, NULL, NULL
  FROM properties p
 WHERE p.slug = 'villa-19'
   AND NOT EXISTS (
     SELECT 1 FROM property_images
      WHERE id = 'a1b2c3d4-0000-0000-0000-000000000128'
   );

-- Pabbas: ensure alt text matches the new Gudbad photo.
UPDATE property_images
   SET alt_text = 'Gudbad ice cream at Pabbas, 2.2 km away'
 WHERE id = 'a1b2c3d4-0000-0000-0000-000000000127'
   AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
