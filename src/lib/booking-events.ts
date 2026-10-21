/**
 * The one signal a booking CTA sends: "this guest wants to book."
 *
 * It lives apart from the dialogs so that both can listen for it without either
 * importing the other. The layout decides which dialog is mounted, so a CTA
 * never has to know whether online payment is switched on: Header, CtaButtons,
 * the homepage bar and anything added later all dispatch this and get whichever
 * answer is correct for the environment.
 */
export const OPEN_BOOKING_EVENT = 'villa19:open-booking';
