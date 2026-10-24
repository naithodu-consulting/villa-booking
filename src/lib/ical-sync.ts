import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

import { fetchIcal, IcalFetchError, redactFeedUrl } from '@/lib/ical-fetch';
import { parseIcal, classifyEvents, eventSetFingerprint, nightsBetween, IcalParseError, type IcalEvent } from '@/lib/ical';
import { todayISO } from '@/lib/format';
import { sendIcalConflictAlert } from '@/lib/email';

/**
 * Running one channel calendar sync.
 *
 * The dry run proved the reading half; this applies it. The order of
 * operations is the whole design, and it is this:
 *
 *   fetch -> parse -> classify -> (only now) write
 *
 * Every step before the write can abort, and aborting leaves blocked_dates
 * exactly as it was. That matters because applying a feed REPLACES its rows:
 * an empty event list frees every imported night. Correct when Airbnb really
 * has no bookings; catastrophic when it is what a 502 page parsed to. So the
 * single rule this file exists to enforce is that nothing reaches
 * apply_ical_feed() unless a calendar was genuinely read and understood.
 *
 * See docs/AIRBNB_ICAL_SYNC.md.
 */

export interface FeedRow {
  id: string;
  property_id: string;
  name: string;
  url: string;
  last_fingerprint: string | null;
}

export type SyncStatus = 'ok' | 'unchanged' | 'fetch_failed' | 'parse_failed' | 'held_for_review';

export interface SyncResult {
  feed: string;
  status: SyncStatus;
  applied: number;
  removed: number;
  dropped: { start: string; end: string; nights: number; reason: string }[];
  nights: number;
  conflicts: ConflictReport[];
  reviewReasons: string[];
  error?: string;
}

export interface ConflictReport {
  bookingId: string;
  reference: string;
  checkIn: string;
  checkOut: string;
  feedStart: string;
  feedEnd: string;
}

export async function syncFeed(supabase: SupabaseClient, feed: FeedRow): Promise<SyncResult> {
  const base = { feed: feed.name, applied: 0, removed: 0, dropped: [], nights: 0, conflicts: [], reviewReasons: [] };

  // ── 1. Fetch. Anything short of a clean read stops here. ────────────────
  let body: string;
  try {
    ({ body } = await fetchIcal(feed.url));
  } catch (err) {
    const message = err instanceof IcalFetchError ? err.message : 'Unknown fetch error.';
    await recordFailure(supabase, feed, 'fetch_failed', message);
    return { ...base, status: 'fetch_failed', error: message };
  }

  // ── 2. Parse. An error page is not an empty calendar. ───────────────────
  let events: IcalEvent[];
  try {
    ({ events } = parseIcal(body));
  } catch (err) {
    const message = err instanceof IcalParseError ? err.message : 'Unknown parse error.';
    await recordFailure(supabase, feed, 'parse_failed', message);
    return { ...base, status: 'parse_failed', error: message };
  }

  const fingerprint = eventSetFingerprint(events);

  // ── 3. Classify: drop the channel's own availability horizon, hold
  //       anything implausible for a human. ───────────────────────────────
  const classified = classifyEvents(events, { today: todayISO() });
  const dropped = classified.dropped.map((d) => ({
    start: d.event.start,
    end: d.event.end,
    nights: d.nights,
    reason: d.reason,
  }));

  if (classified.heldForReview) {
    const message = classified.reviewReasons.join(' ');
    await recordFailure(supabase, feed, 'held_for_review', message);
    return { ...base, status: 'held_for_review', dropped, reviewReasons: classified.reviewReasons, error: message };
  }

  // Nothing changed since last time. Checked after classification so that a
  // feed whose only change was its horizon still counts as unchanged.
  if (feed.last_fingerprint && feed.last_fingerprint === fingerprint) {
    await touch(supabase, feed);
    return { ...base, status: 'unchanged', dropped, nights: classified.totalNights };
  }

  // ── 4. Conflicts, found BEFORE writing so the report describes the
  //       collision rather than the state after it. ──────────────────────
  const conflicts = await findConflicts(supabase, feed.property_id, classified.apply);

  // ── 5. Apply, atomically. ───────────────────────────────────────────────
  const payload = classified.apply.map((e) => ({ start: e.start, end: e.end, uid: e.uid, summary: e.summary }));
  const { data, error } = await supabase.rpc('apply_ical_feed', {
    p_feed_id: feed.id,
    p_events: payload,
    p_fingerprint: fingerprint,
  });

  if (error) {
    await recordFailure(supabase, feed, 'fetch_failed', `apply failed: ${error.message}`);
    return { ...base, status: 'fetch_failed', dropped, error: error.message };
  }

  const row = (Array.isArray(data) ? data[0] : data) as { removed: number; inserted: number } | null;

  // ── 6. Tell a human about a double sale. After the write, because the
  //       block itself is harmless - the night was already taken - and an
  //       email failing must not roll back a correct import. ─────────────
  if (conflicts.length > 0) {
    await reportConflicts(supabase, feed, conflicts);
  }

  return {
    ...base,
    status: 'ok',
    applied: row?.inserted ?? 0,
    removed: row?.removed ?? 0,
    dropped,
    nights: classified.totalNights,
    conflicts,
  };
}

