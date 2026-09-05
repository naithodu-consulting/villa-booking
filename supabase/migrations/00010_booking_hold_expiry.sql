-- Migration: 00010_booking_hold_expiry.sql
-- Description: Time-boxed holds for unpaid bookings.
--
-- Problem this fixes:
--   create_booking_atomic writes a 'pending' booking BEFORE the guest pays, and both
--   the availability API and create_booking_atomic treat every 'pending' row as
--   blocking. Nothing ever cleaned those up, so an abandoned checkout blocked its
--   dates permanently.
--
-- Approach:
--   A pending booking now carries hold_expires_at. It blocks dates only while that
--   hold is live, so expiry is correct at read time and does not depend on a sweeper
--   having run. expire_stale_booking_holds() is housekeeping only — it flips lapsed
--   rows to 'expired' so admin views and reporting stay honest.

-- ── 1. Hold column ───────────────────────────────────────────────────────
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN bookings.hold_expires_at IS
    'When an unpaid pending hold lapses. NULL once confirmed — confirmed bookings never expire.';

-- Backfill existing pending rows. Their created_at is already well in the past, so
-- they stop blocking immediately, which is the intended repair.
UPDATE bookings
   SET hold_expires_at = created_at + INTERVAL '15 minutes'
 WHERE status = 'pending'
   AND hold_expires_at IS NULL;

-- Partial index matching the availability predicate.
CREATE INDEX IF NOT EXISTS idx_bookings_active_holds
    ON bookings (property_id, check_in, check_out)
 WHERE status IN ('pending', 'confirmed');

-- ── 2. Single source of truth for availability ───────────────────────────
-- Previously duplicated between create_booking_atomic and /api/availability,
-- which is exactly how the two drift apart.
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ── 3. create_booking_atomic — delegate to check_availability, set the hold ──
CREATE OR REPLACE FUNCTION create_booking_atomic(
    p_property_id UUID,
    p_guest_name VARCHAR(255),
    p_guest_email VARCHAR(255),
    p_guest_phone VARCHAR(50),
    p_num_adults INT,
    p_num_children INT,
    p_num_infants INT,
    p_check_in DATE,
    p_check_out DATE,
    p_num_nights INT,
    p_base_amount BIGINT,        -- paise
    p_extra_guest_amount BIGINT, -- paise
    p_tax_amount BIGINT,         -- paise
    p_total_amount BIGINT,       -- paise
    p_special_requests TEXT
) RETURNS TABLE (
    booking_id UUID,
    reference_number VARCHAR(20)
) AS $$
DECLARE
    v_availability TEXT;
    v_ref_num VARCHAR(20);
    v_booking_id UUID;
    v_attempts INT := 0;
BEGIN
    -- 1. Advisory lock on the property — serialises concurrent booking attempts
    PERFORM pg_advisory_xact_lock(hashtext(p_property_id::text));

    -- 2. Availability, evaluated inside the lock
    v_availability := check_availability(p_property_id, p_check_in, p_check_out);

    IF v_availability = 'DATE_UNAVAILABLE' THEN
        RAISE EXCEPTION 'DATE_UNAVAILABLE: Selected dates are already booked or on hold.';
    ELSIF v_availability = 'DATE_BLOCKED' THEN
        RAISE EXCEPTION 'DATE_BLOCKED: Selected dates are unavailable due to property hold or maintenance.';
    END IF;

    -- 3. Unique reference number, retrying on collision
    LOOP
        v_ref_num := 'MNG-' || UPPER(SUBSTRING(MD5(RANDOM()::text || CLOCK_TIMESTAMP()::text) FROM 1 FOR 6));

        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM bookings WHERE bookings.reference_number = v_ref_num
        );

        v_attempts := v_attempts + 1;
        IF v_attempts >= 5 THEN
            RAISE EXCEPTION 'REF_COLLISION: Failed to generate a unique reference number after % attempts.', v_attempts;
        END IF;
    END LOOP;

    -- 4. Insert with a 15-minute hold
    INSERT INTO bookings (
        reference_number, property_id, guest_name, guest_email, guest_phone,
        num_adults, num_children, num_infants, check_in, check_out, num_nights,
        base_amount, extra_guest_amount, tax_amount, total_amount, special_requests,
        status, payment_status, hold_expires_at
    ) VALUES (
        v_ref_num, p_property_id, p_guest_name, p_guest_email, p_guest_phone,
        p_num_adults, p_num_children, p_num_infants, p_check_in, p_check_out, p_num_nights,
        p_base_amount, p_extra_guest_amount, p_tax_amount, p_total_amount, p_special_requests,
        'pending', 'unpaid', NOW() + INTERVAL '15 minutes'
    ) RETURNING id INTO v_booking_id;

    RETURN QUERY SELECT v_booking_id, v_ref_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 4. Housekeeping sweeper ──────────────────────────────────────────────
-- Not required for correctness (the predicate above already ignores lapsed holds).
-- It keeps the table tidy so 'pending' means "genuinely awaiting payment".
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION expire_stale_booking_holds() IS
    'Housekeeping: flips lapsed pending holds to expired. Availability is already correct without it.';

REVOKE ALL ON FUNCTION check_availability(UUID, DATE, DATE) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION expire_stale_booking_holds() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION check_availability(UUID, DATE, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION expire_stale_booking_holds() TO service_role;
