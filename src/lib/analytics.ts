/**
 * The one place that talks to Google Analytics.
 *
 * Every measurement call in the app goes through `track()`, so three
 * guarantees hold in one file rather than at sixty call sites:
 *
 *   1. Nothing is sent unless the guest accepted cookies. `<Analytics>` is the
 *      only thing that defines `window.gtag`, and it renders nothing until
 *      consent is granted, so `track()` finding no `gtag` *is* the consent
 *      check. No call site has to remember it.
 *   2. No guest data leaves the site. Event parameters are a typed map, so a
 *      parameter this file does not name is a build error, not a privacy
 *      incident found later in a GA report.
 *   3. A booking token never reaches Google. See `redactPath` below.
 *
 * Adding an event means adding it to `EventParams`. Anything else is a type
 * error, which is the point: a mistyped event name used to be a silently
 * missing report.
 *
 * Deliberately free of React, and of anything that only exists in a browser:
 * the payment routes import `nightsBetween`, `paiseToRupees` and `safeGaId`
 * from here to build the server-sent purchase. The readiness hook that used to
 * live here now sits in analytics-ready.ts, because importing a React hook
 * into a route handler fails the build.
 *
 * See docs/ANALYTICS_PLAN.md for the schema and the reasoning behind it.
 */

import { todayISO } from '@/lib/format';

/** The GA4 measurement ID, or undefined when measurement is switched off.
 *
 *  NEXT_PUBLIC_ is inlined at build time, so this has to be present in the
 *  build environment of whichever host is deploying, not just at runtime. */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/* -------------------------------------------------------------------------- */
/* Redaction                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * `/booking/<token>` → `/booking/[token]`.
 *
 * The booking confirmation page is reached with a secret token in the path: it
 * is the only thing standing between a stranger and a guest's name, dates and
 * phone number. Sent to Google it would sit in an analytics report, be readable
 * by anyone with report access, and arrive at Google's servers in the clear as
 * part of the URL.
 *
 * It cannot be filtered away in the GA4 admin: the data has already left the
 * browser by then, and GA4's own redaction only covers email addresses and
 * query parameters, not path segments. So it is stripped here, before the
 * first request.
 */
export function redactPath(pathname: string): string {
  return pathname.replace(/^\/booking\/[^/]+/, '/booking/[token]');
}

/**
 * The same redaction for a full URL, used for `page_location` and
 * `page_referrer`.
 *
 * The referrer matters as much as the location: without this, the booking page
 * leaks its token again as the referrer of whatever the guest opens next.
 *
 * Only our own URLs are rewritten. An unparseable or cross-origin URL is passed
 * through untouched: it cannot hold our token, and silently rewriting a third
 * party's path would misreport where a guest came from.
 */
export function redactUrl(url: string, origin: string): string {
  if (!url) return url;
  try {
    // No base: `document.referrer` is always absolute or empty, and resolving
    // against our own origin would turn an unparseable value into something
    // that looks same-origin and gets rewritten.
    const parsed = new URL(url);
    if (parsed.origin !== origin) return url;
    parsed.pathname = redactPath(parsed.pathname);
    return parsed.toString();
  } catch {
    // Not a URL we can parse, so not a URL we can redact. Dropping it loses a
    // referrer; passing it on cannot leak a token we never found.
    return url;
  }
}

/** Drops `?internal=…` from a query string, keeping everything else. */
export function stripInternalParam(search: string): string {
  if (!search) return search;
  const params = new URLSearchParams(search);
  if (!params.has(INTERNAL_TRAFFIC_PARAM)) return search;
  params.delete(INTERNAL_TRAFFIC_PARAM);
  const rest = params.toString();
  return rest ? `?${rest}` : '';
}

/* -------------------------------------------------------------------------- */
/* Page grouping                                                              */
/* -------------------------------------------------------------------------- */

/**
 * A small fixed set of page kinds.
 *
 * Reports group by this rather than by raw path, which keeps "which pages
 * precede an enquiry" answerable in one glance instead of across a long list
 * of URLs, and keeps the booking page's many tokenised paths as one row.
 */
