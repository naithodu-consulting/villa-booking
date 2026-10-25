/**
 * Cookie consent state.
 *
 * The banner used to write a string to localStorage and gate nothing, so
 * "Decline" declined nothing. Analytics now actually depends on this: the
 * gtag script is only injected once `getConsent() === 'accepted'`.
 *
 * The CustomEvent lets the analytics component react to a choice without a page
 * reload, so accepting starts measurement immediately and declining never loads
 * the script at all.
 */

import { useSyncExternalStore } from 'react';

export const CONSENT_KEY = 'villa19_cookie_consent';
export const CONSENT_EVENT = 'villa19:consent';

export type Consent = 'accepted' | 'declined' | null;

/** Reads the stored choice. Returns null when unset, or when storage is
 *  unavailable (private mode, blocked site data) — in which case nothing
 *  non-essential should load. */
export function getConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'accepted' || v === 'declined' ? v : null;
  } catch {
    return null;
  }
}

/** Subscribes to choices made elsewhere on the page. */
export function subscribeConsent(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_EVENT, onChange);
}

/** The server cannot read storage, so the choice is unknown until hydration. */
const unknownConsent = () => undefined;

/**
 * The stored choice, kept in step with any later change.
 *
 * `undefined` means not yet known (server render and the first client render),
 * which is distinct from `null`, meaning known to be unset. Reading storage in
 * an effect instead would set state on every mount and render twice.
 */
export function useConsent(): Consent | undefined {
  return useSyncExternalStore(subscribeConsent, getConsent, unknownConsent);
}

/**
 * Forgets the stored choice, which brings the banner back so the guest can
 * answer again.
 *
 * Nothing calls this today. The footer control that did was removed on
 * 2026-10-25 at the operator's request, so a choice is currently final for the
 * life of the browser's storage: a guest who declined cannot accept, and one
 * who accepted cannot withdraw. Kept because restoring a control is then a
 * one-line import rather than a rewrite, and because the privacy policy implies
 * both are possible - worth revisiting if EU or UK traffic ever matters, where
 * withdrawal has to be as easy as consent.
 *
 * Analytics reacts to the same event, so withdrawing stops measurement for the
 * rest of this page view without a reload. Scripts already loaded into the page
 * cannot be unloaded, so a guest who withdraws mid-session should be told to
 * reload for it to take full effect.
 */
export function clearConsent() {
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    // Storage blocked: there was nothing persisted to clear.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }));
}

export function setConsent(choice: Exclude<Consent, null>) {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // Storage blocked: the choice cannot persist, so it applies to this page
    // view only. Still dispatch so the current page honours it.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
}
