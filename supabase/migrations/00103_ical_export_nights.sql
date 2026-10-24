-- 00103: the nights we publish to booking channels.
--
-- The other half of iCal sync (00102 was the import). Airbnb fetches an .ics
-- from us and blocks those nights on the listing, so this function decides
-- what a channel is told the villa is not available for.
--
-- ── Why this is NOT get_unavailable_nights() ──────────────────────────────
--
-- The obvious implementation is to reuse get_unavailable_nights(), and it
-- would be wrong in a way that is invisible until it has cost real bookings.
--
-- That function answers "can a guest book this night on villa19.in?", and it
-- returns false for every night past properties.booking_cutoff_date. The
-- cutoff is a commercial limit on OUR direct bookings - today it sits around
-- mid-January - not a statement that the villa is occupied. Exporting it would
-- tell Airbnb the villa is unavailable from mid-January onwards and blanket
-- their entire sellable window, killing the channel while every screen looked
-- healthy.
--
-- This function answers a different question: "is this night genuinely taken?"
-- It therefore ignores the cutoff entirely. The two are deliberately separate
-- so that changing one cannot silently change the other; if you find yourself
-- making them agree, re-read this comment first.
--
-- ── What counts as taken ──────────────────────────────────────────────────
--
--   * a confirmed booking
--   * a pending booking whose checkout hold has not lapsed
--   * a manual block entered by a human in Ooruda
--
-- Live holds are included deliberately. The question is which error to prefer
-- when a channel's poll lands inside the fifteen minutes a checkout holds a
-- night. Include them and an abandoned checkout can show that night as
-- unavailable on Airbnb until the next poll: a few hours of a sellable night
-- lost. Exclude them and a checkout that completes leaves the night sellable
-- on Airbnb until the next poll, which is a double booking waiting to happen.
-- Equal odds, unequal costs - a lost night is recoverable.
--
-- ── What is excluded, and why it matters most ─────────────────────────────
--
-- Rows with source = 'ical' are the blocks WE imported from a channel.
-- Exporting them back is a feedback loop: Airbnb would be told its own
-- bookings are unavailable, and a cancellation there could never free the
-- night again because our export would keep asserting it.

CREATE OR REPLACE FUNCTION get_export_blocked_nights(
    p_property_id UUID,
    p_from        DATE,
    p_to          DATE
) RETURNS SETOF DATE AS $$
    SELECT d::date
      FROM generate_series(p_from, p_to - 1, INTERVAL '1 day') AS d
     WHERE EXISTS (
             SELECT 1
               FROM bookings b
              WHERE b.property_id = p_property_id
                AND d::date >= b.check_in
                AND d::date <  b.check_out
                AND (
                      b.status = 'confirmed'
                      OR (
                           b.status = 'pending'
                           AND COALESCE(b.hold_expires_at, b.created_at + INTERVAL '15 minutes') > NOW()
                         )
                    )
           )
        OR EXISTS (
             SELECT 1
               FROM blocked_dates bd
              WHERE bd.property_id = p_property_id
                AND bd.source = 'manual'
                AND d::date >= bd.start_date
                AND d::date <  bd.end_date
           )
     ORDER BY 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION get_export_blocked_nights(UUID, DATE, DATE) IS
  'Nights published to booking channels as unavailable. Deliberately ignores booking_cutoff_date and rows with source = ''ical''; see the migration for why. Not interchangeable with get_unavailable_nights().';

REVOKE ALL ON FUNCTION get_export_blocked_nights(UUID, DATE, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_export_blocked_nights(UUID, DATE, DATE) TO service_role;
