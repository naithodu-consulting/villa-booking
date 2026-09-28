'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Re-fetches the confirmation page while payment is still being confirmed.
 *
 * The Razorpay webhook usually lands a few seconds after the guest is sent
 * here, so the first render often says "pending". Without this the guest had
 * to know to reload. Stops after `maxTries` so an abandoned tab does not poll
 * forever; the page says what to do if it is still pending by then.
 */
export default function RefreshWhilePending({ intervalMs = 4000, maxTries = 15 }: { intervalMs?: number; maxTries?: number }) {
  const router = useRouter();

  useEffect(() => {
    let tries = 0;
    const id = window.setInterval(() => {
      tries += 1;
      router.refresh();
      if (tries >= maxTries) window.clearInterval(id);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [router, intervalMs, maxTries]);

  return null;
}
