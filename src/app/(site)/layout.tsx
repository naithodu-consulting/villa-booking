import React from 'react';
import Header from '@/components/layout/Header';
import BookingDialog from '@/components/guest/BookingDialog';
import PaymentsPausedDialog from '@/components/guest/PaymentsPausedDialog';
import Footer from '@/components/layout/Footer';
import AnnouncementBar, { type Announcement } from '@/components/layout/AnnouncementBar';
import CookieConsent from '@/components/layout/CookieConsent';
import ScrollAid from '@/components/layout/ScrollAid';
import Analytics from '@/components/layout/Analytics';
import { getProperty } from '@/lib/data';
import { isJournalLive } from '@/lib/journal';
import JsonLd from '@/components/seo/JsonLd';
import { organizationJsonLd } from '@/lib/seo';
import { ONLINE_PAYMENTS_ENABLED } from '@/lib/features';
import { ENTITY } from '@/lib/entity';
import { enquiryWhatsAppUrl } from '@/lib/whatsapp';

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'promo-1',
    text: 'Book directly and save 15%. Use code:',
    shortText: 'Save 15% with code:',
    code: 'VILLA19',
  },
  {
    id: 'reservations',
    text: 'For reservations, contact: reservations@habbaa.com  /  +91 80504 84123',
    shortText: 'For reservations: +91 80504 84123',
  },
];

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [property, showJournal] = await Promise.all([getProperty(), isJournalLive()]);

  const whatsappNumber = property?.whatsapp_number;
  const whatsappUrl = whatsappNumber
    ? enquiryWhatsAppUrl(whatsappNumber, property?.name)
    : undefined;
  // The drawer's second button is Call (the mobile CTA bar already carries
  // WhatsApp), so the Header needs the number the contact card uses.
  const phoneNumber = process.env.PROPERTY_PHONE ?? property?.whatsapp_number;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--paper)' }}>
      <JsonLd data={organizationJsonLd()} />
      <AnnouncementBar announcements={ANNOUNCEMENTS} />
      <Header propertyName={property?.name ?? 'Villa 19'} phoneNumber={phoneNumber} showJournal={showJournal} />
      <main id="main-content" className="flex-1">{children}</main>
      {property && <Footer property={property} whatsappUrl={whatsappUrl} showJournal={showJournal} />}
      {/* Exactly one of these answers OPEN_BOOKING_EVENT, so every Book Now on
          the site follows the flag without the CTAs knowing about it. */}
      {ONLINE_PAYMENTS_ENABLED ? (
        <BookingDialog maxOccupancy={property?.max_occupancy ?? 14} idealOccupancy={property?.ideal_occupancy ?? 8} propertyId={property?.id} />
      ) : (
        <PaymentsPausedDialog
          phoneNumber={phoneNumber}
          whatsappUrl={whatsappUrl}
          email={process.env.PROPERTY_EMAIL ?? ENTITY.email}
        />
      )}
      <ScrollAid />
      <CookieConsent />
      <Analytics />
    </div>
  );
}
