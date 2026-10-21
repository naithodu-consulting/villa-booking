'use client';

import React from 'react';
import Link from 'next/link';

import { OPEN_BOOKING_EVENT } from '@/lib/booking-events';

type Props = Omit<React.ComponentPropsWithoutRef<'a'>, 'href'> & {
  children: React.ReactNode;
  /** Extra work to run on activation, e.g. closing the mobile drawer. */
  onActivate?: () => void;
};

/**
 * A booking CTA that opens the date dialog instead of navigating.
 *
 * Deliberately still an <a href="/book">: without JavaScript, or if the dialog
 * has not mounted, the click falls through to a real page that does the same
 * job. Modified clicks (new tab, middle-click) are left alone so the link keeps
 * behaving like a link.
 */
export default function BookNowLink({ children, onActivate, onClick, ...rest }: Props) {
  return (
    <Link
      href="/book"
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        onActivate?.();
        window.dispatchEvent(new CustomEvent(OPEN_BOOKING_EVENT));
      }}
    >
      {children}
    </Link>
  );
}
