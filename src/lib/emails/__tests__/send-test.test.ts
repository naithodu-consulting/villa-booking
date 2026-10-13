import { readFileSync } from 'node:fs';
import { it } from 'vitest';
import { renderBookingConfirmation } from '@/lib/emails/booking-confirmation';
import { SAMPLE_CONFIRMATION } from './fixture';

/**
 * A real send through Resend, for checking the template in actual mail clients.
 * Inert unless EMAIL_TEST_TO is set, so `npm test` never sends anything:
 *
 *   EMAIL_TEST_TO=you@example.com npx vitest run \
 *     --config vitest.config.mts src/lib/emails/__tests__/send-test.test.ts
 *
 * It reads .env.local itself because vitest does not load it.
 */
const TO = process.env.EMAIL_TEST_TO;

function envFromFile(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  try {
    const line = readFileSync('.env.local', 'utf8')
      .split('\n')
      .find((l) => l.startsWith(`${key}=`));
    return line?.slice(key.length + 1).trim().replace(/^["']|["']$/g, '');
  } catch {
    return undefined;
  }
}

it.runIf(TO)('sends the confirmation through Resend', async () => {
  const apiKey = envFromFile('RESEND_API_KEY');
  const from = envFromFile('RESEND_FROM_EMAIL') ?? 'Villa 19 by Habbaa <reservations@habbaa.com>';
  if (!apiKey) throw new Error('RESEND_API_KEY not found in the environment or .env.local');

  const { subject, html, text } = renderBookingConfirmation(SAMPLE_CONFIRMATION);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from,
      to: [TO],
      reply_to: 'reservations@habbaa.com',
      subject: `[TEST] ${subject}`,
      html,
      text,
      tags: [{ name: 'email_type', value: 'booking_confirmation_test' }],
    }),
  });

  const body = await res.text();
  if (!res.ok) throw new Error(`Resend ${res.status}: ${body}`);
  console.log(`Sent to ${TO}: ${body}`);
}, 20_000);
