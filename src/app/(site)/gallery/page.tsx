import React from 'react';
import type { Metadata } from 'next';
import { pageMetadata, breadcrumbJsonLd } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import { getProperty, getImages } from '@/lib/data';
import { isVisibleGalleryCategory } from '@/lib/gallery';
import GalleryGrid from '@/components/guest/GalleryGrid';
import CtaButtons from '@/components/guest/CtaButtons';
import PageHero from '@/components/layout/PageHero';


/**
 * Safety net for content staleness.
 *
 * This page is prerendered and reads live content from Supabase, so without a
 * revalidation period its only refresh path is Ooruda Villa calling
 * POST /api/revalidate. If that webhook is not wired, or CONTENT_REVALIDATE_SECRET
 * is unset (the endpoint then 503s), the page stays frozen at whatever was true
 * at build time until the next deploy: stale policies, stale FAQs, a stale
 * address. A day is the worst case rather than for ever. The webhook is still
 * the fast path and makes an edit appear at once.
 */
export const revalidate = 86400;

export const metadata: Metadata = pageMetadata({
  title: 'Villa Photos & Gallery',
  path: '/gallery',
  description:
    'Photos of Villa 19 in Urwa, Mangalore: the villa, living and dining spaces, bedrooms, bathrooms and outdoor spaces.',
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

  // Hidden sections are dropped here rather than in the grid, so their
  // photographs never reach the browser at all.
  const images = (await getImages(property.id)).filter((img) => isVisibleGalleryCategory(img.category));
  const hasImages = images.length > 0;

  return (
    <div className="pb-0" style={{ color: 'var(--ink)' }}>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Gallery', path: '/gallery' }])} />

      {/* ── Page Hero ── */}
      <PageHero title="Gallery" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12">
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
