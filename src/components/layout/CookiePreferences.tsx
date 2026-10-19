'use client';

import React from 'react';

import { clearConsent, useConsent } from '@/lib/consent';

/**
 * Footer control that brings the cookie banner back.
 *
 * The banner hides permanently once answered, so there was no way to change a
 * choice: a guest who declined could never accept, and one who accepted could
 * never withdraw. Withdrawal has to be as easy as consent.
 *
 * Renders nothing until a choice exists. Before that the banner itself is on
 * screen, and offering "Cookie preferences" next to a live banner would be two
 * controls for one decision. `undefined` (not yet read) is treated the same as
 * unanswered, so this never appears in the server-rendered HTML and cannot
 * flash before hydration.
 */
export default function CookiePreferences() {
  const consent = useConsent();

  if (consent !== 'accepted' && consent !== 'declined') return null;

  return (
    <button
      type="button"
      onClick={clearConsent}
      className="text-[13px] text-white/60 hover:text-white transition-colors"
    >
      Cookie Preferences
    </button>
  );
}
