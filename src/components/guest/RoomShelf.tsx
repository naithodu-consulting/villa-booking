'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { Room } from '@/types';

/**
 * Mobile: a snap-scrolling shelf with real prev/next controls.
 *
 * The previous version printed the word "swipe" — instructional text standing in
 * for a missing control. Buttons are an affordance rather than a caption: they
 * say what they do by being pressable, they work for anyone who does not think
 * to swipe, and they give a visible end-state (dimmed when there is nowhere left
 * to go) that a label cannot. The cut-off next card still carries the primary
 * cue; these make it operable.
 *
 * sm+ renders a plain grid, so the controls hide themselves there.
 */
export default function RoomShelf({ rooms }: { rooms: Room[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  /** Scroll offset of each card. The shelf has px-4, so the first card sits at
   *  16 rather than 0 — reading scrollLeft against 0 reports "not at start"
   *  forever. */
  const snapPoints = () => {
    const el = ref.current;
    if (!el) return [] as number[];
    const base = el.getBoundingClientRect().left - el.scrollLeft;
    return [...el.children].map((c) => Math.round(c.getBoundingClientRect().left - base));
  };

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const first = el.firstElementChild
      ? Math.round(el.firstElementChild.getBoundingClientRect().left - (el.getBoundingClientRect().left - el.scrollLeft))
      : 0;
    setAtStart(el.scrollLeft <= first + 2);
    setAtEnd(el.scrollLeft >= max - 2);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => {
      el.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [sync]);

  // Direct scrollLeft assignment honours scroll-behavior:smooth on the container
  // without fighting scroll-snap-type:mandatory. The two don't conflict because
  // we land exactly on a snap point — there is nothing left to re-snap to.
  const step = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const pts = snapPoints();
    if (!pts.length) return;

    const current = pts.reduce(
      (best, p, i) => (Math.abs(p - el.scrollLeft) < Math.abs(pts[best] - el.scrollLeft) ? i : best),
      0,
    );
    const target = Math.min(Math.max(current + dir, 0), pts.length - 1);
    el.scrollLeft = pts[target];
    sync();
  };

  const btn = (disabled: boolean) =>
    ({
      backgroundColor: disabled ? 'transparent' : 'var(--surface)',
      border: `1px solid ${disabled ? 'var(--border-subtle)' : 'var(--border-medium)'}`,
      color: disabled ? 'var(--ink-faint)' : 'var(--maroon)',
      opacity: disabled ? 0.45 : 1,
    }) as React.CSSProperties;

  return (
    <>
      <div className="flex items-center gap-2.5">
        <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} aria-hidden="true" />
        <h2
          className="text-3xl font-black tracking-tight"
          style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}
        >
          Room Breakdown
        </h2>

        <div className="sm:hidden ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={atStart}
            aria-label="Previous room"
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
            style={btn(atStart)}
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={atEnd}
            aria-label="Next room"
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
            style={btn(atEnd)}
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative -mx-4 sm:mx-0">
        <div
          ref={ref}
          className="shelf-x scroll-smooth flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 scroll-px-4 pb-2
                     sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 sm:scroll-px-0"
          role="group"
          aria-label={`Rooms, ${rooms.length} total`}
        >
          {rooms.map((room) => (
            <div
              key={room.id}
              /* Sized against the viewport: the wrapper's -mx-4 cancels the
                 shelf's px-4, so the sliver is (viewport - card - gap). 34px =
                 16px gap + an 18px sliver, kept under the card's own 20px
                 padding so no word is ever clipped mid-letter. */
              className="p-5 rounded-2xl shadow-sm flex flex-col justify-between
                         shrink-0 basis-[calc(100vw-34px)] snap-start sm:shrink sm:basis-auto"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs lg:text-[13px] font-bold uppercase" style={{ color: 'var(--brass-ink)', letterSpacing: '1.2px' }}>
                    {room.room_type}
                  </span>
                  <span
                    className="text-xs lg:text-[13px] font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--maroon-tint)', color: 'var(--maroon-deep)' }}
                  >
                    Max {room.max_guests} Guests
                  </span>
                </div>
                <h3 className="text-base lg:text-[17px] font-bold mb-2" style={{ color: 'var(--ink)' }}>{room.name}</h3>
                {/* Floor and size: the two things guests ask before picking a room.
                    The lounge has no floor, so the separator collapses with it. */}
                <p className="text-xs lg:text-[13px]" style={{ color: 'var(--ink-muted)' }}>
                  {[room.floor, room.size_sqft ? `${room.size_sqft} sq ft` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <div
                className="pt-3 mt-3 text-sm lg:text-[15px] flex items-center justify-between"
                style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--ink-muted)' }}
              >
                <span>{room.bed_count} × {room.bed_type}</span>
                {/* Only the attached bath is named. The common bathrooms are
                    covered on the Rooms page, not repeated on every card. */}
                {room.has_ensuite_bathroom && (
                  <span className="font-semibold" style={{ color: 'var(--ink-muted)' }}>Attached Bath</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
