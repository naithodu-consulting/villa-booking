'use client';

import React from 'react';
import Link from 'next/link';

import { openBooking } from '@/lib/booking-events';
import type { Source } from '@/lib/analytics';

type Props = Omit<React.ComponentPropsWithoutRef<'a'>, 'href'> & {
  children: React.ReactNode;
  /** Extra work to run on activation, e.g. closing the mobile drawer. */
  onActivate?: () => void;
  /** Which CTA this is, for the funnel report. Required on purpose: a new
   *  Book Now cannot be added without saying where it sits, so the drop-off
   *  report can never quietly acquire an unattributed button. */
  source: Source;
};

/**
 * A booking CTA that opens the date dialog instead of navigating.
 *
 * Deliberately still an <a href="/book">: without JavaScript, or if the dialog
 * has not mounted, the click falls through to a real page that does the same
 * job. Modified clicks (new tab, middle-click) are left alone so the link keeps
 * behaving like a link.
 */
export default function BookNowLink({ children, onActivate, onClick, source, ...rest }: Props) {
  return (
    <Link
      href="/book"
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        onActivate?.();
        openBooking(source);
      }}
    >
      {children}
    </Link>
  );
}
