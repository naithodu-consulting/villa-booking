import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import BookingCheckout from '@/components/guest/BookingCheckout';
import ReservationNotice from '@/components/guest/ReservationNotice';
import { getProperty, getPricingRules, ratesReadAt } from '@/lib/data';
import { ONLINE_PAYMENTS_ENABLED } from '@/lib/features';
import { ENTITY } from '@/lib/entity';

// Must not be cached: the price shown here is what the guest pays. Stale rates
// would show one amount and charge another.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Book',
  description: 'Book Villa 19, Mangalore directly. No platform fees.',
  robots: { index: false, follow: false },
};

export default async function BookPage() {
  // The route still has to answer while online payment is off: bookmarks, a
  // shared link, the journal's "book directly" link, and any click that landed
  // before the dialog had mounted all arrive here. Serving the notice rather
  // than redirecting keeps that URL meaningful instead of silently dropping the
  // guest on the homepage with no explanation.
  if (!ONLINE_PAYMENTS_ENABLED) {
    return (
      <div className="flex-1 flex items-center justify-center px-5 py-16">
        <div
          className="w-full max-w-lg rounded-3xl overflow-hidden shadow-xl"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
        >
          {/* Same band as PaymentsPausedDialog: this page and that dialog are
              the one message, so they are the one design. */}
          <div className="px-7 sm:px-8 pt-7 pb-6" style={{ backgroundColor: 'var(--maroon-deep)' }}>
            <p
              className="text-[10px] font-bold uppercase mb-2"
              style={{ color: 'var(--brass-light)', letterSpacing: '0.18em' }}
            >
              Reservations
            </p>
            <h1
              className="text-[28px] sm:text-[32px] leading-[1.15] font-bold"
              style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}
            >
              Online Payments Coming Soon
            </h1>
          </div>

          <div style={{ height: '2px', backgroundColor: 'var(--brass)' }} />

          <div className="px-7 sm:px-8 py-7 space-y-6">
            <ReservationNotice
              phoneNumber={process.env.PROPERTY_PHONE}
              email={process.env.PROPERTY_EMAIL ?? ENTITY.email}
            />

            <Link
              href="/"
              className="btn-primary inline-flex items-center justify-center gap-2 w-full py-3"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back to the Villa
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const property = await getProperty();
  if (!property) notFound();

  const pricingRules = await getPricingRules(property.id);

  // Rendered per request, so these rates are read fresh here and the calendar's
  // CDN-cached ones will normally lose the comparison — which is correct.
  return <BookingCheckout property={property} pricingRules={pricingRules} ratesReadAt={ratesReadAt()} />;
}
