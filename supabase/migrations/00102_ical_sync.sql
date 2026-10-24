-- 00102: calendar (iCal) sync with booking channels.
--
-- Airbnb has no public booking API for anyone who is not a certified channel
-- manager. The only two-way sync on offer is iCalendar link exchange: we fetch
-- their .ics, they fetch ours. This migration adds the storage for the import
-- half. See docs/AIRBNB_ICAL_SYNC.md for the feed analysis behind the choices.
--
-- Nothing here changes availability on its own. Imported nights land in
-- blocked_dates, which check_availability() already consults (00097), so the
-- booking path needs no change at all.

-- ── Feeds ─────────────────────────────────────────────────────────────────
--
-- One row per channel calendar. The URL is kept here rather than in an
-- environment variable so the operator can rotate it from Ooruda without a
-- redeploy: Airbnb reissues the link whenever the host resets it, and a
-- redeploy to change a URL is a trap waiting for a Sunday.
CREATE TABLE IF NOT EXISTS ical_feeds (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id    UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name           VARCHAR(50) NOT NULL,          -- 'Airbnb'
    url            TEXT NOT NULL,                 -- secret: a bearer token in URL form
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    last_status    VARCHAR(30),                   -- ok | fetch_failed | parse_failed | held_for_review
    last_error     TEXT,
    -- Airbnb sends no ETag and no Last-Modified, and stamps every response with
    -- the time of the request, so the raw body differs on every fetch. This
    -- holds a fingerprint of the parsed event set instead, which compares what
    -- the feed means rather than how it was serialised.
    last_fingerprint TEXT,
    events_applied INT,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ical_feeds_property_name_unique UNIQUE (property_id, name)
);

COMMENT ON COLUMN ical_feeds.url IS
  'Channel export URL. Secret - it exposes occupancy. Never log it, never return it to a browser.';

-- ── Imported blocks ───────────────────────────────────────────────────────
--
-- blocked_dates already uses the half-open range check_availability() expects
-- (p_check_in < end_date AND p_check_out > start_date), which is exactly how
-- iCal treats DTSTART/DTEND. The mapping is direct: no day is added anywhere.
ALTER TABLE blocked_dates
  ADD COLUMN IF NOT EXISTS source       VARCHAR(20) NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS feed_id      UUID REFERENCES ical_feeds(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS external_uid TEXT;

ALTER TABLE blocked_dates
  DROP CONSTRAINT IF EXISTS blocked_dates_source_check;
ALTER TABLE blocked_dates
  ADD CONSTRAINT blocked_dates_source_check CHECK (source IN ('manual', 'ical'));

-- A row either came from a feed or it did not; half-set states are a bug.
ALTER TABLE blocked_dates
  DROP CONSTRAINT IF EXISTS blocked_dates_feed_consistency;
ALTER TABLE blocked_dates
  ADD CONSTRAINT blocked_dates_feed_consistency
  CHECK ((source = 'ical') = (feed_id IS NOT NULL));

CREATE INDEX IF NOT EXISTS idx_blocked_dates_feed ON blocked_dates (feed_id) WHERE feed_id IS NOT NULL;

COMMENT ON COLUMN blocked_dates.source IS
  'manual = entered by a human in Ooruda. ical = imported from a channel feed; owned by the importer and replaced wholesale on every sync.';

-- external_uid is stored for tracing only and is deliberately NOT unique.
-- Airbnb reissues UIDs whenever an event changes: not one UID survived between
-- two fetches a day apart. Reconciling on it would orphan the old row every
-- time a booking's dates were edited, so the importer replaces a feed's rows
-- wholesale instead.
COMMENT ON COLUMN blocked_dates.external_uid IS
  'The channel UID this row came from. For tracing only - channels reissue UIDs, so it is not an identity.';

-- ── Conflicts ─────────────────────────────────────────────────────────────
--
-- A night a channel now blocks that already carries a confirmed booking of
-- ours means the villa is sold twice. iCal sync makes that rare, not
-- impossible: the channel polls us every few hours, so there is a window.
-- The importer records it and emails a human. Nothing automated should decide
-- which guest to move.
CREATE TABLE IF NOT EXISTS ical_conflicts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_id     UUID NOT NULL REFERENCES ical_feeds(id) ON DELETE CASCADE,
    booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    feed_start  DATE NOT NULL,
    feed_end    DATE NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    notes       TEXT
);

CREATE INDEX IF NOT EXISTS idx_ical_conflicts_open ON ical_conflicts (detected_at) WHERE resolved_at IS NULL;

-- ── RLS ───────────────────────────────────────────────────────────────────
--
-- ical_feeds and ical_conflicts get RLS with no policy at all, which denies
-- everything to anon and authenticated. Service role bypasses RLS, and every
-- query in this app goes through the service-role client, so that is the whole
-- access model. A feed URL must never be readable from a browser.
ALTER TABLE ical_feeds     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ical_conflicts ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON ical_feeds, ical_conflicts TO service_role;

-- Note for whoever reads this next: blocked_dates keeps its existing
-- public_read policy from 00006, so the new columns are readable by anon along
-- with the dates that were already public. That is accepted - a channel UID is
-- opaque and the dates were never secret - but it is the reason the feed URL
-- lives in ical_feeds and not in a blocked_dates column.
