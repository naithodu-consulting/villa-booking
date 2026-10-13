import 'server-only';
import { esc } from '@/lib/emails/html';
import { ENTITY } from '@/lib/entity';
import {
  renderBookingConfirmation,
  type BookingConfirmationContext,
} from '@/lib/emails/booking-confirmation';
import {
  renderAdminNewBooking,
  type AdminNewBookingContext,
} from '@/lib/emails/admin-new-booking';

const FROM = process.env.RESEND_FROM_EMAIL ?? `Villa 19 by Habbaa <${ENTITY.email}>`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ENTITY.email;

/**
 * Replies reach the inbox the copy tells guests to write to. That is the same
 * mailbox we send from today, but RESEND_FROM_EMAIL is configurable and the
 * two drifted apart once already.
 */
const REPLY_TO = ENTITY.email;

export interface EmailAttachment {
  filename: string;
  content: Uint8Array;
}

async function send(
  to: string,
  subject: string,
  html: string,
  tag: string,
  /** A plain-text alternative lifts deliverability and covers text-only clients. */
  opts?: { text?: string; attachments?: EmailAttachment[] },
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
      reply_to: REPLY_TO,
      subject,
      html,
      ...(opts?.text && { text: opts.text }),
      tags: [{ name: 'email_type', value: tag }],
      ...(opts?.attachments?.length && {
        attachments: opts.attachments.map((a) => ({ filename: a.filename, content: Buffer.from(a.content).toString('base64') })),
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

// ── Public helpers ────────────────────────────────────────────────────

/**
 * Guest booking confirmation. The template lives in emails/booking-confirmation.ts;
 * this adds the transport.
 *
 * No GST invoice rides along: it is issued after check-out, not before.
 */
export async function sendBookingConfirmation(p: BookingConfirmationContext) {
  const { subject, html, text } = renderBookingConfirmation(p);
  return send(p.guestEmail, subject, html, 'booking_confirmation', { text });
}

/**
 * The host's new-booking notice. The template lives in emails/admin-new-booking.ts.
 */
export async function sendAdminNewBookingNotification(p: AdminNewBookingContext) {
  const { subject, html, text } = renderAdminNewBooking(p);
  return send(ADMIN_EMAIL, subject, html, 'admin_new_booking', { text });
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
      <p>Approved refunds are generally processed within 5 to 7 working days. It may take a little longer to appear in your account, depending on your bank.</p>
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
