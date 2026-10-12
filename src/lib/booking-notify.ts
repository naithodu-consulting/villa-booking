import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sendBookingConfirmation, sendAdminNewBookingNotification } from '@/lib/email';
import { buildInvoicePdf } from '@/lib/invoice';
import { idShareWhatsAppUrl } from '@/lib/whatsapp';
import { formatTime12 } from '@/lib/format';
import { SITE_URL } from '@/lib/seo';

/**
 * Guest confirmation (with the GST invoice attached) and the admin notice for a
 * booking that has just been confirmed.
 *
 * Both confirmation paths, the verify-payment call and the Razorpay webhook,
 * used to build these emails separately; this is the one copy. It re-reads the
 * booking after the confirming UPDATE so it sees the invoice number the
 * database trigger assigned in that same statement.
 *
 * An invoice that fails to render must not cost the guest their confirmation:
 * the email goes without the attachment and the failure is logged for a resend.
 */
export async function notifyConfirmedBooking(supabase: SupabaseClient, bookingId: string, channel: string) {
  const { data: b } = await supabase
    .from('bookings')
    .select('booking_code, reference_number, access_token, invoice_number, invoice_date, guest_name, guest_email, guest_phone, check_in, check_out, num_nights, num_adults, num_children, base_amount, extra_guest_amount, tax_amount, total_amount, special_requests, properties(name, address, city, state, pincode, check_in_time, check_out_time, base_occupancy)')
    .eq('id', bookingId)
    .single();
  if (!b) return;

  const p = (Array.isArray(b.properties) ? b.properties[0] : b.properties) as {
    name: string; address: string; city: string; state: string; pincode: string; check_in_time: string; check_out_time: string; base_occupancy: number;
  };
  const bookingRef = b.booking_code ?? b.reference_number;
  const fmt = (d: string) =>
    new Date(`${d}T12:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  const guests = (b.num_adults ?? 0) + (b.num_children ?? 0);

  let invoice: { number: string; pdf: Uint8Array } | undefined;
  if (b.invoice_number && b.invoice_date) {
    try {
      const pdf = await buildInvoicePdf({
        invoiceNumber: b.invoice_number,
        invoiceDate: b.invoice_date,
        bookingCode: bookingRef,
        guestName: b.guest_name,
        guestEmail: b.guest_email,
        guestPhone: b.guest_phone,
        propertyName: p.name,
        propertyAddress: `${p.address}, ${p.city}, ${p.state} ${p.pincode}`,
        checkIn: b.check_in,
        checkOut: b.check_out,
        nights: b.num_nights,
        adults: b.num_adults ?? 0,
        children: b.num_children ?? 0,
        baseAmount: b.base_amount,
        extraGuestAmount: b.extra_guest_amount ?? 0,
        taxAmount: b.tax_amount,
        totalAmount: b.total_amount,
      });
      invoice = { number: b.invoice_number, pdf };
    } catch (err) {
      console.error(`[notify] Invoice ${b.invoice_number} for ${bookingRef} failed to render; sending confirmation without it:`, err);
    }
  } else {
    console.error(`[notify] ${bookingRef} is confirmed but has no invoice number; sending confirmation without it.`);
  }

  await Promise.all([
    sendBookingConfirmation({
      guestEmail: b.guest_email,
      guestName: b.guest_name,
      bookingRef,
      bookingUrl: `${SITE_URL}/booking/${b.access_token}`,
      idShareUrl: process.env.PROPERTY_WHATSAPP && b.booking_code
        ? idShareWhatsAppUrl(process.env.PROPERTY_WHATSAPP, b.booking_code, b.num_adults ?? 1)
        : undefined,
      propertyName: `${p.name} by Habbaa`,
      checkIn: fmt(b.check_in),
      checkOut: fmt(b.check_out),
      checkInTime: formatTime12(p.check_in_time),
      checkOutTime: formatTime12(p.check_out_time),
      guests,
      additionalGuestsNote: guests > p.base_occupancy,
      totalPaise: b.total_amount,
      invoice,
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
