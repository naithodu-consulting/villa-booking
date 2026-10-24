import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { bearerSecretMatches } from '@/lib/signature';
import { fetchIcal, IcalFetchError, redactFeedUrl } from '@/lib/ical-fetch';
import { parseIcal, classifyEvents, nightsBetween, eventSetFingerprint, IcalParseError } from '@/lib/ical';
import { activeFeeds, syncFeed, type SyncResult } from '@/lib/ical-sync';
import { todayISO } from '@/lib/format';
import { getProperty } from '@/lib/data';
import { ICAL_SYNC_ENABLED } from '@/lib/features';

/**
 * GET /api/cron/ical-sync
 *
 * Reads every active channel calendar and applies it to blocked_dates. This is
 * what makes a date blocked on Airbnb disappear from the site, and a date
 * freed there come back.
 *
 * Authenticated with CRON_SECRET as a bearer token, compared in constant time;
 * anything else gets a 404, because a 403 confirms the route exists. The same
 * route serves Ooruda's "Sync now" button, so there is one code path and one
 * secret rather than two that drift.
 *
 * Scheduled hourly from Hostinger's cron in production - Vercel is the
 * development deployment and its Hobby plan runs cron once a day, which is too
 * slow to be useful:
 *
 *   17 * * * * /home/<user>/villa-booking/scripts/ical-sync.sh
 *
 * ?dry=1 runs everything except the write and reports what would change. Kept
 * deliberately: it is how the next person checks a feed without touching the
 * calendar, and how this was verified before Phase 1 wrote anything.
 *
 * Route handlers are uncached by default in this version of Next, which is
 * what a sync wants.
 *
 * See docs/AIRBNB_ICAL_SYNC.md.
 */

export async function GET(request: NextRequest) {
  if (!bearerSecretMatches(process.env.CRON_SECRET, request.headers.get('authorization'))) {
    return new NextResponse(null, { status: 404 });
  }

  // Checked after authentication, so the disabled state is not something an
  // unauthenticated caller can probe for.
  if (!ICAL_SYNC_ENABLED) {
    // 200, not an error: a disabled sync is a working sync asked to do
    // nothing. A cron line treating non-2xx as failure should not page anyone
    // because the feature is deliberately off.
    return NextResponse.json(
      { status: 'disabled', message: 'ICAL_SYNC_ENABLED is not true; nothing was fetched.' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const dryRun = request.nextUrl.searchParams.get('dry') === '1';
  const started = Date.now();

  try {
    const property = await getProperty();
    if (!property) {
      return NextResponse.json({ status: 'error', error: 'No active property.' }, { status: 503 });
    }

    const supabase = createServiceClient();
    const feeds = await activeFeeds(supabase, property.id);

    if (feeds.length === 0) {
      // Not an error, and worth saying out loud: a sync with no feeds
      // configured looks exactly like a sync with nothing to do.
      return NextResponse.json(
        { status: 'no_feeds', message: 'No active rows in ical_feeds for this property.' },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const results: (SyncResult | DryRunResult)[] = [];
    for (const feed of feeds) {
      results.push(dryRun ? await dryRunFeed(feed) : await syncFeed(supabase, feed));
    }

    const payload = {
      status: dryRun ? 'dry-run' : 'ok',
      today: todayISO(),
      ms: Date.now() - started,
      feeds: results,
    };

    console.info('[ical-sync]', JSON.stringify(payload));
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error.';
    console.error('[ical-sync] run failed:', message);
    return NextResponse.json({ status: 'error', error: message }, { status: 500 });
  }
}

interface DryRunResult {
  feed: string;
  status: string;
  wouldBlock: { start: string; end: string; nights: number }[];
  dropped: { start: string; end: string; nights: number; reason: string }[];
  nights: number;
  heldForReview: boolean;
  reviewReasons: string[];
  fingerprint?: string;
  error?: string;
}

/** Everything syncFeed does, stopping before the write. */
async function dryRunFeed(feed: { name: string; url: string }): Promise<DryRunResult> {
  const empty = { wouldBlock: [], dropped: [], nights: 0, heldForReview: false, reviewReasons: [] };
  try {
    const { body } = await fetchIcal(feed.url);
    const { events } = parseIcal(body);
    const classified = classifyEvents(events, { today: todayISO() });

    return {
      feed: feed.name,
      status: classified.heldForReview ? 'held_for_review' : 'ok',
      wouldBlock: classified.apply.map((e) => ({
        start: e.start,
        end: e.end,
        nights: nightsBetween(e.start, e.end),
      })),
      dropped: classified.dropped.map((d) => ({
        start: d.event.start,
        end: d.event.end,
        nights: d.nights,
        reason: d.reason,
      })),
      nights: classified.totalNights,
      heldForReview: classified.heldForReview,
      reviewReasons: classified.reviewReasons,
      fingerprint: eventSetFingerprint(events),
    };
  } catch (err) {
    const status = err instanceof IcalFetchError ? 'fetch_failed' : err instanceof IcalParseError ? 'parse_failed' : 'error';
    console.error(`[ical-sync] dry run ${status} for ${redactFeedUrl(feed.url)}`);
    return { feed: feed.name, status, ...empty, error: err instanceof Error ? err.message : 'Unknown error.' };
  }
}
