import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { renderBookingConfirmation } from '@/lib/emails/booking-confirmation';
import { SAMPLE_CONFIRMATION } from './fixture';

const OUT = process.env.STATES_OUT;

/** Check-in 16 Oct 2026, 2pm. Deadlines: 100% until 16 Sep, 50% until 1 Oct. */
const CASES = [
  { label: 'Fully refundable - booked 1 Aug, 76 days out', bookedAt: '2026-08-01T06:00:00Z' },
  { label: 'Partially refundable - booked 20 Sep, 26 days out', bookedAt: '2026-09-20T06:00:00Z' },
  { label: 'Non-refundable - booked 13 Oct, 3 days out', bookedAt: '2026-10-13T06:00:00Z' },
];

it.runIf(OUT)('writes all three refund states', () => {
  const parts = CASES.map(({ label, bookedAt }) => {
    const { html } = renderBookingConfirmation({
      ...SAMPLE_CONFIRMATION, checkIn: '2026-10-16', checkOut: '2026-10-18', nights: 2, bookedAt,
    });
    const body = html.slice(html.indexOf('<body'), html.indexOf('</body>'));
    return `<h2 style="font:600 15px/1.4 Helvetica,Arial;color:#5C1732;margin:28px 16px 6px">${label}</h2>${body.replace(/^<body[^>]*>/, '')}`;
  });
  writeFileSync(OUT!, `<!doctype html><html><head><meta charset="utf-8"><title>Refund states</title></head><body style="margin:0;background:#f7f3ee">${parts.join('')}</body></html>`);
});
