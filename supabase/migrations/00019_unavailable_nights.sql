-- 00019: per-night availability for the guest calendar.
--
-- The calendar needs "which nights in this window are taken", not the yes/no
-- that check_availability() answers for one stay. Rather than copy its overlap
-- predicate (which is how the booking engine and the old availability route
-- drifted apart before 00010), this asks check_availability() about each
-- single night. A night D is unavailable when the one-night stay [D, D+1)
-- would be refused, so bookings, live checkout holds and blocked dates are all
-- covered by exactly the same rule create_booking_atomic enforces.
--
-- p_to is exclusive, like check_out. Callers should keep the window small
-- (the API caps it at 186 nights).
CREATE OR REPLACE FUNCTION get_unavailable_nights(
    p_property_id UUID,
    p_from        DATE,
    p_to          DATE
) RETURNS SETOF DATE AS $$
    SELECT d::date
      FROM generate_series(p_from, p_to - 1, INTERVAL '1 day') AS d
     WHERE check_availability(p_property_id, d::date, d::date + 1) <> 'AVAILABLE'
     ORDER BY 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION get_unavailable_nights(UUID, DATE, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_unavailable_nights(UUID, DATE, DATE) TO service_role;
