import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

import { nightsBetween, paiseToRupees } from '@/lib/analytics';

/**
 * The `purchase` event, sent from the server.
 *
 * Every other event in this app is sent from the browser. This one cannot be:
 * a guest can close the tab the moment they finish paying, and the Razorpay
 * webhook is then the only thing that ever learns the booking was confirmed.
 * A browser-sent purchase would quietly undercount revenue, and undercount it
 * worst on mobile, where tabs are closed soonest.
 *
 * Sent once per booking. Both confirmation paths — the verify-payment call and
 * the webhook — reach this, and exactly one of them gets through: see
 * `reportPurchase`.
 *
 * Never throws. A booking is not allowed to fail because Google is slow.
 */

const MP_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const MP_DEBUG_ENDPOINT = 'https://www.google-analytics.com/debug/mp/collect';

/** Google gives up on a Measurement Protocol request long before a guest would. */
const SEND_TIMEOUT_MS = 2000;

export interface PurchaseBooking {
  booking_code: string | null;
  reference_number: string | null;
  total_amount: number;
  tax_amount: number | null;
  discount_code: string | null;
  check_in: string;
  check_out: string;
  num_adults: number | null;
  num_children: number | null;
  created_at: string | null;
  property_name?: string | null;
}

export interface GaIdentifiers {
  clientId: string | null;
  sessionId: string | null;
}

/**
 * A GA client id for a guest who has none.
 *
 * Declining cookies means no `_ga` cookie, so there is nothing to attribute
 * to. The booking is still counted — dropping it would understate revenue to
 * protect a guest from being counted, which is not what they declined. It
 * arrives with no journey attached, which is exactly what declining means.
 *
 * Shaped like a real client id (`<random>.<seconds>`) because GA4 rejects
 * values that are not.
 */
export function syntheticClientId(now: number = Date.now()): string {
  const random = Math.floor(Math.random() * 1_000_000_000);
  return `${random}.${Math.floor(now / 1000)}`;
}

/**
 * The Measurement Protocol body for a confirmed booking.
 *
 * Pure, and exported, so the shape can be tested without sending anything:
 * Google answers a malformed event with `204 No Content` exactly as it answers
 * a good one, so a broken payload is invisible in production.
 */
export function buildPurchasePayload(
  booking: PurchaseBooking,
  ga: GaIdentifiers,
  now: number = Date.now(),
): Record<string, unknown> {
  const value = paiseToRupees(booking.total_amount);
  const nights = nightsBetween(booking.check_in, booking.check_out);

  // The booking code, not the database id: it is what appears on the invoice
  // and in the operator's inbox, so a figure in GA4 can be traced to a real
  // booking. It identifies a booking, not a person.
  const transactionId = booking.booking_code ?? booking.reference_number ?? '';

  const params: Record<string, unknown> = {
    currency: 'INR',
    value,
    transaction_id: transactionId,
    tax: paiseToRupees(booking.tax_amount ?? 0),
    nights,
    lead_time_days: leadTimeFromBooking(booking),
    // Without this the hit counts as a session with no engagement, and GA4
    // files it outside the session it belongs to.
    engagement_time_msec: 1,
    items: [
      {
        item_id: 'villa-stay',
        item_name: booking.property_name ?? 'Villa 19',
        item_category: 'stay',
        price: value,
        quantity: 1,
      },
    ],
  };

  // Only when there is one: GA4 reads `coupon` as "a discount was used", so an
  // empty string would report every full-price booking as a discounted one.
  if (booking.discount_code) params.coupon = booking.discount_code;

  // The session the booking came from. Without it the event attaches to the
  // user but to no session, and arrives with no source or medium.
  if (ga.sessionId) params.session_id = ga.sessionId;

  return {
    client_id: ga.clientId ?? syntheticClientId(now),
    // Guests who declined are not profiled for advertising on the strength of
    // a booking they made anyway.
    non_personalized_ads: !ga.clientId,
    events: [{ name: 'purchase', params }],
  };
}

/** Whole days between the booking being made and the guest arriving. */
function leadTimeFromBooking(booking: PurchaseBooking): number {
  if (!booking.created_at) return 0;
  const bookedOn = booking.created_at.slice(0, 10);
  return nightsBetween(bookedOn, booking.check_in);
}

/**
 * Reports a confirmed booking to GA4.
 *
 * Called from whichever path confirmed the booking, right beside the
 * confirmation emails, and for the same reason it is safe to do so: the
 * compare-and-swap on `payments.status` upstream has already decided that this
 * caller — and only this caller — is the one that confirmed it. That is the
 * same gate the emails rely on, and an email that double-sends is far more
 * visible than a double-counted purchase, so it is a gate we would hear about
 * if it ever failed.
 *
 * A second claim column was considered and rejected: it would be a second
 * mechanism for a guarantee the codebase already makes once, and two
 * mechanisms for one rule is how they drift apart.
 */
export async function reportPurchase(supabase: SupabaseClient, bookingId: string): Promise<void> {
  try {
    const measurementId = process.env.NEXT_PUBLIC_GA_ID;
    const apiSecret = process.env.GA4_API_SECRET;
    // Not configured is the normal state until GA4 is switched on, and is not
    // worth a line in the log on every booking.
    if (!measurementId || !apiSecret) return;

    const { data: booking } = await supabase
      .from('bookings')
      .select(
        'booking_code, reference_number, total_amount, tax_amount, discount_code, check_in, check_out, num_adults, num_children, created_at, properties(name)',
      )
      .eq('id', bookingId)
      .single();

    if (!booking) {
      console.error(`[analytics] purchase not sent: booking ${bookingId} could not be read`);
      return;
    }

    const { data: payment } = await supabase
      .from('payments')
      .select('ga_client_id, ga_session_id')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const property = Array.isArray(booking.properties) ? booking.properties[0] : booking.properties;

    const payload = buildPurchasePayload(
      { ...booking, property_name: (property as { name?: string } | null)?.name ?? null },
      { clientId: payment?.ga_client_id ?? null, sessionId: payment?.ga_session_id ?? null },
    );

    const url = `${MP_ENDPOINT}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(`[analytics] purchase for ${bookingId} refused by GA4: ${response.status}`);
    }
  } catch (err) {
    // The booking is confirmed and the guest has been charged. Nothing here is
    // allowed to change that.
    console.error(`[analytics] purchase for ${bookingId} not sent; the booking stands:`, err);
  }
}

/**
 * The same payload, put to GA4's validation endpoint instead of its collector.
 *
 * `mp/collect` answers 204 whatever it is sent, so the only way to learn that
 * an event is malformed is to ask. Used by scripts/check-ga4-purchase.mjs
 * rather than at runtime.
 */
export async function validatePurchasePayload(
  payload: Record<string, unknown>,
  measurementId: string,
  apiSecret: string,
): Promise<{ validationMessages: unknown[] }> {
  const url = `${MP_DEBUG_ENDPOINT}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
}
