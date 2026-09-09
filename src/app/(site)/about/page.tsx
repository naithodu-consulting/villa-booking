import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Heart, Headphones, Star } from 'lucide-react';
import BookNowLink from '@/components/guest/BookNowLink';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Habbaa is a boutique hospitality brand offering curated private villa stays on the Karnataka coast. No middlemen, no platform fees. Just direct, personal hospitality.',
  openGraph: {
    title: 'About Us | Villa 19',
    description: 'Boutique hospitality on the Karnataka coast. Direct booking, personal hosts, no OTA fees.',
    url: 'https://habbaa.in/about',
  },
  twitter: {
    title: 'About Us',
    description: 'Boutique hospitality on the Karnataka coast. Direct booking, no platform fees.',
  },
};

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Direct & Transparent',
    body: 'No OTA markups or hidden platform fees. What you pay is what we charge. Every rupee goes toward your experience.',
  },
  {
    icon: Heart,
    title: 'Personal Hospitality',
    body: 'We are not a faceless listing. Your host is reachable on WhatsApp throughout your stay, from enquiry to checkout.',
  },
  {
    icon: Headphones,
    title: 'Always On',
    body: 'Midnight check-in, early checkout, a broken fan at 2 AM: we handle it. Prompt, human responses every time.',
  },
  {
    icon: Star,
    title: 'Curated Properties Only',
    body: 'Habbaa lists only properties we personally vouch for. Quality over quantity. Every home we host meets our standard.',
  },
];

export default function AboutPage() {
  return (
    <div className="pb-0" style={{ color: 'var(--ink)' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        className="py-16 sm:py-20"
        style={{ backgroundColor: 'var(--maroon-deep)', color: 'white' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/habbaa-logo-white.svg"
              alt="Habbaa"
              width={72}
              height={72}
              className="rounded-full"
            />
          </div>
          <h1
            className="text-5xl sm:text-6xl font-bold italic mb-5"
            style={{ fontFamily: 'var(--font-display)', color: 'white' }}
          >
            About Us
          </h1>
          <p className="text-lg text-white/75 leading-relaxed max-w-xl mx-auto">
            A boutique hospitality brand born on the Karnataka coast.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* ── Story ────────────────────────────────────────── */}
        <section className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} />
            <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
              Our Story
            </h2>
          </div>
          <p className="leading-relaxed text-base" style={{ color: 'var(--ink-muted)' }}>
            Habbaa started with a simple frustration: beautiful private villas in Mangalore were buried under layers of OTA commissions, impersonal listings, and guests who never got to speak to a real person until they showed up at the gate.
          </p>
          <p className="leading-relaxed text-base" style={{ color: 'var(--ink-muted)' }}>
            We built Habbaa to be the direct alternative. Villa 19 is our flagship property: a 4-bedroom retreat in Urwa where the host is a WhatsApp message away, the price you see is the price you pay, and the experience is curated from first enquiry to checkout.
          </p>
          <p className="leading-relaxed text-base" style={{ color: 'var(--ink-muted)' }}>
            We are a small team rooted in Mangalore. We know the city, the coast, and what makes a stay memorable. We put that into every property we take on.
          </p>
        </section>

        {/* ── Values ───────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} />
            <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
              What We Stand For
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {VALUES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="p-6 rounded-2xl space-y-3"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'var(--maroon-tint)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: 'var(--brass)' }} aria-hidden="true" />
                </div>
                <p className="font-bold text-base" style={{ color: 'var(--maroon)' }}>{title}</p>
                <p className="text-base leading-relaxed" style={{ color: 'var(--ink-muted)' }}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────── */}
        <section
          className="p-8 rounded-3xl text-center space-y-4"
          style={{ backgroundColor: 'var(--maroon)', color: 'white' }}
        >
          <h2 className="text-3xl font-bold italic" style={{ fontFamily: 'var(--font-display)' }}>
            Ready to experience it?
          </h2>
          <p className="text-white/70 text-base">Book Villa 19 directly. No platform fees, personal host service.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
            <BookNowLink
              className="btn-brass-filled px-8 py-3.5 rounded-xl"
            >
              Check Availability
            </BookNowLink>
            <Link
              href="/contact"
              className="btn-frosted px-6 py-3.5 rounded-xl"
            >
              Contact Us
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
