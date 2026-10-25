/**
 * The one signal a booking CTA sends: "this guest wants to book."
 *
 * It lives apart from the dialogs so that both can listen for it without either
 * importing the other. The layout decides which dialog is mounted, so a CTA
 * never has to know whether online payment is switched on: Header, CtaButtons,
 * the homepage bar and anything added later all dispatch this and get whichever
 * answer is correct for the environment.
 */
import { track, pageType, type Source } from '@/lib/analytics';
import { ONLINE_PAYMENTS_ENABLED } from '@/lib/features';

export const OPEN_BOOKING_EVENT = 'villa19:open-booking';

/**
 * Opens the booking flow, and records that it was asked for.
 *
 * Every CTA goes through this rather than dispatching the event itself, so the
 * measurement cannot be forgotten by the next button someone adds: there is one
 * way to open booking, and it is this. `source` is the only thing a CTA has to
 * say about itself, because it is the only thing it knows that this file
 * cannot work out.
 *
 * `payments_enabled` is recorded here, at the fork, because it decides which
 * of the two funnels the guest is about to enter: the checkout, or the notice
 * asking them to phone. Without it, the same event would mean two different
 * things either side of Razorpay go-live and the before/after comparison would
 * be meaningless.
 */
export function openBooking(source: Source) {
  track('booking_intent', {
    source,
    payments_enabled: ONLINE_PAYMENTS_ENABLED,
    page_type: pageType(window.location.pathname),
  });
  window.dispatchEvent(new CustomEvent(OPEN_BOOKING_EVENT));
}
