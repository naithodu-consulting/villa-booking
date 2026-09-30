import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageMetadata, breadcrumbJsonLd, faqJsonLd } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import PageHero from '@/components/layout/PageHero';
import FaqList from '@/components/guest/FaqList';
import CtaButtons from '@/components/guest/CtaButtons';
import { getProperty, getFAQs } from '@/lib/data';
import type { FAQ } from '@/types';

export const metadata: Metadata = pageMetadata({
  title: 'Frequently Asked Questions',
  path: '/faq',
  description:
    'Answers about Villa 19, Mangalore: booking the whole villa, guests and occupancy, check-in, kitchen and amenities, bedrooms, parking, house rules, safety and location.',
});

export default async function FaqPage() {
  const property = await getProperty();
  if (!property) notFound();
  const faqs = await getFAQs(property.id);

  // Sections in the order their first question appears (display_order).
  const sections = faqs.reduce<{ name: string; items: FAQ[] }[]>((acc, f) => {
    const name = f.category || 'General';
    const sec = acc.find((s) => s.name === name);
    if (sec) sec.items.push(f); else acc.push({ name, items: [f] });
    return acc;
  }, []);

  return (
    <div className="pb-0" style={{ color: 'var(--ink)' }}>
      {/* The full list carries the FAQPage markup; the home page shows a subset. */}
      <JsonLd data={[breadcrumbJsonLd([{ name: 'FAQs', path: '/faq' }]), ...(faqs.length ? [faqJsonLd(faqs)] : [])]} />

      <PageHero
        title="Frequently Asked Questions"
        intro="Everything guests usually ask before booking Villa 19. Can't find your answer? Message us on WhatsApp."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-10">
        {sections.map(({ name, items }) => (
          <section key={name} className="space-y-4" aria-labelledby={`faq-${name}`}>
            <h2
              id={`faq-${name}`}
              className="text-sm font-bold uppercase tracking-widest pb-2"
              style={{ color: 'var(--brass-ink)', borderBottom: '1px solid var(--border-subtle)' }}
            >
              {name}
            </h2>
            <FaqList faqs={items} />
          </section>
        ))}

        <section
          className="p-8 rounded-3xl text-center space-y-4"
          style={{ backgroundColor: 'var(--maroon-deep)', color: 'white' }}
        >
          <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Still have questions?
          </h2>
          <p className="text-white/70 text-base">We are happy to help before and during your stay.</p>
          <CtaButtons secondary={{ href: '/contact', label: 'Contact Us' }} />
        </section>
      </div>
    </div>
  );
}
