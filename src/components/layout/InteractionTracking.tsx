'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import {
  track,
  pageType,
  pickSource,
  classifyContactLink,
  CONTACT_EVENTS,
} from '@/lib/analytics';

/**
 * Delegated measurement: the interactions spread across the whole site that
 * would otherwise mean touching dozens of components.
 *
 * While online payment is paused these links *are* the conversion: a guest who
 * taps "Enquire Now" is the closest thing the live site has to a booking. There
 * are 66 of them across 16 files, in the header, the footer, the drawer, the
 * paused-payments dialog, the contact page and most content pages.
 *
 * Instrumenting each one would mean 66 edits and a standing invitation to
 * forget the 67th. One listener on the document classifies by href scheme
 * instead, so a link added next year is measured the day it ships, and the
 * links themselves stay plain anchors that work without JavaScript.
 *
 * The FAQ accordions are here for a different reason. They are plain
 * `<details>` elements inside a server component, so today they work with no
 * JavaScript at all; giving each one an onToggle would turn a zero-JS
 * accordion into a client component on two pages purely to measure it. A
 * `toggle` listener here costs nothing extra, because this component is
 * mounted either way.
 *
 * Capture phase for both: some of these links close a dialog on click and a
 * bubbling listener can be beaten by a handler that stops propagation first,
 * and `toggle` does not bubble at all, so capture is the only way to hear it
 * from up here.
 *
 * Nothing is sent without consent. `track()` is a no-op until <Analytics> has
 * loaded gtag, which happens only after the guest accepts, so this listener is
 * free to run from the first render.
 */
export default function InteractionTracking() {
  const pathname = usePathname();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      // closest() rather than the target itself: these links wrap an icon and
      // a label, so the click almost always lands on a child.
      const link = target.closest('a[href]');
      if (!link) return;

      const channel = classifyContactLink(link.getAttribute('href') ?? '');
      if (!channel) return;

      const attr = link.closest('[data-track-source]')?.getAttribute('data-track-source') ?? null;
      const landmark = link.closest('header, footer, dialog, main')?.tagName.toLowerCase() ?? null;

      track(CONTACT_EVENTS[channel], {
        source: pickSource(attr, landmark),
        // The pathname from the router, not location.pathname: on a link that
        // navigates away, reading location at send time can catch the next URL.
        page_type: pageType(pathname),
      });
    };

    const onToggle = (event: Event) => {
      const details = event.target;
      if (!(details instanceof HTMLDetailsElement) || !details.open) return;

      // The question itself, not its position: an index stops meaning anything
      // the moment the FAQ order changes, and the question is what the
      // operator would act on. GA4 caps a parameter at 100 characters, so a
      // long question is cut rather than dropped.
      const question = details.querySelector('summary')?.textContent?.trim();
      if (!question) return;

      track('faq_open', { faq_question: question.slice(0, 100) });
    };

    document.addEventListener('click', onClick, { capture: true });
    document.addEventListener('toggle', onToggle, { capture: true });
    return () => {
      document.removeEventListener('click', onClick, { capture: true });
      document.removeEventListener('toggle', onToggle, { capture: true });
    };
  }, [pathname]);

  return null;
}
