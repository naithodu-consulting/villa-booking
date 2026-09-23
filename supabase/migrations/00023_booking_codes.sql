-- 00023: guest-facing booking codes and private confirmation links.
--
-- booking_code  "V19-7KQ-M4X": villa prefix, 5 random Crockford Base32
--               characters, 1 check character. Assigned once, when a booking
--               first becomes confirmed, by whatever path confirms it: website
--               payment, Ooruda Villa, or an OTA import. No counter, so nothing
--               ever resets, and the random part is unique across all villas.
--               Mirrored in src/lib/booking-code.ts; keep the two in step.
-- access_token  256 random bits. The only key that opens /booking/<token>.
--               A booking code is a label people read aloud, not a secret.
--
-- reference_number (MNG-xxxxxx) stays as the internal hold reference used for
-- Razorpay receipts. Guests no longer see it.
-- Not a tax invoice number: GST invoices need their own gapless series.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS booking_code_prefix TEXT
    CHECK (booking_code_prefix ~ '^[A-Z][A-Z0-9]{1,3}$');

UPDATE properties SET booking_code_prefix = 'V19'
 WHERE slug = 'villa-19' AND booking_code_prefix IS NULL;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS booking_code TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS access_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_booking_code ON bookings (booking_code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_access_token ON bookings (access_token);

-- Two v4 UUIDs = 244 random bits from the server's CSPRNG, as 64 hex characters.
CREATE OR REPLACE FUNCTION new_booking_access_token()
RETURNS TEXT LANGUAGE sql VOLATILE SET search_path = '' AS $$
  SELECT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
$$;

UPDATE bookings SET access_token = new_booking_access_token() WHERE access_token IS NULL;
ALTER TABLE bookings
  ALTER COLUMN access_token SET DEFAULT new_booking_access_token(),
  ALTER COLUMN access_token SET NOT NULL;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_booking_code_format;
ALTER TABLE bookings ADD CONSTRAINT bookings_booking_code_format
  CHECK (booking_code IS NULL OR booking_code ~ '^[A-Z][A-Z0-9]{1,3}-[0-9A-HJKMNP-TV-Z]{3}-[0-9A-HJKMNP-TV-Z]{3}$');

-- ── Code generation ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_booking_code(p_prefix TEXT)
RETURNS TEXT LANGUAGE plpgsql VOLATILE SET search_path = '' AS $$
DECLARE
  v_alphabet CONSTANT TEXT := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_body  TEXT := '';
  v_sum   INT  := 0;
  v_val   INT;
  v_full  TEXT;
BEGIN
  FOR i IN 1..5 LOOP
    v_val  := floor(random() * 32)::int;
    v_body := v_body || substr(v_alphabet, v_val + 1, 1);
    v_sum  := v_sum + v_val * i;
  END LOOP;
  v_full := v_body || substr(v_alphabet, (v_sum % 31) + 1, 1);
  RETURN p_prefix || '-' || substr(v_full, 1, 3) || '-' || substr(v_full, 4, 3);
END;
$$;

-- Assigns the code the first time a booking is confirmed. A trigger rather than
-- a function callers must remember: every confirmation path gets a code.
CREATE OR REPLACE FUNCTION bookings_assign_code()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE
  v_prefix TEXT;
  v_code   TEXT;
BEGIN
  IF NEW.status = 'confirmed' AND NEW.booking_code IS NULL THEN
    SELECT booking_code_prefix INTO v_prefix FROM public.properties WHERE id = NEW.property_id;
    v_prefix := COALESCE(v_prefix, 'HB');
    LOOP
      v_code := public.generate_booking_code(v_prefix);
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bookings WHERE booking_code = v_code);
    END LOOP;
    NEW.booking_code := v_code;
  END IF;
  IF NEW.status = 'confirmed' AND NEW.confirmed_at IS NULL THEN
    NEW.confirmed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookings_assign_code ON bookings;
CREATE TRIGGER trg_bookings_assign_code
  BEFORE INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION bookings_assign_code();

-- Backfill: already-confirmed rows get a code; the trigger does the work.
UPDATE bookings SET status = status WHERE status = 'confirmed' AND booking_code IS NULL;

REVOKE ALL ON FUNCTION generate_booking_code(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION new_booking_access_token() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_booking_code(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION new_booking_access_token() TO service_role;
