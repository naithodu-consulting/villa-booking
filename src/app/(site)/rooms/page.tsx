import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Users, Bed, Bath, Wind, Check } from 'lucide-react';
import { getProperty, getRooms } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Rooms',
  description:
    'Four well-appointed bedrooms at Villa 19, Mangalore. Each room detailed with bed type, capacity, and bathroom info.',
  openGraph: {
    title: 'Rooms | Villa 19 by Habbaa',
    description: '4 bedrooms sleeping up to 12 guests. Master suite, luxury bedrooms, each with bed type, capacity and bathroom details.',
    url: 'https://habbaa.in/rooms',
  },
  twitter: {
    title: 'Rooms | Villa 19 by Habbaa',
    description: '4 bedrooms sleeping up to 12 guests at Villa 19, Mangalore.',
  },
};

const BED_TYPE_LABEL: Record<string, string> = {
  'King':   'King Bed',
  'Queen':  'Queen Bed',
  'Twin':   'Twin Beds',
  'Double': 'Double Bed',
  'Bunk':   'Bunk Bed',
};

export default async function RoomsPage() {
  const property = await getProperty();
  if (!property) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-base" style={{ color: 'var(--ink-muted)' }}>Property data unavailable.</p>
      </div>
    );
  }

  const rooms = await getRooms(property.id);

  return (
    <div className="pb-20 md:pb-0" style={{ color: 'var(--ink)' }}>

      {/* ── Page Hero ─────────────────────────────────────── */}
      <section
        className="py-16 sm:py-20"
        style={{ backgroundColor: 'var(--maroon)', color: 'white' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--brass-light)' }}>
            Sleeping Arrangements
          </p>
          <h1
            className="text-5xl sm:text-6xl font-bold italic mb-5"
            style={{ fontFamily: 'var(--font-display)', color: 'white' }}
          >
            Rooms
          </h1>
          <p className="text-lg text-white/75 leading-relaxed">
            {rooms.length} bedrooms sleeping up to {property.max_occupancy} guests. Each space thoughtfully appointed for comfort and privacy.
          </p>
        </div>
      </section>

      {/* ── Room Cards ────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        <section className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {rooms.map((room, idx) => (
              <div
                key={room.id}
                className="rounded-3xl shadow-sm overflow-hidden"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
              >
                {/* Room image placeholder */}
                <div
                  className="w-full h-48 flex items-center justify-center"
                  style={{ backgroundColor: 'var(--paper-sunk)' }}
                >
                  <div className="text-center space-y-2">
                    <Bed className="w-10 h-10 mx-auto" style={{ color: 'var(--border-brass)' }} aria-hidden="true" />
                    <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>Room {idx + 1}</p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--brass)' }}>
                        {room.room_type}
                      </span>
                      <h2 className="text-lg font-bold" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
                        {room.name}
                      </h2>
                    </div>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: 'var(--maroon-tint)', color: 'var(--maroon-deep)' }}
                    >
                      {room.max_guests} Guests
                    </span>
                  </div>

                  {/* Room specs */}
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div
                      className="flex items-center gap-2 p-2.5 rounded-xl"
                      style={{ backgroundColor: 'var(--paper-sunk)' }}
                    >
                      <Bed className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--brass)' }} aria-hidden="true" />
                      <span style={{ color: 'var(--ink-muted)' }}>
                        {room.bed_count}× {BED_TYPE_LABEL[room.bed_type] ?? room.bed_type}
                      </span>
                    </div>

                  </div>

                  {/* Features */}
                  <div
                    className="pt-4 text-xs space-y-2"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}
                  >
                    {room.has_ensuite_bathroom && (
                      <div className="flex items-center gap-2" style={{ color: 'var(--ok)' }}>
                        <Bath className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="font-semibold">Private Ensuite Bathroom</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2" style={{ color: 'var(--ink-muted)' }}>
                      <Wind className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Air-conditioned</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: 'var(--ink-muted)' }}>
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Fresh linens & towels provided</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Shared Facilities ────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} />
            <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
              Shared Facilities
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Guest Bathrooms',  body: 'Additional guest bathrooms are available in the common areas of the villa.' },
              { title: 'Living Areas',     body: 'Spacious living and dining areas shared across all guests.' },
              { title: 'Outdoor Spaces',   body: 'Lawn, balconies, and outdoor seating available to all guests.' },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="p-5 rounded-2xl"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
              >
                <p className="text-sm font-bold mb-1.5" style={{ color: 'var(--maroon)' }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────── */}
        <section
          className="p-8 rounded-3xl text-center space-y-4"
          style={{ backgroundColor: 'var(--maroon)', color: 'white' }}
        >
          <h2 className="text-2xl font-bold italic" style={{ fontFamily: 'var(--font-display)' }}>
            Book the entire villa
          </h2>
          <p className="text-white/70 text-sm">
            Villa 19 is rented exclusively: all {rooms.length} bedrooms, for up to {property.max_occupancy} guests.
          </p>
          <Link
            href="/book"
            className="inline-block px-8 py-3.5 rounded-xl font-bold text-base mt-2 transition-all"
            style={{ backgroundColor: 'var(--brass)', color: 'white' }}
          >
            Check Availability & Rates
          </Link>
        </section>

      </div>
    </div>
  );
}
