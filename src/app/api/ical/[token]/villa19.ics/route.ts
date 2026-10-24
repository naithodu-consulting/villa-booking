import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { hexSignatureMatches } from '@/lib/signature';
import { buildIcalCalendar, collapseNights } from '@/lib/ical-export';
import { addDaysISO, todayISO } from '@/lib/format';
import { getProperty } from '@/lib/data';
import { ICAL_SYNC_ENABLED } from '@/lib/features';
import { LIMITS, rateLimit, tooManyRequests } from '@/lib/rate-limit';

/**
 * GET /api/ical/<token>/villa19.ics
 *
 * The calendar we publish to booking channels. This is the URL pasted into
 * Airbnb's "Connect to another website", Step 2, after which Airbnb fetches it
 * on its own schedule and blocks these nights on the listing.
 *
 * ── This endpoint instructs a live listing ────────────────────────────────
 *
 * Everything else in this app reports. This one is read by a system that will
 * act on it with someone's money, and the dangerous answer is not an error -
 * it is a *successful* empty calendar, which to Airbnb means "nothing is
 * booked, sell every night". So every path that cannot establish the real
 * answer refuses with a status, and none of them falls through to an empty
 * VCALENDAR. Refusing leaves Airbnb holding its last good copy, which is
 * stale but safe; serving an empty one frees the villa.
 *
 * That is the same rule as the import side, from the other direction: never
 * let "I don't know" be published as "nothing".
 *
 * ── Why the path ends in .ics ─────────────────────────────────────────────
 *
 * Airbnb's form asks for "a link ending in .ics" and validates it. A query
 * parameter would not do, so the token is a path segment and the filename is
 * a real static segment.
 *
 * ── On the token ──────────────────────────────────────────────────────────
 *
 * A wrong token answers 404 rather than 403: a 403 confirms the route exists
 * and invites guessing. The comparison is constant-time. The URL is a bearer
 * credential living in a third party's database, so it exposes occupancy and
 * deliberately nothing else - no names, no references, no amounts.
 *
 * See docs/AIRBNB_ICAL_SYNC.md.
 */

/**
 * How far ahead we publish. Eighteen months in days, not addMonthsISO(), which
 * snaps to the first of the month. A channel that cannot sell that far simply
 * ignores the surplus.
 */
const HORIZON_DAYS = 550;

const notFound = () => new NextResponse(null, { status: 404 });

export async function GET(
  request: NextRequest,
  // Typed explicitly rather than with the RouteContext helper: that helper's
  // route literals are generated during a build, so a brand-new route does not
  // type-check until one has run. params is a promise in this version of Next.
  ctx: { params: Promise<{ token: string }> },
) {
  // Off means off in both directions. Not an empty calendar: see above.
  if (!ICAL_SYNC_ENABLED) return notFound();

  const expected = process.env.ICAL_EXPORT_TOKEN;
  if (!expected) return notFound();

  const { token } = await ctx.params;
  if (!hexSignatureMatches(expected, token)) return notFound();

  const limit = rateLimit(request.headers, LIMITS.icalExport.bucket, LIMITS.icalExport.limit, LIMITS.icalExport.windowMs);
  if (!limit.ok) return tooManyRequests(limit.retryAfter, 'Too many requests for this calendar.');

  try {
    const property = await getProperty();
    // No property means we cannot say what is booked. Refusing is the only
    // safe answer; an empty calendar would read as "sell everything".
    if (!property) {
      console.error('[ical/export] no active property; refusing to serve a calendar');
      return NextResponse.json({ error: 'Calendar unavailable.' }, { status: 503 });
    }

    const from = todayISO();
    const to = addDaysISO(from, HORIZON_DAYS);

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('get_export_blocked_nights', {
      p_property_id: property.id,
      p_from: from,
      p_to: to,
    });

    if (error) throw error;

    const nights = (data ?? []) as string[];
    const body = buildIcalCalendar(collapseNights(nights), {
      propertyId: property.id,
      summary: 'Villa 19 (Not available)',
    });

    return new NextResponse(body, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        // Named so a human downloading it gets something recognisable.
        'Content-Disposition': 'inline; filename="villa19-calendar.ics"',
        // Five minutes at the CDN is invisible next to a channel's own
        // multi-hour poll, and keeps a leaked URL from being free load. The
        // browser is told not to store it at all.
        'Cache-Control': 'no-store',
        'CDN-Cache-Control': 'public, s-maxage=300',
        // This is not a page and must never be framed or sniffed into one.
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch (err) {
    // Refuse, loudly. Airbnb keeps its previous copy, which is stale but safe.
    console.error('[ical/export] refusing to serve a calendar:', err);
    return NextResponse.json({ error: 'Calendar unavailable.' }, { status: 503 });
  }
}
