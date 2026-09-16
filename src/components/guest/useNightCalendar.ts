'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addMonthsISO, todayISO } from '@/lib/format';
import type { DayInfo, MonthStatus } from '@/components/ui/DatePicker';

export interface NightInfo {
  date: string;           // "YYYY-MM-DD"
  rate: number;           // paise
  available: boolean;
  special: string | null; // pricing rule name, when the night has a special price
}

/**
 * Nightly price and availability for the date pickers, loaded a month at a time
 * from /api/availability/calendar as the guest pages through the calendar.
 *
 * If a month fails to load its dates stay selectable: checkout prices the stay and
 * re-checks availability on the server, so a failed request never blocks a booking.
 */
export function useNightCalendar(propertyId: string | undefined) {
  const [nights, setNights] = useState<ReadonlyMap<string, NightInfo>>(() => new Map());
  const [loaded, setLoaded] = useState<ReadonlySet<string>>(() => new Set());
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const requested = useRef(new Set<string>());

  /** Load the month containing `iso`, once (retried on the next call if it failed). */
  const loadMonth = useCallback((iso: string) => {
    if (!propertyId || !/^\d{4}-\d{2}/.test(iso)) return;
    const from = `${iso.slice(0, 7)}-01`;
    if (requested.current.has(from)) return;
    requested.current.add(from);

    const params = new URLSearchParams({ propertyId, from, to: addMonthsISO(from, 1) });
    fetch(`/api/availability/calendar?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error(`calendar ${res.status}`);
        return res.json() as Promise<{ nights?: NightInfo[] }>;
      })
      .then((body) => {
        if (!body.nights) throw new Error('calendar: no nights');
        setNights((prev) => {
          const next = new Map(prev);
          for (const night of body.nights!) next.set(night.date, night);
          return next;
        });
        setLoaded((prev) => new Set(prev).add(from));
      })
      .catch(() => {
        requested.current.delete(from);
        setFailed((prev) => new Set(prev).add(from));
      });
  }, [propertyId]);

  /** Load every month a stay touches, so range checks see all of its nights. */
  const loadRange = useCallback((checkIn: string, checkOut: string) => {
    if (!checkIn) return;
    const last = checkOut && checkOut > checkIn ? checkOut : checkIn;
    let month = `${checkIn.slice(0, 7)}-01`;
    for (let i = 0; i < 24 && month <= last; i++) {
      loadMonth(month);
      month = addMonthsISO(month, 1);
    }
  }, [loadMonth]);

  // The two months a guest is most likely to look at first.
  useEffect(() => {
    const today = todayISO();
    loadMonth(today);
    loadMonth(addMonthsISO(today, 1));
  }, [loadMonth]);

  const unavailable = useMemo<ReadonlySet<string>>(
    () => new Set([...nights.values()].filter((n) => !n.available).map((n) => n.date)),
    [nights],
  );

  const infoFor = useCallback((iso: string): DayInfo | undefined => {
    const night = nights.get(iso);
    return night && { available: night.available, rate: night.rate, special: night.special };
  }, [nights]);

  const monthStatus = useCallback(
    (firstOfMonth: string): MonthStatus =>
      loaded.has(firstOfMonth) ? 'ready' : failed.has(firstOfMonth) ? 'error' : 'loading',
    [loaded, failed],
  );

  return { unavailable, infoFor, monthStatus, loadMonth, loadRange };
}
