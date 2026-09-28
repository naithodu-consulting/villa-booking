import React from 'react';
import type { Metadata } from 'next';
import { pageMetadata, breadcrumbJsonLd, lodgingJsonLd } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import Link from 'next/link';
import {
  MapPin, Users, Wifi, Car, Home,
  ShieldCheck, Check, Bed,
  Sofa, Trees, BedSingle,
} from 'lucide-react';
import { getProperty, getAmenities, getPolicies, getNearbyPlaces, getImages, nearestPlace, formatDistance } from '@/lib/data';
import BookNowLink from '@/components/guest/BookNowLink';
import { renderBoldText } from '@/lib/bold';

export const metadata: Metadata = pageMetadata({
  title: 'Private 4-Bedroom Villa in Mangalore',
  path: '/the-villa',
  description:
    'Explore Villa 19, a private 4-bedroom villa in Urwa, Mangalore: amenities, house rules, nearby places and everything to know before you book directly.',
});

/** What the villa does not have. Shared with the structured data on this page. */
const GOOD_TO_KNOW = (beachKm?: number) => [
  { title: 'No swimming pool', body: 'The outdoor space is a private lawn with balconies on every floor.' },
  { title: 'Self-catering', body: 'There is no in-house cook. The fully equipped kitchen is yours to use, and the local market is a short walk away.' },
  {
    title: 'Not on the beach',
    body: beachKm
      ? `The villa is in a quiet residential area. The nearest beach is about ${Number(beachKm)} km away by car.`
      : 'The villa is in a quiet residential area, a short drive from the nearest beach.',
  },
  { title: 'Pets are not entertained', body: 'Pets are not entertained at the villa.' },
];

const CATEGORY_ICON: Record<string, string> = {
  beach: '🏖️',
  temple: '🛕',
  food: '🍽️',
  shopping: '🛍️',
  transport: '🚌',
  attraction: '🏛️',
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

  const [amenities, policies, nearbyPlaces, images] = await Promise.all([
    getAmenities(property.id),
    getPolicies(property.id),
    getNearbyPlaces(property.id),
    getImages(property.id),
  ]);

  const amenityGroups = amenities.reduce<Record<string, string[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a.label);
    return acc;
  }, {});

  const nearbyGroups = nearbyPlaces.reduce<Record<string, typeof nearbyPlaces>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  const nearestBeach = nearestPlace(nearbyPlaces, 'beach');

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
            style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)', textTransform: 'uppercase' }}
          >
            {property.name}
          </h1>
          <p className="text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-8 text-[var(--ink-muted)]">
            {property.tagline}
          </p>
          <BookNowLink
            className="btn-brass-filled inline-flex items-center gap-2 px-8 py-3.5 rounded-xl"
          >
            Check Availability
          </BookNowLink>
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

        {/* ── Amenities ────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} />
            <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>Property Amenities</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(amenityGroups).map(([category, items]) => (
              <div
                key={category}
                className="p-5 rounded-2xl shadow-sm"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
              >
                <h3 className="text-sm font-bold uppercase mb-3" style={{ color: 'var(--brass-ink)', letterSpacing: '1.2px' }}>{category}</h3>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="text-sm flex items-center gap-2.5" style={{ color: 'var(--ink-muted)' }}>
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'var(--maroon-tint)' }}
                      >
                        <Check className="w-3 h-3" style={{ color: 'var(--brass)' }} aria-hidden="true" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── Villa Rules / Policies ───────────────────────── */}
        {policies.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} />
              <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>Villa Rules</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {policies.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <p className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--brass-ink)', letterSpacing: '1.2px' }}>{p.title}</p>
                  <p className="text-base" style={{ color: 'var(--ink-muted)' }}>{p.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Good to know ─────────────────────────────────── */}
        {/* Stated plainly because guests (and AI assistants) tend to assume a
            private villa has a pool and staff. Wrong assumptions become bad reviews. */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} />
            <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>Good to Know</h2>
          </div>
          <ul
            className="p-5 rounded-2xl space-y-3 text-base"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)', color: 'var(--ink-muted)' }}
          >
            {GOOD_TO_KNOW(nearestBeach?.distance_km).map(({ title, body }) => (
              <li key={title}>
                <strong style={{ color: 'var(--ink)' }}>{title}.</strong> {body}
              </li>
            ))}
          </ul>
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
                <span>{CATEGORY_ICON[category] ?? '📍'}</span> {category}
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
          <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
            <BookNowLink
              className="btn-brass-filled px-8 py-3.5 rounded-xl"
            >
              Check Availability
            </BookNowLink>
            <Link
              href="/"
              className="btn-frosted px-6 py-3.5 rounded-xl"
            >
              Back to Overview
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
