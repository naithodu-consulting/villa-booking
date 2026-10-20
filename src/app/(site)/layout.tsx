import React from 'react';
import Header from '@/components/layout/Header';
import BookingDialog from '@/components/guest/BookingDialog';
import Footer from '@/components/layout/Footer';
import AnnouncementBar, { type Announcement } from '@/components/layout/AnnouncementBar';
import CookieConsent from '@/components/layout/CookieConsent';
import ScrollAid from '@/components/layout/ScrollAid';
import Analytics from '@/components/layout/Analytics';
import { getProperty } from '@/lib/data';
import { isJournalLive } from '@/lib/journal';
import JsonLd from '@/components/seo/JsonLd';
import { organizationJsonLd } from '@/lib/seo';

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
      <AnnouncementBar announcements={ANNOUNCEMENTS} />
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