export type PageType =
  | 'home'
  | 'the-villa'
  | 'rooms'
  | 'gallery'
  | 'about'
  | 'contact'
  | 'faq'
  | 'stay-guide'
  | 'testimonials'
  | 'journal'
  | 'events'
  | 'legal'
  | 'book'
  | 'booking'
  | 'other';

/** First path segment → page type. Anything unlisted is `other`. */
const PAGE_TYPES: Record<string, PageType> = {
  'the-villa': 'the-villa',
  rooms: 'rooms',
  gallery: 'gallery',
  about: 'about',
  contact: 'contact',
  faq: 'faq',
  'stay-guide': 'stay-guide',
  testimonials: 'testimonials',
  journal: 'journal',
  events: 'events',
  terms: 'legal',
  privacy: 'legal',
  cancellation: 'legal',
  // The checkout itself, as against `booking`, the confirmation page a guest
  // lands on afterwards. Two very different places in the funnel, one letter
  // apart in the URL, so they are deliberately separate rows.
  book: 'book',
  booking: 'booking',
};

export function pageType(pathname: string): PageType {
  if (pathname === '/') return 'home';
  const segment = pathname.split('/')[1] ?? '';
  return PAGE_TYPES[segment] ?? 'other';
}

/* -------------------------------------------------------------------------- */
/* Sources                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Where on the page a guest acted.
 *
 * The same closed set serves the booking CTAs and the contact links, because
 * the question both answer is the same one: which part of the page produces
 * enquiries. A closed union rather than a free string so a report never splits
 * across `mobile_bar` and `mobile-bar`.
 */
export type Source =
  | 'header'
  | 'drawer'
  | 'hero'
  | 'mobile_bar'
  | 'widget'
  | 'cta_panel'
  | 'footer'
  | 'dialog'
  | 'checkout'
  | 'page'
  | 'unknown';

const SOURCES: ReadonlySet<string> = new Set<Source>([
  'header',
  'drawer',
  'hero',
  'mobile_bar',
  'widget',
  'cta_panel',
  'footer',
  'dialog',
  'checkout',
  'page',
  'unknown',
]);

/**
 * Decides a source from what the DOM walk found.
 *
 * Split from the walk itself so the decision is testable without a browser.
 * `attr` is the nearest `data-track-source`; `landmark` is the nearest
 * enclosing element of interest, as a tag name.
 *
 * An unrecognised attribute value falls back to the landmark rather than being
 * passed through: a typo in a `data-track-source` should land in a row we
 * already read, not invent a new one that nobody notices is wrong.
 */
export function pickSource(attr: string | null, landmark: string | null): Source {
  if (attr && SOURCES.has(attr)) return attr as Source;

  switch (landmark) {
    case 'header':
      return 'header';
    case 'footer':
      return 'footer';
    case 'dialog':
      return 'dialog';
    case 'main':
      return 'page';
    default:
      return 'unknown';
  }
}

/** The contact channel a link opens, or null when it is an ordinary link. */
export type ContactChannel = 'whatsapp' | 'call' | 'email';

const WHATSAPP_HOSTS: ReadonlySet<string> = new Set([
  'wa.me',
  'api.whatsapp.com',
  'web.whatsapp.com',
  'whatsapp.com',
]);

/**
 * Classifies a link by what it opens.
 *
 * Done by scheme and host rather than by asking every call site to declare
 * itself: there are 66 WhatsApp, phone and email links across 16 files, and a
 * scheme cannot be forgotten the way a prop can. A link added next year is
 * measured the day it ships.
 */
export function classifyContactLink(href: string): ContactChannel | null {
  if (!href) return null;

  const value = href.trim();
  if (/^tel:/i.test(value)) return 'call';
  if (/^mailto:/i.test(value)) return 'email';

  try {
    const { hostname } = new URL(value);
    const host = hostname.replace(/^www\./, '').toLowerCase();
    return WHATSAPP_HOSTS.has(host) ? 'whatsapp' : null;
  } catch {
    // A relative or malformed href: an internal link, so not a contact link.
    return null;
  }
}

