import React from 'react';
import type { Metadata } from 'next';
import { pageMetadata, breadcrumbJsonLd } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import { getProperty, getImages } from '@/lib/data';
import GalleryGrid from '@/components/guest/GalleryGrid';
import CtaButtons from '@/components/guest/CtaButtons';
import PageHero from '@/components/layout/PageHero';

export const metadata: Metadata = pageMetadata({
  title: 'Villa Photos & Gallery',
  path: '/gallery',
  description:
    'Photos of Villa 19 in Urwa, Mangalore: the villa, living and dining spaces, bedrooms, bathrooms, outdoor spaces, parking and the neighbourhood.',
});

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
  const hasImages = images.length > 0;

  return (
    <div className="pb-0" style={{ color: 'var(--ink)' }}>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Gallery', path: '/gallery' }])} />

      {/* ── Page Hero ── */}
      <PageHero title="Gallery" intro="Explore the spaces, the surroundings, and everything in between." />

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
              {property.whatsapp_number && (
                <>
                  <a
                    href={`https://wa.me/${property.whatsapp_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    style={{ color: 'var(--brass-ink)' }}
                  >
                    WhatsApp us
                  </a>{' '}
                </>
              )}
              and we will share a full media pack.
            </p>
          </div>
        ) : (
          <GalleryGrid images={images} />
        )}

        {/* ── CTA ──────────────────────────────────────────── */}
        <div
          className="mt-12 p-8 rounded-3xl text-center space-y-4"
          style={{ backgroundColor: 'var(--maroon-deep)', color: 'white' }}
        >
          <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Like what you see?
          </h2>
          <p className="text-white/70 text-base">Book directly. No platform fees, instant confirmation.</p>
          <CtaButtons />
        </div>
      </div>
    </div>
  );
}
