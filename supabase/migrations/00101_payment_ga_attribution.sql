-- 00101: carry the guest's Google Analytics identifiers on the payment row.
--
-- The `purchase` event is sent from the server, not the browser: the browser
-- can be closed between paying and landing on the confirmation page, and the
-- Razorpay webhook is then the only thing that knows the booking is real.
--
-- A server-sent event has no cookies, so it has to carry the identifiers the
-- browser would have supplied. Without them Google files every direct booking
-- under "(direct) / (none)", and the one question the whole measurement plan
-- exists to answer — which traffic actually produces bookings — cannot be
-- answered at all.
--
-- client_id identifies the browser; session_id ties the purchase to the visit
-- that produced it. client_id alone is not enough: the event lands on the user
-- but outside any session, and arrives with no source or medium.
--
-- Both are nullable. A guest who declined cookies has neither, and that
-- booking is still counted — just without a journey attached to it, which is
-- what declining means.
--
-- These are analytics identifiers, not guest data: they say nothing about who
-- someone is, only which browser and visit a payment came from.

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS ga_client_id text,
  ADD COLUMN IF NOT EXISTS ga_session_id text;

COMMENT ON COLUMN payments.ga_client_id IS
  'GA4 client id (the _ga cookie value) captured in the browser at create-order, so the server-sent purchase event attributes to the right browser. NULL when the guest declined cookies.';

COMMENT ON COLUMN payments.ga_session_id IS
  'GA4 session id captured alongside ga_client_id. Without it a server-sent purchase has no source or medium. NULL when the guest declined cookies.';
