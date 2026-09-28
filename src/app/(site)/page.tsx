import React from 'react';
import type { Metadata } from 'next';
import { pageMetadata, lodgingJsonLd, faqJsonLd } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import Image from 'next/image';
import GalleryModal from '@/components/guest/GalleryModal';
import BookingWidget from '@/components/guest/BookingWidget';
import AmenitiesSection from '@/components/guest/AmenitiesSection';
import RoomShelf from '@/components/guest/RoomShelf';
import { getProperty, getRooms, getImages, getPricingRules, getAmenities, getFAQs, getNearbyPlaces, closestByCategory, formatDistance } from '@/lib/data';
import { formatTime12 } from '@/lib/format';
import BookNowLink from '@/components/guest/BookNowLink';
import { renderBoldText } from '@/lib/bold';
import { villaRules } from '@/lib/villa-rules';
import {
  ShieldCheck, MapPin, Users, Wifi, Bed,
  Car, Sofa, Trees, BedSingle,
  Sparkles, Phone,
  Clock, ChevronDown, ArrowRight,
} from 'lucide-react';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}

export const metadata: Metadata = pageMetadata({
  title: 'Villa 19 | Private Holiday Villa in Mangalore by Habbaa',
  path: '/',
  description:
    'Villa 19 is a private 4-bedroom holiday villa in Urwa, Mangalore for up to 14 guests: private lawn, balconies, parking and power backup. Book direct, no fees.',
  absoluteTitle: true,
});

