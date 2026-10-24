import { esc, stayRange } from '@/lib/emails/html';

/**
 * The villa has been sold twice.
 *
 * A channel has blocked nights that a confirmed direct booking already holds.
 * iCal sync makes this rare rather than impossible: a channel reads our
 * calendar every few hours, so two guests can buy the same night inside that
 * window.
 *
 * This is the one email in the app that asks someone to stop what they are
 * doing. It is written accordingly: no branding, no greeting, no marketing
 * furniture. The dates, the booking reference, and what to do, in that order,
 * legible on a phone at the top of the message with nothing to scroll past.
 *
 * It deliberately does not suggest which guest to move. That depends on who
 * paid, who travelled furthest, what the channel's cancellation penalty is and
 * who is easier to rehouse - none of which this process knows, and all of
 * which a person does.
 */
export interface IcalConflict {
  reference: string;
  checkIn: string;
  checkOut: string;
  feedStart: string;
  feedEnd: string;
  nights: number;
}

export interface IcalConflictContext {
  /** 'Airbnb'. */
  channel: string;
  conflicts: IcalConflict[];
}

export function renderIcalConflict({ channel, conflicts }: IcalConflictContext) {
  const count = conflicts.length;
  const subject =
    count === 1
      ? `Double booking: ${channel} and ${conflicts[0].reference}`
      : `Double booking: ${count} clashes between ${channel} and villa19.in`;

  const rows = conflicts
    .map(
      (c) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e5e5;">
          <div style="font-weight:600;font-size:16px;">${esc(stayRange(c.feedStart, c.feedEnd))}</div>
          <div style="color:#666;font-size:14px;margin-top:2px;">
            ${esc(c.nights)} night${c.nights === 1 ? '' : 's'} blocked on ${esc(channel)}
          </div>
          <div style="margin-top:8px;font-size:14px;">
            Clashes with <strong>${esc(c.reference)}</strong> on villa19.in,
            ${esc(stayRange(c.checkIn, c.checkOut))}
          </div>
        </td>
      </tr>`,
    )
    .join('');

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f6f6f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;">
    <div style="background:#8a1c1c;color:#ffffff;padding:16px 20px;font-size:18px;font-weight:600;">
      The villa is booked twice
    </div>
    <div style="padding:16px 20px 4px;font-size:15px;line-height:1.5;">
      ${esc(channel)} has blocked ${count === 1 ? 'a stay' : 'stays'} that villa19.in has already
      confirmed and taken payment for. Both guests currently believe they have the villa.
    </div>
    <table style="width:100%;border-collapse:collapse;margin-top:12px;">${rows}</table>
    <div style="padding:16px 20px;font-size:14px;line-height:1.5;color:#444;border-top:1px solid #e5e5e5;">
      The ${esc(channel)} block has been applied to our calendar, so no third guest can book these
      nights. Nothing else has been changed, and no guest has been contacted.
      <br><br>
      Someone needs to decide which booking moves.
    </div>
  </div>
</body></html>`;

  const text = [
    `${channel} has blocked nights that villa19.in has already confirmed.`,
    'Both guests currently believe they have the villa.',
    '',
    ...conflicts.map(
      (c) =>
        `${stayRange(c.feedStart, c.feedEnd)} (${c.nights} night${c.nights === 1 ? '' : 's'} on ${channel}) ` +
        `clashes with ${c.reference} on villa19.in, ${stayRange(c.checkIn, c.checkOut)}`,
    ),
    '',
    `The ${channel} block has been applied, so no third guest can book these nights.`,
    'Nothing else has been changed and no guest has been contacted.',
    'Someone needs to decide which booking moves.',
  ].join('\n');

  return { subject, html, text };
}
