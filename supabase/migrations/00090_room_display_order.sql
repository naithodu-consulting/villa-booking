-- 00090: the four bedrooms all sorted at display_order 1, so the Rooms page
-- showed them in whatever order Postgres happened to return.
--
-- 00028 created Rooms 1 to 4 without naming display_order, so each took the
-- column default of 1 (00001). Its ON CONFLICT clause does not set the column
-- either, so re-running it never corrected them. supabase/seed.sql does give
-- 1, 2, 3, 4, but with ON CONFLICT (id) DO NOTHING, so it leaves the existing
-- rows exactly as they are. Only the Private Lounge, inserted separately with
-- display_order 5, was ever ordered on purpose.
--
-- `ORDER BY display_order` on a four-way tie has no defined result: Postgres
-- may return those rows in any order, and the order can change between
-- queries, after a vacuum, or after any write to the table. On the Rooms page
-- that showed as Room 4 before Room 3, and a guest comparing rooms had no
-- reason to expect the cards to be anywhere in particular.
--
-- The matching query in src/lib/data.ts now sorts by display_order and then by
-- name, so a tie introduced later degrades to alphabetical rather than to
-- chance.

-- Matched on id, not slug: rooms.slug carries no unique constraint, so an
-- UPDATE ... FROM joined on it would pick an arbitrary row if a slug were ever
-- duplicated. These ids are seeded explicitly and are the same in every
-- environment, which is how every other migration here addresses these rows.
UPDATE rooms AS r
   SET display_order = v.ord
  FROM (VALUES
         ('a1b2c3d4-0000-0000-0000-000000000011'::uuid, 1),  -- Room 1
         ('a1b2c3d4-0000-0000-0000-000000000012'::uuid, 2),  -- Room 2
         ('a1b2c3d4-0000-0000-0000-000000000013'::uuid, 3),  -- Room 3
         ('a1b2c3d4-0000-0000-0000-000000000014'::uuid, 4),  -- Room 4
         ('a1b2c3d4-0000-0000-0000-000000000015'::uuid, 5)   -- Private Lounge
       ) AS v(id, ord)
 WHERE r.id = v.id
   AND r.display_order IS DISTINCT FROM v.ord;
