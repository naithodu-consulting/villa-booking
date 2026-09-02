import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getProperty, getImages } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Gallery',
  description:
    'Photo gallery of Villa 19, Mangalore. Interiors, bedrooms, outdoor spaces and surrounding views.',
  openGraph: {
    title: 'Gallery | Villa 19 by Habbaa',
    description: 'A visual tour of Villa 19: interiors, bedrooms, outdoor lawns and the Karnataka coast.',
    url: 'https://habbaa.in/gallery',
  },
  twitter: {
    title: 'Gallery | Villa 19 by Habbaa',
    description: 'A visual tour of Villa 19, Mangalore.',
  },
};

const CATEGORY_ORDER = ['hero', 'exterior', 'living', 'bedroom', 'dining', 'kitchen', 'bathroom', 'outdoor', 'surroundings'];

const CATEGORY_LABEL: Record<string, string> = {
  hero:          'Overview',
  exterior:      'Exterior',
  living:        'Living Spaces',
  bedroom:       'Bedrooms',
  dining:        'Dining',
  kitchen:       'Kitchen',
  bathroom:      'Bathrooms',
  outdoor:       'Outdoor',
  surroundings:  'Surroundings',
};

export default async function GalleryPage() {
  const property = await getProperty();
  if (!property) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-base" style={{ color: 'var(--ink-muted)' }}>Property data unavailable.</p>
      </div>
    );
  }

  const images = await getImages(property.id);

  // Group by category in defined order
  const imageGroups = CATEGORY_ORDER.reduce<Record<string, typeof images>>((acc, cat) => {
    const imgs = images.filter((img) => img.category === cat);
    if (imgs.length > 0) acc[cat] = imgs;
    return acc;
  }, {});

  const hasImages = images.length > 0;

  return (
    <div className="pb-20 md:pb-0" style={{ color: 'var(--ink)' }}>

      {/* ── Page Hero ─────────────────────────────────────── */}
      <section
        className="py-16 sm:py-20"
        style={{ backgroundColor: 'var(--maroon)', color: 'white' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--brass-light)' }}>
            {property.name}
          </p>
          <h1
            className="text-5xl sm:text-6xl font-bold italic mb-5"
            style={{ fontFamily: 'var(--font-display)', color: 'white' }}
          >
            Gallery
          </h1>
          <p className="text-lg text-white/75 leading-relaxed">
            A visual tour of the villa and its surroundings.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!hasImages ? (
          <div
            className="py-24 rounded-3xl text-center space-y-3"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
          >
            <p className="text-2xl">📸</p>
            <p className="font-semibold" style={{ color: 'var(--maroon)' }}>Photos coming soon</p>
            <p className="text-base" style={{ color: 'var(--ink-muted)' }}>
              We are adding professional photos. In the meantime,{' '}
              <a
                href={`https://wa.me/${property.whatsapp_number ?? '919876543210'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: 'var(--brass)' }}
              >
                WhatsApp us
              </a>{' '}
              and we will share a full media pack.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(imageGroups).map(([category, imgs]) => (
              <section key={category} className="space-y-4">
                <h2
                  className="text-sm font-bold uppercase tracking-widest pb-2"
                  style={{ color: 'var(--brass)', borderBottom: '1px solid var(--border-subtle)' }}
                >
                  {CATEGORY_LABEL[category] ?? category}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {imgs.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm"
                      style={{ border: '1px solid var(--border-subtle)' }}
                    >
                      <Image
                        src={img.url}
                        alt={img.alt_text}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* ── CTA ──────────────────────────────────────────── */}
        <div
          className="mt-12 p-8 rounded-3xl text-center space-y-4"
          style={{ backgroundColor: 'var(--maroon)', color: 'white' }}
        >
          <h2 className="text-2xl font-bold italic" style={{ fontFamily: 'var(--font-display)' }}>
            Like what you see?
          </h2>
          <p className="text-white/70 text-base">Book directly. No platform fees, instant confirmation.</p>
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
