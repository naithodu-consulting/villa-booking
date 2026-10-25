'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';

import { track, pageType, type PageType } from '@/lib/analytics';
import { useAnalyticsReady } from '@/lib/analytics-ready';

/**
 * Core Web Vitals, as guests actually experience them.
 *
 * Field data, not a lab score: the question is whether the site is quick
 * enough on a mid-range phone on Indian 4G, and no amount of local testing
 * answers that. Vercel's Speed Insights would do this too, but production is
 * built on Hostinger, so it would go blind on the day it mattered. This works
 * wherever the site is served.
 *
 * Two things here are not obvious, and both were found by watching what the
 * page actually sent rather than by reading the code.
 *
 * The callback handed to `useReportWebVitals` must keep the same identity.
 * Next calls any *new* callback with every metric gathered so far, so a
 * callback rebuilt on each render reports the same metric again on every
 * render. That is why the state below lives at module scope and the callback
 * is a plain function rather than a closure over props. The `seen` set is the
 * belt to that braces: each metric carries an id that is unique for the page
 * load, so a duplicate can be dropped however it arrives.
 *
 * And metrics are buffered until gtag is up. TTFB and FCP settle within the
 * first moments of a page load, well before an `afterInteractive` script has
 * run, so without the buffer the two earliest metrics would be the two that
 * never arrived, and the report would flatter the site.
 */

type Metric = { id: string; name: string; value: number; rating?: string };

/** Module scope so the callback below never changes identity. */
let isReady = false;
let currentPage: PageType = 'other';
const pending: Metric[] = [];
const seen = new Set<string>();

function send(metric: Metric) {
  track('web_vitals', {
    metric: metric.name,
    // CLS is a ratio below 1, and rounding it to a whole number would report
    // every layout shift as zero. Everything else is milliseconds, where a
    // fraction is noise.
    value: metric.name === 'CLS' ? Math.round(metric.value * 1000) / 1000 : Math.round(metric.value),
    rating: metric.rating ?? 'unknown',
    page_type: currentPage,
  });
}

function handleMetric(metric: Metric) {
  if (seen.has(metric.id)) return;
  seen.add(metric.id);

  if (!isReady) {
    pending.push(metric);
    return;
  }
  send(metric);
}

export default function WebVitals() {
  const pathname = usePathname();
  const ready = useAnalyticsReady();

  useEffect(() => {
    currentPage = pageType(pathname);
  }, [pathname]);

  useEffect(() => {
    isReady = ready;
    if (!ready) return;
    // Drained rather than copied: a metric sent twice is worse than one lost,
    // because it silently skews the average.
    while (pending.length > 0) send(pending.shift()!);
  }, [ready]);

  useReportWebVitals(handleMetric);

  return null;
}
