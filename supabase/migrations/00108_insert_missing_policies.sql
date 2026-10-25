-- 00108: insert the cancellation policy row, which has never existed on a
-- migrations-only database.
--
-- Every migration that has ever touched this row is an UPDATE (00009, 00015,
-- 00037, 00056 and 00106); the only thing that INSERTs it is seed.sql, which
-- the remotes never run. So each of those updates matched zero rows and
-- reported success. 00106 is recorded as applied in production's ledger and
-- changed nothing there: the row it targeted does not exist, which is why
-- production holds no policy row mentioning a refund at all. Dev has the row
-- only because dev was seeded.
--
-- This is the second time: 00100 fixed exactly this for checkin_time after
-- 00099 updated a row that was not there. The pattern to break is writing a
-- content migration as a bare UPDATE. Prefer INSERT ... ON CONFLICT DO UPDATE,
-- which is correct whether or not the row exists, and verify a content
-- migration by reading the target rather than by the push succeeding.
--
-- Only the cancellation row. seed.sql also carries kitchen_policy and
-- housekeeping_policy, which are absent from production for the same reason,
-- and they stay absent: that copy is fictional and outdated, written by the
-- Phase 1 content pipeline (921e667) and never reviewed. Do not add them here
-- or in a later migration.
--
-- The body matches src/lib/cancellation.ts and 00106 exactly, so a database
-- that gets 00106 then 00108 ends in the same state as one that gets only
-- 00108.

INSERT INTO property_policies (property_id, key, title, body, category, display_order)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'cancellation',
  'Cancellation Policy',
  'More than 14 days before check-in: 100% refund. 7 to 14 days before check-in: 50% refund. Under 7 days before check-in: no refund. A security deposit, where applicable, will be collected at check-in. Subject to property inspection following check-out, the refundable deposit will be processed within 5 working days and returned to the original payment method.',
  'cancellation',
  40
)
ON CONFLICT (property_id, key) DO UPDATE
  SET title = EXCLUDED.title,
      body = EXCLUDED.body,
      category = EXCLUDED.category,
      display_order = EXCLUDED.display_order;
