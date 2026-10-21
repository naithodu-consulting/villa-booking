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
