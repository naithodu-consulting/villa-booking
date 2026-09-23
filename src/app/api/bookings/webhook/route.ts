import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { hexSignatureMatches } from '@/lib/signature';
import { sendBookingConfirmation, sendAdminNewBookingNotification, sendRefundConfirmation } from '@/lib/email';
import { SITE_URL } from '@/lib/seo';
import { idShareWhatsAppUrl } from '@/lib/whatsapp';

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
 * Every state change is a compare-and-swap on payments.status, so a retried
 * event, or a capture that verify-payment already recorded, updates zero rows
 * and sends no email. Delivery order is not guaranteed, which is why a late
 * payment.failed can never undo a capture.
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

  if (!hexSignatureMatches(expected, signature)) {
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
          break;
        }

        if (!payment) {
          console.info(`[webhook] payment.captured — order ${orderId} already processed, skipping`);
          break;
        }

        if (payment.booking_id) {
          const { data: booking } = await supabase
            .from('bookings')
            .update({ status: 'confirmed', payment_status: 'paid', hold_expires_at: null })
            .eq('id', payment.booking_id)
            .select('reference_number, booking_code, access_token, guest_name, guest_email, guest_phone, check_in, check_out, num_adults, num_children, total_amount')
            .single();

          if (booking) {
            const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const guests = (booking.num_adults ?? 0) + (booking.num_children ?? 0);
            await Promise.all([
              sendBookingConfirmation({
                guestEmail: booking.guest_email,
                guestName: booking.guest_name,
                bookingRef: booking.booking_code ?? booking.reference_number,
                bookingUrl: `${SITE_URL}/booking/${booking.access_token}`,
                idShareUrl: process.env.PROPERTY_WHATSAPP && booking.booking_code
                  ? idShareWhatsAppUrl(process.env.PROPERTY_WHATSAPP, booking.booking_code, booking.num_adults ?? 1)
                  : undefined,
                propertyName: 'Villa 19 by Habbaa',
                checkIn: fmt(booking.check_in),
                checkOut: fmt(booking.check_out),
                guests,
                totalPaise: booking.total_amount,
              }),
              sendAdminNewBookingNotification({
                bookingRef: booking.booking_code ?? booking.reference_number,
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
          break;
        }

        if (payment?.booking_id) {
          await supabase
            .from('bookings')
            .update({ status: 'cancelled', payment_status: 'unpaid' })
            .eq('id', payment.booking_id)
            .eq('status', 'pending');
        }

        console.warn(`[webhook] payment.failed — order: ${orderId}${payment ? '' : ' (ignored, payment already settled)'}`);
        break;
      }

      case 'refund.processed': {
        const entity = extractEntity<RefundEntity>(event, 'refund');
        const paymentId = entity?.payment_id;

        if (!paymentId) break;

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
          break;
        }

        if (!payment) {
          console.info(`[webhook] refund.processed — payment ${paymentId} unknown or already refunded, ignoring`);
          break;
        }

        if (payment.booking_id) {
          const { data: booking } = await supabase
            .from('bookings')
            .update({ status: 'cancelled', payment_status: 'refunded' })
            .eq('id', payment.booking_id)
            .select('reference_number, booking_code, guest_name, guest_email, total_amount')
            .single();

          if (booking) {
            await sendRefundConfirmation({
              guestEmail: booking.guest_email,
              guestName: booking.guest_name,
              bookingRef: booking.booking_code ?? booking.reference_number,
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
