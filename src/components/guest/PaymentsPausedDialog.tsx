'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { X, Phone, Mail } from 'lucide-react';

import ReservationNotice from '@/components/guest/ReservationNotice';
import WhatsAppIcon from '@/components/guest/WhatsAppIcon';
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
  whatsappUrl,
  email,
}: {
  phoneNumber?: string;
  /** Built by the caller, so this button and the footer's share one wording. */
  whatsappUrl?: string;
  email?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  const close = useCallback(() => ref.current?.close(), []);
  const digits = phoneNumber?.replace(/\D/g, '');

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
      {/* Maroon band over a white body: the treatment the booking widget's
          header and the site's CTA bands use, so the notice reads as part of
          the villa rather than as a browser alert. --maroon, not
          --maroon-deep, so the band and the button below it are the one colour
          rather than two maroons in one small card. */}
      <div className="relative px-6 sm:px-7 pt-6 pb-5" style={{ backgroundColor: 'var(--maroon)' }}>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
          style={{ color: 'rgba(255,255,255,0.75)' }}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
        <h2
          id="payments-paused-title"
          className="text-[20px] leading-[1.25] font-bold text-center px-8"
          style={{ color: '#FFFFFF', fontFamily: 'var(--font-body)' }}
        >
          Please Note
        </h2>
      </div>

      {/* Hairline in brass, the site's rule colour, between band and body. */}
      <div style={{ height: '2px', backgroundColor: 'var(--brass)' }} />

      <div className="px-6 sm:px-7 py-6 space-y-6" style={{ backgroundColor: 'var(--surface)' }}>
        <ReservationNotice phoneNumber={phoneNumber} email={email} />

        {/* The one button is the next step, not a dismissal; the X in the band
            is the way out. WhatsApp, with the same label and the same prefilled
            message as the homepage's mobile CTA bar, so "Enquire Now" means one
            thing across the site. Falls back to a call, then to email, so it is
            never a dead link if a number is unset. The glyph carries the
            channel; the fill stays --maroon with the header's nav gold on it,
            rather than WhatsApp green, which would be the loudest thing in the
            card. */}
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            className="w-full btn-primary py-3"
            style={{ color: 'var(--brass-nav)' }}
          >
            <WhatsAppIcon />
            Enquire Now
          </a>
        ) : digits ? (
          <a
            href={`tel:+${digits}`}
            onClick={close}
            className="w-full btn-primary py-3"
            style={{ color: 'var(--brass-nav)' }}
          >
            <Phone className="w-4 h-4" aria-hidden="true" />
            Enquire Now
          </a>
        ) : (
          <a
            href={`mailto:${email}`}
            onClick={close}
            className="w-full btn-primary py-3"
            style={{ color: 'var(--brass-nav)' }}
          >
            <Mail className="w-4 h-4" aria-hidden="true" />
            Enquire Now
          </a>
        )}
      </div>
    </dialog>
  );
}
