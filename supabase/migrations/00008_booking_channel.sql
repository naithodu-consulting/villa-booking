-- Add booking_channel to track how each reservation came in
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS booking_channel TEXT DEFAULT 'online'
    CHECK (booking_channel IN ('online', 'whatsapp', 'phone', 'referral', 'instagram', 'manual', 'other'));

-- Backfill existing bookings
UPDATE bookings SET booking_channel = 'online' WHERE booking_channel IS NULL;
