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

const ARROW =
  'absolute top-1/2 -translate-y-1/2 z-10 grid place-items-center rounded-full ' +
  'border border-white/25 bg-black/55 text-white backdrop-blur-sm transition-colors ' +
  'hover:bg-[var(--brass-light)] hover:text-[var(--maroon-deep)] hover:border-transparent ' +
  'h-10 w-10 sm:h-11 sm:w-11';

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
      {/* ── Header. The chips take a line of their own on a phone, where
             sharing one with the counter and close button left them clipped
             mid-word. ── */}
      <div className="flex flex-shrink-0 flex-wrap items-center gap-x-3 gap-y-2 px-3 pt-3 sm:flex-nowrap sm:gap-x-4 sm:px-6 sm:pt-5">
        <span className="order-1 mr-auto text-xs tabular-nums text-white/70 sm:order-2 sm:mr-0">
          {index + 1} / {shown.length}
        </span>

        <button
          ref={closeRef}
          onClick={onClose}
          className="order-2 grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 text-white/90 transition-colors hover:border-transparent hover:bg-[var(--brass-light)] hover:text-[var(--maroon-deep)] sm:order-3"
          aria-label="Close gallery"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        {showFilters && (
          <div className="relative order-3 w-full min-w-0 sm:order-1 sm:w-auto sm:flex-1">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pr-10">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setIndex(0);
                  }}
                  className={`flex-shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? 'bg-[var(--brass-light)] text-[var(--maroon-deep)]'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
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
      </div>

      {/* ── Photo and its caption, kept together and centred. The photo box
             carries the 4:3 of almost every photo here, so a phone shows the
             pair as one block instead of a small photo marooned in the dark. ── */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-3 py-4 sm:px-6">
        {/* max-h reserves the caption's line(s). Plain max-h-full lets the
            photo take the column's whole height and push the caption off the
            bottom of the screen. The desktop figure allows for the extra
            keyboard-hint line. */}
        <div
          className="relative aspect-[4/3] w-full max-w-5xl max-h-[calc(100%-3.5rem)] sm:max-h-[calc(100%-5rem)]"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <Image
            key={current.id}
            src={current.url}
            alt={current.alt_text}
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            priority
            className="object-contain"
          />

          <button onClick={goPrev} className={`${ARROW} left-2`} aria-label="Previous photo">
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </button>
          <button onClick={goNext} className={`${ARROW} right-2`} aria-label="Next photo">
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-shrink-0 text-center">
          <p className="text-sm text-white/85">{current.alt_text}</p>
          <p className="pointer-only mt-1.5 text-xs text-white/40">
            Use the arrow keys to move between photos. Press Escape to close.
          </p>
        </div>
      </div>
    </div>
  );
}