/** The event each channel reports. */
export const CONTACT_EVENTS = {
  whatsapp: 'contact_whatsapp',
  call: 'contact_call',
  email: 'contact_email',
} as const satisfies Record<ContactChannel, EventName>;

/* -------------------------------------------------------------------------- */
/* Stay shape                                                                 */
/* -------------------------------------------------------------------------- */

/** Nights between two "YYYY-MM-DD" dates. 0 when the range is empty or backwards. */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const from = Date.parse(`${checkIn}T00:00:00Z`);
  const to = Date.parse(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to) || to <= from) return 0;
  return Math.round((to - from) / 86_400_000);
}

/**
 * Days between today and check-in: how far ahead guests book.
 *
 * `today` defaults to the calendar date *at the property*, not the UTC date.
 * Between 00:00 and 05:30 IST those differ, and a lead time computed from the
 * UTC day would be one day out for every booking made in that window.
 */
export function leadTimeDays(checkIn: string, today: string = todayISO()): number {
  return nightsBetween(today, checkIn);
}

/**
 * Paise to rupees, for the one place money is reported.
 *
 * Everything else in the app keeps money as integer paise on purpose. GA4
 * expects a decimal currency value, so the conversion happens here, once, at
 * the boundary, and never in a component.
 */
export function paiseToRupees(paise: number): number {
  return Math.round(paise) / 100;
}

/**
 * A GA client or session id, or null if it is not one.
 *
 * These arrive in the create-order request body like any other client-supplied
 * field, are stored, and are later put into an outbound request to Google. A
 * client id is `<digits>.<digits>` and a session id is digits; nothing else is
 * a real identifier, and nothing else has any business being passed on.
 *
 * Capped well above the real length so a long string cannot be smuggled
 * through and parked in the database.
 */
export function safeGaId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 64) return null;
  return /^\d+(\.\d+)?$/.test(trimmed) ? trimmed : null;
}

/* -------------------------------------------------------------------------- */
/* Internal traffic                                                           */
/* -------------------------------------------------------------------------- */

export const INTERNAL_TRAFFIC_KEY = 'villa19_internal_traffic';

/** The query parameter that marks this browser as the operator's own. */
export const INTERNAL_TRAFFIC_PARAM = 'internal';

/**
 * Whether this browser belongs to the people running the villa.
 *
 * On a site with a handful of bookings a month, the operator checking their
 * own pages is a large share of all traffic, and it is the share that behaves
 * least like a guest: straight to /book, no gallery, no enquiry. Left in, it
 * makes the funnel look healthier than it is.
 *
 * GA4 filters on a `traffic_type` of `internal`, which is what this flag ends
 * up setting. It is a stored flag rather than an IP rule because Indian mobile
 * networks hand out a different address almost every session, so the IP list
 * GA4 would otherwise need is unmaintainable.
 *
 * Visit any page with `?internal=1` to set it, and `?internal=0` to clear it.
 */
