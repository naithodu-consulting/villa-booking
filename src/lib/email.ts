import 'server-only';

const FROM = process.env.RESEND_FROM_EMAIL ?? 'Villa 19 by Habbaa <reservations@habbaa.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'reservations@habbaa.com';

export interface EmailAttachment {
  filename: string;
  content: Uint8Array;
}

async function send(
  to: string,
  subject: string,
  html: string,
  tag: string,
  attachments?: EmailAttachment[],
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
      ...(attachments?.length && {
        attachments: attachments.map((a) => ({ filename: a.filename, content: Buffer.from(a.content).toString('base64') })),
      }),
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

/** Guest-supplied text (name, email, phone) must not become markup in an email. */
function esc(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── Public helpers ────────────────────────────────────────────────────

export interface BookingConfirmationParams {
  guestEmail: string;
  guestName: string;
  bookingRef: string;
  /** Private link to the guest's confirmation page. */
  bookingUrl: string;
  /** Prefilled WhatsApp link for sending ID documents; omitted when no number is configured. */
  idShareUrl?: string;
  propertyName: string;
  checkIn: string;   // e.g. "14 Sep 2026"
  checkOut: string;
  guests: number;
  /** When true, the email notes that extra guests are on mattresses. */
  additionalGuestsNote?: boolean;
  totalPaise: number; // total in paise, formatted to INR
  checkInTime: string;  // e.g. "3:00 PM", from the property row
  checkOutTime: string;
  /** GST tax invoice, attached as a PDF. Absent only if generation failed. */
  invoice?: { number: string; pdf: Uint8Array };
}

export async function sendBookingConfirmation(p: BookingConfirmationParams) {
  const totalRupees = (p.totalPaise / 100).toLocaleString('en-IN');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Booking Confirmed</title></head>
<body style="margin:0;padding:0;background:#f9f6f1;font-family:Georgia,serif;">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5ddd5;">
    <div style="background:#5C1732;padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:28px;font-style:italic;">Booking Confirmed</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">${esc(p.propertyName)}</p>
    </div>
    <div style="padding:32px 40px;">
      <p style="color:#333;font-size:15px;">Dear ${esc(p.guestName)},</p>
      <p style="color:#555;font-size:14px;line-height:1.7;">Your booking is confirmed. Here are your details:</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
        <tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:10px 0;color:#888;width:50%;">Booking Number</td>
          <td style="padding:10px 0;color:#333;font-weight:bold;">${esc(p.bookingRef)}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:10px 0;color:#888;">Check-in</td>
          <td style="padding:10px 0;color:#333;">${esc(p.checkIn)} from ${esc(p.checkInTime)}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:10px 0;color:#888;">Check-out</td>
          <td style="padding:10px 0;color:#333;">${esc(p.checkOut)} by ${esc(p.checkOutTime)}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:10px 0;color:#888;">Guests</td>
          <td style="padding:10px 0;color:#333;">${p.guests}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#888;">Total Paid</td>
          <td style="padding:10px 0;color:#5C1732;font-weight:bold;">₹${totalRupees}</td>
        </tr>
      </table>
      ${p.additionalGuestsNote ? `<p style="color:#555;font-size:13px;line-height:1.7;background:#fdf8f2;border:1px solid #e5ddd5;border-radius:8px;padding:12px 16px;">Additional guests are accommodated using mattresses in select bedrooms and the lounge.</p>` : ''}
      ${p.invoice ? `<p style="color:#555;font-size:13px;line-height:1.7;">Your GST tax invoice <strong>${esc(p.invoice.number)}</strong> is attached to this email.</p>` : ''}
      <p style="text-align:center;margin:24px 0;">
        <a href="${esc(p.bookingUrl)}" style="display:inline-block;background:#3A0E1F;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:bold;">View your booking</a>
      </p>
      <p style="color:#555;font-size:13px;line-height:1.7;">
        ${p.idShareUrl ? `<strong>Please share a photo ID for every adult guest</strong> (Aadhaar, passport or driving licence)
        on <a href="${esc(p.idShareUrl)}" style="color:#5C1732;">WhatsApp</a> before you arrive. Please do not reply to this email with ID documents.<br><br>` : ''}
        We will send you the exact address and check-in instructions 24 hours before your arrival.
        If you have any questions, WhatsApp us. We usually reply within an hour during the day.
      </p>
      <p style="color:#333;font-size:14px;margin-top:24px;">Warm regards,<br>The Habbaa Team</p>
    </div>
    <div style="background:#f9f6f1;padding:16px 40px;text-align:center;font-size:12px;color:#aaa;">
      Villa 19 by Habbaa · Urwa, Mangalore, Karnataka 575006<br>
      reservations@habbaa.com
    </div>
  </div>
</body>
</html>`;

  const attachments = p.invoice
    ? [{ filename: `Invoice-${p.invoice.number.replace(/\//g, '-')}.pdf`, content: p.invoice.pdf }]
    : undefined;
  return send(p.guestEmail, `Booking Confirmed: ${p.bookingRef} | ${p.propertyName}`, html, 'booking_confirmation', attachments);
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
    <div style="background:#5C1732;padding:24px 40px;">
      <h1 style="margin:0;color:#fff;font-size:20px;">New Booking: ${esc(p.bookingRef)}</h1>
    </div>
    <div style="padding:28px 40px;font-size:14px;color:#333;">
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:8px 0;color:#888;width:40%;">Guest</td>
          <td style="padding:8px 0;">${esc(p.guestName)}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:8px 0;color:#888;">Email</td>
          <td style="padding:8px 0;">${esc(p.guestEmail)}</td>
        </tr>
        ${p.guestPhone ? `<tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:8px 0;color:#888;">Phone</td>
          <td style="padding:8px 0;">${esc(p.guestPhone)}</td>
        </tr>` : ''}
        <tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:8px 0;color:#888;">Check-in</td>
          <td style="padding:8px 0;">${esc(p.checkIn)}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:8px 0;color:#888;">Check-out</td>
          <td style="padding:8px 0;">${esc(p.checkOut)}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:8px 0;color:#888;">Guests</td>
          <td style="padding:8px 0;">${p.guests}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0ebe4;">
          <td style="padding:8px 0;color:#888;">Total</td>
          <td style="padding:8px 0;font-weight:bold;color:#5C1732;">₹${totalRupees}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#888;">Channel</td>
          <td style="padding:8px 0;">${esc(p.channel)}</td>
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
    <div style="background:#5C1732;padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;font-style:italic;">Refund Processed</h1>
    </div>
    <div style="padding:32px 40px;font-size:14px;color:#555;line-height:1.7;">
      <p>Dear ${esc(p.guestName)},</p>
      <p>Your refund of <strong style="color:#5C1732;">₹${refundRupees}</strong> for booking <strong>${esc(p.bookingRef)}</strong> has been processed by Razorpay.</p>
      <p>Refunds typically appear in your account within 5 to 7 business days depending on your bank.</p>
      <p style="margin-top:24px;">Warm regards,<br>The Habbaa Team</p>
    </div>
    <div style="background:#f9f6f1;padding:16px 40px;text-align:center;font-size:12px;color:#aaa;">
      Villa 19 by Habbaa · reservations@habbaa.com
    </div>
  </div>
</body>
</html>`;

  return send(p.guestEmail, `Refund Processed: ${p.bookingRef}`, html, 'refund_processed');
}