export default async function LandingPage() {
  const property = await getProperty();
  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--paper)' }}>
        <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>Property not found. Please check your database setup.</p>
      </div>
    );
  }

  const [rooms, images, pricingRules, amenities, faqs, nearby] = await Promise.all([
    getRooms(property.id),
    getImages(property.id),
    getPricingRules(property.id),
    getAmenities(property.id),
    getFAQs(property.id),
    getNearbyPlaces(property.id),
  ]);
  // The Location card's four tiles. See closestByCategory: nearest-first, one
  // per category, so the airport (22 min) and a beach (15) no longer sit beside
  // a bus stand 100 m away.
  // Function halls are left out: they are listed on The Villa page for wedding
  // guests, and a hall 80 m away would otherwise take a tile here.
  const locationHighlights = closestByCategory(nearby.filter((p) => p.category !== 'function_hall'), 4);

  // Group amenities by category (preserving display_order within each group)
  const amenityGroups = amenities.reduce<Record<string, string[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a.label);
    return acc;
  }, {});

  // Curated highlights. Falls back to the first six only if nothing is flagged,
  // so the section still renders against a database predating the is_featured column.
  const flagged = amenities.filter((a) => a.is_featured);
  const featuredAmenities = flagged.length > 0 ? flagged : amenities.slice(0, 6);

  // No placeholder fallback: a link to a stranger's number is worse than no link.
  const whatsappUrl = property.whatsapp_number
    ? `https://wa.me/${property.whatsapp_number}?text=${encodeURIComponent(`Hi, I'm interested in booking ${property.name}`)}`
    : undefined;
  const phoneNumber = process.env.PROPERTY_PHONE ?? property.whatsapp_number;

  // No pb-20 on the wrapper below: the Footer carries the sticky-bar clearance
  // now, and this wrapper ends before the footer, so the two stacked into
  // ~128px of dead space between the last card and the footer.
  return (
    <div style={{ color: 'var(--ink)' }}>
      <JsonLd data={[
        lodgingJsonLd({ property, images: images.map((i) => i.url), amenities: amenities.map((a) => a.label), telephone: process.env.PROPERTY_PHONE ?? property.whatsapp_number }),
        ...(faqs.length ? [faqJsonLd(faqs)] : []),
      ]} />

      {/* ── Hero ──────────────────────────────────────── */}
      <section id="overview" className="pt-6 sm:pt-8">
        <div className="max-w-[1440px] mx-auto">
          <div className="px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4 sm:mb-5">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-3 sm:mb-5"
                style={{
                  backgroundColor: 'var(--maroon-tint)',
                  border: '1px solid var(--border-brass)',
                  color: 'var(--brass)',
                }}
              >
                <ShieldCheck className="w-4 h-4" aria-hidden="true" /> Direct Property Booking
              </div>
              {/* Lockup: the heading is exactly as wide as the name, and the
                  signature is right-aligned under it, the way the logo pairs
                  them. Width-relative, not pixel offsets, so it holds at any
                  viewport, zoom level or property name. */}
              <h1
                className="flex flex-col items-end w-fit text-4xl sm:text-6xl leading-tight mb-4"
                style={{ fontFamily: 'var(--font-brand)', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--maroon)', textTransform: 'uppercase' }}
              >
                <span className="self-stretch">{property.name}</span>
                {/* The logo's own "by Habbaa" signature, cut from the traced mark
                    so it matches exactly. About half the cap height, so it reads
                    as a signature rather than a second headline. The negative
                    margin tucks it into the empty space below the capitals (they
                    have no descenders). Alt text completes the heading for screen
                    readers and search: "Villa 19 by Habbaa". */}
                <Image
                  src="/by-habbaa.svg"
                  alt=" by Habbaa"
                  width={99}
                  height={34}
                  priority
                  className="block h-[22px] sm:h-[34px] w-auto"
                  style={{ marginTop: '-0.12em' }}
                />
              </h1>
              <p className="text-sm flex items-center gap-1.5" style={{ color: 'var(--ink-muted)' }}>
                <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--brass)' }} aria-hidden="true" />
                <span>{property.address}, {property.city}, {property.state}</span>
              </p>
            </div>
          </div>
          {/* Inset at every width. This was full-bleed below sm, but the badge,
              the h1 and the location line above it are all px-4, so the gallery
              was the only block breaking that margin and it read as a bug rather
              than a deliberate bleed. Edge-to-edge hero imagery works when the
              image is the first thing under the chrome; here it sits mid-flow. */}
          <div className="px-4 sm:px-6 lg:px-8">
            <GalleryModal images={images} />
          </div>
        </div>
      </section>

      {/* ── Main Layout: Content + Widget ─────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-10">

          {/* Highlights bar — gap-px trick: container = border colour, cells = surface */}
          <div
            className="rounded-3xl overflow-hidden shadow-md"
            style={{ backgroundColor: 'var(--border-subtle)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px">
              {[
                { icon: MapPin,    value: 'Centrally Located'       },
                { icon: Bed,       value: '4 Bedrooms'             },
                { icon: Users,     value: 'Upto 14 Guests'         },
                { icon: Car,       value: 'Private Parking'  },
                { icon: Sofa,      value: 'Lounge Area'         },
                { icon: Trees,     value: 'Landscaped Garden'       },
                { icon: Wifi,      value: 'High Speed Internet'        },
                { icon: BedSingle, value: 'Driver Room'   },
              ].map(({ icon: Icon, value }) => (
                <div
                  key={value}
                  className="flex items-center gap-2.5 py-4 px-3 sm:flex-col sm:items-center sm:py-6 sm:px-4 sm:text-center"
                  style={{ backgroundColor: 'var(--surface)' }}
                >
                  <div
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 sm:mb-3"
                    style={{ backgroundColor: 'var(--maroon-tint)' }}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--brass)' }} aria-hidden="true" />
                  </div>
                  <p className="text-sm sm:text-base font-bold leading-snug" style={{ color: 'var(--maroon)' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* About */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--brass)' }}>
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> About the Villa
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>{property.tagline}</h2>
            {property.description?.split(/\n\s*\n/).map((para) => (
            <p key={para.slice(0, 32)} className="leading-relaxed text-base" style={{ color: 'var(--ink-muted)' }}>{renderBoldText(para)}</p>
          ))}
          </div>

          {/* Rooms */}
          <div id="rooms" className="scroll-mt-24 space-y-4">
            <RoomShelf rooms={rooms} />
          </div>

          {/* Amenities from DB */}
          <div id="amenities" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} aria-hidden="true" />
              <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>Property Amenities</h2>
            </div>
            <AmenitiesSection
              featured={featuredAmenities.map((a) => ({ id: a.id, label: a.label }))}
              groups={amenityGroups}
              total={amenities.length}
            />
          </div>

          {/* Location */}
          <div id="location" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} aria-hidden="true" />
              <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>Location</h2>
            </div>
            <div
              className="p-6 rounded-3xl shadow-sm space-y-4"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--brass)' }} aria-hidden="true" />
                <div>
                  <p className="text-base font-semibold">{property.address}</p>
                  <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>{property.city}, {property.state} {property.pincode}</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--ink-faint)' }}>
                    Exact address and directions will be shared after booking confirmation.
                  </p>
                </div>
              </div>
              {/* A pre-rendered map image, not a live embed.
                  The previous iframe pointed at openstreetmap.org/export/embed.html,
                  which now ships MapLibre GL and therefore *requires WebGL* — anyone
                  with WebGL disabled or a blocklisted GPU got a "your browser does not
                  support WebGL" error page instead of a map. Since the embed was already
                  inert (pointer-events: none) to stop it trapping mobile scroll, a live
                  map bought us nothing but that failure mode. A static image renders
                  everywhere, needs no API key in the browser, and paints immediately.
                  Regenerate with scripts/make-map.py if the property ever moves.
                  Deliberately an *area*, not a pin: the exact address is only shared
                  after booking, so this follows the approximate-radius pattern. */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${property.geo_lat},${property.geo_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block w-full h-48 sm:h-56 lg:h-64 rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--border-subtle)', backgroundColor: 'var(--paper-sunk)' }}
                aria-label="Open this location in Google Maps"
              >
                <Image
                  src="/villa-map.jpg"
                  alt={`Map showing the approximate location of the villa in ${property.address}, ${property.city}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 640px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ filter: 'saturate(0.85) contrast(1.02)' }}
                />

                {/* Map data credit — required by the ODbL tile licence. */}
                <span
                  className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] leading-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.82)', color: 'var(--ink-muted)' }}
                >
                  &copy; OpenStreetMap
                </span>

                {/* Approximate-radius disc, brand-tinted */}
                <span
                  className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    width: '38%', aspectRatio: '1',
                    backgroundColor: 'rgba(90,38,38,0.18)',
                    border: '2px solid rgba(90,38,38,0.55)',
                  }}
                  aria-hidden="true"
                />

                <span
                  className="absolute left-3 right-3 bottom-3 flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold shadow-sm"
                  style={{ backgroundColor: 'rgba(255,255,255,0.94)', color: 'var(--maroon)' }}
                >
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--brass)' }} aria-hidden="true" />
                    Approximate area &middot; exact address after booking
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </a>
              {/* Two columns on mobile with the value stacked under the place —
                  four rows of one become two rows of two, and no place name
                  has to be truncated to fit beside its distance. */}
              <div className="grid grid-cols-2 gap-2 text-sm lg:text-[15px]">
                {/* Walking distances lead: 100 m to the main road is the most
                    persuasive thing about the location, and these were hardcoded
                    guesses ("Walking distance", "City Centre 3.7 km") until the
                    operator supplied the real figures. Now read from the DB. */}
                {locationHighlights.map((p) => [p.name, formatDistance(p)] as const).map(([place, time]) => (
                  <div
                    key={place}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 p-2.5 rounded-xl"
                    style={{ backgroundColor: 'var(--paper-sunk)', border: '1px solid var(--border-subtle)' }}
                  >
                    <span className="text-xs sm:text-sm leading-tight sm:truncate" style={{ color: 'var(--ink-muted)' }}>{place}</span>
                    <span className="font-semibold text-[13px] sm:text-sm leading-tight sm:flex-shrink-0">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reviews placeholder */}
          <div id="reviews" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} aria-hidden="true" />
              <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>Guest Reviews</h2>
            </div>
            <div
              className="p-6 rounded-2xl shadow-sm text-center space-y-3"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
            >
              <p className="text-base" style={{ color: 'var(--ink)' }}>
                We are gathering our first verified reviews. In the meantime,{' '}
                <a href={whatsappUrl ?? '/contact'} className="font-semibold underline underline-offset-2" style={{ color: 'var(--brass)' }}>
                  {whatsappUrl ? 'message us on WhatsApp' : 'get in touch'}
                </a>{' '}
                and we will be happy to connect you with past guests.
              </p>
            </div>
          </div>

          {/* Cancellation Policy — heading sits above the card, matching Guest
              Reviews and every other section. The card itself is the disclosure. */}
          <div id="cancellation" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} aria-hidden="true" />
              <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>Cancellation Policy</h2>
            </div>
            {/* The collapsed one-liner lives inside <summary>: a closed <details>
                renders nothing but its summary, so anything after it would vanish. */}
            {/* The refund tiers ARE the policy, so they live in the collapsed
                state. Previously the summary paraphrased the same three numbers
                the expanded panel then repeated, so opening the card added colour
                but no information and the chevron read as decoration. Now the
                disclosure holds only what the summary genuinely omits: deposit
                timing, refund method, inspection terms. */}
            <div
              className="p-5 sm:p-6 rounded-3xl shadow-sm"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
            >
              {/* One "refund" instead of three: the word belonged to the card, not
                  to each tile, where it was repeated under a heading that already
                  said Cancellation Policy. */}
              <p className="text-sm lg:text-[16px] font-semibold mb-3" style={{ color: 'var(--ink)' }}>
                Refund if you cancel
              </p>

              {/* Label above value, matching the Villa Rules tiles directly below:
                  the two cards carry the same kind of content and previously used
                  opposite structures. The window is also what a guest scans for
                  first ("which bucket am I in?"), so it leads.
                  Boundaries are exclusive — "30 or more" and "15 to 30" both used
                  to claim day 30, so a guest cancelling exactly 30 days out could
                  read either 90% or 50%. Day 30 pays 90%. */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { color: 'var(--ok)',    bg: 'rgba(46,125,91,0.07)',  border: 'rgba(46,125,91,0.22)',
                    when: '30 or more days before', amount: '90%' },
                  { color: 'var(--warn)',  bg: 'rgba(169,112,26,0.07)', border: 'rgba(169,112,26,0.22)',
                    when: '15 to 29 days before',   amount: '50%' },
                  { color: 'var(--ink-muted)', bg: 'var(--paper-sunk)', border: 'var(--border-subtle)',
                    when: 'Under 15 days before',   amount: '0%'  },
                ].map(({ color, bg, border, when, amount }) => (
                  <div
                    key={when}
                    className="p-4 rounded-2xl text-center"
                    style={{ backgroundColor: bg, border: `1px solid ${border}` }}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[1px]" style={{ color: 'var(--ink-muted)' }}>
                      {when} check-in
                    </p>
                    <p className="text-xl lg:text-2xl font-black mt-1.5 leading-none" style={{ color }}>
                      {amount}
                    </p>
                  </div>
                ))}
              </div>

              <details className="group mt-4 text-center">
                <summary
                  className="cursor-pointer list-none select-none inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm lg:text-[15px] font-semibold transition-colors hover:bg-[var(--paper-sunk)]"
                  style={{ color: 'var(--maroon)', border: '1px solid var(--border-medium)' }}
                >
                  Deposit and refund terms
                  <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" aria-hidden="true" />
                </summary>
                <p className="text-sm lg:text-[15px] pt-3 leading-relaxed text-left" style={{ color: 'var(--ink-muted)' }}>
                  A security deposit, where applicable, will be collected at check-in. Subject to property inspection following check-out, the refundable deposit will be processed within 5 working days and returned to the original payment method.
                </p>
              </details>
            </div>
          </div>

          {/* Villa Rules — heading above the card, same as every other section. */}
          <div id="policies" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} aria-hidden="true" />
              <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>Villa Rules</h2>
            </div>
            {/* The four most-asked facts are always visible as labelled values;
                the disclosure carries only the rules those four do not already
                answer, so opening it earns its click. */}
            <div
              className="p-5 sm:p-6 rounded-3xl shadow-sm"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  ['Check-in',    `From ${formatTime12(property.check_in_time)}`],
                  ['Check-out',   `By ${formatTime12(property.check_out_time)}`],
                  ['Quiet hours', '10 PM to 7 AM'],
                  ['Ideal For',  `${property.ideal_occupancy}-${property.max_occupancy} Guests`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="p-3.5 rounded-2xl text-center"
                    style={{ backgroundColor: 'var(--paper-sunk)', border: '1px solid var(--border-subtle)' }}
                  >
                    {/* --ink-faint measured 2.71:1 on --paper-sunk at 11px, well
                        under the 4.5:1 AA floor. --ink-muted is 5.41:1. */}
                    <p className="text-[11px] font-bold uppercase tracking-[1px]" style={{ color: 'var(--ink-muted)' }}>
                      {label}
                    </p>
                    <p className="text-base lg:text-[17px] font-bold mt-1" style={{ color: 'var(--ink)' }}>{value}</p>
                  </div>
                ))}
              </div>

              <details className="group mt-4 text-center">
                <summary
                  className="cursor-pointer list-none select-none inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm lg:text-[15px] font-semibold transition-colors hover:bg-[var(--paper-sunk)]"
                  style={{ color: 'var(--maroon)', border: '1px solid var(--border-medium)' }}
                >
                  All villa rules
                  <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" aria-hidden="true" />
                </summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm lg:text-[15px] pt-3 text-left">
                  {/* Quiet hours is already a tile above. */}
                  {villaRules(property).filter((r) => !r.title.startsWith('Quiet hours')).map((rule) => (
                    <div
                      key={rule.title}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl"
                      style={{ backgroundColor: 'var(--paper-sunk)', border: '1px solid var(--border-subtle)', color: 'var(--ink-muted)' }}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: 'var(--brass)' }} aria-hidden="true" />
                      <span><strong style={{ color: 'var(--ink)' }}>{rule.title}:</strong> {rule.body}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>

          {/* FAQ from DB. The full list lives here: the Stay Guide no longer repeats it. */}
          <div id="faq" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} aria-hidden="true" />
              <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>Frequently Asked Questions</h2>
            </div>
            <div className="space-y-2">
              {faqs.map((faq) => (
                <details
                  key={faq.id}
                  className="rounded-2xl shadow-sm group"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <summary
                    className="flex items-center justify-between p-5 cursor-pointer list-none font-semibold text-base select-none"
                    style={{ color: 'var(--ink)' }}
                  >
                    {faq.question}
                    <ChevronDown className="w-4 h-4 flex-shrink-0 group-open:rotate-180 transition-transform" style={{ color: 'var(--ink-muted)' }} aria-hidden="true" />
                  </summary>
                  <p
                    className="px-5 pb-5 text-base leading-relaxed pt-4"
                    style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--ink-muted)' }}
                  >
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>

          {/* Contact strip */}
          <div
            className="p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
          >
            <div>
              <p className="text-base font-bold">Planning Your Stay?</p>
              <p className="text-base mt-0.5" style={{ color: 'var(--ink-muted)' }}>We usually reply on WhatsApp within an hour during the day.</p>
            </div>
            <div className="flex items-center gap-3">
              {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-wa-ghost flex items-center gap-2 px-4 py-2.5 rounded-xl"
              >
                <WhatsAppIcon className="w-4 h-4" /> WhatsApp
              </a>
              )}
              {phoneNumber && (
              <a
                href={`tel:+${phoneNumber}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-colors hover:border-[var(--brass)] hover:text-[var(--ink)] active:scale-95"
                style={{
                  backgroundColor: 'var(--paper-sunk)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--ink-muted)',
                  /* Matches .btn-wa-ghost beside it, which is the design system's
                     button type: 13.5px uppercase tracked. This was 14px sentence
                     case, so the pair disagreed on size, casing and height. Only
                     the type is aligned; the neutral colour role is unchanged. */
                  fontSize: 'var(--text-ui)',
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                }}
              >
                <Phone className="w-4 h-4" aria-hidden="true" /> Call Us
              </a>
              )}
            </div>
          </div>

        </div>

        {/* Right column: sticky booking widget */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <BookingWidget property={property} pricingRules={pricingRules} />
            <div
              className="mt-4 p-4 rounded-2xl shadow-sm space-y-2 text-sm"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--ink-muted)',
              }}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--brass)' }} aria-hidden="true" />
                <span>Check-in from <strong style={{ color: 'var(--ink)' }}>{formatTime12(property.check_in_time)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--brass)' }} aria-hidden="true" />
                <span>Check-out by <strong style={{ color: 'var(--ink)' }}>{formatTime12(property.check_out_time)}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mobile sticky booking bar ─────────────────── */}
      <div id="mobile-cta-bar" className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-3 px-4 py-3">
          {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
            style={{ backgroundColor: 'rgba(37,211,102,0.1)', color: 'var(--wa-on-light)', border: '1px solid rgba(37,211,102,0.3)' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
          )}
          <BookNowLink
            className="flex-1 flex items-center justify-center py-3 rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: 'var(--maroon)' }}
          >
            Book Now
          </BookNowLink>
        </div>
      </div>

    </div>
  );
}
