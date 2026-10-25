'use client';

import { useSyncExternalStore } from 'react';

/**
 * Readiness of the GA script, as a tiny store.
 *
 * Kept apart from analytics.ts because this depends on React, and the payment
 * routes import analytics.ts to build the server-sent purchase: a React hook
 * reachable from a route handler fails the Next build.
 */

/**
 * Whether gtag.js has finished initialising.
 *
 * `track()` is a no-op until it has, which is right for an event fired by a
 * click: by then the script is long since up. It is wrong for an event fired
 * when a component mounts, because mounting happens before an
 * `afterInteractive` script has loaded, so the event is silently dropped.
 *
 * That is not hypothetical: it is how the /book reservations notice came to
 * report nothing at all while the dialog version reported fine.
 *
 * So a mount-time event waits for this instead. Nothing is buffered: if the
 * guest never consents, gtag never initialises, this never turns true and the
 * event is never sent, which is the behaviour the banner promises.
 */
let analyticsReady = false;
const readyListeners = new Set<() => void>();

/** Called by <Analytics> once the gtag snippet has run. */
export function markAnalyticsReady(): void {
  if (analyticsReady) return;
  analyticsReady = true;
  readyListeners.forEach((listener) => listener());
}

function subscribeReady(onChange: () => void) {
  readyListeners.add(onChange);
  return () => {
    readyListeners.delete(onChange);
  };
}

/**
 * Readiness as React state, for components that report on mount.
 *
 * False on the server and on the first client render, so it never renders
 * differently in the two places.
 */
export function useAnalyticsReady(): boolean {
  return useSyncExternalStore(
    subscribeReady,
    () => analyticsReady,
    () => false,
  );
}
