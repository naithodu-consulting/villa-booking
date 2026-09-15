'use client';

import { useEffect, useState } from 'react';
import { addDaysISO } from '@/lib/format';

const EMPTY: ReadonlySet<string> = new Set();

/**
 * Nights that cannot be booked, from `from` for `days` nights, for greying out
 * the date pickers. Until it loads (or if it fails) every date stays selectable:
 * checkout re-checks availability on the server, so a failed fetch degrades to
 * the old behaviour rather than blocking bookings.
 */
export function useUnavailableNights(propertyId: string | undefined, from: string, days = 180) {
  const [unavailable, setUnavailable] = useState<ReadonlySet<string>>(EMPTY);

  useEffect(() => {
    if (!propertyId) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ propertyId, from, to: addDaysISO(from, days) });

    fetch(`/api/availability/calendar?${params}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { unavailable?: string[] } | null) => {
        if (body?.unavailable) setUnavailable(new Set(body.unavailable));
      })
      .catch(() => { /* aborted or offline: keep dates selectable */ });

    return () => controller.abort();
  }, [propertyId, from, days]);

  return unavailable;
}
