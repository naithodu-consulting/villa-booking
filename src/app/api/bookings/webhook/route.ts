import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { sendBookingConfirmation, sendAdminNewBookingNotification, sendRefundConfirmation } from '@/lib/email';

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
 * All other events acknowledged with 200 to suppress Razorpay retries.
 * Errors are logged but always return 200 for the same reason.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') ?? '';
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';

  if (!secret) {
    console.error('[webhook] RAZORPAY_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  // timingSafeEqual prevents HMAC timing attacks
  const signaturesMatch =
    expected.length === signature.length &&
    crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex'),
    );

  if (!signaturesMatch) {
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

        const { data: payment, error } = await supabase
          .from('payments')
          .update({
            razorpay_payment_id: paymentId,
            status: 'captured',
            raw_payload: entity,
          })
          .eq('razorpay_order_id', orderId)
          .select('booking_id')
          .single();

        if (error) {
          console.error('[webhook] payment.captured — update failed:', error.message);
          break;
        }

        if (payment?.booking_id) {
          const { data: booking } = await supabase
            .from('bookings')
            .update({ status: 'confirmed', payment_status: 'paid' })
            .eq('id', payment.booking_id)
            .select('reference_number, guest_name, guest_email, guest_phone, check_in, check_out, num_adults, num_children, total_amount')
            .single();

          if (booking) {
            const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const guests = (booking.num_adults ?? 0) + (booking.num_children ?? 0);
            await Promise.all([
              sendBookingConfirmation({
                guestEmail: booking.guest_email,
                guestName: booking.guest_name,
                bookingRef: booking.reference_number,
                propertyName: 'Villa 19 by Habbaa',
                checkIn: fmt(booking.check_in),
                checkOut: fmt(booking.check_out),
                guests,
                totalPaise: booking.total_amount,
              }),
              sendAdminNewBookingNotification({
                bookingRef: booking.reference_number,
                guestName: booking.guest_name,
                guestEmail: booking.guest_email,
                guestPhone: booking.guest_phone ?? undefined,
                checkIn: fmt(booking.check_in),
                checkOut: fmt(booking.check_out),
                guests,
                totalPaise: booking.total_amount,
                channel: 'Online (Razorpay webhook)',
              }),
            ]);
          }
        }

        console.info(`[webhook] payment.captured — order: ${orderId}, payment: ${paymentId}`);
        break;
      }

      case 'payment.failed': {
        const entity = extractEntity<PaymentEntity>(event, 'payment');
        const orderId = entity?.order_id;

        if (!orderId) break;

        const { data: payment, error } = await supabase
          .from('payments')
          .update({ status: 'failed', raw_payload: entity })
          .eq('razorpay_order_id', orderId)
          .select('booking_id')
          .single();

        if (error) {
          console.error('[webhook] payment.failed — update failed:', error.message);
          break;
        }

        if (payment?.booking_id) {
          await supabase
            .from('bookings')
            .update({ status: 'cancelled', payment_status: 'unpaid' })
            .eq('id', payment.booking_id);
        }

        console.warn(`[webhook] payment.failed — order: ${orderId}`);
        break;
      }

      case 'refund.processed': {
        const entity = extractEntity<RefundEntity>(event, 'refund');
        const paymentId = entity?.payment_id;

        if (!paymentId) break;

        // Look up payment row by razorpay_payment_id
        const { data: payment, error: lookupError } = await supabase
          .from('payments')
          .select('booking_id')
          .eq('razorpay_payment_id', paymentId)
          .maybeSingle();

        if (lookupError) {
          console.error('[webhook] refund.processed — lookup failed:', lookupError.message);
          break;
        }

        if (!payment) {
          // Payment not from this app — ignore silently
          console.info(`[webhook] refund.processed — payment ${paymentId} not found, ignoring`);
          break;
        }

        // Mark payment refunded
        await supabase
          .from('payments')
          .update({ status: 'refunded', raw_payload: entity })
          .eq('razorpay_payment_id', paymentId);

        // Mark booking cancelled with refunded payment status
        if (payment.booking_id) {
          await supabase
            .from('bookings')
            .update({ status: 'cancelled', payment_status: 'refunded' })
            .eq('id', payment.booking_id);
        }

        // Fetch booking ref + guest details for the refund email
        if (payment.booking_id) {
          const { data: booking } = await supabase
            .from('bookings')
            .select('reference_number, guest_name, guest_email, total_amount')
            .eq('id', payment.booking_id)
            .single();

          if (booking) {
            await sendRefundConfirmation({
              guestEmail: booking.guest_email,
              guestName: booking.guest_name,
              bookingRef: booking.reference_number,
              refundPaise: entity?.amount ?? booking.total_amount,
            });
          }
        }

        console.info(`[webhook] refund.processed — payment: ${paymentId}, booking: ${payment.booking_id}`);
        break;
      }

      default:
        console.info(`[webhook] Unhandled event type acknowledged: ${eventType}`);
    }
  } catch (err) {
    // Log but return 200 — Razorpay retries on non-200, risking duplicates
    console.error('[webhook] Handler error (suppressed for idempotency):', err);
  }

  return NextResponse.json({ received: true });
}

function extractEntity<T>(event: Record<string, unknown>, key: string): T | undefined {
  const payload = event.payload as Record<string, unknown> | undefined;
  const wrapper = payload?.[key] as Record<string, unknown> | undefined;
  return wrapper?.entity as T | undefined;
}
