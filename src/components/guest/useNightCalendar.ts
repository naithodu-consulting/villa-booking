'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addMonthsISO, todayISO } from '@/lib/format';
import type { DayInfo, MonthStatus } from '@/components/ui/DatePicker';

export interface NightInfo {
  date: string;           // "YYYY-MM-DD"
  rate: number;           // paise
  available: boolean;
  special: string | null; // pricing rule name, when the night has a special price
  /** When the server read this night's rate. Set on arrival, not by the API. */
  generatedAt?: number;
}

/** Longest span the calendar endpoint will serve in one request. */
const MAX_MONTHS_PER_REQUEST = 6;

/**
 * Splits months to reload into requests the endpoint will accept.
 *
 * Two constraints. The endpoint refuses spans over 186 nights, so no request
 * may cover more than six months. And the set is not necessarily contiguous —
 * loading a stay far ahead leaves a gap between those months and the ones
 * loaded on mount — while a request covers an unbroken span, so a gap has to
 * start a new request or the months past it are never re-read and quietly keep
 * the availability they were first loaded with.
 *
 * Exported for testing; `months` must be sorted ascending.
 */
export function planRefreshRequests(
  months: readonly string[],
  maxPerRequest: number = MAX_MONTHS_PER_REQUEST,
): Array<{ start: string; count: number }> {
  const plan: Array<{ start: string; count: number }> = [];
  let run: string[] = [];

  const flush = () => {
    for (let i = 0; i < run.length; i += maxPerRequest) {
      plan.push({ start: run[i], count: Math.min(maxPerRequest, run.length - i) });
    }
    run = [];
  };

  for (const month of months) {
    if (run.length > 0 && addMonthsISO(run[run.length - 1], 1) !== month) flush();
    run.push(month);
  }
  flush();

  return plan;
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
  // Bumped by refresh(). A fetch started before a refresh belongs to an older
  // generation and is discarded, so a slow reply cannot land after the refresh
  // it was superseded by and put stale rates back.
  const generation = useRef(0);

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
    const mine = generation.current;
    const params = new URLSearchParams({ propertyId, from, to });
    fetch(`/api/availability/calendar?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error(`calendar ${res.status}`);
        return res.json() as Promise<{ nights?: NightInfo[]; generatedAt?: number }>;
      })
      .then((body) => {
        if (!body.nights) throw new Error('calendar: no nights');
        if (mine !== generation.current) return; // superseded by a refresh
        // Stamp each night with the age of the response that carried it. An
        // older server may omit generatedAt; treat that as "unknown age", which
        // rateFor then declines to prefer over the page's own rates.
        const generatedAt = body.generatedAt;
        setNights((prev) => {
          const next = new Map(prev);
          for (const night of body.nights!) next.set(night.date, { ...night, generatedAt });
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
        if (mine !== generation.current) return;
        months.forEach((m) => requested.current.delete(m));
        // Drop these months from `loaded` as well. monthStatus checks `loaded`
        // first, so a month left there would keep reporting "ready" after a
        // failed reload and hide that its prices are the ones held from before.
        setLoaded((prev) => {
          const next = new Set(prev);
          months.forEach((m) => next.delete(m));
          return next;
        });
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

  /**
   * Re-fetches every month already loaded, discarding what is held.
   *
   * Rates and availability are read once on mount, so a tab left open
   * overnight would otherwise price stays at yesterday's rates and show nights
   * as free that have since been booked — for as long as it stays open.
   */
  const refresh = useCallback(() => {
    const months = [...requested.current].sort();
    if (months.length === 0) return;
    generation.current += 1;
    requested.current.clear();
    for (const { start, count } of planRefreshRequests(months)) {
      loadMonths(start, count);
    }
  }, [loadMonths]);

  // Refresh when the guest comes back to the tab, at most once a minute (the
  // endpoint's own cache window, so anything more often cannot return newer
  // data). This is what keeps a day-old tab honest.
  useEffect(() => {
    let lastRefresh = Date.now();
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastRefresh < 60_000) return;
      lastRefresh = Date.now();
      refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  const unavailable = useMemo<ReadonlySet<string>>(
    () => new Set([...nights.values()].filter((n) => !n.available).map((n) => n.date)),
    [nights],
  );

  const infoFor = useCallback((iso: string): DayInfo | undefined => {
    const night = nights.get(iso);
    return night && { available: night.available, rate: night.rate, special: night.special };
  }, [nights]);

  /**
   * The rate for a night in paise, but only when it is newer than the page
   * asking for it (`since`, the moment the page's own rates were read).
   *
   * The calendar endpoint is cached at the CDN for up to two minutes, so its
   * rates are not automatically the fresher ones: on a page rendered per
   * request they are usually older. Preferring them unconditionally would show
   * a just-changed price and then correct it at the payment step — the wrong
   * direction for a money figure. Returning undefined leaves the caller on its
   * own rates, which are then the better of the two.
   *
   * In a tab left open, the page's rates stop ageing while the calendar keeps
   * refreshing, so this is where the live rates take over — which is the case
   * it exists for.
   */
  const rateForSince = useCallback(
    (since: number) => (iso: string): number | undefined => {
      const night = nights.get(iso);
      if (!night || night.generatedAt === undefined) return undefined;
      return night.generatedAt >= since ? night.rate : undefined;
    },
    [nights],
  );

  const monthStatus = useCallback(
    (firstOfMonth: string): MonthStatus =>
      loaded.has(firstOfMonth) ? 'ready' : failed.has(firstOfMonth) ? 'error' : 'loading',
    [loaded, failed],
  );

  return { unavailable, infoFor, rateForSince, monthStatus, loadMonth, loadRange, refresh };
}
