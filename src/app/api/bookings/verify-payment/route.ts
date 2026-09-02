import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';

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

    // Verify HMAC-SHA256 — same check the webhook performs
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Payment signature invalid.' }, { status: 400 });
    }

    // Mark payment captured and booking confirmed
    const supabase = createServiceClient();

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'captured',
      })
      .eq('razorpay_order_id', razorpay_order_id);

    if (updateError) {
      console.error('[verify-payment] Failed to update payment:', updateError.message);
      return NextResponse.json({ error: 'Could not confirm payment. Contact support.' }, { status: 503 });
    }

    const { data: payment } = await supabase
      .from('payments')
      .select('booking_id')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (payment?.booking_id) {
      await supabase
        .from('bookings')
        .update({ status: 'confirmed', payment_status: 'paid' })
        .eq('id', payment.booking_id);
    }

    return NextResponse.json({ verified: true });
  } catch (err) {
    console.error('[verify-payment] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
