'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import { CONSENT_KEY, setConsent } from '@/lib/consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  // setConsent persists the choice and broadcasts it, so <Analytics> can load
  // or stay away without a page reload. The banner no longer records a
  // preference it does not act on.
  const respond = (choice: 'accepted' | 'declined') => {
    setConsent(choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
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
