'use client';

import { useEffect } from 'react';

import { track } from '@/lib/analytics';
import { useAnalyticsReady } from '@/lib/analytics-ready';

/**
 * Reports that /book served the reservations notice instead of the checkout.
 *
 * The page itself is a server component and the notice is static, so there is
 * nothing to hang an effect on: this exists only to report the view. The
 * dialog version reports from its own open handler, where a guest opening it
 * is a real action rather than a render.
 *
 * Both report the same event with a different `surface`, so the enquiry funnel
 * counts a guest who went straight to /book alongside one who pressed Book Now
 * on a content page.
 */
export default function TrackReservationNotice() {
  // Waits for gtag: this mounts with the page, well before an
  // `afterInteractive` script has run, so reporting straight away sent the
  // event into a no-op and /book recorded nothing.
  const ready = useAnalyticsReady();

  useEffect(() => {
    if (!ready) return;
    track('reservation_notice_view', { surface: 'page' });
  }, [ready]);

  return null;
}
