import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Users, Music, Briefcase, Heart, Check } from 'lucide-react';
import { getProperty } from '@/lib/data';
import BookNowLink from '@/components/guest/BookNowLink';

export const metadata: Metadata = {
  title: 'Events & Celebrations',
  description:
    'Host your celebration, reunion, or corporate retreat at Villa 19, Mangalore. Private villa exclusively yours for up to 12 guests.',
  openGraph: {
    title: 'Events & Celebrations | Villa 19 by Habbaa',
    description: 'Birthday parties, family reunions, corporate retreats. Villa 19 is exclusively yours for up to 12 guests.',
    url: 'https://habbaa.in/events',
  },
  twitter: {
    title: 'Events & Celebrations | Villa 19 by Habbaa',
    description: 'Private villa exclusively yours for events. Up to 12 guests, Mangalore.',
  },
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}

const EVENT_TYPES = [
  {
    icon: Heart,
    title: 'Family Reunions',
    body: 'Bring the extended family together in a private space with enough room for everyone. Lawn, shared spaces, and a full kitchen to make it your own.',
  },
  {
    icon: Music,
    title: 'Milestone Celebrations',
    body: 'Birthdays, anniversaries, graduations: celebrate the moments that matter in a private villa, away from crowded venues.',
  },
  {
    icon: Briefcase,
    title: 'Corporate Retreats',
    body: 'Off-sites and team getaways in a relaxed setting. Reliable WiFi, ample space, and the Karnataka coast as your backdrop.',
  },
  {
    icon: Users,
    title: 'Group Getaways',
    body: 'Friends-only trips, bachelor or bachelorette stays, or just a group that wants a place entirely to themselves.',
  },
];

const IMPORTANT_NOTES = [
  'All events must be declared at the time of booking. Undisclosed events may result in cancellation.',
  'Loud music after 11 PM is not permitted. Quiet hours are strictly enforced.',
  'Guest count must not exceed the booked capacity at any time, including day visitors.',
  'An additional security deposit applies for event bookings.',
  'We do not permit events that conflict with local laws or cause nuisance to neighbours.',
];

export default async function EventsPage() {
  const property = await getProperty();
  const whatsappNumber = property?.whatsapp_number;
  // Advertised capacity is the guests included in the rate; up to 3 more can book
  // at extra cost (see property.max_occupancy).
  const includedGuests = property?.base_occupancy ?? 12;
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I'd like to enquire about hosting an event at ${property?.name ?? 'Villa 19'}`)}`
    : undefined;

  const INCLUDED = [
    'Exclusive use of the entire villa and grounds',
    `Up to ${includedGuests} guests across 4 bedrooms`,
    'Full access to kitchen and all outdoor spaces',
    'Dedicated host contact throughout your stay',
    'Flexible check-in time subject to availability',
    'No restrictions on outside food or catering',
  ];

  return (
    <div className="pb-0" style={{ color: 'var(--ink)' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        className="py-10 sm:py-14"
        style={{
          backgroundColor: 'var(--paper-sunk)',
          color: 'var(--ink)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--brass-ink)' }}>
            Private Villa Exclusively Yours
          </p>
          <h1
            className="text-5xl sm:text-6xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}
          >
            Events & Celebrations
          </h1>
          <p className="text-lg leading-relaxed max-w-xl mx-auto mb-6 text-[var(--ink-muted)]">
            Make your celebration memorable with a private villa stay for up to {includedGuests} guests.
          </p>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-brass-filled inline-flex items-center gap-2 px-8 py-3.5 rounded-xl"
            >
              <WhatsAppIcon className="w-4 h-4" /> Enquire on WhatsApp
            </a>
          )}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">

        {/* ── Event types ──────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} />
            <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
              What We Host
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {EVENT_TYPES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="p-6 rounded-2xl space-y-3"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'var(--maroon-tint)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: 'var(--brass)' }} aria-hidden="true" />
                </div>
                <p className="font-bold text-base" style={{ color: 'var(--maroon)' }}>{title}</p>
                <p className="text-base leading-relaxed" style={{ color: 'var(--ink-muted)' }}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── What's included ──────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} />
            <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
              What's Included
            </h2>
          </div>
          <div
            className="p-6 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
          >
            {INCLUDED.map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-base" style={{ color: 'var(--ink-muted)' }}>
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: 'var(--maroon-tint)' }}
                >
                  <Check className="w-3 h-3" style={{ color: 'var(--brass)' }} aria-hidden="true" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* ── Important notes ──────────────────────────────── */}
        <section
          className="p-6 rounded-2xl space-y-4"
          style={{ backgroundColor: 'var(--paper-sunk)', border: '1px solid var(--border-subtle)' }}
        >
          <h2 className="text-lg font-bold" style={{ color: 'var(--maroon)' }}>Important Notes</h2>
          <ul className="space-y-3">
            {IMPORTANT_NOTES.map((note) => (
              <li key={note} className="flex items-start gap-3 text-base" style={{ color: 'var(--ink-muted)' }}>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                  style={{ backgroundColor: 'var(--maroon-tint)', color: 'var(--maroon)' }}
                >
                  !
                </span>
                {note}
              </li>
            ))}
          </ul>
        </section>

        {/* ── CTA ──────────────────────────────────────────── */}
        <section
          className="p-8 sm:p-10 rounded-3xl text-center space-y-4"
          style={{ backgroundColor: 'var(--maroon-deep)', color: 'white' }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Planning something special?
          </h2>
          <p className="text-white/70 text-base max-w-sm mx-auto">
            Tell us about your event and we will work out the details together.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-frosted flex items-center gap-2 px-8 py-3.5 rounded-xl"
              >
                <WhatsAppIcon className="w-4 h-4" /> Enquire on WhatsApp
              </a>
            )}
            <BookNowLink
              className="btn-brass-filled px-6 py-3.5 rounded-xl"
            >
              Check Availability
            </BookNowLink>
          </div>
        </section>

      </div>
    </div>
  );
}
