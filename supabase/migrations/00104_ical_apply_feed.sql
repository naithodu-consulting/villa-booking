-- 00104: apply a channel feed's events to blocked_dates, atomically.
--
-- Phase 1 of docs/AIRBNB_ICAL_SYNC.md. The dry run (00102) worked out what it
-- would change; this is what changes it.
--
-- ── Why this is a database function and not TypeScript ────────────────────
--
-- Reconciliation is a DELETE followed by INSERTs, and the window between them
-- is one where the villa looks completely free. supabase-js has no
-- transactions, so doing this from the route would mean that window is real:
-- a guest loading the date picker at the wrong moment sees imported nights as
-- available, and create_booking_atomic would happily sell one. Inside a
-- function the whole thing is one statement, and no reader ever observes the
-- gap.
--
-- ── Why replace rather than upsert ────────────────────────────────────────
--
-- Airbnb reissues a UID whenever an event changes: not one UID survived
-- between two fetches a day apart. Matching on external_uid would therefore
-- treat every edit as a new event and leave the old row behind, blocking
-- nights that were freed. Replacing the feed's rows wholesale is the only
-- reconciliation that cannot orphan anything.
--
-- ── The rule that makes replacing safe ────────────────────────────────────
--
-- Replacing means an empty event list frees every imported night. That is
-- correct when the channel really has no bookings, and catastrophic when it
-- is what an error page parsed to. The caller must therefore NEVER reach this
-- function unless it genuinely read and parsed a calendar; see the abort
-- rules in src/lib/ical-fetch.ts and the thrown IcalParseError in ical.ts.
-- This function trusts that and does not second-guess it: p_events is what
-- the channel says, in full.

CREATE OR REPLACE FUNCTION apply_ical_feed(
    p_feed_id UUID,
    p_events  JSONB,
    p_fingerprint TEXT DEFAULT NULL
) RETURNS TABLE (removed INT, inserted INT) AS $$
DECLARE
    v_property_id UUID;
    v_removed INT;
    v_inserted INT;
BEGIN
    SELECT property_id INTO v_property_id FROM ical_feeds WHERE id = p_feed_id;
    IF v_property_id IS NULL THEN
        RAISE EXCEPTION 'Unknown feed %', p_feed_id;
    END IF;

    -- One sync per feed at a time. A cron run and an operator pressing "Sync
    -- now" can overlap, and two concurrent replaces would interleave their
    -- deletes and inserts. Released automatically at the end of the
    -- transaction, which is the end of this statement.
    PERFORM pg_advisory_xact_lock(hashtext('ical_feed:' || p_feed_id::text));

    DELETE FROM blocked_dates WHERE feed_id = p_feed_id;
    GET DIAGNOSTICS v_removed = ROW_COUNT;

    INSERT INTO blocked_dates (property_id, start_date, end_date, reason, notes, source, feed_id, external_uid)
    SELECT
        v_property_id,
        (e ->> 'start')::date,
        (e ->> 'end')::date,
        'offline_booking',
        NULLIF(e ->> 'summary', ''),
        'ical',
        p_feed_id,
        NULLIF(e ->> 'uid', '')
      FROM jsonb_array_elements(COALESCE(p_events, '[]'::jsonb)) AS e;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;

    UPDATE ical_feeds
       SET last_synced_at = NOW(),
           last_status    = 'ok',
           last_error     = NULL,
           last_fingerprint = COALESCE(p_fingerprint, last_fingerprint),
           events_applied = v_inserted
     WHERE id = p_feed_id;

    removed  := v_removed;
    inserted := v_inserted;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION apply_ical_feed(UUID, JSONB, TEXT) IS
  'Replaces a feed''s blocked_dates rows with p_events, atomically and under an advisory lock. Callers must never pass an empty list unless the channel genuinely returned an empty calendar.';

REVOKE ALL ON FUNCTION apply_ical_feed(UUID, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION apply_ical_feed(UUID, JSONB, TEXT) TO service_role;

-- ── Recording a run that did not apply ────────────────────────────────────
--
-- A failed fetch, an unparseable body, or a feed held for review all leave
-- blocked_dates untouched but must still be visible: a sync that has been
-- silently failing for a week looks identical to one with nothing to do.
CREATE OR REPLACE FUNCTION record_ical_failure(
    p_feed_id UUID,
    p_status  TEXT,
    p_error   TEXT
) RETURNS VOID AS $$
    UPDATE ical_feeds
       SET last_synced_at = NOW(),
           last_status    = p_status,
           last_error     = LEFT(p_error, 2000)
     WHERE id = p_feed_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION record_ical_failure(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_ical_failure(UUID, TEXT, TEXT) TO service_role;
