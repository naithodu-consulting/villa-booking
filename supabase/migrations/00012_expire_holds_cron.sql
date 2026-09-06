-- ── Schedule the booking-hold sweeper in the database ────────────────────────
-- Replaces the Vercel Cron entry (vercel.json) that drove /api/cron/expire-holds.
--
-- Why in-database: expire_stale_booking_holds() is already a SQL function, so
-- pg_cron calls it directly. No HTTP hop, no Edge Function, no shared secret,
-- and no dependency on the hosting plan's cron limits. This matches the
-- scheduling pattern used in PropTech (pg_cron in a migration).
--
-- The sweep is housekeeping only. check_availability() already ignores holds
-- past hold_expires_at, so dates free themselves whether or not this runs.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any prior schedule first so this migration is safe to re-run.
SELECT cron.unschedule('expire-booking-holds') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'expire-booking-holds'
);

-- Daily at 3 AM IST = 21:30 UTC previous day.
--
-- Daily is deliberate, not a limitation. Availability is already correct at read
-- time, so the only effect of a lapsed hold sitting unswept is that it still reads
-- as 'pending' in admin views until the next run. A tighter cadence would buy
-- nothing but would write 144 rows/day into cron.job_run_details, which pg_cron
-- never prunes.
SELECT cron.schedule(
    'expire-booking-holds',
    '30 21 * * *',
    $$ SELECT public.expire_stale_booking_holds() $$
);
