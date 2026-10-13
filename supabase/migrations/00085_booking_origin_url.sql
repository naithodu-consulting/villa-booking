-- =============================================================
-- Where the guest actually booked from.
--
-- The confirmation email's "View your booking" link used to be built from
-- APP_URL, which is one value per deployment. A booking made on a Vercel
-- preview therefore got a link to production, and a confirmation sent from a
-- developer's machine got a localhost link.
--
-- The browser that creates the booking knows the right host, so create-order
-- records it here and both confirmation paths read it back. The Razorpay
-- webhook is server-to-server and has no guest origin of its own, which is why
-- this is stored rather than passed through the request.
--
-- The value is derived from the Origin header, which the caller controls, so
-- create-order only ever writes a host it has checked against an allowlist
-- (lib/origin.ts). The length cap here is a backstop, not the validation.
-- =============================================================

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS origin_url TEXT
    CHECK (origin_url IS NULL OR (length(origin_url) <= 200 AND origin_url ~ '^https?://'));

COMMENT ON COLUMN bookings.origin_url IS
  'Scheme and host the guest booked from, e.g. https://villa19.in. Written by '
  'create-order from an allowlisted Origin header; guest links are built from '
  'it, falling back to APP_URL when absent.';
