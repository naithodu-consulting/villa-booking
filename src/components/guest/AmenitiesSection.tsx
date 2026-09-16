'use client';

import React, { useRef } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

interface Props {
  featured: { id: string; label: string }[];
  groups: Record<string, string[]>;
  total: number;
}

function AmenityItem({ label }: { label: string }) {
  return (
    <li className="text-sm lg:text-[15px] flex items-center gap-2.5" style={{ color: 'var(--ink-muted)' }}>
      <span
        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'var(--maroon-tint)' }}
      >
        <Check className="w-3 h-3" style={{ color: 'var(--brass)' }} aria-hidden="true" />
      </span>
      {label}
    </li>
  );
}

function CategoryCards({ groups }: { groups: Record<string, string[]> }) {
  return (
    <>
      {Object.entries(groups).map(([category, items]) => (
        <div
          key={category}
          className="p-5 rounded-2xl shadow-sm"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
        >
          <h3 className="text-sm lg:text-[15px] font-bold uppercase mb-3" style={{ color: 'var(--brass-ink)', letterSpacing: '1.2px' }}>
            {category}
          </h3>
          <ul className="space-y-2.5">
            {items.map((item) => <AmenityItem key={item} label={item} />)}
          </ul>
        </div>
      ))}
    </>
  );
}

export default function AmenitiesSection({ featured, groups, total }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Background scroll is locked in CSS via `html:has(dialog[open])` (globals.css),
  // not from here. Doing it in JS meant tracking every way the sheet can close —
  // ESC, backdrop, the close button — and a missed one left the page unscrollable.
  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  return (
    <>
      {/* ── Below lg: curated highlights, then the control at the BOTTOM ──
          A "show more" trigger answers "is there more below this?", so it has to
          sit after the content it extends. */}
      <div className="lg:hidden space-y-4">
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
          {featured.map((a) => <AmenityItem key={a.id} label={a.label} />)}
        </ul>
        <button
          type="button"
          onClick={open}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl text-sm font-bold"
          style={{
            color: 'var(--maroon)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-medium)',
          }}
        >
          Show all {total} amenities
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* ── lg and up: no truncation. Desktop has no vertical-space problem. ── */}
      <div className="hidden lg:grid grid-cols-2 gap-4">
        <CategoryCards groups={groups} />
      </div>

      {/* ── The sheet (mobile only — the trigger above is lg:hidden) ── */}
      <dialog
        ref={dialogRef}
        aria-labelledby="amenities-dialog-title"
        className="amenity-sheet w-full max-w-lg p-0 rounded-t-3xl sm:rounded-3xl backdrop:bg-black/50"
        style={{ backgroundColor: 'var(--paper)', color: 'var(--ink)' }}
        onClick={(e) => { if (e.target === dialogRef.current) close(); }}
      >
        <div
          className="sticky top-0 flex items-center justify-between px-5 py-4 z-10"
          style={{ backgroundColor: 'var(--paper)', borderBottom: '1px solid var(--border-subtle)' }}
        >
          <h2
            id="amenities-dialog-title"
            className="text-2xl font-bold"
            style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}
          >
            All {total} Amenities
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close amenities"
            className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0"
            style={{ backgroundColor: 'var(--maroon-tint)', color: 'var(--maroon)' }}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 p-5">
          <CategoryCards groups={groups} />
        </div>
      </dialog>
    </>
  );
}
