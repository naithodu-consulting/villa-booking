'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Property, PricingRule, PricingBreakdown } from '@/types';
import { calculateBookingPrice, MAX_STAY_NIGHTS } from '@/lib/pricing-engine';
import { Users, ChevronDown, Info, Lock, Loader2 } from 'lucide-react';
import DatePicker from '@/components/ui/DatePicker';
import { todayISO, addDaysISO } from '@/lib/format';
import { isRangeAvailable, latestCheckOut } from '@/lib/availability';
import { useNightCalendar } from '@/components/guest/useNightCalendar';

interface BookingWidgetProps {
  property: Property;
  pricingRules: PricingRule[];
}

/** Converts paise integer to formatted rupee string: 1450000 → "14,500" */
function inr(paise: number): string {
  return (paise / 100).toLocaleString('en-IN');
}

export default function BookingWidget({ property, pricingRules }: BookingWidgetProps) {
  // Calendar dates at the property, not UTC instants: toISOString() returns
  // yesterday in India between 00:00 and 05:30 IST.
  const todayStr = todayISO();

  const [checkIn, setCheckIn] = useState<string>(addDaysISO(todayStr, 3));
  const [checkOut, setCheckOut] = useState<string>(addDaysISO(todayStr, 5));
  // Defaults to the villa's ideal party size, not 2: this is a whole-villa
  // booking, so a couple is never the expected starting point.
  const [adults, setAdults] = useState<number>(property.ideal_occupancy);
  const [children, setChildren] = useState<number>(0);
  const [showGuestMenu, setShowGuestMenu] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const guestMenuRef = useRef<HTMLDivElement>(null);
  const { unavailable, infoFor, monthStatus, loadMonth, loadRange } = useNightCalendar(property.id);
  useEffect(() => { loadRange(checkIn, checkOut); }, [checkIn, checkOut, loadRange]);
  // The morning of the first taken night is a valid check-out, so the check-out
  // calendar shows it as open rather than booked.
  // Cap the picker at the longest bookable stay as well as at the next booked
  // night, so the 10-night limit is a shape of the calendar, not just an error.
  const stayCap = addDaysISO(checkIn, MAX_STAY_NIGHTS);
  const nextTaken = latestCheckOut(unavailable, checkIn) ?? undefined;
  const checkOutMax = nextTaken && nextTaken < stayCap ? nextTaken : stayCap;
  const checkOutInfo = (iso: string) => (iso === checkOutMax ? { available: true } : infoFor(iso));

  // Clear the loading state on a bfcache restore, which hands back the frozen
  // React tree with isSubmitting still true and does not remount, so no effect
  // would otherwise run. A real mount needs nothing: the state starts false.
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setIsSubmitting(false);
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  // Close guest dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (guestMenuRef.current && !guestMenuRef.current.contains(e.target as Node)) {
        setShowGuestMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Enforce combined guest total against max occupancy
  const maxAdults = property.max_occupancy - children;
  const maxChildren = property.max_occupancy - adults;

  let breakdown: PricingBreakdown | null = null;
  let errorMsg = '';

  try {
    breakdown = calculateBookingPrice(property, pricingRules, checkIn, checkOut, adults, children);
  } catch (err: unknown) {
    const raw = err instanceof Error ? err.message : 'Invalid dates selected';
    errorMsg = raw.includes(':') ? raw.split(':').slice(1).join(':').trim() : raw;
  }

  if (breakdown && !isRangeAvailable(unavailable, checkIn, checkOut)) {
    breakdown = null;
    errorMsg = 'Some of those nights are already booked. Please choose different dates.';
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakdown) return;
    setIsSubmitting(true);
    try {
      router.push(`/book?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}`);
    } catch {
      setIsSubmitting(false);
    }
  };

  // "Starting from" must be the lowest nightly rate a guest can actually get:
  // weekday, weekend or any seasonal rule, whichever is cheapest.
  const fromRateDisplay = inr(Math.min(
    property.base_nightly_rate,
    property.weekend_nightly_rate,
    ...pricingRules.map((r) => r.nightly_rate),
  ));
  const extraRateDisplay = inr(property.extra_guest_rate);
  const tier2From = property.extra_guest_tier2_from;

  return (
    <div className="w-full rounded-2xl border border-[rgba(0,0,0,0.09)] shadow-lg">
      {/* No overflow-hidden on the card: it clipped the date picker popup. The header
          and body round their own corners instead. */}
      {/* Header carries one message: the lowest nightly rate, stated honestly.
          It read "₹12,000 / night" as if fixed, but weekends, holidays and extra
          guests cost more and 18% GST is added on top. Villa sites commonly show
          a "from" price and reviewers warn it hides those; so it says what the
          figure covers (before GST, up to base_occupancy guests).
          Was --maroon (#5A2626) while the site header and footer are --maroon-deep
          (#3C1717), so the page showed three different maroons; now they agree.
          The "Direct Booking" pill is gone: it made the same claim as the
          guarantee line beside it, and its rgba(30,138,122,0.2) fill composited
          over maroon to #4E3A37, a muddy brown-grey rather than the intended teal. */}
      <div className="bg-[var(--maroon-deep)] p-5 rounded-t-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[1px] text-white/60 mb-1.5">Starting from</p>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-3xl font-black text-white leading-none">₹{fromRateDisplay}</span>
          <span className="text-white/60 text-sm font-semibold">/ night + GST</span>
        </div>
        <p className="text-[13px] text-white/70 mt-1.5">For up to {property.base_occupancy} guests</p>
        <p className="text-[13px] font-semibold text-[var(--brass-light)] mt-2">
          Lowest rate guaranteed &middot; No platform fees
        </p>
      </div>

      {/* White body — form */}
      <div className="bg-white p-5 space-y-4 rounded-b-2xl">
        <form onSubmit={handleBookingSubmit} className="space-y-3">
          {/* Dates and guests share one field treatment: same fill, border, radius
              and label style. The dates used to sit in an extra sunk panel (a box
              inside a box) while the guest control used --cream, the announcement
              bar's attention ground, so one form showed two different field fills. */}
          <div className="space-y-3">
            <DatePicker
              id="widget-checkin"
              label="Check-In"
              value={checkIn}
              min={todayStr}
              getDayInfo={infoFor}
              getMonthStatus={monthStatus}
              onViewMonthChange={loadMonth}
              onChange={(v) => {
                setCheckIn(v);
                if (v >= checkOut || !isRangeAvailable(unavailable, v, checkOut)) setCheckOut(addDaysISO(v, 1));
              }}
              clearable={false}
              compact
              placeholder="Select check-in"
            />
            <DatePicker
              id="widget-checkout"
              label="Check-Out"
              value={checkOut}
              min={addDaysISO(checkIn || todayStr, 1)}
              max={checkOutMax}
              getDayInfo={checkOutInfo}
              getMonthStatus={monthStatus}
              onViewMonthChange={loadMonth}
              onChange={setCheckOut}
              clearable={false}
              compact
              placeholder="Select check-out"
            />
          </div>

          {/* Guests Selector */}
          <div className="relative" ref={guestMenuRef}>
            <label
              className="block"
              style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--ink-muted)',
                marginBottom: '6px',
              }}
            >
              Guests &amp; Capacity
            </label>
            <button
              type="button"
              aria-expanded={showGuestMenu}
              aria-haspopup="true"
              onClick={() => setShowGuestMenu((v) => !v)}
              className="w-full rounded-xl text-left flex items-center justify-between text-[var(--ink)] text-sm font-semibold transition-colors"
              style={{
                backgroundColor: 'var(--paper-sunk)',
                border: '1px solid var(--border-subtle)',
                padding: '10px 12px',
                minHeight: '44px',
              }}
            >
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[var(--brass)]" />
                <span>
                  {adults} Adult{adults !== 1 ? 's' : ''}
                  {children > 0 ? `, ${children} Child${children !== 1 ? 'ren' : ''}` : ''}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[var(--ink-muted)] transition-transform ${showGuestMenu ? 'rotate-180' : ''}`} />
            </button>

            {showGuestMenu && (
              <div
                role="dialog"
                aria-label="Select number of guests"
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-[rgba(0,0,0,0.12)] p-4 rounded-xl shadow-lg z-50 space-y-3"
              >
                {/* Adults */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--ink)]">Adults</p>
                    <p className="text-xs text-[var(--ink-muted)]">Ages 12+</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      aria-label="Remove one adult"
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      className="w-7 h-7 rounded-lg bg-[var(--paper-sunk)] text-[var(--ink)] font-bold hover:bg-[var(--paper-sunk-hover)] text-sm flex items-center justify-center disabled:opacity-40"
                      disabled={adults <= 1}
                    >
                      −
                    </button>
                    <span className="text-sm font-bold w-5 text-center tabular-nums">{adults}</span>
                    <button
                      type="button"
                      aria-label="Add one adult"
                      onClick={() => setAdults(Math.min(maxAdults, adults + 1))}
                      className="w-7 h-7 rounded-lg bg-[var(--paper-sunk)] text-[var(--ink)] font-bold hover:bg-[var(--paper-sunk-hover)] text-sm flex items-center justify-center disabled:opacity-40"
                      disabled={adults >= maxAdults}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between border-t border-[rgba(0,0,0,0.09)] pt-2.5">
                  <div>
                    <p className="text-sm font-bold text-[var(--ink)]">Children</p>
                    <p className="text-xs text-[var(--ink-muted)]">Ages 5 to 12</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      aria-label="Remove one child"
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      className="w-7 h-7 rounded-lg bg-[var(--paper-sunk)] text-[var(--ink)] font-bold hover:bg-[var(--paper-sunk-hover)] text-sm flex items-center justify-center disabled:opacity-40"
                      disabled={children <= 0}
                    >
                      −
                    </button>
                    <span className="text-sm font-bold w-5 text-center tabular-nums">{children}</span>
                    <button
                      type="button"
                      aria-label="Add one child"
                      onClick={() => setChildren(Math.min(maxChildren, children + 1))}
                      className="w-7 h-7 rounded-lg bg-[var(--paper-sunk)] text-[var(--ink)] font-bold hover:bg-[var(--paper-sunk-hover)] text-sm flex items-center justify-center disabled:opacity-40"
                      disabled={children >= maxChildren}
                    >
                      +
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[var(--brass-ink)] pt-2 border-t border-[rgba(0,0,0,0.09)]">
                  Base rate includes up to {property.base_occupancy} guests.{' '}
                  {tier2From != null && tier2From <= property.max_occupancy && property.extra_guest_tier2_rate != null
                    ? <>Extra guests per night: ₹{extraRateDisplay} each for guests {property.base_occupancy + 1}-{tier2From - 1}, ₹{inr(property.extra_guest_tier2_rate)} each for guests {tier2From}-{property.max_occupancy}.</>
                    : <>₹{extraRateDisplay}/night per additional guest.</>}
                </p>
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          {errorMsg ? (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-[var(--error)] text-xs font-medium">
              {errorMsg}
            </div>
          ) : breakdown ? (
            <div className="space-y-1.5 py-2.5 border-t border-b border-[rgba(0,0,0,0.09)] text-sm">
              {/* One line for the stay, not a night-by-night ledger: weekday and
                  weekend nights are summed rather than itemised. */}
              <div className="flex justify-between text-[var(--ink-muted)]">
                <span>Total nights × {breakdown.num_nights}</span>
                <span className="tabular-nums">₹{inr(breakdown.base_amount)}</span>
              </div>

              {breakdown.extra_guest_amount > 0 && (
                <div className="flex justify-between text-[var(--ink-muted)]">
                  <span>Extra guests ({breakdown.extra_guests_count})</span>
                  <span className="tabular-nums">₹{inr(breakdown.extra_guest_amount)}</span>
                </div>
              )}

              <div className="flex justify-between text-[var(--ink-muted)]">
                <span className="flex items-center gap-1">
                  GST (18%)
                  <Info className="w-3 h-3 text-[var(--ink-muted)]" aria-label="Goods & Services Tax applicable on accommodation above ₹7,500/night" />
                </span>
                <span className="tabular-nums">₹{inr(breakdown.tax_amount)}</span>
              </div>

              <div className="flex justify-between text-sm font-black text-[var(--ink)] pt-2 border-t border-[rgba(0,0,0,0.09)]">
                <span>Total Payable</span>
                <span className="text-[var(--brass-ink)] font-extrabold text-sm tabular-nums">
                  ₹{inr(breakdown.total_amount)}
                </span>
              </div>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!!errorMsg || isSubmitting}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Securing Dates…</>
            ) : (
              <><Lock className="w-3.5 h-3.5" /> Book Now</>
            )}
          </button>

          <p className="text-center text-xs text-[var(--ink-muted)]">
            No platform fees · Best rate guaranteed
          </p>
        </form>
      </div>
    </div>
  );
}
