'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

import ReservationNotice from '@/components/guest/ReservationNotice';
import { OPEN_BOOKING_EVENT } from '@/lib/booking-events';

/**
 * Stands in for BookingDialog while ONLINE_PAYMENTS_ENABLED is off.
 *
 * It answers the same OPEN_BOOKING_EVENT, so every Book Now on the site is
 * covered by mounting this instead of the date picker: the CTAs themselves are
 * untouched, and none can be forgotten. The layout mounts exactly one of the
 * two, so a guest can never reach the date picker by a route that was missed.
 *
 * Native <dialog> + showModal() for the same reasons as BookingDialog: focus
 * trap, ESC to close, inert background, ::backdrop, and the page-scroll lock
 * globals.css already hangs off html:has(dialog[open]).
 */
export default function PaymentsPausedDialog({
  phoneNumber,
  email,
}: {
  phoneNumber?: string;
  email?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  const close = useCallback(() => ref.current?.close(), []);

  useEffect(() => {
    const open = () => {
      const el = ref.current;
      if (el && !el.open) el.showModal();
    };
    window.addEventListener(OPEN_BOOKING_EVENT, open);
    return () => window.removeEventListener(OPEN_BOOKING_EVENT, open);
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="payments-paused-title"
      // The dialog element itself is the click target for backdrop clicks, so
      // compare against the event target rather than measuring coordinates.
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
      className="w-[min(30rem,calc(100vw-2rem))] rounded-3xl p-0 overflow-hidden shadow-2xl backdrop:bg-[rgba(58,14,31,0.62)] backdrop:backdrop-blur-sm"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
    >
      {/* Maroon band, brass eyebrow, Cormorant heading: the same treatment the
          booking widget's header and the site's CTA bands use, so the notice
          reads as part of the villa rather than as a browser alert. */}
      <div className="relative px-6 sm:px-7 pt-6 pb-5" style={{ backgroundColor: 'var(--maroon-deep)' }}>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
          style={{ color: 'rgba(255,255,255,0.75)' }}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
        <p
          className="text-[10px] font-bold uppercase mb-2"
          style={{ color: 'var(--brass-light)', letterSpacing: '0.18em' }}
        >
          Reservations
        </p>
        <h2
          id="payments-paused-title"
          className="text-[26px] sm:text-[28px] leading-[1.15] font-bold pr-10"
          style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}
        >
          Online Payments Coming Soon
        </h2>
      </div>

      {/* Hairline in brass, the site's rule colour, between band and body. */}
      <div style={{ height: '2px', backgroundColor: 'var(--brass)' }} />

      <div className="px-6 sm:px-7 py-6 space-y-6" style={{ backgroundColor: 'var(--surface)' }}>
        <ReservationNotice phoneNumber={phoneNumber} email={email} />

        <button type="button" onClick={close} className="w-full btn-primary py-3">
          Got It
        </button>
      </div>
    </dialog>
  );
}
