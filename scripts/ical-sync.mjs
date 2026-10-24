#!/usr/bin/env node
/**
 * Calls the calendar sync endpoint. This is what Hostinger's cron runs.
 *
 * Written for hPanel -> Advanced -> Cron Jobs in **Node.js** mode, which runs
 *
 *   /opt/alt/alt-nodejs22/root/bin/node --env-file=<app>/.env scripts/ical-sync.mjs
 *
 * Two consequences shape this file:
 *
 *   1. It is run by node, not by a shell, so the .sh version is no use there.
 *   2. Hostinger supplies --env-file itself, so CRON_SECRET arrives in
 *      process.env and never has to be typed into the command field, where it
 *      would sit in the panel in clear text and in the cron log of anyone with
 *      account access. That is the main reason to prefer Node.js mode over a
 *      Custom curl line.
 *
 * Exits non-zero on failure so the scheduler records a failed run rather than
 * a silent one. Prints a single line per run: cron output is read months later
 * by someone scrolling a log, not by anyone watching it happen.
 *
 * See docs/AIRBNB_ICAL_SYNC.md.
 */

const APP_URL = (process.env.APP_URL ?? 'https://villa19.in').replace(/\/$/, '');
const SECRET = process.env.CRON_SECRET;
const TIMEOUT_MS = 60_000;

const stamp = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const say = (line) => console.log(`[${stamp()}] ical-sync: ${line}`);

if (!SECRET) {
  // The most likely first failure: the env file exists but has no CRON_SECRET,
  // or hPanel's environment variables are not written to the file node was
  // pointed at. Say which, rather than failing with an auth error that looks
  // like a bad secret.
  console.error(`[${stamp()}] ical-sync: CRON_SECRET is not set. Add it in hPanel -> Environment variables, then redeploy so it reaches the env file this cron reads.`);
  process.exit(1);
}

const url = `${APP_URL}/api/cron/ical-sync`;

try {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${SECRET}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const text = await response.text();

  if (response.status === 404) {
    // The route answers 404 to a wrong or missing secret, deliberately: a 403
    // would confirm it exists. So a 404 here is almost always authentication,
    // not a missing route.
    say(`FAILED: 404 from ${url}. Usually a CRON_SECRET that does not match the one the site was deployed with.`);
    process.exit(1);
  }

  if (!response.ok) {
    say(`FAILED: HTTP ${response.status} ${text.slice(0, 300)}`);
    process.exit(1);
  }

  let report;
  try {
    report = JSON.parse(text);
  } catch {
    say(`FAILED: response was not JSON: ${text.slice(0, 200)}`);
    process.exit(1);
  }

  if (report.status === 'disabled') {
    say('disabled (ICAL_SYNC_ENABLED is not true). Nothing was fetched.');
    process.exit(0);
  }

  if (report.status === 'no_feeds') {
    say('no active feeds configured in ical_feeds. Nothing to sync.');
    process.exit(0);
  }

  const feeds = report.feeds ?? [];
  // One line per feed, because a run that silently did nothing for one channel
  // while succeeding for another is the failure worth being able to see.
  for (const feed of feeds) {
    const bits = [`${feed.feed}: ${feed.status}`];
    if (feed.status === 'ok') bits.push(`applied ${feed.applied}, removed ${feed.removed}, ${feed.nights} nights`);
    if (feed.conflicts?.length) bits.push(`CONFLICTS: ${feed.conflicts.length}`);
    if (feed.error) bits.push(`error: ${feed.error}`);
    say(bits.join(' | '));
  }

  // A failure inside one feed is still a failed run, even though the request
  // itself returned 200: the endpoint reports per-feed status rather than
  // failing the whole call, so the exit code has to be worked out here.
  const failed = feeds.filter((f) => !['ok', 'unchanged'].includes(f.status));
  if (failed.length > 0) {
    say(`${failed.length} of ${feeds.length} feed(s) did not sync.`);
    process.exit(1);
  }

  say(`done in ${report.ms}ms`);
} catch (err) {
  const reason = err?.name === 'TimeoutError' ? `no response in ${TIMEOUT_MS / 1000}s` : (err?.message ?? 'unknown error');
  say(`FAILED: ${reason}`);
  process.exit(1);
}
