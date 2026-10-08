import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BookingCheckout from '@/components/guest/BookingCheckout';
import { getProperty, getPricingRules, ratesReadAt } from '@/lib/data';

// Must not be cached: the price shown here is what the guest pays. Stale rates
// would show one amount and charge another.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Book',
  description: 'Book Villa 19, Mangalore directly. No platform fees.',
  robots: { index: false, follow: false },
};

export default async function BookPage() {
  const property = await getProperty();
  if (!property) notFound();

  const pricingRules = await getPricingRules(property.id);

  // Rendered per request, so these rates are read fresh here and the calendar's
  // CDN-cached ones will normally lose the comparison — which is correct.
  return <BookingCheckout property={property} pricingRules={pricingRules} ratesReadAt={ratesReadAt()} />;
}
