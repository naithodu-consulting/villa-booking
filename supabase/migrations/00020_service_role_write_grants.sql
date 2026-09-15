-- 00020: let service_role write availability and rates.
--
-- Ooruda Villa manages Villa 19's calendar and prices by writing to this
-- database with the service role key (docs/OORUDA_VILLA_INTEGRATION.md).
-- 00004 granted service_role SELECT only on these tables. Hosted Supabase
-- projects grant service_role full table privileges by default, so the remote
-- already allowed the writes and this is a no-op there; a local stack built
-- from migrations did not, which hid the gap until the concurrency tests tried
-- to block a date locally.
GRANT INSERT, UPDATE, DELETE ON blocked_dates, pricing_rules, properties TO service_role;
