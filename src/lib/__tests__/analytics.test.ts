import { describe, it, expect } from 'vitest';

import {
  redactPath,
  redactUrl,
  pageType,
  classifyContactLink,
  pickSource,
  nightsBetween,
  leadTimeDays,
  paiseToRupees,
  stripInternalParam,
  isInternalTraffic,
  syncInternalTraffic,
} from '@/lib/analytics';

const ORIGIN = 'https://villa19.in';

/**
 * The token tests are the point of this file. A booking token reaching Google
 * is the one failure in Phase 1 that cannot be undone afterwards: the data has
 * already left the browser, and no GA4 admin setting removes a path segment.
 */
describe('redactPath', () => {
  it('replaces a booking token with the route pattern', () => {
    expect(redactPath('/booking/a1b2c3d4e5f6')).toBe('/booking/[token]');
  });

  it('redacts tokens of any shape, including ones with dots and dashes', () => {
    expect(redactPath('/booking/eyJhbGci.OiJIUzI1-NiIs')).toBe('/booking/[token]');
  });

  it('keeps a trailing path after the token, still redacted', () => {
    expect(redactPath('/booking/tok3n/invoice')).toBe('/booking/[token]/invoice');
  });

  it('leaves /booking itself alone: there is no token to hide', () => {
    expect(redactPath('/booking')).toBe('/booking');
  });

  it('does not touch /book, which is the checkout and carries no token', () => {
    expect(redactPath('/book')).toBe('/book');
  });

  it('leaves every other path untouched', () => {
    expect(redactPath('/')).toBe('/');
    expect(redactPath('/rooms')).toBe('/rooms');
    expect(redactPath('/journal/monsoon-in-mangalore')).toBe('/journal/monsoon-in-mangalore');
  });

  it('only matches at the start, so a nested path cannot smuggle one through', () => {
    expect(redactPath('/journal/booking/tips')).toBe('/journal/booking/tips');
  });
});

describe('redactUrl', () => {
  it('redacts the token in a same-origin URL and keeps the query', () => {
    expect(redactUrl(`${ORIGIN}/booking/secret?utm_source=email`, ORIGIN)).toBe(
      `${ORIGIN}/booking/[token]?utm_source=email`,
    );
  });

  it('leaves other same-origin URLs as they were', () => {
    expect(redactUrl(`${ORIGIN}/gallery`, ORIGIN)).toBe(`${ORIGIN}/gallery`);
  });

  it('passes a cross-origin referrer through untouched', () => {
    // Rewriting someone else's /booking/x would misreport where a guest came
    // from, and it cannot be hiding our token.
    const google = 'https://www.google.com/booking/xyz';
    expect(redactUrl(google, ORIGIN)).toBe(google);
  });

  it('returns an empty referrer unchanged (a direct visit)', () => {
    expect(redactUrl('', ORIGIN)).toBe('');
  });

  it('passes through anything it cannot parse rather than throwing', () => {
    expect(redactUrl('about:blank', ORIGIN)).toBe('about:blank');
    expect(redactUrl('not a url', ORIGIN)).toBe('not a url');
  });

  it('handles the preview origin too, not just production', () => {
    const preview = 'https://villa-booking-psi.vercel.app';
    expect(redactUrl(`${preview}/booking/tok3n`, preview)).toBe(`${preview}/booking/[token]`);
  });
});

describe('pageType', () => {
  it('names the home page', () => {
    expect(pageType('/')).toBe('home');
  });

  it('separates the checkout from the confirmation page', () => {
    // One letter apart in the URL, opposite ends of the funnel.
    expect(pageType('/book')).toBe('book');
    expect(pageType('/booking/anything')).toBe('booking');
  });

  it('groups the legal pages together', () => {
    expect(pageType('/terms')).toBe('legal');
    expect(pageType('/privacy')).toBe('legal');
    expect(pageType('/cancellation')).toBe('legal');
  });

  it('maps a journal post to the journal, not to its slug', () => {
    expect(pageType('/journal')).toBe('journal');
    expect(pageType('/journal/monsoon-in-mangalore')).toBe('journal');
  });

  it('names the content pages the funnel questions ask about', () => {
    expect(pageType('/rooms')).toBe('rooms');
    expect(pageType('/gallery')).toBe('gallery');
    expect(pageType('/faq')).toBe('faq');
    expect(pageType('/contact')).toBe('contact');
    expect(pageType('/the-villa')).toBe('the-villa');
    expect(pageType('/stay-guide')).toBe('stay-guide');
    expect(pageType('/testimonials')).toBe('testimonials');
    expect(pageType('/about')).toBe('about');
    expect(pageType('/events')).toBe('events');
  });

  it('falls back to other for anything unlisted', () => {
    expect(pageType('/sitemap.xml')).toBe('other');
    expect(pageType('/some-new-page')).toBe('other');
  });
});

