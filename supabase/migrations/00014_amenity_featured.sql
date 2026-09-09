-- ── Curated amenity highlights ───────────────────────────────────────────────
-- The homepage shows a short list of amenities above a "show all" control.
-- That list was amenities.slice(0, 6), which is not a choice — it returns
-- whatever sorts first by display_order. In practice that meant the first four
-- of Comfort & Leisure plus the first two of Kitchen & Dining, so a 55" TV was
-- promoted while covered parking, the on-site caretaker and power backup were
-- hidden, and two whole categories never appeared at all.
--
-- display_order cannot double as the curation key: reordering to fix the
-- highlights would scramble the category groupings that use the same column.
-- Hence a separate flag.
--
-- The six below are chosen to be decision-relevant for a 12-guest villa on the
-- Mangalore coast, and to span all four categories so none is invisible in the
-- collapsed state.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE property_amenities
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN property_amenities.is_featured IS
    'Shown in the homepage highlights list. Curated, not derived from display_order.';

-- Idempotent: clear then set, so re-running converges on exactly this set.
UPDATE property_amenities SET is_featured = FALSE
 WHERE property_id = 'a1b2c3d4-0000-0000-0000-000000000001';

UPDATE property_amenities SET is_featured = TRUE
 WHERE property_id = 'a1b2c3d4-0000-0000-0000-000000000001'
   AND label IN (
       'Air Conditioning in All Rooms',   -- Comfort & Leisure: humid coastal climate
       'High-Speed Wi-Fi',                -- Comfort & Leisure: absence is a dealbreaker
       'Fully Equipped Kitchen',          -- Kitchen & Dining: self-catering is the point
       'Spacious Private Lawn',           -- Outdoor & Location: the actual differentiator
       'Covered Parking for 4+ Cars',     -- Outdoor & Location: groups arrive in several cars
       '100% Power Backup Generator'      -- Safety & Hygiene: real risk, strong trust signal
   );

-- Partial index: the highlights query filters on this and returns a handful of rows.
CREATE INDEX IF NOT EXISTS idx_amenities_featured
    ON property_amenities (property_id, display_order)
    WHERE is_featured;
