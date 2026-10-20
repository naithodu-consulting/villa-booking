-- 00097: booking cutoff date.
--
-- When set on a property, no new bookings are accepted with a check-in after
-- this date. The calendar API marks every night beyond it as unavailable, and
-- check_availability() / create_booking_atomic refuse the stay.
--
-- NULL = no cutoff (open-ended). Ooruda Villa writes this column when the
-- admin changes the "Booking cutoff date" setting.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS booking_cutoff_date date;

COMMENT ON COLUMN properties.booking_cutoff_date IS
  'Last allowed check-in date for new bookings. NULL means no limit. Written by Ooruda Villa.';

-- ── Update check_availability to respect the cutoff ──
CREATE OR REPLACE FUNCTION check_availability(
    p_property_id UUID,
    p_check_in    DATE,
    p_check_out   DATE
) RETURNS TEXT AS $$
DECLARE
    v_count INT;
    v_cutoff DATE;
BEGIN
    -- Cutoff check: refuse if check-in is after the property's cutoff date.
    SELECT booking_cutoff_date INTO v_cutoff
      FROM properties
     WHERE id = p_property_id;

    IF v_cutoff IS NOT NULL AND p_check_in > v_cutoff THEN
        RETURN 'DATE_BLOCKED';
    END IF;

    -- Overlapping bookings that are still holding the dates.
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

-- get_unavailable_nights delegates to check_availability, so it automatically
-- picks up the cutoff: any night beyond the cutoff date returns DATE_BLOCKED.
-- No change needed there.

-- Grants stay as they were (service_role only).
REVOKE ALL ON FUNCTION check_availability(UUID, DATE, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION check_availability(UUID, DATE, DATE) TO service_role;
