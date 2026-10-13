'use client';

import React, { useEffect, useState } from 'react';

import DatePicker from '@/components/ui/DatePicker';
import { todayISO, addDaysISO } from '@/lib/format';
import { isRangeAvailable, latestCheckOut, firstAvailableNight } from '@/lib/availability';
import { useNightCalendar } from '@/components/guest/useNightCalendar';
import { MAX_STAY_NIGHTS, MAX_STAY_MESSAGE } from '@/lib/pricing-engine';

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
  // Only the guest's own choices are state; a null pick means "still on the
  // default", so the opening dates can follow availability as it loads.
  const [pickedIn, setPickedIn] = useState<string | null>(null);
  const [pickedOut, setPickedOut] = useState<string | null>(null);
  const [adults, setAdults] = useState(Math.min(idealOccupancy, maxOccupancy));
  const { unavailable, infoFor, monthStatus, loadMonth, loadRange } = useNightCalendar(propertyId);

  // One night from the first bookable date. Availability lands after the first
  // render, so this re-derives rather than opening on a night already taken.
  const checkIn = pickedIn ?? firstAvailableNight(unavailable, todayStr) ?? todayStr;
  const checkOut = pickedOut ?? addDaysISO(checkIn, 1);
  useEffect(() => { loadRange(checkIn, checkOut); }, [checkIn, checkOut, loadRange]);
  // The morning of the first taken night is a valid check-out, so the check-out
  // calendar shows it as open rather than booked.
  // Cap the picker at the longest bookable stay as well as at the next booked
  // night, so the 10-night limit is a shape of the calendar, not just an error.
  const stayCap = addDaysISO(checkIn, MAX_STAY_NIGHTS);
  const nextTaken = latestCheckOut(unavailable, checkIn) ?? undefined;
  const checkOutMax = nextTaken && nextTaken < stayCap ? nextTaken : stayCap;
  const checkOutInfo = (iso: string) => (iso === checkOutMax ? { available: true } : infoFor(iso));
  const datesAvailable = isRangeAvailable(unavailable, checkIn, checkOut);
  const tooLong = checkOut > stayCap;
  const canContinue = datesAvailable && !tooLong;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canContinue) return;
        onContinue(`checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=0`);
      }}
      className="space-y-5"
    >
      {/* No fill here. Each DatePicker already paints its trigger with
          --paper-sunk, so a sunk wrapper around them stacked the same tone on
          itself and the two fields vanished into one slab. The modal's white
          surface is the ground, exactly as in the booking widget. */}
      <div className="space-y-2">
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
            setPickedIn(v);
            if (v >= checkOut || !isRangeAvailable(unavailable, v, checkOut)) setPickedOut(null);
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
          onChange={setPickedOut}
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

      {tooLong ? (
        <p role="alert" className="text-sm font-medium text-[var(--error)]">
          {MAX_STAY_MESSAGE}
        </p>
      ) : !datesAvailable ? (
        <p role="alert" className="text-sm font-medium text-[var(--error)]">
          Some of those nights are already booked. Please choose different dates.
        </p>
      ) : null}

      <button type="submit" disabled={!canContinue} className="btn-primary block w-full disabled:opacity-50">
        Continue
      </button>
    </form>
  );
}
