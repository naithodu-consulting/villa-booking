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
 * Nightly price and availability for the date pickers, from
 * /api/availability/calendar: six months on page load, then the month on screen
 * plus the next two as the guest pages forward, so a month is normally ready
 * before it is shown.
 *
 * If a month fails to load its dates stay selectable: checkout prices the stay and
 * re-checks availability on the server, so a failed request never blocks a booking.
 */
export function useNightCalendar(propertyId: string | undefined) {
  const [nights, setNights] = useState<ReadonlyMap<string, NightInfo>>(() => new Map());
  const [loaded, setLoaded] = useState<ReadonlySet<string>>(() => new Set());
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const requested = useRef(new Set<string>());

  /**
   * Load `count` months starting with the one containing `iso`, in a single
   * request, skipping months already loaded or in flight. A failed month is
   * retried on the next call.
   */
  const loadMonths = useCallback((iso: string, count: number) => {
    if (!propertyId || !/^\d{4}-\d{2}/.test(iso)) return;
    const months: string[] = [];
    let month = `${iso.slice(0, 7)}-01`;
    for (let i = 0; i < count; i++) {
      if (!requested.current.has(month)) months.push(month);
      month = addMonthsISO(month, 1);
    }
    if (months.length === 0) return;
    // One request spans the first to the last missing month; a loaded month in
    // between is simply fetched again, which is cheaper than a second request.
    const from = months[0];
    const to = addMonthsISO(months[months.length - 1], 1);
    for (let m = from; m < to; m = addMonthsISO(m, 1)) if (!months.includes(m)) months.push(m);
    months.forEach((m) => requested.current.add(m));
    const params = new URLSearchParams({ propertyId, from, to });
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
        setLoaded((prev) => {
          const next = new Set(prev);
          months.forEach((m) => next.add(m));
          return next;
        });
        setFailed((prev) => {
          const next = new Set(prev);
          months.forEach((m) => next.delete(m));
          return next;
        });
      })
      .catch(() => {
        months.forEach((m) => requested.current.delete(m));
        setFailed((prev) => {
          const next = new Set(prev);
          months.forEach((m) => next.add(m));
          return next;
        });
      });
  }, [propertyId]);

  /**
   * The month on screen, plus the next two fetched in the background, so paging
   * forward shows prices at once instead of a blank calendar that fills in.
   */
  const loadMonth = useCallback((iso: string) => loadMonths(iso, 3), [loadMonths]);

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

  // Six months in one request on page load: most stays are booked within that
  // window, so the calendar is usually complete before the guest opens it.
  // (Six months is at most 184 nights, inside the endpoint's 186-night limit.)
  useEffect(() => {
    loadMonths(todayISO(), 6);
  }, [loadMonths]);

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
