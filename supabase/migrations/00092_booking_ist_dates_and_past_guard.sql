-- 00092: judge discount validity on the property's calendar date, and refuse a
-- check-in that has already passed.
--
-- Two defects, both in create_booking_atomic, both about dates.
--
-- 1. CURRENT_DATE (00062:123) is the *server's* date. Supabase runs UTC, so
--    between 00:00 and 05:30 IST it is still yesterday in Mangalore. Three
--    layers decide whether a promo code is inside valid_from..valid_to and all
--    three used a different clock: create-order used todayISO() (IST, right),
--    /api/discount/validate used toISOString() (UTC), and this function used
--    CURRENT_DATE (UTC). So a code on its first valid day was shown as expired
--    by the browser-facing check, and a code on its last valid day was accepted
--    there and then rejected in here, after the guest pressed Pay. Booking dates
--    are calendar dates at the property, so IST is the only correct clock, and
--    create-order's own comment already said so.
--
-- 2. Nothing rejected a check-in in the past. calculateBookingPrice checks the
--    range order, the 10-night cap and occupancy; check_availability has no
--    opinion on dates that have gone; and the only table constraint is
--    check_out > check_in. A crafted POST could therefore create and pay for a
--    stay in 2019. The guard belongs here as well as in the route, because this
--    function is the one place every booking path goes through.
--
-- Why not a CHECK constraint for the past-date rule: CURRENT_DATE is STABLE,
-- not IMMUTABLE, and Postgres refuses non-immutable functions in CHECK
-- constraints. A row that was legal when written must stay legal, which is
-- exactly why "not in the past" cannot be a constraint. It has to be enforced
-- at write time, here.
--
-- Everything else is byte-for-byte 00062.

CREATE OR REPLACE FUNCTION create_booking_atomic(
    p_property_id        UUID,
    p_guest_name         VARCHAR(255),
    p_guest_email        VARCHAR(255),
    p_guest_phone        VARCHAR(50),
    p_num_adults         INT,
    p_num_children       INT,
    p_num_infants        INT,
    p_check_in           DATE,
    p_check_out          DATE,
    p_num_nights         INT,
    p_base_amount        BIGINT,        -- paise
    p_extra_guest_amount BIGINT,        -- paise
    p_tax_amount         BIGINT,        -- paise
    p_total_amount       BIGINT,        -- paise (pre-discount total, for accounting)
    p_special_requests   TEXT,
    p_discount_code      TEXT    DEFAULT NULL,
    p_discount_amount    BIGINT  DEFAULT 0   -- paise; 0 when no code
) RETURNS TABLE (
    booking_id       UUID,
    reference_number VARCHAR(20)
) AS $$
DECLARE
    v_availability TEXT;
    v_ref_num      VARCHAR(20);
    v_booking_id   UUID;
    v_attempts     INT := 0;
    v_dc           discount_codes%ROWTYPE;
    v_use_count    INT;
    -- The calendar date at the property. Used for both the past-check-in guard
    -- and the discount window, so the two cannot disagree with each other.
    v_today        DATE := (now() AT TIME ZONE 'Asia/Kolkata')::date;
