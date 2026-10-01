'use client';

import React from 'react';
import Link from 'next/link';

import { setConsent, useConsent } from '@/lib/consent';

export default function CookieConsent() {
  // null means asked and unanswered; undefined means not yet known, which
  // keeps the banner out of the server-rendered HTML so it cannot flash at
  // someone who decided long ago.
  const consent = useConsent();

  // setConsent persists the choice and broadcasts it, so <Analytics> can load
  // or stay away without a page reload, and this banner closes off the same
  // event rather than its own copy of the answer.
  const respond = (choice: 'accepted' | 'declined') => setConsent(choice);

  if (consent !== null) return null;

  return (
    <div
      /* id is a layout hook: ScrollAid lifts clear of this banner via
         `body:has(#cookie-banner)` in globals.css. */
      id="cookie-banner"
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: 'var(--maroon-deep)',
        borderTop: '1px solid rgba(201,148,74,0.35)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <p className="flex-1 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.88)' }}>
          We use cookies to enable booking functionality and remember your preferences.{' '}
          <Link href="/privacy" className="underline underline-offset-2" style={{ color: 'var(--brass-light)' }}>
            Privacy Policy
          </Link>
        </p>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => respond('accepted')}
            className="px-5 rounded font-bold transition-all duration-150"
            style={{
              background: 'var(--paper)',
              color: 'var(--maroon)',
              letterSpacing: '1.1px',
              fontSize: '13px',
              minHeight: '40px',
              border: '1px solid rgba(251,247,241,0.9)',
              transition: 'background 0.18s ease, color 0.18s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget).style.background = 'var(--maroon)';
              (e.currentTarget).style.color = 'var(--paper)';
            }}
            onMouseLeave={e => {
              (e.currentTarget).style.background = 'var(--paper)';
              (e.currentTarget).style.color = 'var(--maroon)';
            }}
          >
            Accept
          </button>
          <button
            onClick={() => respond('declined')}
            className="px-4 rounded font-semibold transition-all duration-150"
            style={{
              color: 'rgba(255,255,255,0.80)',
              border: '1px solid rgba(255,255,255,0.35)',
              background: 'transparent',
              fontSize: '13px',
              minHeight: '40px',
            }}
            onMouseEnter={e => {
              (e.currentTarget).style.color = 'rgba(255,255,255,0.95)';
              (e.currentTarget).style.borderColor = 'rgba(255,255,255,0.55)';
            }}
            onMouseLeave={e => {
              (e.currentTarget).style.color = 'rgba(255,255,255,0.80)';
              (e.currentTarget).style.borderColor = 'rgba(255,255,255,0.35)';
            }}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
