-- 00091: pin search_path on the two SECURITY DEFINER functions that lack it.
--
-- check_availability() and expire_stale_booking_holds() were defined in 00010
-- without SET search_path. Every other definer in this schema sets it (00019,
-- 00023, 00024, 00038, 00062), and 00005 exists specifically to fix this class
-- of defect on a trigger, so these two are an oversight rather than a choice.
-- `supabase db lint` reports them as function_search_path_mutable.
--
-- A SECURITY DEFINER function runs as its owner. Without a pinned search_path it
-- resolves unqualified names through the caller's, so a role able to create an
-- object in an earlier schema can have the definer execute that object as the
-- owner. Execute is already revoked from PUBLIC, anon and authenticated here,
-- which is why this was never urgent, but defence in depth is the whole point
-- of a definer and an unpinned path removes it.
--
-- Bodies are byte-for-byte what 00010 defined. Only the function attributes
-- change, so this migration cannot alter availability or sweeper behaviour.
-- The grants are re-stated because CREATE OR REPLACE preserves privileges but
-- re-stating them makes the end state readable without cross-referencing 00010.

CREATE OR REPLACE FUNCTION check_availability(
    p_property_id UUID,
    p_check_in    DATE,
    p_check_out   DATE
) RETURNS TEXT AS $$
DECLARE
    v_count INT;
BEGIN
    -- Overlapping bookings that are still holding the dates.
    -- A pending row only counts while its hold is live. COALESCE guards rows that
    -- predate this column or were written by an older code path.
    SELECT COUNT(*) INTO v_count
      FROM bookings
     WHERE property_id = p_property_id
       AND (p_check_in < check_out AND p_check_out > check_in)
       AND (
             status = 'confirmed'
             OR (
                  status = 'pending'
                  AND COALESCE(hold_expires_at, created_at + INTERVAL '15 minutes') > NOW()
                )
           );

    IF v_count > 0 THEN
        RETURN 'DATE_UNAVAILABLE';
    END IF;

    SELECT COUNT(*) INTO v_count
      FROM blocked_dates
     WHERE property_id = p_property_id
       AND (p_check_in < end_date AND p_check_out > start_date);

    IF v_count > 0 THEN
        RETURN 'DATE_BLOCKED';
    END IF;

    RETURN 'AVAILABLE';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION expire_stale_booking_holds()
RETURNS INT AS $$
DECLARE
    v_expired INT;
BEGIN
    WITH swept AS (
        UPDATE bookings
           SET status     = 'expired',
               updated_at = NOW()
         WHERE status = 'pending'
           AND COALESCE(hold_expires_at, created_at + INTERVAL '15 minutes') <= NOW()
        RETURNING id
    )
    SELECT COUNT(*) INTO v_expired FROM swept;

    -- Mirror onto the payment rows that never reached capture
    UPDATE payments p
       SET status = 'expired'
      FROM bookings b
     WHERE p.booking_id = b.id
       AND b.status = 'expired'
       AND p.status = 'created';

    RETURN v_expired;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION expire_stale_booking_holds() IS
    'Housekeeping: flips lapsed pending holds to expired. Availability is already correct without it.';

REVOKE ALL ON FUNCTION check_availability(UUID, DATE, DATE) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION expire_stale_booking_holds() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION check_availability(UUID, DATE, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION expire_stale_booking_holds() TO service_role;
