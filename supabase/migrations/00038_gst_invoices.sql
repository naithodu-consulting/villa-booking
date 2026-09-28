-- 00038: GST tax invoices, per the operator 2026-09-28.
--
-- invoice_number  "V19/26-27/INV/000001". Same shape as Ooruda Villa's document
--                 numbers ({INITIALS}/{FY}/{TYPE}/{NNNNNN}, see PropTech's
--                 allocate_ledger_doc_no). FY is the Indian financial year of
--                 the confirmation date in IST; the counter restarts each 1 April.
--                 GST requires the series to be consecutive, so the number is
--                 allocated inside the transaction that confirms the booking: if
--                 that transaction rolls back, so does the counter, and no number
--                 is skipped.
-- guest_company / guest_gstin
--                 Optional, captured at checkout so a business guest can claim the
--                 input tax. Printed on the invoice when present.
--
-- The booking code (V19-7KQ-M4X) stays the guest-facing label. It is not an
-- invoice number and never was.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS guest_company  TEXT,
  ADD COLUMN IF NOT EXISTS guest_gstin    TEXT,
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS invoice_date   DATE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_invoice_number ON bookings (invoice_number);

-- 15 characters: 2-digit state code, 10-character PAN, entity digit, Z, check.
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_guest_gstin_format;
ALTER TABLE bookings ADD CONSTRAINT bookings_guest_gstin_format
  CHECK (guest_gstin IS NULL OR guest_gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$');

-- A GSTIN without a legal name is not a usable B2B invoice.
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_guest_gstin_needs_company;
ALTER TABLE bookings ADD CONSTRAINT bookings_guest_gstin_needs_company
  CHECK (guest_gstin IS NULL OR length(trim(guest_company)) > 0);

CREATE TABLE IF NOT EXISTS invoice_sequences (
  property_id    UUID     NOT NULL REFERENCES properties(id),
  financial_year SMALLINT NOT NULL,  -- end year: FY 2026-27 is 2027
  next_val       INT      NOT NULL,
  PRIMARY KEY (property_id, financial_year)
);

-- Service role only. No policies: nothing else may read or bump the counter.
ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION allocate_invoice_number(p_property_id UUID, p_date DATE)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_fy     SMALLINT;
  v_seq    INT;
  v_prefix TEXT;
BEGIN
  -- Indian financial year: 1 April starts a new one. v_fy is the end year.
  v_fy := CASE WHEN extract(month FROM p_date) >= 4
               THEN extract(year FROM p_date)::smallint + 1
               ELSE extract(year FROM p_date)::smallint END;

  -- Row lock on conflict serialises concurrent confirmations: no duplicates, no gaps.
  INSERT INTO public.invoice_sequences AS s (property_id, financial_year, next_val)
  VALUES (p_property_id, v_fy, 2)
  ON CONFLICT (property_id, financial_year)
  DO UPDATE SET next_val = s.next_val + 1
  RETURNING s.next_val - 1 INTO v_seq;

  SELECT booking_code_prefix INTO v_prefix FROM public.properties WHERE id = p_property_id;

  RETURN COALESCE(v_prefix, 'HB') || '/'
      || lpad(((v_fy - 1) % 100)::text, 2, '0') || '-' || lpad((v_fy % 100)::text, 2, '0')
      || '/INV/' || lpad(v_seq::text, 6, '0');
END;
$$;

-- Issued once, when a booking is first both confirmed and paid, by whatever path
-- gets it there. Fires after trg_bookings_assign_code (triggers run by name).
CREATE OR REPLACE FUNCTION bookings_assign_invoice()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Asia/Kolkata')::date;
BEGIN
  IF NEW.status = 'confirmed' AND NEW.payment_status = 'paid' AND NEW.invoice_number IS NULL THEN
    NEW.invoice_number := public.allocate_invoice_number(NEW.property_id, v_today);
    NEW.invoice_date   := v_today;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookings_assign_invoice ON bookings;
CREATE TRIGGER trg_bookings_assign_invoice
  BEFORE INSERT OR UPDATE OF status, payment_status ON bookings
  FOR EACH ROW EXECUTE FUNCTION bookings_assign_invoice();

-- No backfill: bookings confirmed before today were not invoiced under this
-- series, and issuing them numbers dated today would misstate the supply date.

REVOKE ALL ON FUNCTION allocate_invoice_number(UUID, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION allocate_invoice_number(UUID, DATE) TO service_role;
REVOKE ALL ON TABLE invoice_sequences FROM anon, authenticated;
