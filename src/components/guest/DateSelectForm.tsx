'use client';

import React, { useEffect, useState } from 'react';

import DatePicker from '@/components/ui/DatePicker';
import { todayISO, addDaysISO } from '@/lib/format';
import { isRangeAvailable, latestCheckOut } from '@/lib/availability';
import { useNightCalendar } from '@/components/guest/useNightCalendar';

interface Props {
  maxOccupancy: number;
  /** Starting guest count - the villa's ideal party size. */
  idealOccupancy: number;
  /** When given, booked and blocked nights are struck out and cannot be chosen. */
  propertyId?: string;
  /** Receives the query string for /book, e.g. "checkIn=…&checkOut=…&adults=8&children=0". */
  onContinue: (query: string) => void;
}

/**
 * Date and guest selection, shared by the /book landing step and the booking
 * dialog so the two cannot drift apart.
 *
 * Dates are calendar dates at the property (see todayISO): using the UTC day
 * here would offer a check-in that has already passed between 00:00 and 05:30 IST.
 */
export default function DateSelectForm({ maxOccupancy, idealOccupancy, propertyId, onContinue }: Props) {
  const todayStr = todayISO();
  const [checkIn, setCheckIn] = useState(todayStr);
  const [checkOut, setCheckOut] = useState(addDaysISO(todayStr, 1));
  const [adults, setAdults] = useState(Math.min(idealOccupancy, maxOccupancy));
  const { unavailable, infoFor, monthStatus, loadMonth, loadRange } = useNightCalendar(propertyId);
  useEffect(() => { loadRange(checkIn, checkOut); }, [checkIn, checkOut, loadRange]);
  // The morning of the first taken night is a valid check-out, so the check-out
  // calendar shows it as open rather than booked.
  const checkOutMax = latestCheckOut(unavailable, checkIn) ?? undefined;
  const checkOutInfo = (iso: string) => (iso === checkOutMax ? { available: true } : infoFor(iso));
  const datesAvailable = isRangeAvailable(unavailable, checkIn, checkOut);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!datesAvailable) return;
        onContinue(`checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=0`);
      }}
      className="space-y-5"
    >
      <div
        className="space-y-2 p-3 rounded-xl"
        style={{ backgroundColor: 'var(--paper-sunk)', border: '1px solid var(--border-subtle)' }}
      >
        <DatePicker
          id="ds-checkin"
          label="Check-In"
          value={checkIn}
          min={todayStr}
          clearable={false}
          getDayInfo={propertyId ? infoFor : undefined}
          getMonthStatus={monthStatus}
          onViewMonthChange={loadMonth}
          onChange={(v) => {
            setCheckIn(v);
            if (v >= checkOut || !isRangeAvailable(unavailable, v, checkOut)) setCheckOut(addDaysISO(v, 1));
          }}
        />
        <DatePicker
          id="ds-checkout"
          label="Check-Out"
          value={checkOut}
          min={addDaysISO(checkIn, 1)}
          max={checkOutMax}
          getDayInfo={propertyId ? checkOutInfo : undefined}
          getMonthStatus={monthStatus}
          onViewMonthChange={loadMonth}
          clearable={false}
          onChange={setCheckOut}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <label htmlFor="ds-guests" className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          Guests
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Fewer guests"
            onClick={() => setAdults((n) => Math.max(1, n - 1))}
            disabled={adults <= 1}
            className="w-9 h-9 rounded-lg font-bold disabled:opacity-40"
            style={{ backgroundColor: 'var(--paper-sunk)', color: 'var(--ink)' }}
          >
            -
          </button>
          <span
            id="ds-guests"
            aria-live="polite"
            className="w-8 text-center font-bold tabular-nums"
            style={{ color: 'var(--ink)' }}
          >
            {adults}
          </span>
          <button
            type="button"
            aria-label="More guests"
            onClick={() => setAdults((n) => Math.min(maxOccupancy, n + 1))}
            disabled={adults >= maxOccupancy}
            className="w-9 h-9 rounded-lg font-bold disabled:opacity-40"
            style={{ backgroundColor: 'var(--paper-sunk)', color: 'var(--ink)' }}
          >
            +
          </button>
        </div>
      </div>

      {!datesAvailable && (
        <p role="alert" className="text-sm font-medium text-[var(--error)]">
          Some of those nights are already booked. Please choose different dates.
        </p>
      )}

      <button type="submit" disabled={!datesAvailable} className="btn-primary block w-full disabled:opacity-50">
        Continue
      </button>
    </form>
  );
}
