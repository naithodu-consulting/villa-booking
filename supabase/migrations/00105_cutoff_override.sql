-- 00105: let an Ooruda Villa admin record a booking past the booking cutoff.
--
-- The cutoff (00097) is a limit on PUBLIC sales: "take no new guest bookings
-- with a check-in after date X". It lives inside check_availability(), ahead of
-- the occupancy test, so every night past it reports DATE_BLOCKED. That is
-- right for the guest site and for channel managers, and wrong for the villa's
-- own operator: a stay agreed on the phone for next season has to be
-- recordable, or it never reaches the books.
--
-- Three pieces here:
--
--   1. check_occupancy() — the overlap test alone (bookings, live holds,
--      blocked_dates), with no opinion on the cutoff.
--   2. check_availability() now = cutoff test + check_occupancy(). Same
--      behaviour as 00097 for every existing caller, byte-for-byte on the
--      overlap predicate, which now exists in exactly one place. The guest
--      site, get_unavailable_nights() and the channel export are unchanged.
--   3. create_booking_atomic() gains p_ignore_cutoff (default false). When
--      true it consults check_occupancy() instead, so the override skips the
--      cutoff and NOTHING else: a night already sold or blocked is still
--      refused, the past-date guard still applies, and the advisory lock still
--      serialises everything. Only Ooruda's service-role path can pass it, and
--      Ooruda restricts it to villa_admin behind an explicit confirmation.
--
-- Grants: create_booking_atomic had no explicit grants, so it carried
-- Postgres's default EXECUTE to PUBLIC on a SECURITY DEFINER function that
-- writes bookings. Every caller is service-role (the create-order route and
-- the pgTAP/vitest harnesses), so it is revoked here the way 00097 did for
-- check_availability. Noted rather than slipped in.
--
-- The old 17-parameter signature is dropped rather than left beside the new
-- one: two overloads differing only by a defaulted parameter make every
-- positional call ambiguous ("could not choose best candidate function").

-- ── 1. Occupancy only ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_occupancy(
    p_property_id UUID,
    p_check_in    DATE,
    p_check_out   DATE
) RETURNS TEXT AS $$
DECLARE
    v_count INT;
BEGIN
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

COMMENT ON FUNCTION check_occupancy(UUID, DATE, DATE) IS
  'Is the stay free of bookings, live holds and blocked dates? Ignores properties.booking_cutoff_date by design: only the operator override in create_booking_atomic should call this. Guest-facing callers want check_availability().';

REVOKE ALL ON FUNCTION check_occupancy(UUID, DATE, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION check_occupancy(UUID, DATE, DATE) TO service_role;

-- ── 2. check_availability = cutoff + occupancy ────────────────────────────
-- Replaces the 00097 body. The overlap test is not re-stated here; drifting
-- copies of it are what 00010 and 00019 were written to stop.
CREATE OR REPLACE FUNCTION check_availability(
    p_property_id UUID,
    p_check_in    DATE,
    p_check_out   DATE
) RETURNS TEXT AS $$
DECLARE
    v_cutoff DATE;
BEGIN
    SELECT booking_cutoff_date INTO v_cutoff
      FROM properties
     WHERE id = p_property_id;

    IF v_cutoff IS NOT NULL AND p_check_in > v_cutoff THEN
        RETURN 'DATE_BLOCKED';
    END IF;

    RETURN check_occupancy(p_property_id, p_check_in, p_check_out);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION check_availability(UUID, DATE, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION check_availability(UUID, DATE, DATE) TO service_role;

-- ── 3. create_booking_atomic with the override ────────────────────────────
DO $$
DECLARE
  v_old_sig TEXT;
BEGIN
  SELECT p.oid::regprocedure::text INTO v_old_sig
    FROM pg_proc p
   WHERE p.proname = 'create_booking_atomic'
     AND p.pronargs = 17  -- 00062/00092 signature, before p_ignore_cutoff
   LIMIT 1;
  IF v_old_sig IS NOT NULL THEN
    EXECUTE 'DROP FUNCTION ' || v_old_sig;
  END IF;
END;
$$;

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
    p_discount_amount    BIGINT  DEFAULT 0,  -- paise; 0 when no code
    -- Operator override (Ooruda Villa admin only): book past the
    -- property's booking_cutoff_date. Occupancy is still enforced.
    p_ignore_cutoff      BOOLEAN DEFAULT false
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
    -- check_occupancy is check_availability without the cutoff test, so an
    -- override still cannot double-sell a night.
    v_availability := CASE
        WHEN p_ignore_cutoff THEN check_occupancy(p_property_id, p_check_in, p_check_out)
        ELSE check_availability(p_property_id, p_check_in, p_check_out)
    END;
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

COMMENT ON FUNCTION create_booking_atomic(UUID, VARCHAR, VARCHAR, VARCHAR, INT, INT, INT, DATE, DATE, INT, BIGINT, BIGINT, BIGINT, BIGINT, TEXT, TEXT, BIGINT, BOOLEAN) IS
  'Creates a pending booking under the property lock. p_ignore_cutoff skips properties.booking_cutoff_date (operator override from Ooruda Villa) and nothing else.';

REVOKE ALL ON FUNCTION create_booking_atomic(UUID, VARCHAR, VARCHAR, VARCHAR, INT, INT, INT, DATE, DATE, INT, BIGINT, BIGINT, BIGINT, BIGINT, TEXT, TEXT, BIGINT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION create_booking_atomic(UUID, VARCHAR, VARCHAR, VARCHAR, INT, INT, INT, DATE, DATE, INT, BIGINT, BIGINT, BIGINT, BIGINT, TEXT, TEXT, BIGINT, BOOLEAN) TO service_role;
