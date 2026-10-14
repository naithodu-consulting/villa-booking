import { ENTITY } from '@/lib/entity';
import { cancellationOutlook, type CancellationOutlook } from '@/lib/cancellation';
import { formatPhone } from '@/lib/format';
import {
  esc, inr, dateTimeMedium, timestampDate, dateWithWeekday, dateDayMonth, dateShort,
  time12, guestLine, stayRange, EMAIL_ASSET_BASE,
} from '@/lib/emails/html';

/**
 * The booking confirmation a guest receives the moment their payment is
 * captured. It doubles as their voucher, so it carries everything they would
 * otherwise have to ask for: what they paid, what happens next, and what a
 * cancellation would return on which date.
 *
 * Pure: it renders, it does not send. The sender lives in lib/email.ts, which
 * keeps this testable and lets the template move without the transport.
 *
 */

/**
 * The GST line's label, derived from what was actually charged rather than
 * assuming 18%: a booking on another slab, or one with no tax, would otherwise
 * be labelled wrongly. Falls back to a bare "GST" when the amounts do not
 * resolve to a clean rate.
 */
function gstLabel(taxPaise: number, taxablePaise: number): string {
  if (taxPaise <= 0 || taxablePaise <= 0) return 'GST';
  const pct = (taxPaise / taxablePaise) * 100;
  if (pct > 100) return 'GST';
  const whole = Math.round(pct);
  // Stored paise are rounded, so an exact slab lands a hair off the integer.
  return `GST at ${Math.abs(pct - whole) <= 0.1 ? whole : pct.toFixed(1)}%`;
}

export interface BookingConfirmationContext {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  bookingRef: string;
  /** Private link to the guest's confirmation page. */
  bookingUrl: string;
  /** Public cancellation policy page. */
  cancellationUrl: string;
  /** The property's WhatsApp number, for the "If you need us" block. */
  whatsappNumber?: string;
  propertyName: string;
  /** How the team signs off, e.g. "Villa 19". */
  propertyShortName: string;
  /** "Urwa, Mangalore, Karnataka" */
  propertyLocation: string;
  checkIn: string;   // 'YYYY-MM-DD'
  checkOut: string;
  checkInTime: string;  // 'HH:MM'
  checkOutTime: string;
  nights: number;
  adults: number;
  children: number;
  /** When the booking was paid, as a timestamp: the row shows the time too. */
  bookedAt: string;
  /**
   * Guests above the property's base occupancy, which is what extraGuestAmount
   * is charged for. Derived at send time rather than stored: the booking row
   * keeps the amount but not the count the pricing engine worked it out from.
   * Omitted leaves the row unqualified rather than printing "0".
   */
  extraGuests?: number;
  /** All amounts in paise. */
  baseAmount: number;
  extraGuestAmount: number;
  discountAmount: number;
  discountCode?: string;
  taxAmount: number;
  totalAmount: number;
  /** Shown beside the paid line, e.g. "Razorpay". */
  paymentMethod?: string;
  /** True only when the booking is settled in full; gates the paid-in-full strip. */
  paidInFull: boolean;
  /** What has actually been received so far, in paise. */
  amountPaidPaise: number;
  /** When true, the email notes that extra guests are on mattresses. */
  additionalGuestsNote?: boolean;
}

// ── Palette ───────────────────────────────────────────────────────────
const MAROON = '#5C1732';
const CREAM = '#f7f3ee';
const CARD = '#fdf9f4';
const RULE = '#e9e0d6';
const INK = '#2e2a28';
const MUTED = '#73685f';
const GREEN = '#2f6b45';
/** The site's success token (--ok). Emails cannot read CSS variables. */
const OK = '#2E7D5B';
/** --error, and the deeper amber the admin notice already uses. */
const RED = '#B3261E';
const RED_TINT = '#FDF0EF';
const RED_EDGE = '#EFC9C6';
const AMBER = '#8a5a12';
const AMBER_TINT = '#fdf2e3';
const AMBER_EDGE = '#e6cfa8';

