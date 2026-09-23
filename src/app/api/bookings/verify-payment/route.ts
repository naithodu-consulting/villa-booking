import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { hexSignatureMatches } from '@/lib/signature';
import { sendBookingConfirmation, sendAdminNewBookingNotification } from '@/lib/email';
import { SITE_URL } from '@/lib/seo';
import { idShareWhatsAppUrl } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment verification fields.' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Payment verification not configured.' }, { status: 503 });
    }

    // Verify HMAC-SHA256 with timingSafeEqual to prevent timing attacks
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (!hexSignatureMatches(expected, razorpay_signature)) {
      return NextResponse.json({ error: 'Payment signature invalid.' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Compare-and-swap: only the first caller (this route or the webhook) moves
    // the payment to captured, and only that caller sends the emails. 'expired'
    // covers a guest who paid after the hold lapsed; 'failed' a retry that
    // succeeded after an earlier failed attempt on the same order.
    const { data: payment, error: updateError } = await supabase
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'captured',
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .in('status', ['created', 'expired', 'failed'])
      .select('booking_id')
      .maybeSingle();

    if (updateError) {
      console.error('[verify-payment] Failed to update payment:', updateError.message);
      return NextResponse.json({ error: 'Could not confirm payment. Contact support.' }, { status: 503 });
    }

    if (!payment) {
      // Already captured (double-submit, or the webhook got there first) is a
      // success for the guest. Anything else means no such order.
      const { data: existing } = await supabase
        .from('payments')
        .select('status')
        .eq('razorpay_order_id', razorpay_order_id)
        .maybeSingle();

      if (existing?.status === 'captured') {
        return NextResponse.json({ verified: true });
      }
      console.error(`[verify-payment] No payable payment row for order ${razorpay_order_id} (status: ${existing?.status ?? 'missing'})`);
      return NextResponse.json({ error: 'Could not confirm payment. Contact support.' }, { status: 409 });
    }

    if (payment.booking_id) {
      // The guest has paid, so the booking is always honoured — including when the
      // 15-minute hold lapsed while they were in the Razorpay modal. Clearing
      // hold_expires_at makes the row permanent.
      const { data: booking } = await supabase
        .from('bookings')
        .update({ status: 'confirmed', payment_status: 'paid', hold_expires_at: null })
        .eq('id', payment.booking_id)
        .select('property_id, reference_number, booking_code, access_token, guest_name, guest_email, guest_phone, check_in, check_out, num_adults, num_children, total_amount')
        .single();

      if (booking) {
        // A lapsed hold can be re-taken by someone else before payment lands. That
        // is a genuine double-booking needing a human, not something to resolve by
        // refusing a guest who has already been charged.
        const { count: clash } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('property_id', booking.property_id)
          .eq('status', 'confirmed')
          .neq('id', payment.booking_id)
          .lt('check_in', booking.check_out)
          .gt('check_out', booking.check_in);

        if ((clash ?? 0) > 0) {
          console.error(
            `[verify-payment] DOUBLE BOOKING — ${booking.booking_code} (${booking.reference_number}) was paid after its ` +
            `hold lapsed and ${clash} confirmed booking(s) now overlap ${booking.check_in}→${booking.check_out}. ` +
            `Payment honoured; needs manual resolution.`
          );
        }

        const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const emailParams = {
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
          guests: (booking.num_adults ?? 0) + (booking.num_children ?? 0),
          totalPaise: booking.total_amount,
        };
        await Promise.all([
          sendBookingConfirmation(emailParams),
          sendAdminNewBookingNotification({
            bookingRef: booking.booking_code ?? booking.reference_number,
            guestName: booking.guest_name,
            guestEmail: booking.guest_email,
            guestPhone: booking.guest_phone ?? undefined,
            checkIn: fmt(booking.check_in),
            checkOut: fmt(booking.check_out),
            guests: emailParams.guests,
            totalPaise: booking.total_amount,
            channel: 'Online (Razorpay)',
          }),
        ]);
      }
    }

    return NextResponse.json({ verified: true });
  } catch (err) {
    console.error('[verify-payment] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
