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
 * The label sits under the tile on touch devices and over it on hover, so a
 * phone never has 40% of each photo covered by a gradient it cannot dismiss.
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
            {/* One grid for every section so tiles are the same size throughout; a
                short section leaves space rather than stretching its photos. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-5">
              {imgs.map((img) => {
                const tileLabel = img.caption ?? img.alt_text;
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setOpenAt(ordered.findIndex((o) => o.id === img.id))}
                    className="group block w-full text-left rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:ring-offset-2"
                    aria-label={`View photo: ${img.alt_text}`}
                  >
                    <div
                      className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm"
                      style={{ border: '1px solid var(--border-subtle)' }}
                    >
                      {/* sizes matches the grid: 2 / 3 / 4 columns, capped by max-w-6xl. */}
                      <Image
                        src={img.url}
                        alt={img.alt_text}
                        fill
                        className="object-cover transition-transform duration-500 can-hover:group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 290px"
                      />
                      <div className="hidden can-hover:block absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="hidden can-hover:block absolute inset-x-0 bottom-0 px-3 pb-2.5 opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                        <p className="text-white text-xs font-semibold leading-snug drop-shadow-sm">
                          {tileLabel}
                        </p>
                      </div>
                    </div>
                    <p
                      className="can-hover:hidden mt-2 text-xs font-medium leading-snug"
                      style={{ color: 'var(--ink-muted)' }}
                    >
                      {tileLabel}
                    </p>
                  </button>
                );
              })}
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
