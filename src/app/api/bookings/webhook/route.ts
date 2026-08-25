import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Razorpay webhook handler.
 * Verifies HMAC-SHA256 signature before processing any payment event.
 * Idempotent: safe to receive the same event multiple times.
 * Always returns 200 to Razorpay; errors are logged server-side.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') ?? '';
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';

  // Signature verification — never skip
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (!secret || expectedSignature !== signature) {
    console.warn('[webhook] Invalid or missing signature — rejecting event');
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
    const supabase = await createServiceClient();

    switch (eventType) {
      case 'payment.captured': {
        const entity = extractEntity(event, 'payment');
        const orderId = entity?.order_id as string;
        const paymentId = entity?.id as string;
        const signature = entity?.acquirer_data
          ? (entity.acquirer_data as Record<string, string>)?.rrn
          : null;

        if (orderId && paymentId) {
          // Mark booking confirmed and record payment
          const { error } = await supabase
            .from('payments')
            .update({
              razorpay_payment_id: paymentId,
              razorpay_signature: signature ?? null,
              status: 'captured',
              raw_payload: entity,
            })
            .eq('razorpay_order_id', orderId);

          if (error) {
            console.error('[webhook] Failed to update payment record:', error.message);
          } else {
            // Mark associated booking as confirmed + paid
            const { data: payment } = await supabase
              .from('payments')
              .select('booking_id')
              .eq('razorpay_order_id', orderId)
              .single();

            if (payment?.booking_id) {
              await supabase
                .from('bookings')
                .update({ status: 'confirmed', payment_status: 'paid' })
                .eq('id', payment.booking_id);
            }
          }
        }
        console.info(`[webhook] payment.captured — order: ${orderId}, payment: ${paymentId}`);
        break;
      }

      case 'payment.failed': {
        const entity = extractEntity(event, 'payment');
        const orderId = entity?.order_id as string;

        if (orderId) {
          await supabase
            .from('payments')
            .update({ status: 'failed', raw_payload: entity })
            .eq('razorpay_order_id', orderId);

          // Release booking hold — revert to cancelled so dates free up
          const { data: payment } = await supabase
            .from('payments')
            .select('booking_id')
            .eq('razorpay_order_id', orderId)
            .single();

          if (payment?.booking_id) {
            await supabase
              .from('bookings')
              .update({ status: 'cancelled', payment_status: 'unpaid' })
              .eq('id', payment.booking_id);
          }
        }
        console.warn(`[webhook] payment.failed — order: ${orderId}`);
        break;
      }

      case 'refund.processed': {
        const entity = extractEntity(event, 'refund');
        const paymentId = entity?.payment_id as string;
        console.info(`[webhook] refund.processed — payment: ${paymentId}`);
        // TODO: record refund row and notify guest via Resend
        break;
      }

      default:
        console.info(`[webhook] Unhandled event type: ${eventType}`);
    }
  } catch (err) {
    // Log but still return 200 — Razorpay retries on non-200 which could cause duplicates
    console.error('[webhook] Handler error (suppressed for idempotency):', err);
  }

  return NextResponse.json({ received: true });
}

function extractEntity(event: Record<string, unknown>, key: string) {
  const payload = event.payload as Record<string, unknown> | undefined;
  const wrapper = payload?.[key] as Record<string, unknown> | undefined;
  return wrapper?.entity as Record<string, unknown> | undefined;
}
