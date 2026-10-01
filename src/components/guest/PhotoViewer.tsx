'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { PropertyImage } from '@/types';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { GALLERY_SECTIONS, galleryLabel } from '@/lib/gallery';

interface PhotoViewerProps {
  images: PropertyImage[];
  startIndex: number;
  onClose: () => void;
  /** Category chips. Off when the caller already passes one section. */
  showFilters?: boolean;
}

/** Horizontal travel before a touch counts as a swipe rather than a tap. */
const SWIPE_THRESHOLD = 50;

const SCRIM = 'rgba(20,10,8,0.97)';

export default function PhotoViewer({
  images,
  startIndex,
  onClose,
  showFilters = true,
}: PhotoViewerProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [index, setIndex] = useState(startIndex);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const present = new Set(images.map((img) => img.category));
  const categories = ['all', ...GALLERY_SECTIONS.map((s) => s.key).filter((k) => present.has(k))];

  const shown =
    activeCategory === 'all' ? images : images.filter((img) => img.category === activeCategory);
  const current = shown[index];

  const goNext = useCallback(() => setIndex((i) => (i + 1) % shown.length), [shown.length]);
  const goPrev = useCallback(() => setIndex((i) => (i - 1 + shown.length) % shown.length), [shown.length]);

  // Lock the page behind the dialog and return focus where it was on close.
  useEffect(() => {
    const restoreTo = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      restoreTo?.focus?.();
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose();
      if (e.key === 'ArrowRight') return goNext();
      if (e.key === 'ArrowLeft') return goPrev();
      if (e.key !== 'Tab') return;

      // Keep focus inside the dialog.
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, goNext, goPrev]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // Ignore a mostly-vertical drag so scrolling never flips the photo.
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;
    if (dx < 0) goNext();
    else goPrev();
  };

  if (!current) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Photo gallery"
      className="fixed inset-0 z-50 flex flex-col backdrop-blur-xl"
      style={{ backgroundColor: SCRIM }}
    >
      {/* ── Header: filters, counter, close ── */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 sm:gap-4 sm:px-6 sm:pt-5">
        {showFilters && (
          <div className="relative min-w-0 flex-1">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pr-8">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setIndex(0);
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? 'bg-[var(--brass-light)] text-[var(--maroon-deep)]'
                      : 'bg-white/10 text-white/80 can-hover:hover:bg-white/20'
                  }`}
                  aria-pressed={activeCategory === cat}
                >
                  {cat === 'all' ? 'All' : galleryLabel(cat)}
                </button>
              ))}
            </div>
            {/* Shows that the row keeps going. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-10"
              style={{ background: `linear-gradient(to left, ${SCRIM}, transparent)` }}
            />
          </div>
        )}

        <span className="flex-shrink-0 text-xs tabular-nums text-white/70">
          {index + 1} / {shown.length}
        </span>

        <button
          ref={closeRef}
          onClick={onClose}
          className="flex-shrink-0 p-2 rounded-full bg-white/10 text-white/80 can-hover:hover:bg-[var(--brass-light)] can-hover:hover:text-[var(--maroon-deep)] transition-colors"
          aria-label="Close gallery"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
        </button>
      </div>

      {/* ── Photo: fills the space left over, edge to edge on a phone ── */}
      <div
        className="relative flex-1 min-h-0"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Image
          key={current.id}
          src={current.url}
          alt={current.alt_text}
          fill
          sizes="100vw"
          priority
          className="object-contain"
        />

        <button
          onClick={goPrev}
          className="absolute left-1 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors can-hover:hover:bg-[var(--brass-light)] can-hover:hover:text-[var(--maroon-deep)] sm:left-4 sm:p-3"
          aria-label="Previous photo"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
        </button>
        <button
          onClick={goNext}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors can-hover:hover:bg-[var(--brass-light)] can-hover:hover:text-[var(--maroon-deep)] sm:right-4 sm:p-3"
          aria-label="Next photo"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
        </button>
      </div>

      {/* ── Caption ── */}
      <div className="px-4 pb-5 pt-3 text-center sm:pb-6">
        <p className="text-sm text-white/85">{current.alt_text}</p>
        <p className="mt-2 hidden text-xs text-white/40 can-hover:block">
          Use the arrow keys to move between photos. Press Escape to close.
        </p>
      </div>
    </div>
  );
}
