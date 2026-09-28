'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * `next/link` that also handles a click on the page you are already on.
 *
 * The App Router dedupes a navigation to the current URL, so the scroll reset
 * it normally performs on a route change never runs: clicking "Gallery" in the
 * footer while on /gallery did nothing at all. The link is styled as the active
 * page and still looks clickable, so the silence reads as broken. Every other
 * site treats this as "take me back to the top", so that is what we do.
 *
 * Links carrying a hash are left alone — those are anchor jumps, and the
 * browser handles them.
 */
export default function NavLinkBase({
  href,
  onClick,
  children,
  ...rest
}: React.ComponentProps<typeof Link>) {
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);

    // Header and footer stay mounted across routes, so a clicked link kept
    // focus on the new page and grew the focus ring at the next keypress.
    // detail is 0 for keyboard activation: keyboard users keep their focus.
    if (e.detail > 0) e.currentTarget.blur();

    const target = typeof href === 'string' ? href : href.pathname ?? '';
    const isSamePage = !target.includes('#') && target === pathname;

    // Let modified clicks (new tab, new window, download) behave normally.
    const modified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;

    if (!isSamePage || modified || e.defaultPrevented) return;

    e.preventDefault();

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const from = window.scrollY;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Some environments accept a smooth scroll and then never run it, which
    // would leave this click doing nothing — the exact failure being fixed.
    // If the page has not begun moving shortly after, jump instead.
    window.setTimeout(() => {
      if (window.scrollY === from && from !== 0) window.scrollTo({ top: 0, behavior: 'auto' });
    }, 250);
  };

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
