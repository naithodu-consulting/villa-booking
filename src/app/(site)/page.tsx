import React from 'react';
import type { Metadata } from 'next';
import GalleryModal from '@/components/guest/GalleryModal';
import BookingWidget from '@/components/guest/BookingWidget';
import { getProperty, getRooms, getImages, getPricingRules, getAmenities, getFAQs } from '@/lib/data';
import {
  ShieldCheck, MapPin, Users, Wifi, Waves, Home,
  Check, Sparkles, Phone,
  Clock, XCircle, AlertTriangle, ChevronDown,
} from 'lucide-react';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}

export const metadata: Metadata = {
  title: 'Villa 19 | Private Villa in Urwa, Mangalore',
  description:
    'Book a premium 4-bedroom private villa in Urwa, Mangalore, Karnataka. Lush lawns, private balconies, ample parking, beach 1.5 km away. Hosts up to 12 guests. Direct booking with no platform fees.',
  openGraph: {
    title: 'Villa 19 | Private Villa in Urwa, Mangalore',
    description: 'Premium 4-bedroom villa in Urwa, Mangalore. Sleeps 12. Lawn, WiFi, parking, beach 1.5 km. Direct booking at the best rate.',
    url: 'https://habbaa.in',
  },
  twitter: {
    title: 'Villa 19 | Private Villa in Mangalore',
    description: 'Premium 4-bedroom private villa in Urwa, Mangalore. Sleeps 12. Direct booking.',
  },
};

