import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { renderBookingConfirmation } from '@/lib/emails/booking-confirmation';
import { SAMPLE_CONFIRMATION } from './fixture';

const OUT = process.env.EMAIL_PREVIEW_OUT;

it.runIf(OUT)('writes a confirmation preview', () => {
  const { subject, html, text } = renderBookingConfirmation(SAMPLE_CONFIRMATION);
  writeFileSync(OUT!, html);
  writeFileSync(`${OUT!}.txt`, text);
  console.log(subject);
});
