import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { X, Phone } from 'lucide-react';
import BookingCheckout from '@/components/guest/BookingCheckout';
import ReservationNotice from '@/components/guest/ReservationNotice';
import WhatsAppIcon from '@/components/guest/WhatsAppIcon';
import { enquiryWhatsAppUrl } from '@/lib/whatsapp';
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
    const phone = process.env.PROPERTY_PHONE;
    const whatsapp = process.env.PROPERTY_WHATSAPP;
    return (
      <div className="relative flex-1 flex items-center justify-center px-5 py-16">
        {/* The page carries no header, so without this the only way out was a
            button inside the card. A link covering the ground behind the card
            makes clicking outside it go home, the way clicking a dialog's
            backdrop closes the dialog. A plain link rather than a click
            handler: it works before hydration and middle-clicks like a link. */}
        <Link href="/" aria-hidden tabIndex={-1} className="absolute inset-0" />

        <div
          className="relative z-10 w-full max-w-lg rounded-3xl overflow-hidden shadow-xl"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
        >
          {/* Same band as PaymentsPausedDialog: this page and that dialog are
              the one message, so they are the one design, down to the close
              control in the corner. */}
          <div className="relative px-7 sm:px-8 pt-7 pb-6" style={{ backgroundColor: 'var(--maroon)' }}>
            <Link
              href="/"
              aria-label="Close"
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.75)' }}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </Link>
            <h1
              className="text-[20px] leading-[1.25] font-bold text-center px-8"
              style={{ color: '#FFFFFF', fontFamily: 'var(--font-body)' }}
            >
              Please Note
            </h1>
          </div>

          <div style={{ height: '2px', backgroundColor: 'var(--brass)' }} />

          <div className="px-7 sm:px-8 py-7 space-y-6">
            <ReservationNotice
              phoneNumber={phone}
              email={process.env.PROPERTY_EMAIL ?? ENTITY.email}
            />

            {/* One action only: the X and the ground behind the card are the
                way out, so a second "back" button would say it a third time. */}
            {whatsapp ? (
              <a
                href={enquiryWhatsAppUrl(whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full py-3"
                style={{ color: 'var(--brass-nav)' }}
              >
                <WhatsAppIcon />
                Enquire Now
              </a>
            ) : phone ? (
              <a
                href={`tel:+${phone.replace(/\D/g, '')}`}
                className="btn-primary w-full py-3"
                style={{ color: 'var(--brass-nav)' }}
              >
                <Phone className="w-4 h-4" aria-hidden="true" />
                Enquire Now
              </a>
            ) : null}
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
