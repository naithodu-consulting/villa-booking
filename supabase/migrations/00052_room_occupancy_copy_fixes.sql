-- 00052: operator corrections 2026-10-01.
--
-- Room 3 sleeps 2, not 3. The Private Lounge sleeps 3, not 2. Bed types are
-- proper nouns in the operator's copy ("King", "Queen"), and the kitchen FAQ
-- omitted cutlery.

UPDATE rooms
   SET max_guests = 2
 WHERE name = 'Room 3'
   AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

UPDATE rooms
   SET max_guests = 3
 WHERE name = 'Private Lounge'
   AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

UPDATE property_amenities
   SET label = 'Comfortable King & Queen beds'
 WHERE label = 'Comfortable king & queen beds'
   AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

UPDATE faqs
   SET answer = replace(answer, 'combination of king and queen beds', 'combination of King and Queen beds')
 WHERE property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

UPDATE faqs
   SET answer = replace(answer, 'a refrigerator, cookware, crockery', 'a refrigerator, cutlery, cookware, crockery')
 WHERE property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
