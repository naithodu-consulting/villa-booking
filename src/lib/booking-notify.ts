import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sendBookingConfirmation, sendAdminNewBookingNotification } from '@/lib/email';
import { guestLinkBase } from '@/lib/origin';

/**
 * The guest confirmation and the admin notice for a booking that has just been
 * confirmed.
 *
 * Both confirmation paths, the verify-payment call and the Razorpay webhook,
 * used to build these emails separately; this is the one copy.
 *
 * No GST invoice is attached: the invoice number is still issued here by the
 * database trigger, but the document itself belongs to the post-check-out mail.
 *
 * Never throws. Both callers run this inside the try that answers the payment,
 * so an unreachable mail provider would otherwise turn a captured payment into
 * a 500: the guest would see the booking fail despite being charged, and the
 * Razorpay webhook would retry an already-confirmed booking. The booking is
 * already confirmed by the time this runs, so a failed email is logged and
 * resent by hand rather than allowed to undo any of that.
 */
export async function notifyConfirmedBooking(supabase: SupabaseClient, bookingId: string, channel: string) {
  try {
    await sendConfirmationEmails(supabase, bookingId, channel);
  } catch (err) {
    console.error(`[notify] Emails for booking ${bookingId} failed; the booking stands:`, err);
  }
}

async function sendConfirmationEmails(supabase: SupabaseClient, bookingId: string, channel: string) {
  const { data: b } = await supabase
    .from('bookings')
    .select('origin_url, booking_code, reference_number, access_token, payment_status, guest_name, guest_email, guest_phone, check_in, check_out, num_nights, num_adults, num_children, base_amount, extra_guest_amount, discount_amount, discount_code, tax_amount, total_amount, special_requests, confirmed_at, created_at, properties(name, address, city, state, check_in_time, check_out_time, base_occupancy)')
    .eq('id', bookingId)
    .single();
  if (!b) return;

  const p = (Array.isArray(b.properties) ? b.properties[0] : b.properties) as {
    name: string; address: string; city: string; state: string; check_in_time: string; check_out_time: string; base_occupancy: number;
  };
  const bookingRef = b.booking_code ?? b.reference_number;
  // Links point back to wherever the guest booked, not to this deployment's
  // APP_URL: the webhook path has no request origin of its own.
  const base = guestLinkBase(b.origin_url);
  const fmt = (d: string) =>
    new Date(`${d}T12:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  const guests = (b.num_adults ?? 0) + (b.num_children ?? 0);

  // The strip claiming payment in full must not outrun the money: a booking
  // that is only part paid shows a balance instead.
  const { data: pays } = await supabase
    .from('payments')
    .select('amount, status')
    .eq('booking_id', bookingId);
  const paidInFull = b.payment_status === 'paid';
  const captured = (pays ?? [])
    .filter((row: { status: string | null }) => row.status === 'captured' || row.status === 'paid')
    .reduce((sum: number, row: { amount: number }) => sum + row.amount, 0);

  await Promise.all([
    sendBookingConfirmation({
      guestEmail: b.guest_email,
      guestName: b.guest_name,
      guestPhone: b.guest_phone,
      bookingRef,
      bookingUrl: `${base}/booking/${b.access_token}`,
      cancellationUrl: `${base}/cancellation`,
      whatsappNumber: process.env.PROPERTY_WHATSAPP,
      propertyName: `${p.name} by Habbaa`,
      propertyShortName: p.name,
      propertyLocation: `${p.address}, ${p.city}, ${p.state}`,
      checkIn: b.check_in,
      checkOut: b.check_out,
      checkInTime: p.check_in_time,
      checkOutTime: p.check_out_time,
      nights: b.num_nights,
      adults: b.num_adults ?? 0,
      children: b.num_children ?? 0,
      bookedAt: b.confirmed_at ?? b.created_at ?? new Date().toISOString(),
      baseAmount: b.base_amount,
      extraGuestAmount: b.extra_guest_amount ?? 0,
      discountAmount: b.discount_amount ?? 0,
      discountCode: b.discount_code ?? undefined,
      taxAmount: b.tax_amount,
      totalAmount: b.total_amount,
      paymentMethod: 'Razorpay',
      additionalGuestsNote: guests > p.base_occupancy,
      paidInFull,
      amountPaidPaise: paidInFull ? b.total_amount : captured,
    }),
    sendAdminNewBookingNotification({
      bookingRef,
      guestName: b.guest_name,
      guestEmail: b.guest_email,
      guestPhone: b.guest_phone ?? undefined,
      checkIn: fmt(b.check_in),
      checkOut: fmt(b.check_out),
      guests,
      totalPaise: b.total_amount,
      channel,
      specialRequests: b.special_requests ?? undefined,
    }),
  ]);
}