const SANS = 'Helvetica,Arial,sans-serif';
// Single quotes: these stacks are interpolated into style="..." attributes, and
// a double-quoted family name there closes the attribute and drops the rest of
// the declaration (it silently cost the header its white text).
const SERIF = "Georgia,'Times New Roman',serif";

// ── Fragments ─────────────────────────────────────────────────────────

/** A small letterspaced section heading, e.g. "PAYMENT". */
function sectionLabel(text: string): string {
  return `<p style="margin:0 0 12px;font-family:${SANS};font-size:11px;letter-spacing:1.4px;color:${MUTED};text-transform:uppercase;">${esc(text)}</p>`;
}

function rule(): string {
  return `<div style="height:1px;background:${RULE};margin:28px 0;"></div>`;
}

/** A label/value row in the details list. */
function detailRow(label: string, value: string, sub?: string): string {
  return `<tr>
    <td style="padding:4px 12px 4px 0;font-family:${SANS};font-size:14px;color:${MUTED};vertical-align:top;width:34%;">${esc(label)}</td>
    <td style="padding:4px 0;font-family:${SANS};font-size:14px;color:${INK};vertical-align:top;">${value}${
      sub ? `<br><span style="color:${MUTED};font-size:13px;">${esc(sub)}</span>` : ''
    }</td>
  </tr>`;
}

/** A line in the payment breakdown. `tone` colours a discount green. */
function payRow(label: string, amount: string, tone?: 'credit'): string {
  return `<tr>
    <td style="padding:4px 0;font-family:${SANS};font-size:14px;color:${INK};">${label}</td>
    <td style="padding:4px 0;font-family:${SANS};font-size:14px;color:${tone === 'credit' ? GREEN : INK};text-align:right;white-space:nowrap;">${esc(amount)}</td>
  </tr>`;
}

/** One numbered step in "What happens next". */
function step(n: number, title: string, body: string): string {
  return `<tr>
    <td style="padding:0 14px 20px 0;vertical-align:top;width:26px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="24" height="24" align="center" style="width:24px;height:24px;background:${CARD};border:1px solid ${RULE};border-radius:12px;font-family:${SANS};font-size:12px;font-weight:bold;color:${MUTED};line-height:24px;">${n}</td>
      </tr></table>
    </td>
    <td style="padding:0 0 20px;vertical-align:top;">
      <p style="margin:0 0 5px;font-family:${SANS};font-size:15px;font-weight:bold;color:${INK};">${esc(title)}</p>
      <p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.6;color:#5d5550;">${body}</p>
    </td>
  </tr>`;
}

// ── Template ──────────────────────────────────────────────────────────

