import React from 'react';
import type { Metadata } from 'next';
import { pageMetadata, breadcrumbJsonLd } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import Image from 'next/image';
import { getProperty, getImages } from '@/lib/data';
import { GALLERY_SECTIONS } from '@/lib/gallery';
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

  // Sections in the operator's order. A section with no photos yet is left out
  // rather than shown empty.
  const sections = GALLERY_SECTIONS
    .map((sec) => ({ ...sec, imgs: images.filter((img) => img.category === sec.key) }))
    .filter((sec) => sec.imgs.length > 0);

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
          <div className="space-y-12">
            {sections.map(({ key, label, imgs }) => (
              <section key={key} className="space-y-4">
                <h2
                  className="text-sm font-bold uppercase tracking-widest pb-2"
                  style={{ color: 'var(--brass-ink)', borderBottom: '1px solid var(--border-subtle)' }}
                >
                  {label}
                </h2>
                {/* One grid for every section so tiles are the same size throughout; a
                    short section leaves space rather than stretching its photos. */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {imgs.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm group"
                      style={{ border: '1px solid var(--border-subtle)' }}
                    >
                      {/* sizes matches the grid: 2 / 3 / 4 columns, capped by max-w-6xl. */}
                      <Image
                        src={img.url}
                        alt={img.alt_text}
                        fill
                        className="object-cover transition-transform duration-500 md:group-hover:scale-110"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 290px"
                      />
                      {/* Gradient + label overlay.
                          Mobile/tablet: always visible (opacity-100, translate-y-0).
                          Desktop: hidden by default, slides up on hover. */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent
                                      transition-opacity duration-300
                                      md:opacity-0 md:group-hover:opacity-100" />
                      <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5
                                      transition-all duration-300
                                      md:translate-y-1 md:opacity-0
                                      md:group-hover:translate-y-0 md:group-hover:opacity-100">
                        <p className="text-white text-[11px] font-semibold leading-snug line-clamp-2 drop-shadow-sm">
                          {img.alt_text}
                        </p>
                      </div>
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
