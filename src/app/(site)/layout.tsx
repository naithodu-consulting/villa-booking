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
    text: 'Early bookings get 15% discount. Use code:',
    code: 'VILLA19',
  },
  {
    id: 'corporate',
    text: 'Corporate & Bulk bookings: reservations@habbaa.com  |  +91 80504 84123',
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

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--paper)' }}>
      <JsonLd data={organizationJsonLd()} />
      <AnnouncementBar announcements={ANNOUNCEMENTS} />
      <Header propertyName={property?.name ?? 'Villa 19'} whatsappUrl={whatsappUrl} showJournal={showJournal} />
      <main className="flex-1">{children}</main>
      {property && <Footer property={property} whatsappUrl={whatsappUrl} showJournal={showJournal} />}
      <BookingDialog maxOccupancy={property?.max_occupancy ?? 14} propertyId={property?.id} />
      <ScrollAid />
      <CookieConsent />
      <Analytics />
    </div>
  );
}