export function renderBookingConfirmation(
  c: BookingConfirmationContext,
): { subject: string; html: string; text: string } {
  const checkInAt = time12(c.checkInTime);
  const checkOutAt = time12(c.checkOutTime);
  const firstName = c.guestName.trim().split(/\s+/)[0] || c.guestName;
  const phone = formatPhone(c.guestPhone);

  const stayLine =
    `${stayRange(c.checkIn, c.checkOut)} · ${c.nights} ${c.nights === 1 ? 'night' : 'nights'}`;

  const taxable = c.baseAmount + c.extraGuestAmount - c.discountAmount;
  const balanceDue = Math.max(0, c.totalAmount - c.amountPaidPaise);

  // "Extra guests, 6", matching "Stay, 1 night". A comma rather than brackets:
  // the discount row already spends brackets on the code it was claimed with,
  // and a bracketed number beside a money column reads as a negative amount.
  const extraGuestLabel = c.extraGuests && c.extraGuests > 0
    ? `Extra guests, ${c.extraGuests}`
    : 'Extra guests';

  // Carries the facts a guest scans for before opening, so the client does not
  // fall back to showing "Dear <name>," as the preview line.
  const preheader =
    `${c.bookingRef} · ${stayRange(c.checkIn, c.checkOut)} · ${
      c.paidInFull ? `${inr(c.totalAmount)} paid in full` : `${inr(balanceDue)} balance due`
    }`;

  // Filtered against when the booking was actually made: a guest booking close
  // in must not be shown deadlines that passed before they paid.
  const refunds = cancellationOutlook(
    c.checkIn, c.totalAmount, c.bookedAt,
    { long: dateDayMonth, short: dateShort },
  );


  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>Your booking is confirmed</title>
<style>
:root { color-scheme: light only; supported-color-schemes: light only; }
/* The badge is an image, not a character, because Gmail on Android sizes a text
   glyph from the font's own line box and ignores the cell's height. U+2713 is
   absent from Roboto, so it resolves in a fallback symbol font whose line box
   measured ~2.7x the font-size there: the badge came out a third taller than it
   was wide at every size we tried, and tuning font-size only fits the one
   device's fallback font.
   So nothing here may depend on font metrics. The 48px circle is the 22px image
   plus 13px of padding on each side, both fixed, and font-size/line-height are
   zeroed so no stray text box can add to it. A blocked image keeps its reserved
   22px, so the circle still renders at 48px with the tick simply absent. */
.tick td  { padding:13px !important; font-size:0 !important; line-height:0 !important;
            border-radius:24px !important; }
.tick img { width:22px !important; height:22px !important; display:block !important; }
/* Phone clients only. Outlook ignores media queries and keeps the inline
   sizes, which are already correct at the 580px the desktop card uses. */
@media only screen and (max-width:430px) {
  .stay-cell  { padding:12px 10px !important; }
  .stay-date  { font-size:13px !important; }
  .stay-time  { font-size:12px !important; }
  .nights-col { width:52px !important; }
  .pad        { padding-left:22px !important; padding-right:22px !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background:${CREAM};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(preheader)}</div>
<!-- Spacer so the client stops pulling body copy into the preview line. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${'&#847;&zwnj;&nbsp;'.repeat(60)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CREAM};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;background:#ffffff;border:1px solid ${RULE};border-radius:14px;overflow:hidden;">

  <!-- Header -->
  <tr><td class="pad" style="background:${MAROON};padding:30px 36px 34px;text-align:center;">
    <table role="presentation" class="tick" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
      <td align="center" valign="middle" bgcolor="${OK}" style="background:${OK};border-radius:24px;padding:13px;font-size:0;line-height:0;mso-line-height-rule:exactly;">
        <img src="${esc(EMAIL_ASSET_BASE)}/email/success-tick.png" width="22" height="22" alt="" style="display:block;width:22px;height:22px;border:0;outline:none;text-decoration:none;">
      </td>
    </tr></table>
    <h1 style="margin:16px 0 6px;font-family:${SERIF};font-size:28px;font-weight:normal;color:#ffffff;">Your booking is confirmed</h1>
    <p style="margin:0;font-family:${SANS};font-size:14px;color:rgba(255,255,255,0.78);">${esc(stayLine)}</p>
  </td></tr>

  <tr><td class="pad" style="padding:32px 36px 36px;">

    <p style="margin:0 0 14px;font-family:${SANS};font-size:15px;color:${INK};">Dear ${esc(firstName)},</p>
    <p style="margin:0 0 24px;font-family:${SANS};font-size:15px;line-height:1.65;color:#5d5550;">
      Your booking is confirmed and payment has been received.
      Please keep this email for your records.
    </p>

    <!-- Booking reference -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CARD};border:1px solid ${RULE};border-radius:10px;">
      <tr><td style="padding:16px;text-align:center;">
        <p style="margin:0 0 6px;font-family:${SANS};font-size:10px;letter-spacing:1.6px;color:${MUTED};text-transform:uppercase;">Booking reference</p>
        <p style="margin:0;font-family:${SANS};font-size:22px;font-weight:bold;letter-spacing:2px;color:${MAROON};">${esc(c.bookingRef)}</p>
      </td></tr>
    </table>

    <!-- Check-in / nights / check-out -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;border:1px solid ${RULE};border-radius:10px;">
      <tr>
        <td class="stay-cell" style="padding:14px 16px;vertical-align:top;border-right:1px solid ${RULE};">
          <p style="margin:0 0 4px;font-family:${SANS};font-size:10px;letter-spacing:1.4px;color:${MUTED};text-transform:uppercase;white-space:nowrap;">Check-in</p>
          <p class="stay-date" style="margin:0;font-family:${SANS};font-size:15px;font-weight:bold;color:${INK};">${esc(dateWithWeekday(c.checkIn))}</p>
          <p class="stay-time" style="margin:2px 0 0;font-family:${SANS};font-size:13px;color:${MUTED};">from ${esc(checkInAt)}</p>
        </td>
        <td class="nights-col" width="74" style="width:74px;padding:14px 8px;text-align:center;vertical-align:middle;border-right:1px solid ${RULE};">
          <p style="margin:0;font-family:${SANS};font-size:19px;font-weight:bold;color:${INK};">${c.nights}</p>
          <p style="margin:2px 0 0;font-family:${SANS};font-size:10px;letter-spacing:1.2px;color:${MUTED};text-transform:uppercase;">${c.nights === 1 ? 'Night' : 'Nights'}</p>
        </td>
        <td class="stay-cell" style="padding:14px 16px;vertical-align:top;">
          <p style="margin:0 0 4px;font-family:${SANS};font-size:10px;letter-spacing:1.4px;color:${MUTED};text-transform:uppercase;white-space:nowrap;">Check-out</p>
          <p class="stay-date" style="margin:0;font-family:${SANS};font-size:15px;font-weight:bold;color:${INK};">${esc(dateWithWeekday(c.checkOut))}</p>
          <p class="stay-time" style="margin:2px 0 0;font-family:${SANS};font-size:13px;color:${MUTED};">by ${esc(checkOutAt)}</p>
        </td>
      </tr>
    </table>

    <!-- Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
      ${detailRow('Guests', esc(guestLine(c.adults, c.children)))}
      ${detailRow('Villa', esc(c.propertyName), c.propertyLocation)}
      ${detailRow('Booked on', esc(dateTimeMedium(c.bookedAt)))}
      ${detailRow('Email', esc(c.guestEmail))}
      ${detailRow('Mobile', esc(phone))}
    </table>
    <p style="margin:10px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${MUTED};">
      We will send the exact address and check-in details to this mobile number via WhatsApp.
      If the email address or mobile number provided above is incorrect, please let us know.
    </p>
    ${c.additionalGuestsNote ? `<p style="margin:14px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:#5d5550;background:${CARD};border:1px solid ${RULE};border-radius:8px;padding:12px 14px;">Additional guests can be accommodated on mattresses in select bedrooms and in the lounge.</p>` : ''}

    ${rule()}

    <!-- Payment -->
    ${sectionLabel('Payment')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${payRow(`Stay, ${c.nights} ${c.nights === 1 ? 'night' : 'nights'}`, inr(c.baseAmount))}
      ${c.extraGuestAmount > 0 ? payRow(esc(extraGuestLabel), inr(c.extraGuestAmount)) : ''}
      ${c.discountAmount > 0 ? payRow(
        `Discount${c.discountCode ? ` <span style="color:${MUTED};font-size:13px;">(${esc(c.discountCode)})</span>` : ''}`,
        `-${inr(c.discountAmount)}`, 'credit',
      ) : ''}
      ${c.taxAmount > 0 ? payRow(gstLabel(c.taxAmount, taxable), inr(c.taxAmount)) : ''}
      <tr><td colspan="2" style="padding:4px 0 0;"><div style="height:1px;background:${RULE};"></div></td></tr>
      <tr>
        <td style="padding:9px 0 2px;font-family:${SANS};font-size:16px;font-weight:bold;color:${INK};">Total</td>
        <td style="padding:9px 0 2px;font-family:${SANS};font-size:16px;font-weight:bold;color:${INK};text-align:right;white-space:nowrap;">${esc(inr(c.totalAmount))}</td>
      </tr>
      <tr>
        <td style="padding:0 0 4px;font-family:${SANS};font-size:13px;color:${MUTED};">Paid ${esc(timestampDate(c.bookedAt))}${c.paymentMethod ? ` · ${esc(c.paymentMethod)}` : ''}</td>
        <td style="padding:0 0 4px;font-family:${SANS};font-size:13px;color:${MUTED};text-align:right;white-space:nowrap;">${esc(inr(c.amountPaidPaise))}</td>
      </tr>
      ${balanceDue > 0 ? `<tr>
        <td style="padding:6px 0 4px;font-family:${SANS};font-size:14px;font-weight:bold;color:${INK};">Balance due</td>
        <td style="padding:6px 0 4px;font-family:${SANS};font-size:14px;font-weight:bold;color:${INK};text-align:right;white-space:nowrap;">${esc(inr(balanceDue))}</td>
      </tr>` : ''}
    </table>

    ${c.paidInFull ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;background:#f1f7f2;border:1px solid #cfe3d5;border-radius:8px;">
      <tr><td style="padding:11px 14px;font-family:${SANS};font-size:14px;font-weight:bold;color:${GREEN};">&#10003;&nbsp; Amount is paid in full</td></tr>
    </table>` : ''}

    <p style="margin:14px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:#5d5550;">
      <strong style="color:${INK};">Note:</strong> A refundable security deposit is collected upon check-in.
      This is in addition to the online payment. Please contact the property in case of questions.
    </p>

    <!-- CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:26px auto 4px;">
      <tr><td style="background:${MAROON};border-radius:9px;">
        <a href="${esc(c.bookingUrl)}" style="display:inline-block;padding:13px 32px;font-family:${SANS};font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">View your booking</a>
      </td></tr>
    </table>

    ${rule()}

    <!-- What happens next -->
    ${sectionLabel('What happens next')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${step(1, 'Before you arrive',
        `Around 24 hours before check-in, we will share the exact address, directions and access instructions with you.`)}
      ${step(2, 'Need anything before then?',
        `Just ${c.whatsappNumber
          ? `<a href="https://wa.me/${esc(c.whatsappNumber.replace(/\D/g, ''))}" style="color:${MAROON};font-weight:bold;">WhatsApp</a>`
          : 'WhatsApp'} us. We&#39;re usually available during the day and aim to respond within an hour.`)}
    </table>

    ${rule()}

    <!-- Cancellation -->
    ${sectionLabel('Cancellations & refund')}
    ${refunds.state === 'none' ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${RED_TINT};border:1px solid ${RED_EDGE};border-radius:10px;">
      <tr><td style="padding:13px 16px;font-family:${SANS};font-size:14px;font-weight:bold;color:${RED};">This booking is non-refundable.</td></tr>
    </table>` : `
    ${refunds.state === 'partial' ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${AMBER_TINT};border:1px solid ${AMBER_EDGE};border-radius:10px;margin-bottom:12px;">
      <tr><td style="padding:13px 16px;font-family:${SANS};font-size:14px;line-height:1.5;color:${AMBER};">
        <strong>This booking may be eligible for a refund</strong> if cancelled on or before ${esc(refunds.lastRefundableAt ?? '')}.
      </td></tr>
    </table>` : ''}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CARD};border:1px solid ${RULE};border-radius:10px;">
      ${refunds.rows.map((r, i) => `<tr>
        <td style="padding:${i === 0 ? '11px' : '6px'} 14px ${i === refunds.rows.length - 1 ? '11px' : '6px'};font-family:${SANS};font-size:13px;color:${INK};">${esc(r.when)}</td>
        <td style="padding:${i === 0 ? '11px' : '6px'} 14px ${i === refunds.rows.length - 1 ? '11px' : '6px'};font-family:${SANS};font-size:13px;color:${INK};text-align:right;">${
          r.refundPaise > 0
            ? `<strong style="white-space:nowrap;">${esc(inr(r.refundPaise))}</strong> will be refunded`
            : '<span style="white-space:nowrap;">No refund</span>'
        }</td>
      </tr>`).join('')}
    </table>`}
    <p style="margin:10px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${MUTED};">${
      // Nothing is coming back, so a refund address and a processing time would
      // contradict the line directly above it.
      refunds.state === 'none'
        ? `Refer to our <a href="${esc(c.cancellationUrl)}" style="color:${MAROON};font-weight:bold;">Cancellation Policy</a> for more details.`
        : `For cancellations, email us at <a href="mailto:${esc(ENTITY.email)}" style="color:${MAROON};font-weight:bold;">${esc(ENTITY.email)}</a> with your booking reference.
      Approved refunds are generally processed to the original payment method within 5 to 7 working days.
      Refer to our <a href="${esc(c.cancellationUrl)}" style="color:${MAROON};font-weight:bold;">Cancellation Policy</a> for more details.`
    }</p>

    ${rule()}

    <!-- Contact -->
    ${sectionLabel('If you need us')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${c.whatsappNumber ? `<tr>
        <td style="padding:0 14px 8px 0;font-family:${SANS};font-size:14px;color:${MUTED};vertical-align:top;width:30%;white-space:nowrap;">WhatsApp</td>
        <td style="padding:0 0 8px;vertical-align:top;">
          <a href="https://wa.me/${esc(c.whatsappNumber.replace(/\D/g, ''))}" style="font-family:${SANS};font-size:14px;color:${MAROON};font-weight:bold;">${esc(formatPhone(c.whatsappNumber))}</a>
          <br><span style="font-family:${SANS};font-size:13px;color:${MUTED};">The fastest way to reach us.</span>
        </td>
      </tr>` : ''}
      <tr>
        <td style="padding:0 14px 0 0;font-family:${SANS};font-size:14px;color:${MUTED};vertical-align:top;width:30%;white-space:nowrap;">Email</td>
        <td style="vertical-align:top;"><a href="mailto:${esc(ENTITY.email)}" style="font-family:${SANS};font-size:14px;color:${MAROON};">${esc(ENTITY.email)}</a></td>
      </tr>
    </table>

    <p style="margin:26px 0 6px;font-family:${SANS};font-size:14px;line-height:1.6;color:#5d5550;">We look forward to hosting you.</p>
    <p style="margin:0;font-family:${SERIF};font-size:17px;line-height:1.4;color:${MAROON};">Team ${esc(c.propertyShortName)}</p>

  </td></tr>

  <!-- Footer -->
  <tr><td class="pad" style="background:${CREAM};border-top:1px solid ${RULE};padding:22px 36px 26px;text-align:center;">
    <p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.7;color:${MUTED};">
      ${esc(ENTITY.name)}<br>
      ${esc(ENTITY.address)}
    </p>
    <p style="margin:10px 0 0;font-family:${SANS};font-size:12px;line-height:1.7;color:${MUTED};">
      CIN: ${esc(ENTITY.cin)}<br>
      GSTIN: ${esc(ENTITY.gstin)}
    </p>
    <p style="margin:12px 0 0;font-family:${SANS};font-size:11px;color:${MUTED};">You are receiving this email because you have booked a stay with us.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  return {
    subject: `Your booking is confirmed · ${c.bookingRef} · ${c.propertyName}`,
    html,
    text: renderText(c, { checkInAt, checkOutAt, firstName, phone, stayLine, refunds, taxable, balanceDue, extraGuestLabel }),
  };
}

/**
 * The plain-text alternative. Every multipart message carries one: it is what
 * text-only clients show, and a sender without it reads as bulk mail to the
 * filters that matter for a transactional address.
 */
function renderText(
  c: BookingConfirmationContext,
  v: {
    checkInAt: string; checkOutAt: string; firstName: string; phone: string;
    stayLine: string; refunds: CancellationOutlook;
    taxable: number; balanceDue: number; extraGuestLabel: string;
  },
): string {
  const money = (label: string, amount: string) => `  ${label.padEnd(28)}${amount}`;

  return [
    'YOUR BOOKING IS CONFIRMED',
    v.stayLine,
    '',
    `Dear ${v.firstName},`,
    '',
    'Your booking is confirmed and payment has been received.',
    'Please keep this email for your records.',
    '',
    `Booking reference: ${c.bookingRef}`,
    '',
    `Check-in   ${dateWithWeekday(c.checkIn)}, from ${v.checkInAt}`,
    `Check-out  ${dateWithWeekday(c.checkOut)}, by ${v.checkOutAt}`,
    `Nights     ${c.nights}`,
    `Guests     ${guestLine(c.adults, c.children)}`,
    `Villa      ${c.propertyName}, ${c.propertyLocation}`,
    `Booked on  ${dateTimeMedium(c.bookedAt)}`,
    `Email      ${c.guestEmail}`,
    `Mobile     ${v.phone}`,
    '',
    'We will send the exact address and check-in details to this mobile number',
    'on WhatsApp. If the email or mobile number mentioned above is wrong, please',
    'let us know.',
    '',
    'PAYMENT',
    money(`Stay, ${c.nights} ${c.nights === 1 ? 'night' : 'nights'}`, inr(c.baseAmount)),
    ...(c.extraGuestAmount > 0 ? [money(v.extraGuestLabel, inr(c.extraGuestAmount))] : []),
    ...(c.discountAmount > 0
      ? [money(`Discount${c.discountCode ? ` (${c.discountCode})` : ''}`, `-${inr(c.discountAmount)}`)]
      : []),
    ...(c.taxAmount > 0 ? [money(gstLabel(c.taxAmount, v.taxable), inr(c.taxAmount))] : []),
    money('Total', inr(c.totalAmount)),
    money(`Paid ${timestampDate(c.bookedAt)}${c.paymentMethod ? ` (${c.paymentMethod})` : ''}`, inr(c.amountPaidPaise)),
    ...(v.balanceDue > 0 ? [money('Balance due', inr(v.balanceDue))] : []),
    ...(c.paidInFull ? ['', 'Amount is paid in full.'] : []),
    '',
    'Note: A refundable security deposit is collected upon check-in. This is',
    'in addition to the online payment. Please contact the property in case of',
    'questions.',
    '',
    `View your booking: ${c.bookingUrl}`,
    '',
    'WHAT HAPPENS NEXT',
    '1. Before you arrive',
    '   Around 24 hours before check-in, we will share the exact address,',
    '   directions and access instructions with you.',
    '2. Need anything before then?',
    `   Just WhatsApp us${c.whatsappNumber ? ` on ${formatPhone(c.whatsappNumber)}` : ''}. We are usually available during the day`,
    '   and aim to respond within an hour.',
    '',
    'CANCELLATIONS & REFUND',
    ...(v.refunds.state === 'none'
      ? ['This booking is non-refundable.',
         `Refer to our Cancellation Policy for more details: ${c.cancellationUrl}`]
      : [
          ...(v.refunds.state === 'partial'
            ? [`This booking may be eligible for a refund if cancelled on or before ${v.refunds.lastRefundableAt}.`, '']
            : []),
          ...v.refunds.rows.map((r) =>
            `  ${r.when} - ${r.refundPaise > 0 ? `${inr(r.refundPaise)} will be refunded` : 'no refund'}`),
        ]),
    '',
    ...(v.refunds.state === 'none' ? [] : [
      `For cancellations, email us at ${ENTITY.email} with your booking reference.`,
      'Approved refunds are generally processed to the original payment method',
      'within 5 to 7 working days.',
      `Refer to our Cancellation Policy for more details: ${c.cancellationUrl}`,
      '',
    ]),
    'IF YOU NEED US',
    ...(c.whatsappNumber ? [`WhatsApp: ${formatPhone(c.whatsappNumber)}`] : []),
    `Email: ${ENTITY.email}`,
    '',
    'We look forward to hosting you.',
    `Team ${c.propertyShortName}`,
    '',
    ENTITY.name,
    ENTITY.address,
    `CIN: ${ENTITY.cin}`,
    `GSTIN: ${ENTITY.gstin}`,
    '',
    'You are receiving this because you booked a stay with us.',
  ].join('\n');
}
