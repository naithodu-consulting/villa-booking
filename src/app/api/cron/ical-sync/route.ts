import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { bearerSecretMatches } from '@/lib/signature';
import { fetchIcal, IcalFetchError, redactFeedUrl } from '@/lib/ical-fetch';
import { parseIcal, classifyEvents, nightsBetween, eventSetFingerprint, IcalParseError } from '@/lib/ical';
import { todayISO } from '@/lib/format';
import { getProperty } from '@/lib/data';
import { ICAL_SYNC_ENABLED } from '@/lib/features';

/**
 * GET /api/cron/ical-sync
 *
 * Phase 0: a DRY RUN. It fetches the channel feed, works out exactly what it
 * would change, and writes nothing. Every path through this file is read-only,
 * which is the point - the write half (Phase 1) should not be enabled until a
 * human has read this output against a real feed and agreed with it.
 *
 * Authenticated with CRON_SECRET as a bearer token, compared in constant time.
 * Production schedules it from Hostinger's cron (Vercel is the development
 * deployment, on Hobby, whose cron runs once a day):
 *
 *   17 * * * * curl -fsS -m 60 -H "Authorization: Bearer $CRON_SECRET" \
 *              https://villa19.in/api/cron/ical-sync
 *
 * The same route serves Ooruda's "Sync now" button, so there is one code path
 * and one secret rather than two that can drift.
 *
 * Route handlers are not cached by default in this version of Next, which is
 * what we want: a sync must always do the work.
 *
 * See docs/AIRBNB_ICAL_SYNC.md.
 */

interface DryRunReport {
  mode: 'dry-run';
  feed: string;
  today: string;
  bytes: number;
  parsed: number;
  skipped: number;
  fingerprint: string;
  wouldBlock: { start: string; end: string; nights: number; summary: string }[];
  dropped: { start: string; end: string; nights: number; reason: string }[];
  totalNights: number;
  heldForReview: boolean;
  reviewReasons: string[];
  alreadyBlocked: { start: string; end: string }[];
  conflicts: { reference: string; checkIn: string; checkOut: string; feedStart: string; feedEnd: string }[];
}

export async function GET(request: NextRequest) {
  if (!bearerSecretMatches(process.env.CRON_SECRET, request.headers.get('authorization'))) {
    // 404 rather than 403: a 403 confirms the route is here.
    return new NextResponse(null, { status: 404 });
  }

  // Checked after authentication, so the disabled state is not something an
  // unauthenticated caller can probe for.
  if (!ICAL_SYNC_ENABLED) {
    // 200, not an error: a disabled sync is a working sync that was asked to
    // do nothing. A cron line that treats non-2xx as a failure should not page
    // anyone because the feature is deliberately off.
    return NextResponse.json(
      { mode: 'dry-run', status: 'disabled', message: 'ICAL_SYNC_ENABLED is not true; nothing was fetched.' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const feedUrl = process.env.AIRBNB_ICAL_URL;
  if (!feedUrl) {
    // Phase 1 reads ical_feeds instead, so the operator can rotate the link
    // without a redeploy. Phase 0 takes it from the environment to stay
    // independent of a migration that has not been pushed yet.
    return NextResponse.json({ error: 'AIRBNB_ICAL_URL is not set.' }, { status: 503 });
  }

  const today = todayISO();

  try {
    const { body, bytes } = await fetchIcal(feedUrl);
    const { events, skipped } = parseIcal(body);
    const classification = classifyEvents(events, { today });

    const property = await getProperty();
    const { alreadyBlocked, conflicts } = property
      ? await compareWithDatabase(property.id, classification.apply)
      : { alreadyBlocked: [], conflicts: [] };

    const report: DryRunReport = {
      mode: 'dry-run',
      feed: redactFeedUrl(feedUrl),
      today,
      bytes,
      parsed: events.length,
      skipped,
      fingerprint: eventSetFingerprint(events),
      wouldBlock: classification.apply.map((e) => ({
        start: e.start,
        end: e.end,
        nights: nightsBetween(e.start, e.end),
        summary: e.summary,
      })),
      dropped: classification.dropped.map((d) => ({
        start: d.event.start,
        end: d.event.end,
        nights: d.nights,
        reason: d.reason,
      })),
      totalNights: classification.totalNights,
      heldForReview: classification.heldForReview,
      reviewReasons: classification.reviewReasons,
      alreadyBlocked,
      conflicts,
    };

    console.info('[ical-sync] dry run', JSON.stringify(report));
    return NextResponse.json(report, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    // A failed fetch or an unreadable body is a hard stop, never an empty
    // calendar. In Phase 1 this is the branch that protects every imported
    // night: reaching the reconciliation step with no events would free them
    // all. The feed URL is redacted on the way out - it is a bearer token.
    const status = err instanceof IcalFetchError ? 'fetch_failed'
      : err instanceof IcalParseError ? 'parse_failed'
      : 'error';
    const message = err instanceof Error ? err.message : 'Unknown error.';

    console.error('[ical-sync]', status, redactFeedUrl(feedUrl), message);
    return NextResponse.json({ mode: 'dry-run', status, error: message }, { status: 502 });
  }
}

/**
 * What the database already knows, read-only.
 *
 * Selects only columns that exist before 00101 is pushed, so a dry run works
 * against a database the migration has not reached yet.
 */
async function compareWithDatabase(
  propertyId: string,
  apply: { start: string; end: string }[],
): Promise<Pick<DryRunReport, 'alreadyBlocked' | 'conflicts'>> {
  const supabase = createServiceClient();

  const [blockedRes, bookingsRes] = await Promise.all([
    supabase
      .from('blocked_dates')
      .select('start_date, end_date')
      .eq('property_id', propertyId),
    supabase
      .from('bookings')
      .select('reference_number, check_in, check_out')
      .eq('property_id', propertyId)
      .eq('status', 'confirmed'),
  ]);

  const blocked = blockedRes.data ?? [];
  const bookings = bookingsRes.data ?? [];

  // Half-open overlap, the same predicate check_availability() uses.
  const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
    aStart < bEnd && aEnd > bStart;

  const alreadyBlocked = apply
    .filter((e) => blocked.some((b) => overlaps(e.start, e.end, b.start_date, b.end_date)))
    .map((e) => ({ start: e.start, end: e.end }));

  // A channel night that lands on a confirmed direct booking means the villa is
  // sold twice. Phase 1 records these and emails a human; nothing automated
  // should pick which guest to move.
  const conflicts = apply.flatMap((e) =>
    bookings
      .filter((b) => overlaps(e.start, e.end, b.check_in, b.check_out))
      .map((b) => ({
        reference: b.reference_number as string,
        checkIn: b.check_in as string,
        checkOut: b.check_out as string,
        feedStart: e.start,
        feedEnd: e.end,
      })),
  );

  return { alreadyBlocked, conflicts };
}
