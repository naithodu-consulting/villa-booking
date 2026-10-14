'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { PropertyImage } from '@/types';
import { Grid } from 'lucide-react';
import PhotoViewer from './PhotoViewer';
import HeroVideo from './HeroVideo';

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

  // Each cell is 3:2, which is the shape of every photograph in the gallery,
  // so the photo fills its cell with nothing cropped and no empty margin. The
  // cells were fixed pixel heights before, which matched no photograph.

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 rounded-2xl overflow-hidden shadow-lg relative">
        {/* The reel takes the hero cell, so the tiles start at the first photo
            rather than skipping it: nothing is dropped from the mosaic. */}
        <HeroVideo
          className="col-span-2 md:row-span-2 md:h-full"
          onOpen={() => setOpenAt(0)}
          openLabel={`Open gallery: ${images.length} photos of Villa 19`}
        />

        {/* Four more on desktop, two on mobile. */}
        {images.slice(0, 4).map((img, idx) => (
          <button
            type="button"
            key={img.id}
            className={`relative group overflow-hidden ${idx >= 2 ? 'hidden md:block' : ''}`}
            style={{ aspectRatio: '3 / 2', backgroundColor: 'var(--paper-sunk)' }}
            onClick={() => setOpenAt(idx)}
            aria-label={`View photo: ${img.alt_text}`}
          >
            <Image
              src={img.url}
              alt={img.alt_text ?? `Villa photo ${idx + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              priority={idx < 2}
              className="transition-transform duration-500 group-hover:scale-105"
              style={{ objectFit: 'cover' }}
            />
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
