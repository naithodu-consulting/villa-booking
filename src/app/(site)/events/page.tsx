import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Users, Music, Briefcase, Heart, MessageSquare, Check } from 'lucide-react';
import { getProperty } from '@/lib/data';

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
    body: 'Off-sites and team getaways in a relaxed setting. Reliable WiFi, ample space, and Mangalore\'s coastline as your backdrop.',
  },
  {
    icon: Users,
    title: 'Group Getaways',
    body: 'Friends-only trips, bachelor/bachelorette stays, or just a group that wants a place entirely to themselves.',
  },
];

const INCLUDED = [
  'Exclusive use of the entire villa and grounds',
  `Up to ${12} guests across 4 bedrooms`,
  'Full access to kitchen and outdoor spaces',
  'Dedicated host contact throughout your event',
  'Flexible check-in times (subject to availability)',
  'No outside catering restrictions. Arrange your own.',
];

export default async function EventsPage() {
  const property = await getProperty();
  const whatsappNumber = property?.whatsapp_number ?? '919876543210';
  const maxOccupancy = property?.max_occupancy ?? 12;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I'd like to enquire about hosting an event at ${property?.name ?? 'Villa 19'}`)}`;

  return (
    <div className="pb-20 md:pb-0" style={{ color: 'var(--ink)' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        className="py-16 sm:py-20"
        style={{ backgroundColor: 'var(--maroon)', color: 'white' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--brass-light)' }}>
            Private Villa Exclusively Yours
          </p>
          <h1
            className="text-5xl sm:text-6xl font-bold italic mb-5"
            style={{ fontFamily: 'var(--font-display)', color: 'white' }}
          >
            Events & Celebrations
          </h1>
          <p className="text-lg text-white/75 leading-relaxed max-w-xl mx-auto mb-8">
            Make your celebration memorable with a private villa stay for up to {maxOccupancy} guests.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base transition-all"
            style={{ backgroundColor: '#25D366', color: 'white' }}
          >
            <MessageSquare className="w-4 h-4" aria-hidden="true" /> Enquire on WhatsApp
          </a>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* ── Event types ──────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} />
            <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
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
            <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
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
          className="p-6 rounded-2xl space-y-3"
          style={{ backgroundColor: 'var(--paper-sunk)', border: '1px solid var(--border-subtle)' }}
        >
          <h2 className="text-lg font-bold" style={{ color: 'var(--maroon)' }}>Important Notes</h2>
          <ul className="space-y-2 text-base" style={{ color: 'var(--ink-muted)' }}>
            {[
              'All events must be declared at the time of booking. Undisclosed events may result in cancellation.',
              'Loud music after 11 PM is not permitted. Quiet hours are strictly enforced.',
              `Guest count must not exceed ${maxOccupancy} at any time, including day visitors.`,
              'An additional security deposit may apply for event bookings.',
              'We do not permit events that conflict with local laws or cause nuisance to neighbours.',
            ].map((note) => (
              <li key={note} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ backgroundColor: 'var(--brass)' }} />
                {note}
              </li>
            ))}
          </ul>
        </section>

        {/* ── CTA ──────────────────────────────────────────── */}
        <section
          className="p-8 sm:p-10 rounded-3xl text-center space-y-4"
          style={{ backgroundColor: 'var(--maroon)', color: 'white' }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold italic" style={{ fontFamily: 'var(--font-display)' }}>
            Planning something special?
          </h2>
          <p className="text-white/70 text-base max-w-sm mx-auto">
            Tell us about your event and we will work out the details together.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base transition-all"
              style={{ backgroundColor: '#25D366', color: 'white' }}
            >
              <MessageSquare className="w-4 h-4" aria-hidden="true" /> WhatsApp Enquiry
            </a>
            <Link
              href="/book"
              className="px-6 py-3.5 rounded-xl font-bold text-sm text-white/70 hover:text-white border border-white/20 hover:bg-white/10 transition-all"
            >
              Check Availability
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
