-- Fix missing service_role grants on phase-1 read tables.
-- 00007 only granted to anon + authenticated; service_role needs explicit
-- SELECT even though it bypasses RLS — table-level privilege is separate.

GRANT SELECT ON property_amenities TO service_role;
GRANT SELECT ON property_policies  TO service_role;
GRANT SELECT ON faqs               TO service_role;
GRANT SELECT ON nearby_places      TO service_role;
GRANT SELECT ON offers             TO service_role;
GRANT SELECT ON events             TO service_role;
GRANT SELECT ON page_sections      TO service_role;
GRANT SELECT ON enquiries          TO service_role;

-- Unique constraint so seed.sql is idempotent even without ON CONFLICT support.
ALTER TABLE property_amenities
  ADD CONSTRAINT uq_amenity_property_label UNIQUE (property_id, label);
