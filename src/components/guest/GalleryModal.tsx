'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { PropertyImage } from '@/types';
import { X, ChevronLeft, ChevronRight, Grid } from 'lucide-react';

interface GalleryProps {
  images: PropertyImage[];
}

const VALID_CATEGORIES = ['all', 'hero', 'bedroom', 'living', 'dining', 'exterior'] as const;

export default function GalleryModal({ images }: GalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Derive categories from actual image data — never hardcode (L-02 fix)
  const categories: string[] = ['all', ...Array.from(
    new Set(images.map((img) => img.category).filter((c) => VALID_CATEGORIES.includes(c as typeof VALID_CATEGORIES[number])))
  )];

  const filteredImages = activeCategory === 'all'
    ? images
    : images.filter((img) => img.category === activeCategory);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const closeLightbox = useCallback(() => setIsOpen(false), []);

  const goNext = useCallback(() =>
    setCurrentIndex((i) => (i < filteredImages.length - 1 ? i + 1 : 0)), [filteredImages.length]);

  const goPrev = useCallback(() =>
    setCurrentIndex((i) => (i > 0 ? i - 1 : filteredImages.length - 1)), [filteredImages.length]);

  // ESC key and arrow key navigation (M-02 fix)
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', handler);
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeLightbox, goNext, goPrev]);

  if (images.length === 0) return null;

  return (
    <div className="w-full">
      {/* Thumbnail Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 sm:rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Hero image */}
        <div
          className="col-span-2 md:col-span-2 md:row-span-2 relative h-72 sm:h-80 md:h-[520px] cursor-pointer group overflow-hidden"
          onClick={() => openLightbox(0)}
          role="button"
          tabIndex={0}
          aria-label={`Open gallery: ${images[0]?.alt_text}`}
          onKeyDown={(e) => e.key === 'Enter' && openLightbox(0)}
        >
          <Image
            src={images[0]?.url}
            alt={images[0]?.alt_text ?? 'Villa exterior'}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        </div>

        {/* Remaining thumbnails — show all 4 on desktop, only 2 on mobile */}
        {images.slice(1, 5).map((img, idx) => (
          <div
            key={img.id}
            className={`relative h-36 sm:h-40 md:h-[254px] cursor-pointer group overflow-hidden ${idx >= 2 ? 'hidden md:block' : ''}`}
            onClick={() => openLightbox(idx + 1)}
            role="button"
            tabIndex={0}
            aria-label={`View photo: ${img.alt_text}`}
            onKeyDown={(e) => e.key === 'Enter' && openLightbox(idx + 1)}
          >
            <Image
              src={img.url}
              alt={img.alt_text ?? `Villa photo ${idx + 2}`}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors" />
          </div>
        ))}

        <button
          onClick={() => openLightbox(0)}
          className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md hover:bg-amber-500 hover:text-slate-950 text-white px-3.5 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-all shadow-xl"
          aria-label={`Show all ${images.length} photos`}
        >
          <Grid className="w-3.5 h-3.5" aria-hidden="true" />
          Show All {images.length} Photos
        </button>
      </div>

      {/* Fullscreen Lightbox */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 md:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
        >
          {/* Header: category filters + close */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setCurrentIndex(0); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                  aria-pressed={activeCategory === cat}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              onClick={closeLightbox}
              className="p-2 rounded-full bg-slate-800/80 text-slate-300 hover:bg-red-500 hover:text-white transition-all ml-4 flex-shrink-0"
              aria-label="Close gallery"
            >
              <X className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>

          {/* Image viewer */}
          <div className="relative flex-1 flex items-center justify-center my-4">
            <button
              onClick={goPrev}
              className="absolute left-2 md:left-6 z-10 p-3 rounded-full bg-slate-900/80 text-white hover:bg-amber-500 hover:text-slate-950 transition-all border border-slate-700"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" aria-hidden="true" />
            </button>

            {filteredImages[currentIndex] && (
              <div className="max-w-5xl w-full flex flex-col items-center px-14">
                <div className="relative w-full max-h-[70vh] aspect-video">
                  <Image
                    src={filteredImages[currentIndex].url}
                    alt={filteredImages[currentIndex].alt_text ?? 'Villa photo'}
                    fill
                    sizes="(max-width: 768px) 90vw, 80vw"
                    className="object-contain rounded-xl"
                    priority
                  />
                </div>
                <p className="mt-3 text-slate-400 text-sm font-medium text-center">
                  {filteredImages[currentIndex].alt_text} &mdash;{' '}
                  <span className="tabular-nums">{currentIndex + 1}</span> of{' '}
                  <span className="tabular-nums">{filteredImages.length}</span>
                </p>
              </div>
            )}

            <button
              onClick={goNext}
              className="absolute right-2 md:right-6 z-10 p-3 rounded-full bg-slate-900/80 text-white hover:bg-amber-500 hover:text-slate-950 transition-all border border-slate-700"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>

          <p className="text-center text-xs text-slate-500">
            Use ← → arrow keys to navigate · ESC to close
          </p>
        </div>
      )}
    </div>
  );
}
