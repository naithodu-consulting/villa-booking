import { formatPhone, addDaysISO } from '@/lib/format';
import {
  esc, inr, dateWithWeekday, dateTimeMedium, time12, guestLine, stayRange,
} from '@/lib/emails/html';

/**
 * The notice the host gets the moment a booking is paid for.
 *
 * This is an operational email, not a brochure: it is read on a phone, often
 * while doing something else, and it has to answer who, when, how much, and
 * is anything unusual, before the reader decides to look properly. Anything
 * that cannot be acted on is noise.
 *
 * The arrival flag is the part that earns its place. A same-day booking needs
 * the host moving now, and the old version made the reader subtract two dates
 * to notice.
 */
export interface AdminNewBookingContext {
  bookingRef: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkIn: string;   // 'YYYY-MM-DD'
  checkOut: string;
  checkInTime: string;  // 'HH:MM'
  checkOutTime: string;
  nights: number;
  adults: number;
  children: number;
  /** All amounts in paise. */
  baseAmount: number;
  extraGuestAmount: number;
  discountAmount: number;
  discountCode?: string;
  taxAmount: number;
  totalAmount: number;
  amountPaidPaise: number;
  paidInFull: boolean;
  /** 'Online (Razorpay)', 'Online (Razorpay webhook)', 'manual'. */
  channel: string;
  bookedAt: string;
  /** The guest's own booking page, so the host sees exactly what they see. */
  bookingUrl: string;
  specialRequests?: string;
  /** Today at the property, 'YYYY-MM-DD'. Passed in so the render stays pure. */
  today: string;
}

const MAROON = '#5C1732';
const CREAM = '#f7f3ee';
const CARD = '#fdf9f4';
const RULE = '#e9e0d6';
const INK = '#2e2a28';
const MUTED = '#73685f';
const SANS = 'Helvetica,Arial,sans-serif';

/** wa.me needs bare digits with a country code; stored numbers may lack one. */
function waDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(digits) ? `91${digits}` : digits;
}

