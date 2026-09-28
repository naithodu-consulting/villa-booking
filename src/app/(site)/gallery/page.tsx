import React from 'react';
import type { Metadata } from 'next';
import { pageMetadata, breadcrumbJsonLd } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import Image from 'next/image';
import { getProperty, getImages } from '@/lib/data';
import { GALLERY_SECTIONS } from '@/lib/gallery';
import CtaButtons from '@/components/guest/CtaButtons';

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

  // Sections in the operator's order. A section with no photos yet is left out
  // rather than shown empty.
  const sections = GALLERY_SECTIONS
    .map((sec) => ({ ...sec, imgs: images.filter((img) => img.category === sec.key) }))
    .filter((sec) => sec.imgs.length > 0);

  const hasImages = images.length > 0;

  return (
    <div className="pb-0" style={{ color: 'var(--ink)' }}>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Gallery', path: '/gallery' }])} />

      {/* ── Page Hero ─────────────────────────────────────── */}
      <section
        className="py-10 sm:py-14"
        style={{
          backgroundColor: 'var(--paper-sunk)',
          color: 'var(--ink)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1
            className="text-5xl sm:text-6xl font-bold mb-5"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}
          >
            Gallery
          </h1>
          <p className="text-lg leading-relaxed text-[var(--ink-muted)]">
            Explore the spaces, the surroundings, and everything in between.
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
          <div className="space-y-12">
            {sections.map(({ key, label, imgs }) => (
              <section key={key} className="space-y-4">
                <h2
                  className="text-sm font-bold uppercase tracking-widest pb-2"
                  style={{ color: 'var(--brass-ink)', borderBottom: '1px solid var(--border-subtle)' }}
                >
                  {label}
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
                        sizes="(max-width: 640px) 50vw, 33vw"
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
