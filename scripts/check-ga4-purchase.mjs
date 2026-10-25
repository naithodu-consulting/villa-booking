#!/usr/bin/env node
import { pathToFileURL } from 'node:url';

/**
 * Puts a sample `purchase` event to GA4's validation endpoint and prints what
 * it says.
 *
 * Why this exists: the collector at /mp/collect answers 204 whether the body
 * was perfect or nonsense, so a malformed purchase event is invisible in
 * production and shows up weeks later as revenue missing from a report. The
 * /debug endpoint is the only thing that will say what is wrong.
 *
 * Run it once after creating the GA4 property, and again after changing the
 * payload in src/lib/analytics-server.ts:
 *
 *   GA4_MEASUREMENT_ID=G-XXXXXXXXXX GA4_API_SECRET=... node scripts/check-ga4-purchase.mjs
 *
 * It sends a made-up booking, not a real one. Nothing is written anywhere and
 * no real guest data leaves the machine. The event does not reach reports:
 * the debug endpoint validates and discards.
 */

/**
 * A sample of what the server sends.
 *
 * Kept in step with the real builder by a test: see analytics-purchase.test.ts,
 * which fails if src/lib/analytics-server.ts grows or loses a field.
 */
export function buildSamplePayload() {
  return {
    client_id: '123456789.1700000000',
    non_personalized_ads: false,
    events: [
      {
        name: 'purchase',
        params: {
          currency: 'INR',
          value: 16520,
          transaction_id: 'V19/26-27/BKG/000001',
          tax: 2520,
          nights: 3,
          lead_time_days: 19,
          engagement_time_msec: 1,
          session_id: '1700000001',
          items: [
            {
              item_id: 'villa-stay',
              item_name: 'Villa 19',
              item_category: 'stay',
              price: 16520,
              quantity: 1,
            },
          ],
        },
      },
    ],
  };
}

/**
 * Only when run from a shell. The sample above is imported by the test that
 * keeps it in step with the real payload, and an import must not fire off a
 * request or call process.exit.
 */
async function main() {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    console.error('Set GA4_MEASUREMENT_ID and GA4_API_SECRET.');
    console.error('The secret is made in GA4: Admin > Data Streams > your stream > Measurement Protocol API secrets.');
    return 2;
  }

  const url =
    'https://www.google-analytics.com/debug/mp/collect' +
    `?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildSamplePayload()),
  });

  const result = await response.json();
  const messages = result.validationMessages ?? [];

  if (messages.length === 0) {
    console.log('OK: GA4 accepts the purchase payload.');
    console.log('Next: make a test booking on the preview and watch GA4 DebugView for the purchase.');
    return 0;
  }

  console.error('GA4 rejected the payload:');
  for (const message of messages) console.error(` - ${message.description ?? JSON.stringify(message)}`);
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await main());
}
