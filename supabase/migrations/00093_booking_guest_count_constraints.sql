-- 00093: table-level floor on guest counts.
--
-- 00092 added these checks inside create_booking_atomic, which every website
-- booking goes through. This adds the same floor at the table, so a path that
-- does not use that function (Ooruda Villa writing an offline or OTA booking
-- with the service-role key) cannot store a booking for zero or minus five
-- people either.
--
-- Deliberately only a floor, not a ceiling. The ceiling is max_occupancy on the
-- properties row, and a CHECK constraint cannot reference another table, so the
-- upper bound stays in calculateBookingPrice where it already is.
--
-- Added NOT VALID: the constraint applies to every INSERT and UPDATE from now
-- on, but existing rows are not scanned. This database has been serving as both
-- development and production (see scripts/db-push.sh), so it may hold test rows
-- with nonsense counts, and a migration that fails on legacy junk would block
-- the whole push. Once the test data is cleaned up, make it retroactive with:
--
--   ALTER TABLE bookings VALIDATE CONSTRAINT bookings_guest_counts_sane;
--
-- To find what would fail that validation first:
--
--   SELECT id, reference_number, num_adults, num_children, num_infants
--     FROM bookings
--    WHERE num_adults < 1 OR num_children < 0 OR num_infants < 0;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_guest_counts_sane;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_guest_counts_sane
  CHECK (
    num_adults >= 1
    AND COALESCE(num_children, 0) >= 0
    AND COALESCE(num_infants, 0) >= 0
  )
  NOT VALID;

COMMENT ON CONSTRAINT bookings_guest_counts_sane ON bookings IS
  'A booking needs at least one adult and no negative counts. NOT VALID: new '
  'rows only, because this database held pre-launch test data. VALIDATE once '
  'that is cleaned up.';