BEGIN
    -- 1. Advisory lock on the property — serialises all concurrent attempts,
    --    including discount-use races (codes are per-property).
    PERFORM pg_advisory_xact_lock(hashtext(p_property_id::text));

    -- 2. Dates must not have passed at the property. Checked before availability
    --    so a stale or crafted request gets the accurate reason.
    IF p_check_in < v_today THEN
        RAISE EXCEPTION 'DATE_IN_PAST: Check-in cannot be a date that has already passed.';
    END IF;

    -- 3. Guest counts must be sensible. The pricing engine floors extra guests
    --    at zero, so a negative count silently priced at the base rate and
    --    stored a booking for a negative number of people.
    IF p_num_adults < 1 THEN
        RAISE EXCEPTION 'GUESTS_INVALID: A booking needs at least one adult.';
    END IF;
    IF p_num_children < 0 OR p_num_infants < 0 THEN
        RAISE EXCEPTION 'GUESTS_INVALID: Guest counts cannot be negative.';
    END IF;

    -- 4. Availability check
    v_availability := check_availability(p_property_id, p_check_in, p_check_out);
    IF v_availability = 'DATE_UNAVAILABLE' THEN
        RAISE EXCEPTION 'DATE_UNAVAILABLE: Selected dates are already booked or on hold.';
    ELSIF v_availability = 'DATE_BLOCKED' THEN
        RAISE EXCEPTION 'DATE_BLOCKED: Selected dates are unavailable due to property hold or maintenance.';
    END IF;

    -- 5. Discount code validation (inside the lock — no race on max_uses)
    IF p_discount_code IS NOT NULL THEN
        SELECT * INTO v_dc
          FROM discount_codes
         WHERE code = p_discount_code
           AND property_id = p_property_id
           AND is_active = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'DISCOUNT_INVALID: Code is not valid for this property.';
        END IF;

        -- v_today, not CURRENT_DATE: see the header.
        IF v_today NOT BETWEEN v_dc.valid_from AND v_dc.valid_to THEN
            RAISE EXCEPTION 'DISCOUNT_EXPIRED: This discount code is no longer valid.';
        END IF;

        IF p_num_nights < v_dc.min_nights THEN
            RAISE EXCEPTION 'DISCOUNT_MIN_NIGHTS: This code requires a minimum stay of % nights.', v_dc.min_nights;
        END IF;

        IF (p_base_amount + p_extra_guest_amount) < (v_dc.min_booking_value * 100)::BIGINT THEN
            RAISE EXCEPTION 'DISCOUNT_MIN_VALUE: This code requires a minimum booking value of ₹%.', v_dc.min_booking_value;
        END IF;

        IF EXISTS (
            SELECT 1
              FROM jsonb_array_elements(v_dc.blackouts) AS b
             WHERE p_check_in  < (b->>'end')::date
               AND p_check_out > (b->>'start')::date
        ) THEN
            RAISE EXCEPTION 'DISCOUNT_BLACKOUT: This code is not valid for the selected check-in dates.';
        END IF;

        IF v_dc.max_uses IS NOT NULL THEN
            SELECT COUNT(*) INTO v_use_count
              FROM bookings
             WHERE discount_code = p_discount_code
               AND property_id   = p_property_id
               AND status IN ('confirmed', 'completed');
            IF v_use_count >= v_dc.max_uses THEN
                RAISE EXCEPTION 'DISCOUNT_MAX_USES: This code has reached its maximum number of uses.';
            END IF;
        END IF;

        SELECT COUNT(*) INTO v_use_count
          FROM bookings
         WHERE discount_code = p_discount_code
           AND property_id   = p_property_id
           AND guest_phone   = p_guest_phone
           AND status IN ('confirmed', 'completed');
        IF v_use_count >= v_dc.max_uses_per_guest THEN
            RAISE EXCEPTION 'DISCOUNT_PER_GUEST: You have already used this code the maximum number of times.';
        END IF;
    END IF;

    -- 6. Unique reference number
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

    -- 7. Insert booking
    INSERT INTO bookings (
        reference_number, property_id,
        guest_name, guest_email, guest_phone,
        num_adults, num_children, num_infants,
        check_in, check_out, num_nights,
        base_amount, extra_guest_amount, tax_amount, total_amount,
        discount_code, discount_amount,
        special_requests, status, payment_status, hold_expires_at
    ) VALUES (
        v_ref_num, p_property_id,
        p_guest_name, p_guest_email, p_guest_phone,
        p_num_adults, p_num_children, p_num_infants,
        p_check_in, p_check_out, p_num_nights,
        p_base_amount, p_extra_guest_amount, p_tax_amount, p_total_amount,
        p_discount_code, p_discount_amount,
        p_special_requests, 'pending', 'unpaid', NOW() + INTERVAL '15 minutes'
    ) RETURNING id INTO v_booking_id;

    RETURN QUERY SELECT v_booking_id, v_ref_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