export function isInternalTraffic(): boolean {
  try {
    return localStorage.getItem(INTERNAL_TRAFFIC_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Applies `?internal=1` or `?internal=0` if either is in the URL.
 *
 * Returns whether this browser is internal afterwards, so the caller can mark
 * the very visit that set the flag rather than only the next one.
 */
export function syncInternalTraffic(search: string): boolean {
  try {
    const value = new URLSearchParams(search).get(INTERNAL_TRAFFIC_PARAM);
    if (value === '1') localStorage.setItem(INTERNAL_TRAFFIC_KEY, '1');
    else if (value === '0') localStorage.removeItem(INTERNAL_TRAFFIC_KEY);
  } catch {
    // Storage blocked. The flag cannot persist, so this visit counts as a
    // guest's, which is the safer way to be wrong.
  }
  return isInternalTraffic();
}

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Every event the app can send, with the parameters it carries.
 *
 * Phase 1 sends page views only. The funnel and enquiry events in
 * docs/ANALYTICS_PLAN.md §4 are added here as they ship, so this map stays the
 * full list of what we measure rather than a list of what we once intended to.
 *
 * No parameter here may hold a guest's name, email, phone, address, GSTIN or
 * payment identifier.
 */
export type EventParams = {
  page_view: {
    page_location: string;
    page_path: string;
    page_referrer?: string;
    page_type: PageType;
  };

  /* -- Intent ------------------------------------------------------------- */

  /** A booking CTA was activated. `payments_enabled` says which of the two
   *  funnels the guest then entered, so the same event serves both and the
   *  reports stay comparable across the switch-over. */
  booking_intent: {
    source: Source;
    payments_enabled: boolean;
    page_type: PageType;
  };

  /** The "reservations by phone and email" notice was shown, as the dialog
   *  over a page or as /book itself. The step that replaces the checkout
   *  while online payment is paused. */
  reservation_notice_view: { surface: 'dialog' | 'page' };

  /* -- Enquiries (the live conversion while payments are paused) ---------- */

  contact_whatsapp: { source: Source; page_type: PageType };
  contact_call: { source: Source; page_type: PageType };
  contact_email: { source: Source; page_type: PageType };

  /* -- Booking funnel ---------------------------------------------------- */

  /** Dates and guests chosen, in the dialog or on /book. */
  select_dates: {
    source: Source;
    nights: number;
    adults: number;
    children: number;
    lead_time_days: number;
  };

  /** The checkout rendered with a priced, available stay. */
  begin_checkout: {
    currency: 'INR';
    value: number;
    nights: number;
    adults: number;
    children: number;
    lead_time_days: number;
  };

  promo_applied: { promo_code: string };
  promo_rejected: { promo_code: string };

  /** The Razorpay modal opened. */
  add_payment_info: { currency: 'INR'; value: number; nights: number };

  /** The guest closed the Razorpay modal without paying. Not a failure: the
   *  most common exit from a working payment screen, and the one a funnel
   *  report needs told apart from a broken one. */
  payment_abandoned: { currency: 'INR'; value: number };

  /** Something went wrong. `stage` says whose problem it was: ours, the
   *  gateway's, or verification's. */
  payment_failed: { stage: 'order' | 'razorpay' | 'verification' };

  /** The dates were taken between loading the page and pressing pay. The real
   *  version of "chose unavailable dates": the picker greys those out, so this
   *  is the only way a guest meets a clash. */
  booking_conflict: { nights: number; lead_time_days: number };

  /** The nightly rate moved while the guest was on the checkout, so they were
   *  shown a new total instead of being charged the old one. */
  price_changed: { nights: number };

  /* -- Engagement -------------------------------------------------------- */
  /* Thin on purpose: GA4's enhanced measurement already reports scrolls,
     outbound clicks and engaged sessions, and an event that duplicates one of
     those is a row nobody reads. */

  /** The photo viewer was opened. `page_type` says from where, since the
   *  homepage mosaic and the gallery page are the only two ways in. */
  gallery_open: { page_type: PageType };

  /** It was closed, with how many different photographs were actually looked
   *  at. Opening the gallery says a guest was curious; this says whether the
   *  photographs held them. */
  gallery_close: { page_type: PageType; photos_viewed: number };

  /** An FAQ was expanded. Carries the question itself rather than its
   *  position, which stops meaning anything the moment the order changes. */
  faq_open: { faq_question: string };

  /** The announcement bar's promo code was copied. */
  promo_code_copy: { promo_code: string };

  /** One Core Web Vital, as the guest actually experienced it. */
  web_vitals: {
    metric: string;
    value: number;
    rating: string;
    page_type: PageType;
  };
};

export type EventName = keyof EventParams;

/* -------------------------------------------------------------------------- */
/* Transport                                                                  */
/* -------------------------------------------------------------------------- */

type GtagArgs =
  | ['js', Date]
  | ['config', string, Record<string, unknown>]
  | ['event', string, Record<string, unknown>]
  | ['get', string, string, (value: string | undefined) => void];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArgs) => void;
  }
}

