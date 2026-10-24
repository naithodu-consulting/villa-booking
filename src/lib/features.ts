/**
 * Pages that are built but switched off.
 *
 * Events: hidden 2026-09-28 pending the operator's review. Off removes it from
 * the header, drawer, footer and sitemap, and the route returns 404. Flip to
 * true to bring it back; nothing else needs to change.
 */
export const EVENTS_PAGE_ENABLED = false;

/**
 * Online payment, and everything that leads to it.
 *
 * Razorpay go-live is still in progress, so production takes reservations by
 * phone and email instead: every Book Now opens a notice with the two contact
 * lines, /book serves that notice instead of the checkout, and create-order
 * refuses. Flip it on by setting NEXT_PUBLIC_ONLINE_PAYMENTS_ENABLED=true.
 *
 * Deliberately off unless the variable says otherwise. The opposite default
 * would mean one forgotten variable on a host is a live payment screen in front
 * of guests; this way a forgotten variable only shows the notice. Local and the
 * Vercel preview set it to true, so they still exercise the full flow.
 *
 * NEXT_PUBLIC_ because the CTAs are client components: it is inlined at build
 * time, so the value has to be present when the host builds, not just when it
 * runs. Server code reads the same constant, so the two can never disagree.
 */
export const ONLINE_PAYMENTS_ENABLED =
  process.env.NEXT_PUBLIC_ONLINE_PAYMENTS_ENABLED === 'true';

/**
 * Calendar sync with booking channels (Airbnb).
 *
 * The switch for the whole feature. Off means /api/cron/ical-sync does
 * nothing and says so: no fetch to Airbnb, and from Phase 1 no write to
 * blocked_dates. Flip it off and the next scheduled run is a no-op, with
 * whatever is already in blocked_dates left exactly as it stands - turning the
 * sync off never frees a night, because a night that is genuinely sold on
 * Airbnb is still sold.
 *
 * Deliberately off unless the variable says otherwise, matching the payments
 * flag above. A sync writes to the calendar that decides what the site sells,
 * so a forgotten variable on a host should mean "did nothing", never "started
 * blocking dates". The route reports the disabled state in its response rather
 * than silently succeeding, so a cron log shows the difference between "off"
 * and "ran and found nothing".
 *
 * Not NEXT_PUBLIC_: nothing in the browser knows or cares that a block came
 * from a channel, so this is read at runtime on the server and can be changed
 * without a rebuild - unlike the payments flag, which is inlined into the
 * client bundle at build time.
 *
 * For switching off one channel while keeping others, there is
 * ical_feeds.is_active. This constant is the bigger hammer: the whole feature.
 */
export const ICAL_SYNC_ENABLED = process.env.ICAL_SYNC_ENABLED === 'true';