describe('classifyContactLink', () => {
  it('recognises a wa.me link, with or without a prefilled message', () => {
    expect(classifyContactLink('https://wa.me/918050484123')).toBe('whatsapp');
    expect(classifyContactLink('https://wa.me/918050484123?text=Hi%2C%20I%27m%20interested')).toBe('whatsapp');
  });

  it('recognises WhatsApp’s other hosts', () => {
    expect(classifyContactLink('https://api.whatsapp.com/send?phone=918050484123')).toBe('whatsapp');
    expect(classifyContactLink('https://web.whatsapp.com/send?phone=918050484123')).toBe('whatsapp');
    expect(classifyContactLink('https://www.whatsapp.com/')).toBe('whatsapp');
  });

  it('recognises phone and email links, in any case', () => {
    expect(classifyContactLink('tel:+918050484123')).toBe('call');
    expect(classifyContactLink('TEL:+918050484123')).toBe('call');
    expect(classifyContactLink('mailto:reservations@habbaa.com')).toBe('email');
    expect(classifyContactLink('MailTo:reservations@habbaa.com')).toBe('email');
  });

  it('tolerates whitespace around an href', () => {
    expect(classifyContactLink('  tel:+918050484123  ')).toBe('call');
  });

  it('ignores ordinary links', () => {
    expect(classifyContactLink('/rooms')).toBeNull();
    expect(classifyContactLink('https://villa19.in/gallery')).toBeNull();
    expect(classifyContactLink('#main-content')).toBeNull();
    expect(classifyContactLink('')).toBeNull();
  });

  it('is not fooled by a host that merely contains whatsapp', () => {
    // An exact host set, not a substring match: otherwise a link to a blog
    // post at notwhatsapp.com would be counted as an enquiry.
    expect(classifyContactLink('https://notwhatsapp.com/page')).toBeNull();
    expect(classifyContactLink('https://whatsapp.com.evil.test/')).toBeNull();
  });
});

describe('pickSource', () => {
  it('prefers an explicit data-track-source', () => {
    expect(pickSource('mobile_bar', 'main')).toBe('mobile_bar');
    expect(pickSource('drawer', 'header')).toBe('drawer');
  });

  it('falls back to the landmark when there is no attribute', () => {
    expect(pickSource(null, 'header')).toBe('header');
    expect(pickSource(null, 'footer')).toBe('footer');
    expect(pickSource(null, 'dialog')).toBe('dialog');
    expect(pickSource(null, 'main')).toBe('page');
  });

  it('ignores an unrecognised attribute rather than inventing a row', () => {
    // A typo should land somewhere we already read, not create a new value
    // that silently splits a report.
    expect(pickSource('mobile-bar', 'main')).toBe('page');
    expect(pickSource('footer_v2', null)).toBe('unknown');
  });

  it('returns unknown when nothing identifies the place', () => {
    expect(pickSource(null, null)).toBe('unknown');
  });
});

describe('nightsBetween', () => {
  it('counts nights, not days', () => {
    expect(nightsBetween('2026-12-20', '2026-12-23')).toBe(3);
    expect(nightsBetween('2026-12-20', '2026-12-21')).toBe(1);
  });

  it('counts across a month and a year boundary', () => {
    expect(nightsBetween('2026-12-30', '2027-01-02')).toBe(3);
    expect(nightsBetween('2026-01-31', '2026-02-01')).toBe(1);
  });

  it('is unaffected by IST, which has no daylight saving but is half-hour offset', () => {
    // Parsed as UTC midnights on both sides, so the difference is whole days.
    expect(nightsBetween('2026-03-28', '2026-03-30')).toBe(2);
  });

  it('returns 0 for an empty or backwards range rather than a negative', () => {
    expect(nightsBetween('2026-12-20', '2026-12-20')).toBe(0);
    expect(nightsBetween('2026-12-23', '2026-12-20')).toBe(0);
  });

  it('returns 0 for unparseable input instead of NaN', () => {
    // NaN in an event parameter is worse than a zero: GA4 accepts it and the
    // report quietly shows nothing.
    expect(nightsBetween('', '2026-12-20')).toBe(0);
    expect(nightsBetween('not-a-date', 'also-not')).toBe(0);
  });
});

describe('leadTimeDays', () => {
  it('measures from today to check-in', () => {
    expect(leadTimeDays('2026-12-20', '2026-12-01')).toBe(19);
  });

  it('is 0 for a same-day booking', () => {
    expect(leadTimeDays('2026-12-01', '2026-12-01')).toBe(0);
  });

  it('is 0, not negative, for a date already past', () => {
    expect(leadTimeDays('2026-11-30', '2026-12-01')).toBe(0);
  });
});

describe('paiseToRupees', () => {
  it('converts paise to a decimal rupee value', () => {
    expect(paiseToRupees(1_200_000)).toBe(12_000);
    expect(paiseToRupees(1_234_567)).toBe(12_345.67);
  });

  it('keeps the half-rupee cases exact to two places', () => {
    expect(paiseToRupees(150)).toBe(1.5);
    expect(paiseToRupees(1)).toBe(0.01);
  });

  it('handles zero', () => {
    expect(paiseToRupees(0)).toBe(0);
  });
});

describe('stripInternalParam', () => {
  it('removes the operator marker so it cannot split a report in two', () => {
    expect(stripInternalParam('?internal=1')).toBe('');
    expect(stripInternalParam('?internal=0')).toBe('');
  });

  it('keeps every other parameter, and the ones a booking depends on', () => {
    expect(stripInternalParam('?checkIn=2026-12-20&internal=1&adults=8')).toBe(
      '?checkIn=2026-12-20&adults=8',
    );
    expect(stripInternalParam('?utm_source=instagram')).toBe('?utm_source=instagram');
  });

  it('leaves a query with nothing to strip exactly as it was', () => {
    // Returned unchanged rather than re-encoded: round-tripping through
    // URLSearchParams would rewrite spaces and commas and quietly change what
    // lands in the report.
    expect(stripInternalParam('')).toBe('');
    expect(stripInternalParam('?q=sea%20view')).toBe('?q=sea%20view');
  });
});

describe('internal traffic when storage is unavailable', () => {
  it('treats a browser with no storage as a guest, not as the operator', () => {
    // Private mode, or blocked site data. Counting a guest as internal would
    // hide a real visit from every report; the other way round merely leaves
    // one of the operator's own visits in.
    expect(isInternalTraffic()).toBe(false);
    expect(syncInternalTraffic('?internal=1')).toBe(false);
  });
});
