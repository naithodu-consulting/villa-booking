-- Migration: 00006_rls.sql
-- Row-Level Security for all core tables.
-- Revokes the dangerous anon INSERT on bookings/payments (Phase 0 defect fix).
-- All write paths go through the service-role client in server-side API routes.

-- ─────────────────────────────────────────────────────────
-- 1. Revoke dangerous anon/authenticated INSERT grants
--    Bookings and payments are created server-side via service role.
--    Direct PostgREST insertion by any client role is disallowed.
-- ─────────────────────────────────────────────────────────
REVOKE INSERT ON bookings FROM anon, authenticated;
REVOKE INSERT ON payments FROM anon, authenticated;
REVOKE SELECT ON bookings FROM authenticated; -- replaced by RLS policy below
REVOKE SELECT ON payments FROM authenticated; -- replaced by RLS policy below

-- ─────────────────────────────────────────────────────────
-- 2. Enable RLS on all core tables
-- ─────────────────────────────────────────────────────────
ALTER TABLE properties        ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms             ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_services    ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────
-- 3. Public read policies (replicate existing GRANT semantics via RLS)
-- ─────────────────────────────────────────────────────────

-- Properties: only active ones visible to public
CREATE POLICY "public_read_active_properties"
  ON properties FOR SELECT
  USING (is_active = true);

-- Rooms: public read (any authenticated or anon)
CREATE POLICY "public_read_rooms"
  ON rooms FOR SELECT
  USING (true);

-- Property images: public read
CREATE POLICY "public_read_property_images"
  ON property_images FOR SELECT
  USING (true);

-- Pricing rules: public read (needed for client-side quote display)
CREATE POLICY "public_read_pricing_rules"
  ON pricing_rules FOR SELECT
  USING (true);

-- Blocked dates: public read (availability calendar)
CREATE POLICY "public_read_blocked_dates"
  ON blocked_dates FOR SELECT
  USING (true);

-- Addon services: public read (active only)
CREATE POLICY "public_read_addon_services"
  ON addon_services FOR SELECT
  USING (is_active = true);

-- ─────────────────────────────────────────────────────────
-- 4. Bookings: no public read or write via PostgREST
--    All booking operations go through service-role API routes.
--    Authenticated users can read only their own bookings (matched by email).
-- ─────────────────────────────────────────────────────────
CREATE POLICY "users_read_own_bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (guest_email = auth.jwt() ->> 'email');

-- ─────────────────────────────────────────────────────────
-- 5. Payments: no public read or write via PostgREST
--    Authenticated users can read payments for their own bookings only.
-- ─────────────────────────────────────────────────────────
CREATE POLICY "users_read_own_payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE guest_email = auth.jwt() ->> 'email'
    )
  );

-- ─────────────────────────────────────────────────────────
-- 6. Service role bypass — no policies needed; BYPASSRLS handles it.
--    Explicit comment to document the intent.
-- ─────────────────────────────────────────────────────────
-- service_role bypasses RLS. Server-side API routes (create-order, webhook,
-- verify-payment, admin endpoints) all use createServiceClient() which carries
-- the service_role key. No additional policies needed for service_role.
