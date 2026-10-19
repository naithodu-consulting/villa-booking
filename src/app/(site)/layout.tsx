import React from 'react';
import Header from '@/components/layout/Header';
import BookingDialog from '@/components/guest/BookingDialog';
import Footer from '@/components/layout/Footer';
import AnnouncementBar, { type Announcement } from '@/components/layout/AnnouncementBar';
import CookieConsent from '@/components/layout/CookieConsent';
import ScrollAid from '@/components/layout/ScrollAid';
import Analytics from '@/components/layout/Analytics';
import { getProperty, getActivePromo, type ActivePromo } from '@/lib/data';
import { isJournalLive } from '@/lib/journal';
import JsonLd from '@/components/seo/JsonLd';
import { organizationJsonLd } from '@/lib/seo';

/** Always shown. The promo line in front of it is added only when a real,
 *  currently-valid code exists; see getActivePromo. */
const RESERVATIONS_ANNOUNCEMENT: Announcement = {
  id: 'reservations',
  text: 'For reservations, contact: reservations@habbaa.com  /  +91 80504 84123',
  shortText: 'Reservations: +91 80504 84123',
};

/**
 * The bar's announcements, with the promo line built from the database.
 *
 * It used to hardcode `save 15%` and `VILLA19` with no connection to the
 * discount_codes table checkout validates against, so the site could advertise
 * a code that does not exist, has expired, or is no longer worth what the line
 * claims. Production is about to be exactly that case: it is built from
 * migrations, 00062 creates discount_codes empty, and the codes come from
 * Ooruda Villa, whose production is not live yet.
 */
function announcements(promo: ActivePromo | null): Announcement[] {
  if (!promo) return [RESERVATIONS_ANNOUNCEMENT];
  return [
    {
      id: 'promo-1',
      text: `Book directly and save ${promo.saving}. Use code:`,
      shortText: `Save ${promo.saving} with code:`,
      code: promo.code,
    },
    RESERVATIONS_ANNOUNCEMENT,
  ];
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [property, showJournal] = await Promise.all([getProperty(), isJournalLive()]);
  // After getProperty, because the code is per property. Null when nothing is
  // valid today, which drops the promo line rather than advertising a code
  // checkout would refuse.
  const promo = property ? await getActivePromo(property.id) : null;

  const whatsappNumber = property?.whatsapp_number;
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        `Hi, I'm interested in booking ${property?.name ?? 'Villa 19'}`
      )}`
    : undefined;
  // The drawer's second button is Call (the mobile CTA bar already carries
  // WhatsApp), so the Header needs the number the contact card uses.
  const phoneNumber = process.env.PROPERTY_PHONE ?? property?.whatsapp_number;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--paper)' }}>
      <JsonLd data={organizationJsonLd()} />
      <AnnouncementBar announcements={announcements(promo)} />
      <Header propertyName={property?.name ?? 'Villa 19'} phoneNumber={phoneNumber} showJournal={showJournal} />
      <main id="main-content" className="flex-1">{children}</main>
      {property && <Footer property={property} whatsappUrl={whatsappUrl} showJournal={showJournal} />}
      <BookingDialog maxOccupancy={property?.max_occupancy ?? 14} idealOccupancy={property?.ideal_occupancy ?? 8} propertyId={property?.id} />
      <ScrollAid />
      <CookieConsent />
      <Analytics />
    </div>
  );
}
