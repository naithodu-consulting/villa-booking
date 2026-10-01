'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { PropertyImage } from '@/types';
import { Grid } from 'lucide-react';
import PhotoViewer from './PhotoViewer';

interface GalleryProps {
  images: PropertyImage[];
}

/**
 * The homepage photo mosaic. A way into the viewer rather than a way to
 * identify a room, so tiles carry no caption on touch: the Gallery page is
 * where photos are labelled.
 */
export default function GalleryModal({ images }: GalleryProps) {
  const [openAt, setOpenAt] = useState<number | null>(null);

  if (images.length === 0) return null;

  const hero = images[0];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 rounded-2xl overflow-hidden shadow-lg relative">
        <button
          type="button"
          className="col-span-2 md:row-span-2 relative h-72 sm:h-80 md:h-[520px] group overflow-hidden"
          onClick={() => setOpenAt(0)}
          aria-label={`Open gallery: ${hero.alt_text}`}
        >
          <Image
            src={hero.url}
            alt={hero.alt_text ?? 'Villa exterior'}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-40" />
        </button>

        {/* Four more on desktop, two on mobile. */}
        {images.slice(1, 5).map((img, idx) => (
          <button
            type="button"
            key={img.id}
            className={`relative h-36 sm:h-40 md:h-[254px] group overflow-hidden ${idx >= 2 ? 'hidden md:block' : ''}`}
            onClick={() => setOpenAt(idx + 1)}
            aria-label={`View photo: ${img.alt_text}`}
          >
            <Image
              src={img.url}
              alt={img.alt_text ?? `Villa photo ${idx + 2}`}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-transparent" />
            {/* opacity-0 by default and group-hover: is already wrapped in
                @media (hover: hover), so a touchscreen never reveals this. */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-8 pb-2.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <p className="text-left text-white text-xs font-semibold leading-snug drop-shadow-sm">
                {img.caption ?? img.alt_text}
              </p>
            </div>
          </button>
        ))}

        <button
          onClick={() => setOpenAt(0)}
          className="absolute bottom-3 right-3 bg-[rgba(20,10,8,0.85)] backdrop-blur-md hover:bg-[var(--brass-light)] hover:text-[var(--maroon-deep)] text-white px-4 min-h-11 rounded-xl font-semibold text-xs flex items-center gap-1.5 border border-white/15 transition-all shadow-xl"
          aria-label={`Show all ${images.length} photos`}
        >
          <Grid className="w-3.5 h-3.5" aria-hidden="true" />
          Show All {images.length} Photos
        </button>
      </div>

      {openAt !== null && (
        <PhotoViewer images={images} startIndex={openAt} onClose={() => setOpenAt(null)} />
      )}
    </div>
  );
}
