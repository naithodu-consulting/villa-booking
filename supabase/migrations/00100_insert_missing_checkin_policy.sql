-- 00099 tried to update the "Check-In & Check-Out" policy to 3:00 PM, but the
-- row has never existed on the remote: seed.sql is the only thing that inserts
-- it and the remote never runs seed.sql, so that UPDATE matched zero rows and
-- still reported success. The result is that the policies block renders on the
-- remote without any check-in policy at all.
--
-- Inserted here rather than by amending 00099, which is already applied.
-- Values mirror seed.sql exactly so a local reset and the remote agree.
INSERT INTO property_policies (property_id, key, title, body, category, display_order)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'checkin_time',
  'Check-In & Check-Out',
  'Check-in: 3:00 PM · Check-out: 10:00 AM. Early check-in and late check-out are subject to availability and must be requested at least 24 hours in advance. Additional charges may apply.',
  'checkin',
  10
)
ON CONFLICT (property_id, key) DO UPDATE
  SET title = EXCLUDED.title,
      body = EXCLUDED.body,
      category = EXCLUDED.category,
      display_order = EXCLUDED.display_order;
