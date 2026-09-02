import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { getProperty, getFAQs } from '@/lib/data';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}
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
              <WhatsAppIcon className="w-4 h-4" /> WhatsApp Us
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
