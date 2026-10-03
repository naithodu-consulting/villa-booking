-- M8b discount codes — villa-booking half
--
-- discount_codes  local mirror of active codes pushed from Ooruda; validated
--                 atomically inside create_booking_atomic.
-- bookings        gains discount_code and discount_amount columns.
-- create_booking_atomic  updated to validate and record discounts; new params
--                        are DEFAULT NULL / 0 for full backward compatibility.

-- Drop the old create_booking_atomic overload (N params, no discount support) so
-- the new N+2-param version below is the sole definition and Postgres can resolve
-- calls without "could not choose best candidate function" ambiguity.
DO $$
DECLARE
  v_old_sig TEXT;
BEGIN
  SELECT p.oid::regprocedure::text INTO v_old_sig
    FROM pg_proc p
   WHERE p.proname = 'create_booking_atomic'
     AND p.pronargs = 15  -- original param count (without discount params)
   LIMIT 1;
  IF v_old_sig IS NOT NULL THEN
    EXECUTE 'DROP FUNCTION ' || v_old_sig;
  END IF;
END;
$$;

-- ── 1. discount_codes mirror ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discount_codes (
  id                 text PRIMARY KEY,
  property_id        uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  code               text NOT NULL CHECK (code ~ '^[A-Z0-9]{3,20}$'),
  discount_type      text NOT NULL CHECK (discount_type IN ('percent', 'flat')),
  discount_value     numeric(12,2) NOT NULL CHECK (discount_value > 0),
  max_discount       numeric(12,2) CHECK (max_discount IS NULL OR max_discount > 0),
  valid_from         date NOT NULL,
  valid_to           date NOT NULL,
  min_nights         smallint NOT NULL DEFAULT 1,
  min_booking_value  numeric(12,2) NOT NULL DEFAULT 0,
  max_uses           integer,
  max_uses_per_guest smallint NOT NULL DEFAULT 1,
  -- [{"start":"YYYY-MM-DD","end":"YYYY-MM-DD"}] end-exclusive, same as stay ranges
  blackouts          jsonb NOT NULL DEFAULT '[]',
  is_active          boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, code)
);

-- NOTE: no explicit index on (property_id, code) — the UNIQUE constraint above
-- already creates a B-tree index on those columns.

-- RLS: this table is service-role only — Ooruda writes it, villa-booking routes
-- read it via the service-role key. No anon/authenticated access needed.
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Grant service_role full access (needed even with service-role key in PostgREST)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE discount_codes TO service_role;

-- ── 2. discount columns on bookings ───────────────────────────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS discount_code   text,
  ADD COLUMN IF NOT EXISTS discount_amount bigint NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS bookings_discount_code_idx
  ON bookings (discount_code) WHERE discount_code IS NOT NULL;

-- ── 3. create_booking_atomic — add discount validation ────────────────────
-- New params (p_discount_code, p_discount_amount) default to NULL / 0 so
-- existing callers that omit them continue to work without change.
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
BEGIN
    -- 1. Advisory lock on the property — serialises all concurrent attempts,
    --    including discount-use races (codes are per-property).
    PERFORM pg_advisory_xact_lock(hashtext(p_property_id::text));

    -- 2. Availability check
    v_availability := check_availability(p_property_id, p_check_in, p_check_out);
    IF v_availability = 'DATE_UNAVAILABLE' THEN
        RAISE EXCEPTION 'DATE_UNAVAILABLE: Selected dates are already booked or on hold.';
    ELSIF v_availability = 'DATE_BLOCKED' THEN
        RAISE EXCEPTION 'DATE_BLOCKED: Selected dates are unavailable due to property hold or maintenance.';
    END IF;

    -- 3. Discount code validation (inside the lock — no race on max_uses)
    IF p_discount_code IS NOT NULL THEN
        SELECT * INTO v_dc
          FROM discount_codes
         WHERE code = p_discount_code
           AND property_id = p_property_id
           AND is_active = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'DISCOUNT_INVALID: Code is not valid for this property.';
        END IF;

        IF CURRENT_DATE NOT BETWEEN v_dc.valid_from AND v_dc.valid_to THEN
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

    -- 4. Unique reference number
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

    -- 5. Insert booking
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