/** "Arriving today" and "Arriving tomorrow" are the two that change behaviour. */
function arrivalFlag(checkIn: string, today: string): string | null {
  if (checkIn === today) return 'Arriving today';
  if (checkIn === addDaysISO(today, 1)) return 'Arriving tomorrow';
  return null;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:9px 0;font-family:${SANS};font-size:14px;color:${MUTED};vertical-align:top;width:34%;">${esc(label)}</td>
    <td style="padding:9px 0;font-family:${SANS};font-size:14px;color:${INK};vertical-align:top;">${value}</td>
  </tr>`;
}

function payRow(label: string, amount: string, bold = false): string {
  const weight = bold ? 'font-weight:bold;' : '';
  return `<tr>
    <td style="padding:6px 0;font-family:${SANS};font-size:14px;color:${bold ? INK : MUTED};${weight}">${label}</td>
    <td style="padding:6px 0;font-family:${SANS};font-size:14px;color:${INK};${weight}text-align:right;white-space:nowrap;">${esc(amount)}</td>
  </tr>`;
}

export function renderAdminNewBooking(
  c: AdminNewBookingContext,
): { subject: string; html: string; text: string } {
  const flag = arrivalFlag(c.checkIn, c.today);
  const requests = c.specialRequests?.trim();
  const phone = c.guestPhone ? formatPhone(c.guestPhone) : null;
  const wa = c.guestPhone ? waDigits(c.guestPhone) : null;
  const stay = stayRange(c.checkIn, c.checkOut);

  const subject = [
    flag,
    `New booking ${c.bookingRef}`,
    stay,
    inr(c.totalAmount),
    requests ? 'special requests' : null,
  ].filter(Boolean).join(' · ');

  const preheader = [
    c.guestName,
    guestLine(c.adults, c.children),
    `${c.nights} ${c.nights === 1 ? 'night' : 'nights'}`,
    phone,
  ].filter(Boolean).join(' · ');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>New booking</title>
<style>
:root { color-scheme: light only; supported-color-schemes: light only; }
@media only screen and (max-width:430px) {
  .pad { padding-left:20px !important; padding-right:20px !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background:${CREAM};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(preheader)}</div>
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${'&#847;&zwnj;&nbsp;'.repeat(60)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CREAM};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid ${RULE};border-radius:14px;overflow:hidden;">

  <tr><td class="pad" style="background:${MAROON};padding:22px 28px;">
    <p style="margin:0 0 4px;font-family:${SANS};font-size:11px;letter-spacing:1.6px;color:rgba(255,255,255,0.72);text-transform:uppercase;">New booking</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="font-family:${SANS};font-size:21px;font-weight:bold;color:#ffffff;">${esc(c.bookingRef)}</td>
      <td style="font-family:${SANS};font-size:21px;font-weight:bold;color:#ffffff;text-align:right;white-space:nowrap;">${esc(inr(c.totalAmount))}</td>
    </tr></table>
  </td></tr>

  ${flag ? `<tr><td class="pad" style="background:#fdf2e3;border-bottom:1px solid #e6cfa8;padding:12px 28px;">
    <p style="margin:0;font-family:${SANS};font-size:15px;font-weight:bold;color:#8a5a12;">${esc(flag)} &middot; ${esc(time12(c.checkInTime))}</p>
  </td></tr>` : ''}

  <tr><td class="pad" style="padding:22px 28px 26px;">

    <!-- Stay -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${RULE};border-radius:10px;">
      <tr>
        <td style="padding:12px 14px;vertical-align:top;border-right:1px solid ${RULE};">
          <p style="margin:0 0 3px;font-family:${SANS};font-size:10px;letter-spacing:1.2px;color:${MUTED};text-transform:uppercase;white-space:nowrap;">Check-in</p>
          <p style="margin:0;font-family:${SANS};font-size:15px;font-weight:bold;color:${INK};">${esc(dateWithWeekday(c.checkIn))}</p>
          <p style="margin:2px 0 0;font-family:${SANS};font-size:13px;color:${MUTED};">from ${esc(time12(c.checkInTime))}</p>
        </td>
        <td width="62" style="width:62px;padding:12px 6px;text-align:center;vertical-align:middle;border-right:1px solid ${RULE};">
          <p style="margin:0;font-family:${SANS};font-size:18px;font-weight:bold;color:${INK};">${c.nights}</p>
          <p style="margin:2px 0 0;font-family:${SANS};font-size:10px;letter-spacing:1px;color:${MUTED};text-transform:uppercase;">${c.nights === 1 ? 'Night' : 'Nights'}</p>
        </td>
        <td style="padding:12px 14px;vertical-align:top;">
          <p style="margin:0 0 3px;font-family:${SANS};font-size:10px;letter-spacing:1.2px;color:${MUTED};text-transform:uppercase;white-space:nowrap;">Check-out</p>
          <p style="margin:0;font-family:${SANS};font-size:15px;font-weight:bold;color:${INK};">${esc(dateWithWeekday(c.checkOut))}</p>
          <p style="margin:2px 0 0;font-family:${SANS};font-size:13px;color:${MUTED};">by ${esc(time12(c.checkOutTime))}</p>
        </td>
      </tr>
    </table>

    <!-- Guest -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
      ${row('Guest', `<strong>${esc(c.guestName)}</strong>`)}
      ${row('Party', esc(guestLine(c.adults, c.children)))}
      ${phone ? row('Phone', `<a href="tel:+${esc(wa!)}" style="color:${MAROON};font-weight:bold;text-decoration:none;">${esc(phone)}</a>`) : ''}
      ${row('Email', `<a href="mailto:${esc(c.guestEmail)}" style="color:${MAROON};text-decoration:none;">${esc(c.guestEmail)}</a>`)}
      ${row('Booked', `${esc(dateTimeMedium(c.bookedAt))}<br><span style="color:${MUTED};font-size:13px;">${esc(c.channel)}</span>`)}
    </table>

    ${wa ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;"><tr>
      <td style="border:1px solid ${RULE};border-radius:8px;background:${CARD};">
        <a href="https://wa.me/${esc(wa)}" style="display:inline-block;padding:10px 18px;font-family:${SANS};font-size:14px;font-weight:bold;color:${MAROON};text-decoration:none;">Message ${esc(c.guestName.trim().split(/\s+/)[0] || 'guest')} on WhatsApp &rarr;</a>
      </td>
    </tr></table>` : ''}

    ${requests ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;background:#fdf2e3;border:1px solid #e6cfa8;border-radius:8px;">
      <tr><td style="padding:14px 16px;">
        <p style="margin:0 0 6px;font-family:${SANS};font-size:11px;letter-spacing:1.2px;color:#8a5a12;text-transform:uppercase;font-weight:bold;">Special requests</p>
        <p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.6;color:${INK};white-space:pre-wrap;">${esc(requests)}</p>
        <p style="margin:10px 0 0;font-family:${SANS};font-size:13px;color:${MUTED};">Confirm with the guest whether this can be accommodated.</p>
      </td></tr>
    </table>` : ''}

    <!-- Payment -->
    <div style="height:1px;background:${RULE};margin:22px 0 16px;"></div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${payRow(`Stay, ${c.nights} ${c.nights === 1 ? 'night' : 'nights'}`, inr(c.baseAmount))}
      ${c.extraGuestAmount > 0 ? payRow('Extra guests', inr(c.extraGuestAmount)) : ''}
      ${c.discountAmount > 0 ? payRow(`Discount${c.discountCode ? ` (${esc(c.discountCode)})` : ''}`, `-${inr(c.discountAmount)}`) : ''}
      ${c.taxAmount > 0 ? payRow('GST', inr(c.taxAmount)) : ''}
      ${payRow('Total', inr(c.totalAmount), true)}
      ${c.paidInFull
        ? payRow('Received', inr(c.amountPaidPaise))
        : payRow('Balance due', inr(Math.max(0, c.totalAmount - c.amountPaidPaise)), true)}
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:20px auto 0;"><tr>
      <td style="background:${MAROON};border-radius:8px;">
        <a href="${esc(c.bookingUrl)}" style="display:inline-block;padding:11px 24px;font-family:${SANS};font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">Open the booking</a>
      </td>
    </tr></table>

  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const pad = (label: string, amount: string) => `  ${label.padEnd(26)}${amount}`;
  const text = [
    flag ? `${flag.toUpperCase()} at ${time12(c.checkInTime)}` : null,
    `NEW BOOKING ${c.bookingRef} — ${inr(c.totalAmount)}`,
    stay,
    '',
    `Check-in   ${dateWithWeekday(c.checkIn)}, from ${time12(c.checkInTime)}`,
    `Check-out  ${dateWithWeekday(c.checkOut)}, by ${time12(c.checkOutTime)}`,
    `Nights     ${c.nights}`,
    `Guest      ${c.guestName}`,
    `Party      ${guestLine(c.adults, c.children)}`,
    ...(phone ? [`Phone      ${phone}`] : []),
    `Email      ${c.guestEmail}`,
    `Booked     ${dateTimeMedium(c.bookedAt)} (${c.channel})`,
    '',
    ...(requests ? ['SPECIAL REQUESTS', requests, 'Confirm with the guest whether this can be accommodated.', ''] : []),
    'PAYMENT',
    pad(`Stay, ${c.nights} ${c.nights === 1 ? 'night' : 'nights'}`, inr(c.baseAmount)),
    ...(c.extraGuestAmount > 0 ? [pad('Extra guests', inr(c.extraGuestAmount))] : []),
    ...(c.discountAmount > 0 ? [pad(`Discount${c.discountCode ? ` (${c.discountCode})` : ''}`, `-${inr(c.discountAmount)}`)] : []),
    ...(c.taxAmount > 0 ? [pad('GST', inr(c.taxAmount))] : []),
    pad('Total', inr(c.totalAmount)),
    c.paidInFull
      ? pad('Received', inr(c.amountPaidPaise))
      : pad('Balance due', inr(Math.max(0, c.totalAmount - c.amountPaidPaise))),
    '',
    `Open the booking: ${c.bookingUrl}`,
    ...(wa ? [`WhatsApp the guest: https://wa.me/${wa}`] : []),
  ].filter((l) => l !== null).join('\n');

  return { subject, html, text };
}
