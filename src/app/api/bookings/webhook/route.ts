import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { hexSignatureMatches } from '@/lib/signature';
import { sendRefundConfirmation } from '@/lib/email';
import { notifyConfirmedBooking } from '@/lib/booking-notify';

interface PaymentEntity {
  id: string;
  order_id: string;
  amount: number;
  acquirer_data?: Record<string, string>;
}

interface RefundEntity {
  id: string;
  payment_id: string;
  amount: number; // paise
}

/** Ask Razorpay to redeliver. Safe because every state change below is a
 *  compare-and-swap, so a duplicate delivery updates zero rows. */
function retryLater(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * POST /api/bookings/webhook
 *
 * Razorpay async webhook — safety net for browser-drop or network failures
 * after payment capture. Idempotent by design.
 *
 * Events handled:
 *   payment.captured — mark booking confirmed + payment captured
 *   payment.failed   — release booking hold (cancelled + unpaid)
 *   refund.processed — mark payment refunded, booking cancelled
 *
 * Every state change is a compare-and-swap on payments.status, so a retried
 * event, or a capture that verify-payment already recorded, updates zero rows
 * and sends no email. Delivery order is not guaranteed, which is why a late
 * payment.failed can never undo a capture.
 *
 * Because of that CAS, a transient failure returns 500 so Razorpay redelivers:
 * acknowledging it instead would discard the very capture this endpoint exists
 * to recover. A permanent condition — an unknown order, an already-settled
 * payment, an unhandled event type, an amount that does not match — is
 * acknowledged with 200, since no retry can change it.
 *
 * Unverified: how long Razorpay keeps retrying, and whether it deactivates an
 * endpoint after sustained failures. If it does, a long outage could switch
 * this safety net off instead of deferring it. Check before relying on it.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') ?? '';
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';

  if (!secret) {
    console.error('[webhook] RAZORPAY_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (!hexSignatureMatches(expectedSignature, signature)) {
    console.warn('[webhook] Invalid signature — rejecting event');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const eventType = event.event as string;

  try {
    const supabase = createServiceClient();

    switch (eventType) {

      case 'payment.captured': {
        const entity = extractEntity<PaymentEntity>(event, 'payment');
        const orderId   = entity?.order_id;
        const paymentId = entity?.id;

        if (!orderId || !paymentId) break;

        // Read the expected total before the swap. payments.amount is the figure
        // create-order computed server-side and handed to Razorpay, so it is the
        // authoritative one; bookings.total_amount is pre-discount and would not
        // match on any promo booking.
        const { data: expected, error: lookupError } = await supabase
          .from('payments')
          .select('amount')
          .eq('razorpay_order_id', orderId)
          .maybeSingle();

        if (lookupError) {
          console.error('[webhook] payment.captured — lookup failed:', lookupError.message);
          return retryLater('Could not read payment');
        }

        if (!expected) {
          console.info(`[webhook] payment.captured — order ${orderId} is not from this app, ignoring`);
          break;
        }

        // Checked even when verify-payment already recorded the capture, so a
        // mismatch the browser path waved through still surfaces here.
        if (typeof entity.amount === 'number' && entity.amount !== expected.amount) {
          console.error(
            `[webhook] payment.captured — AMOUNT MISMATCH on order ${orderId}: captured ` +
            `${entity.amount} paise, expected ${expected.amount}. Booking left unconfirmed; ` +
            `needs manual resolution.`
          );
          break;
        }

        // 'expired' and 'failed' are included: a guest can pay after the hold
        // lapses, or succeed on a retry after a failed attempt on the same order.
        const { data: payment, error } = await supabase
          .from('payments')
          .update({
            razorpay_payment_id: paymentId,
            status: 'captured',
            raw_payload: entity,
          })
          .eq('razorpay_order_id', orderId)
          .in('status', ['created', 'expired', 'failed'])
          .select('booking_id')
          .maybeSingle();

        if (error) {
          console.error('[webhook] payment.captured — update failed:', error.message);
          return retryLater('Could not record capture');
        }

        if (!payment) {
          console.info(`[webhook] payment.captured — order ${orderId} already processed, skipping`);
          break;
        }

        if (payment.booking_id) {
          const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .update({ status: 'confirmed', payment_status: 'paid', hold_expires_at: null })
            .eq('id', payment.booking_id)
            .select('id')
            .single();

          if (bookingError) {
            // The payment row now says captured, so a redelivery will skip the
            // swap above and fall to "already processed" without confirming the
            // booking. Shout rather than retry into that dead end.
            console.error(
              `[webhook] payment.captured — payment recorded but booking ${payment.booking_id} ` +
              `could not be confirmed: ${bookingError.message}. Needs manual resolution.`
            );
            break;
          }

          await notifyConfirmedBooking(supabase, booking.id, 'Online (Razorpay webhook)');
        }

        console.info(`[webhook] payment.captured — order: ${orderId}, payment: ${paymentId}`);
        break;
      }

      case 'payment.failed': {
        const entity = extractEntity<PaymentEntity>(event, 'payment');
        const orderId = entity?.order_id;

        if (!orderId) break;

        // Never touch a captured or refunded payment: a late failed event from an
        // earlier attempt must not cancel a booking that has since been paid.
        const { data: payment, error } = await supabase
          .from('payments')
          .update({ status: 'failed', raw_payload: entity })
          .eq('razorpay_order_id', orderId)
          .in('status', ['created', 'expired'])
          .select('booking_id')
          .maybeSingle();

        if (error) {
          console.error('[webhook] payment.failed — update failed:', error.message);
          return retryLater('Could not record failure');
        }

        if (payment?.booking_id) {
          const { error: releaseError } = await supabase
            .from('bookings')
            .update({ status: 'cancelled', payment_status: 'unpaid' })
            .eq('id', payment.booking_id)
            .eq('status', 'pending');

          if (releaseError) {
            // Harmless to leave: hold_expires_at frees the dates anyway.
            console.error('[webhook] payment.failed — could not release hold:', releaseError.message);
          }
        }

        console.warn(`[webhook] payment.failed — order: ${orderId}${payment ? '' : ' (ignored, payment already settled)'}`);
        break;
      }

      case 'refund.processed': {
        const entity = extractEntity<RefundEntity>(event, 'refund');
        const paymentId = entity?.payment_id;

        if (!paymentId) break;

        // No amount check here: partial refunds are legitimate, so the refunded
        // figure is expected to differ from what was captured.
        //
        // Compare-and-swap from captured, so a redelivered event sends no second
        // refund email. Zero rows also covers payments not made through this app.
        const { data: payment, error } = await supabase
          .from('payments')
          .update({ status: 'refunded', raw_payload: entity })
          .eq('razorpay_payment_id', paymentId)
          .eq('status', 'captured')
          .select('booking_id')
          .maybeSingle();

        if (error) {
          console.error('[webhook] refund.processed — update failed:', error.message);
          return retryLater('Could not record refund');
        }

        if (!payment) {
          console.info(`[webhook] refund.processed — payment ${paymentId} unknown or already refunded, ignoring`);
          break;
        }

        if (payment.booking_id) {
          const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .update({ status: 'cancelled', payment_status: 'refunded' })
            .eq('id', payment.booking_id)
            .select('reference_number, booking_code, guest_name, guest_email, total_amount')
            .single();

          if (bookingError) {
            // As with capture, the payment row has already moved, so a retry
            // would skip the swap and never reach this branch again.
            console.error(
              `[webhook] refund.processed — payment marked refunded but booking ` +
              `${payment.booking_id} could not be cancelled: ${bookingError.message}. ` +
              `Dates may still be blocked; needs manual resolution.`
            );
            break;
          }

          await sendRefundConfirmation({
            guestEmail: booking.guest_email,
            guestName: booking.guest_name,
            bookingRef: booking.booking_code ?? booking.reference_number,
            refundPaise: entity?.amount ?? booking.total_amount,
          });
        }

        console.info(`[webhook] refund.processed — payment: ${paymentId}, booking: ${payment.booking_id}`);
        break;
      }

      default:
        console.info(`[webhook] Unhandled event type acknowledged: ${eventType}`);
    }
  } catch (err) {
    // Could be a transient outage (Supabase unreachable, email provider down),
    // so ask for a redelivery rather than losing the event. The CAS makes the
    // retry safe; a genuine code bug shows up as repeated 500s in the logs.
    console.error('[webhook] Handler error, requesting redelivery:', err);
    return retryLater('Handler error');
  }

  return NextResponse.json({ received: true });
}

function extractEntity<T>(event: Record<string, unknown>, key: string): T | undefined {
  const payload = event.payload as Record<string, unknown> | undefined;
  const wrapper = payload?.[key] as Record<string, unknown> | undefined;
  return wrapper?.entity as T | undefined;
}
