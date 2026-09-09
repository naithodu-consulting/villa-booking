import 'server-only';

const FROM = process.env.RESEND_FROM_EMAIL ?? 'Villa 19 by Habbaa <hello@habbaa.in>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'hello@habbaa.in';

async function send(
  to: string,
  subject: string,
  html: string,
  tag: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set, skipping send');
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject,
      html,
      tags: [{ name: 'email_type', value: tag }],
    }),
  });

  if (res.ok) {
    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  }
  const body = await res.text().catch(() => '');
  const err = `Resend ${res.status}: ${body}`;
  console.error('[email] send failed:', err);
  return { ok: false, error: err };
}

// ── Public helpers ────────────────────────────────────────────────────

export interface BookingConfirmationParams {
  guestEmail: string;
  guestName: string;
  bookingRef: string;
  propertyName: string;
  checkIn: string;   // e.g. "14 Sep 2026"
  checkOut: string;
  guests: number;
  totalPaise: number; // total in paise, formatted to INR
}

export async function sendBookingConfirmation(p: BookingConfirmationParams) {
  const totalRupees = (p.totalPaise / 100).toLocaleString('en-IN');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Booking Confirmed</title></head>
<body style="margin:0;padding:0;background:#f9f6f1;font-family:Georgia,serif;">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5ddd5;">
    <div style="background:#6b1c1c;padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:28px;font-style:italic;">Booking Confirmed</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">${p.propertyName}</p>
    </div>
    <div style="padding:32px 40px;">
      <p style="color:#333;font-size:15px;">Dear ${p.guestName},</p>
      <p style="color:#555;font-size:14px;line-height:1.7;">Your booking is confirmed. Here are your details:</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
        <tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:10px 0;color:#888;width:50%;">Booking Reference</td>
          <td style="padding:10px 0;color:#333;font-weight:bold;">${p.bookingRef}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:10px 0;color:#888;">Check-in</td>
          <td style="padding:10px 0;color:#333;">${p.checkIn} from 2:00 PM</td>
        </tr>
        <tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:10px 0;color:#888;">Check-out</td>
          <td style="padding:10px 0;color:#333;">${p.checkOut} by 11:00 AM</td>
        </tr>
        <tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:10px 0;color:#888;">Guests</td>
          <td style="padding:10px 0;color:#333;">${p.guests}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#888;">Total Paid</td>
          <td style="padding:10px 0;color:#6b1c1c;font-weight:bold;">₹${totalRupees}</td>
        </tr>
      </table>
      <p style="color:#555;font-size:13px;line-height:1.7;">
        We will send you the exact address and check-in instructions 24 hours before your arrival.
        If you have any questions, WhatsApp us. We respond within 30 minutes.
      </p>
      <p style="color:#333;font-size:14px;margin-top:24px;">Warm regards,<br>The Habbaa Team</p>
    </div>
    <div style="background:#f9f6f1;padding:16px 40px;text-align:center;font-size:12px;color:#aaa;">
      Villa 19 by Habbaa · Urwa, Mangalore, Karnataka 575006<br>
      hello@habbaa.in
    </div>
  </div>
</body>
</html>`;

  return send(p.guestEmail, `Booking Confirmed: ${p.bookingRef} | ${p.propertyName}`, html, 'booking_confirmation');
}

export interface AdminNewBookingParams {
  bookingRef: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPaise: number;
  channel: string; // 'online' | 'manual'
}

export async function sendAdminNewBookingNotification(p: AdminNewBookingParams) {
  const totalRupees = (p.totalPaise / 100).toLocaleString('en-IN');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>New Booking</title></head>
<body style="margin:0;padding:0;background:#f9f6f1;font-family:Georgia,serif;">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5ddd5;">
    <div style="background:#6b1c1c;padding:24px 40px;">
      <h1 style="margin:0;color:#fff;font-size:20px;">New Booking: ${p.bookingRef}</h1>
    </div>
    <div style="padding:28px 40px;font-size:14px;color:#333;">
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:8px 0;color:#888;width:40%;">Guest</td>
          <td style="padding:8px 0;">${p.guestName}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:8px 0;color:#888;">Email</td>
          <td style="padding:8px 0;">${p.guestEmail}</td>
        </tr>
        ${p.guestPhone ? `<tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:8px 0;color:#888;">Phone</td>
          <td style="padding:8px 0;">${p.guestPhone}</td>
        </tr>` : ''}
        <tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:8px 0;color:#888;">Check-in</td>
          <td style="padding:8px 0;">${p.checkIn}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:8px 0;color:#888;">Check-out</td>
          <td style="padding:8px 0;">${p.checkOut}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:8px 0;color:#888;">Guests</td>
          <td style="padding:8px 0;">${p.guests}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:8px 0;color:#888;">Total</td>
          <td style="padding:8px 0;font-weight:bold;color:#6b1c1c;">₹${totalRupees}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#888;">Channel</td>
          <td style="padding:8px 0;">${p.channel}</td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>`;

  return send(ADMIN_EMAIL, `New Booking: ${p.bookingRef} (₹${totalRupees})`, html, 'admin_new_booking');
}

export interface RefundProcessedParams {
  guestEmail: string;
  guestName: string;
  bookingRef: string;
  refundPaise: number;
}

export async function sendRefundConfirmation(p: RefundProcessedParams) {
  const refundRupees = (p.refundPaise / 100).toLocaleString('en-IN');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Refund Processed</title></head>
<body style="margin:0;padding:0;background:#f9f6f1;font-family:Georgia,serif;">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5ddd5;">
    <div style="background:#6b1c1c;padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;font-style:italic;">Refund Processed</h1>
    </div>
    <div style="padding:32px 40px;font-size:14px;color:#555;line-height:1.7;">
      <p>Dear ${p.guestName},</p>
      <p>Your refund of <strong style="color:#6b1c1c;">₹${refundRupees}</strong> for booking <strong>${p.bookingRef}</strong> has been processed by Razorpay.</p>
      <p>Refunds typically appear in your account within 5 to 7 business days depending on your bank.</p>
      <p style="margin-top:24px;">Warm regards,<br>The Habbaa Team</p>
    </div>
    <div style="background:#f9f6f1;padding:16px 40px;text-align:center;font-size:12px;color:#aaa;">
      Villa 19 by Habbaa · hello@habbaa.in
    </div>
  </div>
</body>
</html>`;

  return send(p.guestEmail, `Refund Processed: ${p.bookingRef}`, html, 'refund_processed');
}
