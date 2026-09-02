import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getProperty } from '@/lib/data';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const property = await getProperty();

  const whatsappNumber = property?.whatsapp_number ?? '919876543210';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hi, I'm interested in booking ${property?.name ?? 'Villa 19'}`
  )}`;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--paper)' }}>
      <Header propertyName={property?.name ?? 'Villa 19'} whatsappUrl={whatsappUrl} />
      <main className="flex-1">{children}</main>
      {property && <Footer property={property} whatsappUrl={whatsappUrl} />}
    </div>
  );
}