/**
 * Channel nights that land on a confirmed booking of ours.
 *
 * This means the villa is sold twice and a human has to decide which guest to
 * move. Nothing here attempts to resolve it: the block is applied anyway,
 * because the night is already unavailable and blocking it changes nothing for
 * a guest, and the conflict is recorded and emailed.
 */
async function findConflicts(
  supabase: SupabaseClient,
  propertyId: string,
  events: IcalEvent[],
): Promise<ConflictReport[]> {
  if (events.length === 0) return [];

  const { data } = await supabase
    .from('bookings')
    .select('id, reference_number, check_in, check_out')
    .eq('property_id', propertyId)
    .eq('status', 'confirmed');

  const bookings = data ?? [];

  // Half-open overlap, the same predicate check_availability() uses.
  return events.flatMap((e) =>
    bookings
      .filter((b) => e.start < b.check_out && e.end > b.check_in)
      .map((b) => ({
        bookingId: b.id as string,
        reference: b.reference_number as string,
        checkIn: b.check_in as string,
        checkOut: b.check_out as string,
        feedStart: e.start,
        feedEnd: e.end,
      })),
  );
}

async function reportConflicts(supabase: SupabaseClient, feed: FeedRow, conflicts: ConflictReport[]) {
  // Recorded first: the email can fail, and a conflict that exists only in a
  // mail that bounced is a conflict nobody ever learns about.
  const { error } = await supabase.from('ical_conflicts').insert(
    conflicts.map((c) => ({
      feed_id: feed.id,
      booking_id: c.bookingId,
      feed_start: c.feedStart,
      feed_end: c.feedEnd,
      notes: `${feed.name} blocked ${c.feedStart} to ${c.feedEnd}, overlapping confirmed booking ${c.reference}.`,
    })),
  );
  if (error) console.error('[ical-sync] could not record conflicts:', error.message);

  try {
    await sendIcalConflictAlert({
      channel: feed.name,
      conflicts: conflicts.map((c) => ({
        reference: c.reference,
        checkIn: c.checkIn,
        checkOut: c.checkOut,
        feedStart: c.feedStart,
        feedEnd: c.feedEnd,
        nights: nightsBetween(c.feedStart, c.feedEnd),
      })),
    });
  } catch (err) {
    console.error('[ical-sync] conflict email failed; the conflict is recorded in ical_conflicts:', err);
  }
}

async function recordFailure(supabase: SupabaseClient, feed: FeedRow, status: SyncStatus, message: string) {
  // The URL is a bearer credential, so it never reaches a log line or a column.
  console.error(`[ical-sync] ${feed.name} ${status}: ${message} (${redactFeedUrl(feed.url)})`);
  const { error } = await supabase.rpc('record_ical_failure', {
    p_feed_id: feed.id,
    p_status: status,
    p_error: message,
  });
  if (error) console.error('[ical-sync] could not record failure status:', error.message);
}

/** A successful run that changed nothing still proves the sync is alive. */
async function touch(supabase: SupabaseClient, feed: FeedRow) {
  const { error } = await supabase.rpc('record_ical_failure', {
    p_feed_id: feed.id,
    p_status: 'ok',
    p_error: null,
  });
  if (error) console.error('[ical-sync] could not update feed status:', error.message);
}

/** Every active feed for the active property. */
export async function activeFeeds(supabase: SupabaseClient, propertyId: string): Promise<FeedRow[]> {
  const { data, error } = await supabase
    .from('ical_feeds')
    .select('id, property_id, name, url, last_fingerprint')
    .eq('property_id', propertyId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return (data ?? []) as FeedRow[];
}
