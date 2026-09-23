-- 00024: track guest ID collection per booking.
--
-- Guests send ID photos on WhatsApp (link on the confirmation page and in the
-- confirmation email). Nothing is stored in this database except where each
-- booking stands. Ooruda Villa staff update the status as documents arrive.
--
--   pending   nothing received yet (default)
--   received  documents arrived on WhatsApp, not yet checked
--   verified  checked against the guest list; guests see "IDs received"

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS id_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (id_status IN ('pending', 'received', 'verified')),
  ADD COLUMN IF NOT EXISTS id_status_updated_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION bookings_touch_id_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.id_status_updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookings_id_status ON bookings;
CREATE TRIGGER trg_bookings_id_status
  BEFORE UPDATE OF id_status ON bookings
  FOR EACH ROW WHEN (OLD.id_status IS DISTINCT FROM NEW.id_status)
  EXECUTE FUNCTION bookings_touch_id_status();
