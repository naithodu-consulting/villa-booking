-- Migration: 00002_concurrency_functions.sql
-- Description: Atomic booking creation with advisory lock, collision-safe reference numbers, and integer paise amounts

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
    v_overlap_count INT;
    v_blocked_count INT;
    v_ref_num VARCHAR(20);
    v_booking_id UUID;
    v_attempts INT := 0;
BEGIN
    -- 1. Acquire advisory lock on property to prevent concurrent double-booking race condition
    PERFORM pg_advisory_xact_lock(hashtext(p_property_id::text));

    -- 2. Check for overlapping existing active bookings
    SELECT COUNT(*) INTO v_overlap_count
    FROM bookings
    WHERE property_id = p_property_id
      AND status IN ('pending', 'confirmed')
      AND (p_check_in < check_out AND p_check_out > check_in);

    IF v_overlap_count > 0 THEN
        RAISE EXCEPTION 'DATE_UNAVAILABLE: Selected dates are already booked or pending payment.';
    END IF;

    -- 3. Check for overlapping blocked dates
    SELECT COUNT(*) INTO v_blocked_count
    FROM blocked_dates
    WHERE property_id = p_property_id
      AND (p_check_in < end_date AND p_check_out > start_date);

    IF v_blocked_count > 0 THEN
        RAISE EXCEPTION 'DATE_BLOCKED: Selected dates are unavailable due to property hold or maintenance.';
    END IF;

    -- 4. Generate unique reference number with retry on collision (L-07 fix)
    --    Format: MNG-XXXXXX (6 uppercase hex chars from MD5 of random + clock timestamp)
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

    -- 5. Insert Booking
    INSERT INTO bookings (
        reference_number, property_id, guest_name, guest_email, guest_phone,
        num_adults, num_children, num_infants, check_in, check_out, num_nights,
        base_amount, extra_guest_amount, tax_amount, total_amount, special_requests,
        status, payment_status
    ) VALUES (
        v_ref_num, p_property_id, p_guest_name, p_guest_email, p_guest_phone,
        p_num_adults, p_num_children, p_num_infants, p_check_in, p_check_out, p_num_nights,
        p_base_amount, p_extra_guest_amount, p_tax_amount, p_total_amount, p_special_requests,
        'pending', 'unpaid'
    ) RETURNING id INTO v_booking_id;

    RETURN QUERY SELECT v_booking_id, v_ref_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
