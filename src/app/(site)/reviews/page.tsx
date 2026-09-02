import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { getProperty } from '@/lib/data';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}
export const metadata: Metadata = {
  title: 'Reviews',
  description: 'Guest reviews for Villa 19, Mangalore. Read what our guests say about their stay.',
  openGraph: {
    title: 'Reviews | Villa 19 by Habbaa',
    description: 'Real guest experiences at Villa 19, Mangalore. Direct booking, personal host service.',
    url: 'https://habbaa.in/reviews',
  },
  twitter: {
    title: 'Reviews | Villa 19 by Habbaa',
    description: 'Guest reviews for Villa 19, Mangalore.',
  },
};

export default async function ReviewsPage() {
  const property = await getProperty();
  const whatsappNumber = property?.whatsapp_number ?? '919876543210';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I'd like to know more about guest reviews for ${property?.name ?? 'Villa 19'}`)}`;

  return (
    <div className="pb-20 md:pb-0" style={{ color: 'var(--ink)' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        className="py-16 sm:py-20"
        style={{ backgroundColor: 'var(--maroon)', color: 'white' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1
            className="text-5xl sm:text-6xl font-bold italic mb-5"
            style={{ fontFamily: 'var(--font-display)', color: 'white' }}
          >
            Guest Reviews
          </h1>
          <p className="text-lg text-white/75 leading-relaxed">
            Verified guest reviews will appear here once we open our doors.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">

        {/* ── Empty state ──────────────────────────────────── */}
        <div
          className="py-16 px-8 rounded-3xl text-center space-y-5"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-6 h-6"
                style={{ color: 'var(--brass)', fill: 'var(--brass)' }}
                aria-hidden="true"
              />
            ))}
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
              Reviews coming soon
            </p>
            <p className="text-sm mt-2 max-w-sm mx-auto leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
              We are gathering our first verified guest reviews. In the meantime, reach out on WhatsApp and we will connect you with past guests directly.
            </p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-base transition-all"
            style={{ backgroundColor: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#1a9e55' }}
          >
            <WhatsAppIcon className="w-4 h-4" /> Ask for References
          </a>
        </div>

        {/* ── Why trust us ─────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} />
            <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
              Why Book With Confidence
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Direct Host',      body: 'You speak to the actual host, not a call centre or an OTA support agent.' },
              { title: 'Verified Property', body: 'Villa 19 is managed and personally maintained by the Habbaa team.' },
              { title: 'Secure Payments',  body: 'All payments via Razorpay. Industry-standard encryption, instant receipts.' },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="p-5 rounded-2xl"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
              >
                <p className="text-sm font-bold mb-1.5" style={{ color: 'var(--maroon)' }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────────── */}
        <div
          className="p-8 rounded-3xl text-center space-y-4"
          style={{ backgroundColor: 'var(--maroon)', color: 'white' }}
        >
          <h2 className="text-2xl font-bold italic" style={{ fontFamily: 'var(--font-display)' }}>
            Be among our first guests
          </h2>
          <p className="text-white/70 text-sm">Book now and help us build our review history.</p>
          <Link
            href="/book"
            className="inline-block px-8 py-3.5 rounded-xl font-bold text-base mt-2 transition-all"
            style={{ backgroundColor: 'var(--brass)', color: 'white' }}
          >
            Check Availability
          </Link>
        </div>

      </div>
    </div>
  );
}
