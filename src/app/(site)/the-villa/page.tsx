import React from 'react';
import type { Metadata } from 'next';
import { pageMetadata, breadcrumbJsonLd, lodgingJsonLd } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import {
  MapPin, Users, Wifi, Car, Bed,
  Sofa, Trees, BedSingle,
} from 'lucide-react';
import { getProperty, getAmenities, getNearbyPlaces, getImages, formatDistance } from '@/lib/data';
import { renderBoldText } from '@/lib/bold';
import CtaButtons from '@/components/guest/CtaButtons';

export const metadata: Metadata = pageMetadata({
  title: 'Private 4-Bedroom Villa in Mangalore',
  path: '/the-villa',
  description:
    'Explore Villa 19, a private 4-bedroom villa in Urwa, Mangalore: the spaces at a glance, the location and nearby places. Book directly.',
});

const CATEGORY_ICON: Record<string, string> = {
  function_hall: '🎉',
  beach: '🏖️',
  temple: '🛕',
  food: '🍽️',
  shopping: '🛍️',
  transport: '🚌',
  attraction: '🏛️',
};

/** Categories whose key does not read as a heading on its own. */
const CATEGORY_LABEL: Record<string, string> = {
  function_hall: 'Function Halls',
};

export default async function TheVillaPage() {
  const property = await getProperty();
  if (!property) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-base" style={{ color: 'var(--ink-muted)' }}>Property data unavailable.</p>
      </div>
    );
  }

  // Amenities are no longer listed on this page (they are on the home page) but
  // still feed the structured data.
  const [amenities, nearbyPlaces, images] = await Promise.all([
    getAmenities(property.id),
    getNearbyPlaces(property.id),
    getImages(property.id),
  ]);

  const nearbyGroups = nearbyPlaces.reduce<Record<string, typeof nearbyPlaces>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  const highlights = [
    { icon: MapPin,    label: 'Location',   value: 'Centrally Located'      },
    { icon: Bed,       label: 'Bedrooms',   value: '4 Bedrooms'            },
    { icon: Users,     label: 'Capacity',   value: 'Upto 14 Guests'        },
    { icon: Car,       label: 'Parking',    value: 'Private Parking' },
    { icon: Sofa,      label: 'Lounge',     value: 'Lounge Area'        },
    { icon: Trees,     label: 'Outdoors',   value: 'Landscaped Garden'      },
    { icon: Wifi,      label: 'Internet',   value: 'High Speed Internet'       },
    { icon: BedSingle, label: 'Staff',      value: 'Driver Room'  },
  ];

  return (
    <div className="pb-0" style={{ color: 'var(--ink)' }}>
      <JsonLd data={[breadcrumbJsonLd([{ name: 'The Villa', path: '/the-villa' }]), lodgingJsonLd({ property, images: images.map((i) => i.url), amenities: amenities.map((a) => a.label), telephone: process.env.PROPERTY_PHONE ?? property.whatsapp_number })]} />

      {/* ── Page Hero ─────────────────────────────────────── */}
      <section
        className="py-12 sm:py-16"
        style={{
          backgroundColor: 'var(--paper-sunk)',
          color: 'var(--ink)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="eyebrow-hero mb-4">
            Urwa, Mangalore, Karnataka
          </p>
          <h1
            className="text-5xl sm:text-6xl font-bold mb-5"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}
          >
            The Villa
          </h1>
          <p className="text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto text-[var(--ink-muted)]">
            {property.tagline}
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* ── Description ──────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} />
            <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>About the Villa</h2>
          </div>
          {property.description?.split(/\n\s*\n/).map((para) => (
            <p key={para.slice(0, 32)} className="leading-relaxed text-base" style={{ color: 'var(--ink-muted)' }}>{renderBoldText(para)}</p>
          ))}
        </section>

        {/* ── Quick Highlights ─────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} />
            <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>At a Glance</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {highlights.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="p-5 rounded-2xl text-center shadow-sm"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: 'var(--maroon-tint)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: 'var(--brass)' }} aria-hidden="true" />
                </div>
                <p className="text-[11px] font-bold uppercase" style={{ color: 'var(--ink-muted)', letterSpacing: '1.2px' }}>{label}</p>
                <p className="text-sm font-bold mt-1" style={{ color: 'var(--maroon)' }}>{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Location & Nearby ────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} />
            <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>Location & Nearby</h2>
          </div>

          {/* Address card */}
          <div
            className="p-5 rounded-2xl flex items-start gap-3"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
          >
            <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--brass)' }} />
            <div>
              <p className="font-semibold text-sm">{property.address}</p>
              <p className="text-base" style={{ color: 'var(--ink-muted)' }}>{property.city}, {property.state} {property.pincode}</p>
              <a
                href={`https://maps.google.com/?q=${property.geo_lat},${property.geo_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs mt-1 inline-block hover:underline"
                style={{ color: 'var(--brass-ink)' }}
              >
                View on Google Maps →
              </a>
            </div>
          </div>

          {/* Nearby by category */}
          {Object.entries(nearbyGroups).map(([category, places]) => (
            <div key={category}>
              <p className="text-xs font-bold uppercase mb-2 flex items-center gap-1.5" style={{ color: 'var(--ink-muted)', letterSpacing: '1.2px' }}>
                <span aria-hidden="true">{CATEGORY_ICON[category] ?? '📍'}</span> {CATEGORY_LABEL[category] ?? category}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {places.map((place) => (
                  <div
                    key={place.id}
                    className="p-3.5 rounded-xl flex items-center justify-between gap-2"
                    style={{ backgroundColor: 'var(--paper-sunk)', border: '1px solid var(--border-subtle)' }}
                  >
                    <span className="text-sm font-medium" style={{ color: 'var(--ink-muted)' }}>{place.name}</span>
                    <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'var(--brass-ink)' }}>
                      {/* Shared helper, not a local template: this printed
                          "0.10 km" for the walkable landmarks. */}
                      {formatDistance(place) ?? (place.travel_minutes ? `${place.travel_minutes} min` : '')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* ── CTA ──────────────────────────────────────────── */}
        <section
          className="p-8 sm:p-10 rounded-3xl text-center space-y-4"
          style={{ backgroundColor: 'var(--maroon-deep)', color: 'white' }}
        >
          <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Ready to book your stay?
          </h2>
          <p className="text-white/70 text-sm">Direct booking. No platform fees, instant confirmation.</p>
          <CtaButtons />
        </section>

      </div>
    </div>
  );
}
