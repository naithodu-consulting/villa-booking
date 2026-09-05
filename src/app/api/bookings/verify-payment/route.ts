import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { sendBookingConfirmation, sendAdminNewBookingNotification } from '@/lib/email';

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

    const signaturesMatch =
      expected.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(razorpay_signature, 'hex'),
      );

    if (!signaturesMatch) {
      return NextResponse.json({ error: 'Payment signature invalid.' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Update payment and fetch booking_id in one round trip
    const { data: payment, error: updateError } = await supabase
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'captured',
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .select('booking_id')
      .single();

    if (updateError) {
      console.error('[verify-payment] Failed to update payment:', updateError.message);
      return NextResponse.json({ error: 'Could not confirm payment. Contact support.' }, { status: 503 });
    }

    if (payment?.booking_id) {
      // The guest has paid, so the booking is always honoured — including when the
      // 15-minute hold lapsed while they were in the Razorpay modal. Clearing
      // hold_expires_at makes the row permanent.
      const { data: booking } = await supabase
        .from('bookings')
        .update({ status: 'confirmed', payment_status: 'paid', hold_expires_at: null })
        .eq('id', payment.booking_id)
        .select('property_id, reference_number, guest_name, guest_email, guest_phone, check_in, check_out, num_adults, num_children, total_amount')
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
            `[verify-payment] DOUBLE BOOKING — ${booking.reference_number} was paid after its ` +
            `hold lapsed and ${clash} confirmed booking(s) now overlap ${booking.check_in}→${booking.check_out}. ` +
            `Payment honoured; needs manual resolution.`
          );
        }

        const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const emailParams = {
          guestEmail: booking.guest_email,
          guestName: booking.guest_name,
          bookingRef: booking.reference_number,
          propertyName: 'Villa 19 by Habbaa',
          checkIn: fmt(booking.check_in),
          checkOut: fmt(booking.check_out),
          guests: (booking.num_adults ?? 0) + (booking.num_children ?? 0),
          totalPaise: booking.total_amount,
        };
        await Promise.all([
          sendBookingConfirmation(emailParams),
          sendAdminNewBookingNotification({
            bookingRef: booking.reference_number,
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
