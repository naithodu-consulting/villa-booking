-- 00096: finish the job 00093 started, wherever it is safe to.
--
-- 00093 added bookings_guest_counts_sane as NOT VALID. That was right at the
-- time: it had to run against the development database, which has been serving
-- as production too and holds 37 test bookings of unknown quality. A migration
-- that fails on legacy junk blocks the whole push, so new rows were constrained
-- and old ones left alone.
--
-- NOT VALID is not a good resting state. The constraint is enforced on INSERT
-- and UPDATE either way, but the planner cannot rely on it and `\d bookings`
-- reports it as unverified, which invites someone to wonder later whether the
-- data is actually sound. On the new production database the answer is trivial:
-- it is empty, so validation is instant and there is nothing to find.
--
-- Conditional rather than unconditional, because this same migration also runs
-- against the development database, where it must not fail:
--
--   - production, and any fresh build: no rows, nothing violates, validated.
--   - development: validated if its test bookings are clean, skipped with a
--     notice naming the count if they are not.
--
-- A skip is not a silent failure. The constraint still governs every write; the
-- only thing deferred is the retroactive scan, and the NOTICE says exactly how
-- many rows would have to be cleaned up first. To finish it by hand later:
--
--   SELECT id, reference_number, num_adults, num_children, num_infants
--     FROM bookings
--    WHERE num_adults < 1 OR COALESCE(num_children,0) < 0 OR COALESCE(num_infants,0) < 0;
--   -- fix or delete those, then:
--   ALTER TABLE bookings VALIDATE CONSTRAINT bookings_guest_counts_sane;

DO $$
DECLARE
  v_bad   INT;
  v_valid BOOLEAN;
BEGIN
  SELECT convalidated INTO v_valid
    FROM pg_constraint
   WHERE conname = 'bookings_guest_counts_sane'
     AND conrelid = 'public.bookings'::regclass;

  IF v_valid IS NULL THEN
    RAISE NOTICE 'bookings_guest_counts_sane not found; nothing to validate.';
    RETURN;
  END IF;

  IF v_valid THEN
    RAISE NOTICE 'bookings_guest_counts_sane already validated.';
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_bad
    FROM bookings
   WHERE num_adults < 1
      OR COALESCE(num_children, 0) < 0
      OR COALESCE(num_infants, 0) < 0;

  IF v_bad = 0 THEN
    ALTER TABLE bookings VALIDATE CONSTRAINT bookings_guest_counts_sane;
    RAISE NOTICE 'bookings_guest_counts_sane validated (no existing row violates it).';
  ELSE
    RAISE NOTICE
      'bookings_guest_counts_sane left NOT VALID: % existing row(s) violate it. '
      'New rows are still constrained. Clean those rows, then run '
      'ALTER TABLE bookings VALIDATE CONSTRAINT bookings_guest_counts_sane;', v_bad;
  END IF;
END $$;
