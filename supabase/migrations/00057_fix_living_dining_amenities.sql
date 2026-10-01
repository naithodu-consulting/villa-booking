-- 00057: repair the Living & Dining amenities that 00055 failed to change.
--
-- 00055 matched these rows by hardcoded UUID, but the amenity rows were created
-- by 00030 with gen_random_uuid(), so the ids differ per environment. On the
-- local database the ids happened to match and the migration looked correct; on
-- staging every UPDATE matched zero rows and still reported success. The one
-- statement in 00055 that did not use an id, the "make room at 13" reorder, ran
-- anyway, so staging was left renamed-not-at-all and with a hole at 13.
--
-- Match on label instead: labels are the thing the operator actually named, and
-- they are unique per property here. Display order is then set explicitly rather
-- than shifted, so this is safe to re-run and converges from either state.

-- Rename, tolerating either the old or the already-correct label.
UPDATE property_amenities
   SET label = 'Living room with plush sofas'
 WHERE label = '2 convertible sofas'
   AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

UPDATE property_amenities
   SET label = 'Books & Board Games'
 WHERE label = 'Indoor games'
   AND property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');

-- The lounge line is a separate amenity from the living room one.
INSERT INTO property_amenities (property_id, category, label, icon, is_available, is_featured, display_order)
SELECT p.id, 'Living & Dining', 'Lounge with convertible sofas', 'BedDouble', TRUE, FALSE, 13
  FROM properties p
 WHERE p.slug = 'villa-19'
   AND NOT EXISTS (
     SELECT 1 FROM property_amenities a
      WHERE a.property_id = p.id
        AND a.label = 'Lounge with convertible sofas'
   );

-- Set the order outright so both environments land identically, whatever
-- 00055 did or did not do to them.
UPDATE property_amenities a
   SET display_order = v.ord
  FROM (VALUES
         ('Spacious living room',          10),
         ('8-seater dining area',          11),
         ('Living room with plush sofas',  12),
         ('Lounge with convertible sofas', 13),
         ('50" Smart TV with OTT apps',    14),
         ('Books & Board Games',           15)
       ) AS v(label, ord)
 WHERE a.label = v.label
   AND a.category = 'Living & Dining'
   AND a.property_id IN (SELECT id FROM properties WHERE slug = 'villa-19');