/**
 * Sends an event, or does nothing at all.
 *
 * `window.gtag` exists only when `<Analytics>` rendered, which happens only
 * with consent and only with a measurement ID configured. So on the server,
 * before hydration, with consent declined, or with GA switched off, this is a
 * no-op and the caller is none the wiser. That is deliberate: a component
 * asking "may I measure this?" is a component that will one day get the answer
 * wrong.
 */
export function track<N extends EventName>(name: N, params: EventParams[N]): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}

/**
 * Sends a page view for the current URL, with the booking token stripped.
 *
 * GA4's automatic page views are switched off in `<Analytics>` precisely so
 * this can run instead: the automatic ones read `location.href` themselves, so
 * the token would be sent before any of our code could touch it.
 *
 * The caller must wait until gtag.js has initialised. Queueing this onto
 * `dataLayer` ahead of time looks tempting, but an event that arrives before
 * gtag's own `config` command can be dropped, which would lose the first page
 * view of every visit: the one the whole funnel is measured against.
 */
export function sendPageView(pathname: string): void {
  if (typeof window === 'undefined') return;

  const { origin, search } = window.location;
  const path = redactPath(pathname);
  // ?internal=1 is a control, not something a guest ever types, and leaving it
  // in would split the home page into two rows in every report.
  const query = stripInternalParam(search);

  track('page_view', {
    page_location: `${origin}${path}${query}`,
    page_path: `${path}${query}`,
    // '' for a direct visit. GA4 treats an absent referrer and an empty one the
    // same way, so the empty case needs no special handling.
    page_referrer: redactUrl(document.referrer, origin) || undefined,
    page_type: pageType(pathname),
  });
}

/**
 * The GA client and session ids for this browser, for a purchase the *server*
 * will report.
 *
 * A Measurement Protocol event carries no cookies, so unless these travel with
 * the order the booking lands in GA4 as "(direct)" and the question the whole
 * plan exists to answer — which traffic produces bookings — goes unanswered.
 *
 * `gtag('get', …)` is asynchronous and answers through a callback, so this
 * waits for both, with a short timeout: a guest about to pay must never be
 * held up by an analytics lookup. Nulls are a perfectly good answer, and the
 * usual one, since a guest who declined cookies has no ids at all.
 */
export function getGaIdentifiers(timeoutMs = 500): Promise<{
  clientId: string | null;
  sessionId: string | null;
}> {
  const none = { clientId: null, sessionId: null };

  if (typeof window === 'undefined' || typeof window.gtag !== 'function' || !GA_ID) {
    return Promise.resolve(none);
  }

  const read = (field: 'client_id' | 'session_id') =>
    new Promise<string | null>((resolve) => {
      try {
        window.gtag!('get', GA_ID, field, (value) => resolve(value ?? null));
      } catch {
        resolve(null);
      }
    });

  return Promise.race([
    Promise.all([read('client_id'), read('session_id')]).then(([clientId, sessionId]) => ({
      clientId,
      sessionId,
    })),
    new Promise<typeof none>((resolve) => setTimeout(() => resolve(none), timeoutMs)),
  ]);
}

/**
 * Stops or resumes measurement for the rest of this page view.
 *
 * A guest who withdraws consent cannot have gtag.js unloaded: it is already in
 * the page, and React unmounting the <Script> tags does not remove it. Google
 * reads this window flag before every hit, so setting it is the only thing that
 * actually stops measurement without a reload. Without it, "withdraw" would
 * stop the *next* page from being measured and quietly keep measuring this one.
 */
export function setMeasurementEnabled(gaId: string, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  (window as unknown as Record<string, boolean>)[`ga-disable-${gaId}`] = !enabled;
}