export default async function LandingPage() {
  const property = await getProperty();
  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--paper)' }}>
        <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>Property not found. Please check your database setup.</p>
      </div>
    );
  }

  const [rooms, images, pricingRules, amenities, faqs] = await Promise.all([
    getRooms(property.id),
    getImages(property.id),
    getPricingRules(property.id),
    getAmenities(property.id),
    getFAQs(property.id),
  ]);

  // Group amenities by category (preserving display_order within each group)
  const amenityGroups = amenities.reduce<Record<string, string[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a.label);
    return acc;
  }, {});

  const whatsappUrl = `https://wa.me/${property.whatsapp_number ?? '919876543210'}?text=${encodeURIComponent(`Hi, I'm interested in booking ${property.name}`)}`;

  return (
    <div className="pb-20 md:pb-0" style={{ color: 'var(--ink)' }}>

      {/* ── Hero ──────────────────────────────────────── */}
      <section id="overview" className="pt-6 sm:pt-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4 sm:mb-5">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-5"
                style={{
                  backgroundColor: 'var(--maroon-tint)',
                  border: '1px solid var(--border-brass)',
                  color: 'var(--brass)',
                }}
              >
                <ShieldCheck className="w-4 h-4" aria-hidden="true" /> Direct Verified Property Booking
              </div>
              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-bold italic leading-tight mb-2"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}
              >
                {property.name}
              </h1>
              <p className="text-sm flex items-center gap-1.5" style={{ color: 'var(--ink-muted)' }}>
                <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--brass)' }} aria-hidden="true" />
                <span>{property.address}, {property.city}, {property.state}</span>
              </p>
            </div>
          </div>
          <GalleryModal images={images} />
        </div>
      </section>

      {/* ── Main Layout: Content + Widget ─────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-10">

          {/* Highlights bar */}
          <div
            className="p-5 sm:p-6 rounded-3xl grid grid-cols-2 sm:grid-cols-4 gap-0 text-center shadow-md"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {[
              { icon: Users, label: 'Capacity', value: `Up to ${property.max_occupancy} Guests` },
              { icon: Waves, label: 'Beach',    value: '1.5 km to Beach' },
              { icon: Wifi,  label: 'WiFi',     value: 'High-Speed WiFi' },
              { icon: Home,  label: 'Outdoors', value: 'Lawn & Balconies' },
            ].map(({ icon: Icon, label, value }, i) => (
              <div
                key={label}
                className={`py-4 px-3 ${i > 0 ? 'border-l' : ''} ${i >= 2 ? 'border-t sm:border-t-0' : ''}`}
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: 'var(--maroon-tint)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: 'var(--brass)' }} aria-hidden="true" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ink-faint)' }}>{label}</p>
                <p className="text-base font-bold mt-1 leading-snug" style={{ color: 'var(--maroon)' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* About */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--brass)' }}>
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> About the Villa
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>{property.tagline}</h2>
            <p className="leading-relaxed text-base" style={{ color: 'var(--ink-muted)' }}>{property.description}</p>
          </div>

          {/* Rooms */}
          <div id="rooms" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} aria-hidden="true" />
              <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>Room Breakdown</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="p-5 rounded-2xl shadow-sm transition-all flex flex-col justify-between"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--brass)' }}>{room.room_type}</span>
                      <span
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--maroon-tint)', color: 'var(--maroon-deep)' }}
                      >
                        {room.max_guests} Guests
                      </span>
                    </div>
                    <h3 className="text-base font-bold mb-2" style={{ color: 'var(--ink)' }}>{room.name}</h3>
                  </div>
                  <div
                    className="pt-3 text-sm flex items-center justify-between"
                    style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--ink-muted)' }}
                  >
                    <span>{room.bed_count} × {room.bed_type}</span>
                    {room.has_ensuite_bathroom && (
                      <span className="font-semibold" style={{ color: 'var(--ok)' }}>Ensuite Bath</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Amenities from DB */}
          <div id="amenities" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} aria-hidden="true" />
              <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>Property Amenities</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(amenityGroups).map(([category, items]) => (
                <div
                  key={category}
                  className="p-5 rounded-2xl shadow-sm"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--brass)' }}>{category}</h3>
                  <ul className="space-y-2.5">
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
          </div>

          {/* Location */}
          <div id="location" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} aria-hidden="true" />
              <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>Location</h2>
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
                    Exact address and directions shared after booking confirmation.
                  </p>
                </div>
              </div>
              <div
                className="w-full h-48 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--paper-sunk)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="text-center space-y-2">
                  <MapPin className="w-8 h-8 mx-auto" style={{ color: 'var(--border-brass)' }} aria-hidden="true" />
                  <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>Interactive map available after booking</p>
                  <a
                    href={`https://maps.google.com/?q=${property.geo_lat},${property.geo_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline"
                    style={{ color: 'var(--brass)' }}
                  >
                    View approximate location →
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Mangalore International Airport', '~20 min'],
                  ['Nearest Beach', '~5 min drive / 1.5 km'],
                  ['Main Road & Market', 'Walking distance'],
                  ['Mangalore City Centre', '~15 min'],
                ].map(([place, time]) => (
                  <div
                    key={place}
                    className="flex items-center justify-between p-2.5 rounded-xl"
                    style={{ backgroundColor: 'var(--paper-sunk)', border: '1px solid var(--border-subtle)' }}
                  >
                    <span style={{ color: 'var(--ink-muted)' }}>{place}</span>
                    <span className="font-semibold">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reviews placeholder */}
          <div id="reviews" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} aria-hidden="true" />
              <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>Guest Reviews</h2>
            </div>
            <div
              className="p-6 rounded-2xl shadow-sm text-center space-y-3"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
            >
              <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                We are gathering our first verified reviews. In the meantime, reach out on{' '}
                <a href={whatsappUrl} className="font-semibold underline underline-offset-2" style={{ color: 'var(--brass)' }}>WhatsApp</a>{' '}
                and we will be happy to connect you with past guests.
              </p>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div
            id="cancellation"
            className="scroll-mt-24 p-6 sm:p-8 rounded-3xl shadow-sm space-y-5"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} aria-hidden="true" />
              <h2 className="text-2xl font-bold" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>Cancellation Policy</h2>
            </div>
            <div className="space-y-3">
              {[
                { icon: Check,         color: 'var(--ok)',    bg: 'rgba(46,125,91,0.07)',  border: 'rgba(46,125,91,0.2)',
                  title: 'Full Refund',    body: '30+ days before check-in: 90% refund.' },
                { icon: AlertTriangle, color: 'var(--warn)',  bg: 'rgba(169,112,26,0.07)', border: 'rgba(169,112,26,0.2)',
                  title: 'Partial Refund', body: '15 to 30 days before check-in: 50% refund.' },
                { icon: XCircle,       color: 'var(--error)', bg: 'rgba(179,38,30,0.07)',  border: 'rgba(179,38,30,0.2)',
                  title: 'No Refund',      body: 'Less than 15 days before check-in: no refund.' },
              ].map(({ icon: Icon, color, bg, border, title, body }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 p-4 rounded-2xl"
                  style={{ backgroundColor: bg, border: `1px solid ${border}` }}
                >
                  <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color }} aria-hidden="true" />
                  <div>
                    <p className="text-base font-bold" style={{ color }}>{title}</p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--ink-muted)' }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>
              Security deposit (if any) is refunded within 5 working days of check-out, subject to property inspection. Refunds are processed to the original payment method.
            </p>
          </div>

          {/* House Rules */}
          <div
            id="policies"
            className="scroll-mt-24 p-6 sm:p-8 rounded-3xl shadow-sm space-y-4"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} aria-hidden="true" />
              <h2 className="text-2xl font-bold" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>House Rules</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                `Check-in: ${property.check_in_time} · Check-out: ${property.check_out_time}`,
                'Government photo ID required at check-in for all adults',
                'Quiet hours: 11 PM to 7 AM',
                'No smoking indoors. Designated outdoor area available.',
                'No pets',
                'No outside guests without prior written approval',
                'Events and celebrations require advance notice',
                `Maximum occupancy: ${property.max_occupancy} guests`,
              ].map((rule) => (
                <div
                  key={rule}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl"
                  style={{ backgroundColor: 'var(--paper-sunk)', border: '1px solid var(--border-subtle)', color: 'var(--ink-muted)' }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--brass)' }} aria-hidden="true" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ from DB */}
          <div id="faq" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} aria-hidden="true" />
              <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>Frequently Asked Questions</h2>
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
              <p className="text-base font-bold">Have a question before booking?</p>
              <p className="text-base mt-0.5" style={{ color: 'var(--ink-muted)' }}>We typically respond within 30 minutes on WhatsApp.</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-wa-ghost flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
              >
                <WhatsAppIcon className="w-4 h-4" /> WhatsApp
              </a>
              <a
                href={`tel:+${property.whatsapp_number ?? '919876543210'}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors hover:border-[var(--brass)] hover:text-[var(--ink)] active:scale-95"
                style={{
                  backgroundColor: 'var(--paper-sunk)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--ink-muted)',
                }}
              >
                <Phone className="w-4 h-4" aria-hidden="true" /> Call Us
              </a>
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
                <span>Check-in from <strong style={{ color: 'var(--ink)' }}>{property.check_in_time}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--brass)' }} aria-hidden="true" />
                <span>Check-out by <strong style={{ color: 'var(--ink)' }}>{property.check_out_time}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
