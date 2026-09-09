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

export function setConsent(choice: Exclude<Consent, null>) {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // Storage blocked: the choice cannot persist, so it applies to this page
    // view only. Still dispatch so the current page honours it.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
}
