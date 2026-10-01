-- 00055: operator copy corrections 2026-10-01.
--
-- The occupancy paragraph now says how the villa reaches 14 (the lounge
-- converts). "Indoor games" was vague. "2 convertible sofas" was one amenity
-- covering two different rooms, so it splits into the living room and lounge.

UPDATE properties
   SET description = replace(
         description,
         'slow down, and enjoy their own private space in Mangalore.',
         'slow down, and enjoy their own private space in Mangalore. For larger groups, the spacious lounge can also be used as additional sleeping space with its convertible sofas.'
       ),
       updated_at = NOW()
 WHERE slug = 'villa-19'
   -- replace() would append the sentence again on every re-run.
   AND description NOT LIKE '%For larger groups, the spacious lounge%';

UPDATE property_amenities
   SET label = 'Books & Board Games'
 WHERE id = '6a2c97c6-920c-41c2-a594-f1937875ff48';

UPDATE property_amenities
   SET label = 'Living room with plush sofas'
 WHERE id = '89c2add0-02df-4145-aeab-1a0549bea6cc';

-- Make room at 13 for the lounge line.
UPDATE property_amenities
   SET display_order = display_order + 1
 WHERE category = 'Living & Dining'
   AND display_order >= 13
   AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19')
   AND NOT EXISTS (
     SELECT 1 FROM property_amenities
      WHERE label = 'Lounge with convertible sofas'
        AND property_id = (SELECT id FROM properties WHERE slug = 'villa-19')
   );

INSERT INTO property_amenities (property_id, category, label, icon, is_available, is_featured, display_order)
SELECT property_id, category, 'Lounge with convertible sofas', icon, is_available, is_featured, 13
  FROM property_amenities
 WHERE id = '89c2add0-02df-4145-aeab-1a0549bea6cc'
   AND NOT EXISTS (
     SELECT 1 FROM property_amenities
      WHERE label = 'Lounge with convertible sofas'
        AND property_id = (SELECT id FROM properties WHERE slug = 'villa-19')
   );
