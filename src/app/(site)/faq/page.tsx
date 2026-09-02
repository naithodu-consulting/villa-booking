import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronDown, MessageSquare } from 'lucide-react';
import { getProperty, getFAQs } from '@/lib/data';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Frequently asked questions about Villa 19, Mangalore. Check-in times, guest policies, parking, pets, and more.',
  openGraph: {
    title: 'FAQ | Villa 19 by Habbaa',
    description: 'Everything you need to know before booking Villa 19, Mangalore. Check-in, policies, parking, pets, and more.',
    url: 'https://habbaa.in/faq',
  },
  twitter: {
    title: 'FAQ | Villa 19 by Habbaa',
    description: 'Everything you need to know before booking Villa 19, Mangalore.',
  },
};

export default async function FAQPage() {
  const property = await getProperty();
  if (!property) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-base" style={{ color: 'var(--ink-muted)' }}>Property data unavailable.</p>
      </div>
    );
  }

  const faqs = await getFAQs(property.id);
  const whatsappUrl = `https://wa.me/${property.whatsapp_number ?? '919876543210'}?text=${encodeURIComponent(`Hi, I have a question about ${property.name}`)}`;

  // Group by category
  const faqGroups = faqs.reduce<Record<string, typeof faqs>>((acc, f) => {
    const key = f.category ?? 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  return (
    <div className="pb-20 md:pb-0" style={{ color: 'var(--ink)' }}>

      {/* ── Page Hero ─────────────────────────────────────── */}
      <section
        className="py-16 sm:py-20"
        style={{ backgroundColor: 'var(--maroon)', color: 'white' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--brass-light)' }}>
            Got questions?
          </p>
          <h1
            className="text-5xl sm:text-6xl font-bold italic mb-5"
            style={{ fontFamily: 'var(--font-display)', color: 'white' }}
          >
            FAQ
          </h1>
          <p className="text-lg text-white/75 leading-relaxed">
            Everything you need to know before booking Villa 19.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* ── FAQ by category ──────────────────────────────── */}
        {Object.entries(faqGroups).map(([category, items]) => (
          <section key={category} className="space-y-3">
            <h2
              className="text-sm font-bold uppercase tracking-widest pb-2"
              style={{ color: 'var(--brass)', borderBottom: '1px solid var(--border-subtle)' }}
            >
              {category}
            </h2>
            <div className="space-y-2">
              {items.map((faq) => (
                <details
                  key={faq.id}
                  className="rounded-2xl shadow-sm group"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <summary
                    className="flex items-center justify-between p-5 cursor-pointer list-none font-semibold text-base select-none"
                    style={{ color: 'var(--ink)' }}
                  >
                    {faq.question}
                    <ChevronDown
                      className="w-4 h-4 flex-shrink-0 group-open:rotate-180 transition-transform"
                      style={{ color: 'var(--ink-muted)' }}
                      aria-hidden="true"
                    />
                  </summary>
                  <p
                    className="px-5 pb-5 text-base leading-relaxed pt-4"
                    style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--ink-muted)' }}
                  >
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}

        {/* ── Still have questions ─────────────────────────── */}
        <section
          className="p-8 rounded-3xl text-center space-y-4"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
        >
          <h2 className="text-xl font-bold" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
            Still have questions?
          </h2>
          <p className="text-base" style={{ color: 'var(--ink-muted)' }}>
            We typically respond within 30 minutes on WhatsApp.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-base transition-all"
              style={{ backgroundColor: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#1a9e55' }}
            >
              <MessageSquare className="w-4 h-4" aria-hidden="true" /> WhatsApp Us
            </a>
            <Link
              href="/book"
              className="px-6 py-3 rounded-xl font-bold text-base transition-all"
              style={{ backgroundColor: 'var(--maroon)', color: 'white' }}
            >
              Book Now
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
