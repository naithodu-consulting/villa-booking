import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MapPin, Users, Wifi, Car, Zap, Home,
  Waves, ShieldCheck, Check, Bed,
} from 'lucide-react';
import { getProperty, getAmenities, getPolicies, getNearbyPlaces } from '@/lib/data';

export const metadata: Metadata = {
  title: 'The Villa',
  description:
    'Explore Villa 19: a premium 4-bedroom private retreat in Urwa, Mangalore. Full amenity list, house rules, and everything you need to know before booking.',
  openGraph: {
    title: 'The Villa | Villa 19 by Habbaa',
    description: 'A premium 4-bedroom private villa in Urwa, Mangalore. Lush lawn, high-speed WiFi, sleeps 12. Everything you need to know.',
    url: 'https://habbaa.in/the-villa',
  },
  twitter: {
    title: 'The Villa | Villa 19 by Habbaa',
    description: 'A premium 4-bedroom private villa in Urwa, Mangalore. Lush lawn, high-speed WiFi, sleeps 12.',
  },
};

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

  const [amenities, policies, nearbyPlaces] = await Promise.all([
    getAmenities(property.id),
    getPolicies(property.id),
    getNearbyPlaces(property.id),
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

  const highlights = [
    { icon: Bed,        label: 'Bedrooms',      value: '4 Bedrooms' },
    { icon: Users,      label: 'Capacity',       value: `Up to ${property.max_occupancy} Guests` },
    { icon: Waves,      label: 'Beach',          value: '1.5 km' },
    { icon: Wifi,       label: 'Internet',       value: 'High-Speed WiFi' },
    { icon: Car,        label: 'Parking',        value: 'Ample Parking' },
    { icon: Zap,        label: 'Power',          value: 'Power Backup' },
    { icon: Home,       label: 'Outdoors',       value: 'Lawn & Balconies' },
    { icon: ShieldCheck, label: 'Booking',       value: 'Direct · No Fees' },
  ];

  return (
    <div className="pb-20 md:pb-0" style={{ color: 'var(--ink)' }}>

      {/* ── Page Hero ─────────────────────────────────────── */}
      <section
        className="py-16 sm:py-20"
        style={{ backgroundColor: 'var(--maroon)', color: 'white' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--brass-light)' }}>
            Urwa, Mangalore, Karnataka
          </p>
          <h1
            className="text-5xl sm:text-6xl font-bold italic mb-5"
            style={{ fontFamily: 'var(--font-display)', color: 'white' }}
          >
            {property.name}
          </h1>
          <p className="text-lg sm:text-xl text-white/75 leading-relaxed max-w-2xl mx-auto mb-8">
            {property.tagline}
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base transition-all"
            style={{ backgroundColor: 'var(--brass)', color: 'white' }}
          >
            Check Availability
          </Link>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* ── Description ──────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} />
            <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>About the Villa</h2>
          </div>
          <p className="leading-relaxed text-base" style={{ color: 'var(--ink-muted)' }}>{property.description}</p>
        </section>

        {/* ── Quick Highlights ─────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} />
            <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>At a Glance</h2>
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
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-faint)' }}>{label}</p>
                <p className="text-sm font-bold mt-1" style={{ color: 'var(--maroon)' }}>{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Amenities ────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} />
            <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>Property Amenities</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(amenityGroups).map(([category, items]) => (
              <div
                key={category}
                className="p-5 rounded-2xl shadow-sm"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
              >
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--brass)' }}>{category}</h3>
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

        {/* ── House Rules / Policies ───────────────────────── */}
        {policies.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} />
              <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>House Rules</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {policies.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--brass)' }}>{p.title}</p>
                  <p className="text-base" style={{ color: 'var(--ink-muted)' }}>{p.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Location & Nearby ────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} />
            <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>Location & Nearby</h2>
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
                style={{ color: 'var(--brass)' }}
              >
                View on Google Maps →
              </a>
            </div>
          </div>

          {/* Nearby by category */}
          {Object.entries(nearbyGroups).map(([category, places]) => (
            <div key={category}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--ink-faint)' }}>
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
                    <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'var(--brass)' }}>
                      {place.distance_km != null ? `${place.distance_km} km` : place.travel_minutes ? `${place.travel_minutes} min` : ''}
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
          style={{ backgroundColor: 'var(--maroon)', color: 'white' }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold italic" style={{ fontFamily: 'var(--font-display)' }}>
            Ready to book your stay?
          </h2>
          <p className="text-white/70 text-sm">Direct booking. No platform fees, instant confirmation.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
            <Link
              href="/book"
              className="px-8 py-3.5 rounded-xl font-bold text-base transition-all"
              style={{ backgroundColor: 'var(--brass)', color: 'white' }}
            >
              Check Availability
            </Link>
            <Link
              href="/"
              className="px-6 py-3.5 rounded-xl font-bold text-base transition-all" style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}
            >
              Back to Overview
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
