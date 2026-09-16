import React from 'react';
import Header from '@/components/layout/Header';
import BookingDialog from '@/components/guest/BookingDialog';
import Footer from '@/components/layout/Footer';
import AnnouncementBar, { type Announcement } from '@/components/layout/AnnouncementBar';
import CookieConsent from '@/components/layout/CookieConsent';
import Analytics from '@/components/layout/Analytics';
import { getProperty } from '@/lib/data';

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'promo-1',
    text: 'Exclusive discount for you. Use code:',
    code: 'VILLA19',
  },
  {
    id: 'corporate',
    text: 'Corporate & Bulk bookings: hello@habbaa.in  |  +91 77607 77876',
  },
];

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const property = await getProperty();

  const whatsappNumber = property?.whatsapp_number ?? '919876543210';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hi, I'm interested in booking ${property?.name ?? 'Villa 19'}`
  )}`;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--paper)' }}>
      <AnnouncementBar announcements={ANNOUNCEMENTS} />
      <Header propertyName={property?.name ?? 'Villa 19'} whatsappUrl={whatsappUrl} />
      <main className="flex-1">{children}</main>
      {property && <Footer property={property} whatsappUrl={whatsappUrl} />}
      <BookingDialog maxOccupancy={property?.max_occupancy ?? 15} propertyId={property?.id} />
      <CookieConsent />
      <Analytics />
    </div>
  );
}
