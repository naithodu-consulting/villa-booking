#!/usr/bin/env node
/**
 * Puts a channel's calendar URL into ical_feeds.
 *
 * The URL is a bearer credential - anyone holding it can read the villa's
 * occupancy - so it must never be committed. It lives in the environment on
 * the machine doing the seeding and in the database afterwards, and nowhere
 * else. This script is the bridge, so no one has to paste it into a SQL
 * console where it would land in shell history.
 *
 * Usage:
 *   AIRBNB_ICAL_URL=... node scripts/ical-feed-set.mjs [--name Airbnb] [--off]
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local
 * unless they are already in the environment, so it targets whichever database
 * that file points at. Check that first.
 */
import { readFileSync } from 'node:fs';

function loadEnv() {
  try {
    for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch { /* environment only, which is how a server would run this */ }
}
loadEnv();

const args = process.argv.slice(2);
const name = args.includes('--name') ? args[args.indexOf('--name') + 1] : 'Airbnb';
const active = !args.includes('--off');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const feedUrl = process.env.AIRBNB_ICAL_URL;

if (!url || !key) { console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.'); process.exit(1); }
if (!feedUrl) { console.error('AIRBNB_ICAL_URL is required.'); process.exit(1); }
if (!feedUrl.startsWith('https://')) { console.error('The feed URL must be https.'); process.exit(1); }

const api = (path, init = {}) =>
  fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...init.headers },
  });

const host = new URL(url).host;
const propRes = await api('properties?select=id,name&is_active=eq.true&limit=1');
const [property] = await propRes.json();
if (!property) { console.error('No active property found.'); process.exit(1); }

const existingRes = await api(`ical_feeds?select=id&property_id=eq.${property.id}&name=eq.${encodeURIComponent(name)}`);
const [existing] = await existingRes.json();

const body = JSON.stringify({ property_id: property.id, name, url: feedUrl, is_active: active });
const res = existing
  ? await api(`ical_feeds?id=eq.${existing.id}`, { method: 'PATCH', body })
  : await api('ical_feeds', { method: 'POST', body, headers: { Prefer: 'return=minimal' } });

if (!res.ok) { console.error(`Failed: ${res.status} ${await res.text()}`); process.exit(1); }

// The URL itself is deliberately not printed back.
console.log(`${existing ? 'Updated' : 'Created'} feed "${name}" for ${property.name} on ${host} (active: ${active}).`);
