import React from 'react';
import type { Metadata } from 'next';
import { pageMetadata, breadcrumbJsonLd } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import { Bed, Bath, Wind, Check, Building, Maximize } from 'lucide-react';
import Image from 'next/image';
import { getProperty, getRooms, getImages } from '@/lib/data';
import CtaButtons from '@/components/guest/CtaButtons';
import PageHero from '@/components/layout/PageHero';

export const metadata: Metadata = pageMetadata({
  title: 'Rooms: Bedrooms, Beds & Capacity',
  path: '/rooms',
  description:
    'Four bedrooms, a private lounge and 3 bathrooms at Villa 19, Mangalore, comfortably accommodating 8 guests and sleeping up to 14. See bed types, floor, size and capacity for each room before you book the whole villa.',
});

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

  const [rooms, images] = await Promise.all([getRooms(property.id), getImages(property.id)]);
  // First linked photo per room (property_images.room_id, 00047).
  const roomPhoto = new Map<string, (typeof images)[number]>();
  for (const img of images) if (img.room_id && !roomPhoto.has(img.room_id)) roomPhoto.set(img.room_id, img);
  // The lounge sleeps 2 on sofa-cum-beds but is not a bedroom, so the
  // headline counts must exclude it or the page overstates the layout.
  const bedroomCount = rooms.filter((r) => r.room_type !== 'Lounge').length;

  return (
    <div className="pb-0" style={{ color: 'var(--ink)' }}>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Rooms', path: '/rooms' }])} />

      {/* ── Page Hero ── */}
      <PageHero title="Rooms" intro={<>{bedroomCount} bedrooms, a private lounge and {property.bathroom_count} bathrooms, comfortably accommodating {property.ideal_occupancy} guests and sleeping up to {property.max_occupancy}. Thoughtfully designed for comfort, privacy and time together.</>} />

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
                {/* The room's own photo; the bed icon stands in until one is
                    linked. The frame is 3:2, like every room photograph in the
                    shoot, so the photo fills it with nothing cropped and no
                    empty margin. */}
                {roomPhoto.get(room.id) ? (
                  <div className="relative w-full" style={{ aspectRatio: '3 / 2', backgroundColor: 'var(--paper-sunk)' }}>
                    <Image
                      src={roomPhoto.get(room.id)!.url}
                      alt={roomPhoto.get(room.id)!.alt_text}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      style={{ objectFit: 'cover' }}
                      priority={idx < 2}
                    />
                  </div>
                ) : (
                  <div
                    className="w-full h-48 flex items-center justify-center"
                    style={{ backgroundColor: 'var(--paper-sunk)' }}
                  >
                    <div className="text-center space-y-2">
                      <Bed className="w-10 h-10 mx-auto" style={{ color: 'var(--border-brass)' }} aria-hidden="true" />
                      <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>{room.name}</p>
                    </div>
                  </div>
                )}

                <div className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase block mb-1" style={{ color: 'var(--brass-ink)', letterSpacing: '1.2px' }}>
                        {room.room_type}
                      </span>
                      <h2 className="text-xl font-bold" style={{ color: 'var(--maroon)' }}>
                        {room.name}
                      </h2>
                    </div>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: 'var(--maroon-tint)', color: 'var(--maroon-deep)' }}
                    >
                      Max {room.max_guests} Guests
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

                    {room.floor && (
                      <div
                        className="flex items-center gap-2 p-2.5 rounded-xl"
                        style={{ backgroundColor: 'var(--paper-sunk)' }}
                      >
                        <Building className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--brass)' }} aria-hidden="true" />
                        <span style={{ color: 'var(--ink-muted)' }}>{room.floor}</span>
                      </div>
                    )}

                    {room.size_sqft && (
                      <div
                        className="flex items-center gap-2 p-2.5 rounded-xl"
                        style={{ backgroundColor: 'var(--paper-sunk)' }}
                      >
                        <Maximize className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--brass)' }} aria-hidden="true" />
                        <span style={{ color: 'var(--ink-muted)' }}>{room.size_sqft} sq ft</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div
                    className="pt-4 text-xs space-y-2"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}
                  >
                    {/* Only the attached bath is named per room; a "shared
                        bathroom" line on every other card would just repeat. */}
                    {room.has_ensuite_bathroom && (
                      <div className="flex items-center gap-2" style={{ color: 'var(--ink-muted)' }}>
                        <Bath className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="font-semibold">Attached Bathroom</span>
                      </div>
                    )}
                    {/* From rooms.has_ac: the Private Lounge is not air-conditioned (00041). */}
                    {room.has_ac && (
                      <div className="flex items-center gap-2" style={{ color: 'var(--ink-muted)' }}>
                        <Wind className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Air-conditioned</span>
                      </div>
                    )}
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

        {/* ── CTA ──────────────────────────────────────────── */}
        <section
          className="p-8 rounded-3xl text-center space-y-4"
          style={{ backgroundColor: 'var(--maroon-deep)', color: 'white' }}
        >
          <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Book {property.name}
          </h2>
          <p className="text-white/70 text-sm">
            Enjoy the entire villa exclusively for your group, with {bedroomCount} bedrooms, a private lounge and space for up to {property.max_occupancy} guests.
          </p>
          <CtaButtons />
        </section>

      </div>
    </div>
  );
}
