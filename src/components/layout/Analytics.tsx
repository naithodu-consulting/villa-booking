'use client';

import React, { useEffect } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

import { useConsent } from '@/lib/consent';
import { GA_ID, sendPageView, setMeasurementEnabled, syncInternalTraffic } from '@/lib/analytics';
import { markAnalyticsReady, useAnalyticsReady } from '@/lib/analytics-ready';
import WebVitals from '@/components/layout/WebVitals';

/**
 * Google Analytics, loaded only after the guest accepts cookies.
 *
 * Nothing is requested from Google until then: the <Script> tags are not
 * rendered at all, so declining means no third-party request is ever made,
 * which is what the banner claims and what the privacy policy states.
 *
 * Set NEXT_PUBLIC_GA_ID to the GA4 measurement ID (G-XXXXXXXXXX) to switch it
 * on. Without it this renders nothing, so the consent gate is already in place
 * and measurement begins the moment the ID is configured.
 *
 * Mounted in the root layout, not in a route group's layout: /book is a real
 * page a guest can link to or refresh into, and mounting this only under
 * (site) left the whole checkout unmeasured.
 */
export default function Analytics() {
  // Unknown on the server and until hydration, so nothing is requested from
  // Google before the stored choice has actually been read.
  const granted = useConsent() === 'accepted';

  useEffect(() => {
    if (!GA_ID) return;
    // Withdrawing consent cannot unload a script that is already in the page.
    // This flag is read by Google before every hit, so it is what actually
    // stops measurement for the rest of this page view.
    setMeasurementEnabled(GA_ID, granted);
  }, [granted]);

  if (!GA_ID || !granted) return null;

  // The operator's own visits. Resolved here rather than in state or an
  // effect: by this line we are certainly in the browser, past hydration and
  // past the consent gate, and the answer cannot change during a page load.
  const internal = resolveInternalTraffic();

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      {/* markAnalyticsReady, not local state: every component that reports on
          mount waits on the same signal, so none of them can race the script
          the way the /book notice did. */}
      <Script id="ga-init" strategy="afterInteractive" onReady={markAnalyticsReady}>
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${GA_ID}',{send_page_view:false${internal ? ",traffic_type:'internal'" : ''}});`}
      </Script>
      <PageViews />
      {/* Inside the consent gate: a performance metric is still a measurement. */}
      <WebVitals />
    </>
  );
}

/**
 * `?internal=1` applied once per page load.
 *
 * Module scope, so the URL is read and the flag written exactly once however
 * often <Analytics> renders, and every render after the first gets the same
 * answer: a config that disagreed with itself between renders would mark some
 * of a visit internal and some of it not.
 */
let internalTraffic: boolean | null = null;

function resolveInternalTraffic(): boolean {
  if (internalTraffic === null) internalTraffic = syncInternalTraffic(window.location.search);
  return internalTraffic;
}

/**
 * One page view per route, sent by hand.
 *
 * GA4's automatic page views are switched off in the config above
 * (`send_page_view:false`) because they read `location.href` directly, which
 * would send the booking confirmation page's secret token to Google. Sending
 * them here means the path passes through `redactPath` first.
 *
 * `usePathname` only, deliberately: `useSearchParams` would force every page
 * under the root layout to be client-side rendered, and fails the production
 * build outright unless wrapped in Suspense. The query string is read from
 * `window.location` at send time instead, which costs nothing and keeps the
 * whole site prerenderable.
 */
function PageViews() {
  const pathname = usePathname();
  const ready = useAnalyticsReady();

  useEffect(() => {
    if (!ready) return;
    sendPageView(pathname);
  }, [ready, pathname]);

  return null;
}
