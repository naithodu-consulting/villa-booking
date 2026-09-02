import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BookingCheckout from '@/components/guest/BookingCheckout';
import { getProperty, getPricingRules } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Book',
  description: 'Book Villa 19, Mangalore directly. No platform fees.',
  robots: { index: false, follow: false },
};

export default async function BookPage() {
  const property = await getProperty();
  if (!property) notFound();

  const pricingRules = await getPricingRules(property.id);

  return <BookingCheckout property={property} pricingRules={pricingRules} />;
}
