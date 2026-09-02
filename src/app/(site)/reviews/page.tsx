import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageSquare, Star } from 'lucide-react';
import { getProperty } from '@/lib/data';

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
            <MessageSquare className="w-4 h-4" aria-hidden="true" /> Ask for References
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
