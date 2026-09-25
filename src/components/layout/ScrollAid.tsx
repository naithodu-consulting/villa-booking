'use client';

import React, { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

/** Below this many viewports tall, a page is short enough to scroll by hand. */
const MIN_VIEWPORTS = 2;

/**
 * Desktop jump-to-top / jump-to-bottom control for long pages.
 *
 * Mounted once in the site layout rather than per page: it measures the
 * document and hides itself on anything short, so a page that later grows or
 * shrinks needs no change here.
 *
 * Touch devices are excluded (`hidden lg:flex`): they have momentum scrolling,
 * and the mobile CTA bar already occupies the bottom of the screen.
 */
export default function ScrollAid() {
  const [longPage, setLongPage] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const measure = () => {
      const doc = document.documentElement;
      setLongPage(doc.scrollHeight > window.innerHeight * MIN_VIEWPORTS);
    };

    const onScroll = () => {
      const doc = document.documentElement;
      const y = window.scrollY;
      setAtTop(y < 80);
      // 2px of slack: fractional device pixels mean the sum rarely lands exact.
      setAtBottom(y + window.innerHeight >= doc.scrollHeight - 2);
    };

    measure();
    onScroll();

    // Images and fonts settle after mount, and accordions change the height as
    // the guest opens them, so the measurement has to be live rather than once.
    const ro = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    ro.observe(document.body);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
    };
  }, []);

  if (!longPage) return null;

  const jump = (to: 'top' | 'bottom') => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: to === 'top' ? 0 : document.documentElement.scrollHeight,
      behavior: reduced ? 'auto' : 'smooth',
    });
  };

  const btn = (disabled: boolean): React.CSSProperties => ({
    color: disabled ? 'var(--ink-faint)' : 'var(--maroon)',
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'default' : 'pointer',
    transition: 'color 0.15s ease, background-color 0.15s ease',
  });

  const hover = (on: boolean) => (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    if (el.disabled) return;
    el.style.backgroundColor = on ? 'var(--maroon-tint)' : 'transparent';
  };

  return (
    <div
      /* scroll-aid: globals.css lifts this above the cookie banner while that
         banner is on screen. z-30 keeps it under the header and any dialog. */
      className="scroll-aid hidden lg:flex fixed right-6 z-30 flex-col rounded-full overflow-hidden shadow-lg"
      style={{
        /* Inline, not a `bottom-6` utility: Tailwind's utilities layer outranks
           the components layer that holds the cookie-banner rule, whatever the
           specificity. The variable keeps that rule in charge of the offset. */
        bottom: 'var(--scroll-aid-bottom, 1.5rem)',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <button
        type="button"
        onClick={() => jump('top')}
        disabled={atTop}
        aria-label="Scroll to top of page"
        className="flex items-center justify-center w-11 h-11"
        style={btn(atTop)}
        onMouseEnter={hover(true)}
        onMouseLeave={hover(false)}
      >
        <ChevronUp className="w-5 h-5" aria-hidden="true" />
      </button>

      <div className="h-px mx-2.5" style={{ backgroundColor: 'var(--border-subtle)' }} aria-hidden="true" />

      <button
        type="button"
        onClick={() => jump('bottom')}
        disabled={atBottom}
        aria-label="Scroll to bottom of page"
        className="flex items-center justify-center w-11 h-11"
        style={btn(atBottom)}
        onMouseEnter={hover(true)}
        onMouseLeave={hover(false)}
      >
        <ChevronDown className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  );
}
