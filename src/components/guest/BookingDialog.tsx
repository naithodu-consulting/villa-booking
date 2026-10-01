'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

import DateSelectForm from '@/components/guest/DateSelectForm';

/** Any CTA can open the dialog by dispatching this on window. */
export const OPEN_BOOKING_EVENT = 'villa19:open-booking';

/**
 * Date selection as a dialog over whatever page the guest is already reading.
 *
 * Pressing BOOK NOW used to be a full navigation to /book, which cost a page
 * load and dropped the guest out of the page they were reading. The dialog
 * keeps them in place; /book still exists and still works, so direct links,
 * bookmarks, refreshes and no-JS all land somewhere real.
 *
 * Native <dialog> + showModal() is used rather than a hand-rolled overlay
 * because it brings the focus trap, ESC-to-close, inert background and the
 * ::backdrop pseudo-element for free. globals.css already locks page scroll via
 * html:has(dialog[open]).
 */
export default function BookingDialog({ maxOccupancy, idealOccupancy, propertyId }: { maxOccupancy: number; idealOccupancy: number; propertyId?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();

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
      aria-labelledby="booking-dialog-title"
      // Clicking the backdrop closes. The dialog element itself is the click
      // target for backdrop clicks, so compare against the event target rather
      // than measuring coordinates.
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
      className="w-[min(28rem,calc(100vw-2rem))] rounded-3xl p-0 backdrop:bg-slate-950/70 backdrop:backdrop-blur-sm"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="p-6 sm:p-7 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h2
              id="booking-dialog-title"
              className="text-2xl font-bold"
              style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}
            >
              Choose your dates
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:bg-[var(--paper-sunk)]"
            style={{ color: 'var(--ink-muted)' }}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <DateSelectForm
          maxOccupancy={maxOccupancy}
          idealOccupancy={idealOccupancy}
          propertyId={propertyId}
          onContinue={(query) => {
            close();
            router.push(`/book?${query}`);
          }}
        />
      </div>
    </dialog>
  );
}
