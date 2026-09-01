-- Migration: 00004_grants.sql
-- Description: Grant read access on public-facing tables to anon and authenticated roles.
--              PostgREST requires explicit GRANTs — no grant = permission denied.

-- Public read: property discovery data (guests and search engines read these)
GRANT SELECT ON properties        TO anon, authenticated;
GRANT SELECT ON rooms             TO anon, authenticated;
GRANT SELECT ON property_images   TO anon, authenticated;
GRANT SELECT ON pricing_rules     TO anon, authenticated;
GRANT SELECT ON blocked_dates     TO anon, authenticated;
GRANT SELECT ON addon_services    TO anon, authenticated;
GRANT SELECT ON notification_templates TO authenticated;

-- Bookings: guests can insert (create booking) but never read others' bookings
-- Service role bypasses all grants — admin operations use service role client only
GRANT INSERT ON bookings TO anon, authenticated;
GRANT INSERT ON payments TO anon, authenticated;

-- Authenticated users can read their own booking (enforced by RLS in a later migration)
GRANT SELECT ON bookings TO authenticated;
GRANT SELECT ON payments TO authenticated;

-- Sequences needed for INSERT
GRANT USAGE ON SEQUENCE audit_logs_id_seq TO authenticated;

-- service_role: used by server-side admin operations and SSR data fetching
-- Has BYPASSRLS but still needs explicit table grants in PostgREST
GRANT SELECT ON properties, rooms, property_images, pricing_rules, blocked_dates, addon_services TO service_role;
GRANT ALL ON bookings, payments TO service_role;
GRANT USAGE ON SEQUENCE audit_logs_id_seq TO service_role;
