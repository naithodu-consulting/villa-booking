'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { PropertyImage } from '@/types';
import { GALLERY_SECTIONS } from '@/lib/gallery';
import PhotoViewer from './PhotoViewer';

/**
 * The Gallery page grid. Every tile opens the viewer, which is the only way to
 * see a photo at any size on a phone.
 *
 * The label sits under the tile on every device rather than over the photo on
 * one and under it on another. Text on top of the photo needs a scrim to stay
 * legible, which dims the thing the page exists to show, and hiding it behind
 * hover leaves it unreachable on a touchscreen. Hover zooms the tile; that is
 * the whole of the hover treatment.
 */
export default function GalleryGrid({ images }: { images: PropertyImage[] }) {
  const [openAt, setOpenAt] = useState<number | null>(null);

  const sections = GALLERY_SECTIONS.map((sec) => ({
    ...sec,
    imgs: images.filter((img) => img.category === sec.key),
  })).filter((sec) => sec.imgs.length > 0);

  // The viewer walks this list, so tile indices have to come from it.
  const ordered = sections.flatMap((sec) => sec.imgs);

  return (
    <>
      <div className="space-y-12">
        {sections.map(({ key, label, imgs }) => (
          <section key={key} className="space-y-4">
            <h2
              className="text-sm font-bold uppercase tracking-widest pb-2"
              style={{ color: 'var(--brass-ink)', borderBottom: '1px solid var(--border-subtle)' }}
            >
              {label}
            </h2>
            {/* Every photograph in the gallery is landscape 3:2 (00067), so one
                3:2 tile fits them all: the grid is even, the photo fills its
                tile edge to edge, and nothing is cropped or left as a border
                above and below. Masonry and letterboxing both existed to cope
                with the vertical frames, which are no longer published. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-5">
              {imgs.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setOpenAt(ordered.findIndex((o) => o.id === img.id))}
                  className="group block w-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:ring-offset-2"
                  aria-label={`View photo: ${img.alt_text}`}
                >
                  {/* The tile's shape is the photographs' own 3:2 (00067 for
                      the villa, 00068 for the neighbourhood ones), so covering
                      it has nothing to crop. */}
                  <div
                    className="relative rounded-2xl overflow-hidden shadow-sm"
                    style={{
                      // Inline, not a utility class: a tile that renders with a
                      // stale stylesheet would otherwise fall back to the old
                      // 4:3 and letterbox the photo. Inline styles travel with
                      // the markup, so the tile cannot be the wrong shape.
                      aspectRatio: '3 / 2',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--paper-band)',
                    }}
                  >
                    {/* sizes matches the columns: 2 / 3 / 4, capped by max-w-6xl. */}
                    <Image
                      src={img.url}
                      alt={img.alt_text}
                      fill
                      className="transition-transform duration-500 group-hover:scale-105"
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 290px"
                    />
                  </div>
                  {/* Colour set by class, not inline style: an inline style
                      would outrank the hover rule and never change. */}
                  <p className="mt-2 text-center text-xs font-medium leading-snug text-[var(--ink-muted)] transition-colors group-hover:text-[var(--maroon)]">
                    {img.caption ?? img.alt_text}
                  </p>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {openAt !== null && (
        <PhotoViewer images={ordered} startIndex={openAt} onClose={() => setOpenAt(null)} />
      )}
    </>
  );
}
