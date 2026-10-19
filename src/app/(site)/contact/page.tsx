import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageMetadata } from '@/lib/seo';


/**
 * Safety net for content staleness.
 *
 * This page is prerendered and reads live content from Supabase, so without a
 * revalidation period its only refresh path is Ooruda Villa calling
 * POST /api/revalidate. If that webhook is not wired, or CONTENT_REVALIDATE_SECRET
 * is unset (the endpoint then 503s), the page stays frozen at whatever was true
 * at build time until the next deploy: stale policies, stale FAQs, a stale
 * address. A day is the worst case rather than for ever. The webhook is still
 * the fast path and makes an edit appear at once.
 */
export const revalidate = 86400;

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Contact & Enquiries',
    path: '/contact',
    description:
      'Contact Villa 19 by Habbaa in Mangalore by WhatsApp, email or phone.',
  }),
  robots: { index: false, follow: false },
};

/**
 * Retired by the operator 2026-10-13, along with its enquiry form.
 *
 * Guests already reach us three faster ways: WhatsApp from the header and the
 * sticky bar, and the phone and email rows in the site footer. The page and its
 * form were a fourth path, and the slowest one.
 *
 * Unlike /about and /testimonials, the body is not kept behind the notFound().
 * This page read a nullable property and narrowed it inside JSX, and code after
 * a never-returning call is unreachable, where TypeScript drops that narrowing.
 * Keeping it would have meant 180 lines that cannot run and do not compile.
 * Restore from git history if the page comes back.
 */
export default function ContactPage() {
  notFound();
}
