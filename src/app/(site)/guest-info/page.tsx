import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Key, Luggage, Wifi, Car, ShieldCheck, MessageSquare, Info } from 'lucide-react';
import { getProperty } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Guest Info',
  description:
    'Everything you need to know for your stay at Villa 19. Check-in process, parking, WiFi, amenities, and house rules.',
  openGraph: {
    title: 'Guest Info | Villa 19 by Habbaa',
    description: 'Check-in guide, parking, WiFi, house rules, and emergency contacts for your stay at Villa 19, Mangalore.',
    url: 'https://habbaa.in/guest-info',
  },
  twitter: {
    title: 'Guest Info | Villa 19 by Habbaa',
    description: 'Everything you need for your stay at Villa 19, Mangalore.',
  },
};

export default async function GuestInfoPage() {
  const property = await getProperty();
  const whatsappNumber = property?.whatsapp_number ?? '919876543210';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I have a question about my upcoming stay at ${property?.name ?? 'Villa 19'}`)}`;
  const checkIn  = property?.check_in_time  ?? '14:00';
  const checkOut = property?.check_out_time ?? '11:00';

  const sections = [
    {
      icon: Clock,
      title: 'Check-in & Check-out',
      items: [
        `Check-in from ${checkIn} onwards`,
        `Check-out by ${checkOut}`,
        'Early check-in and late check-out subject to availability. Ask us on WhatsApp.',
        'A self-check-in option is available; instructions sent 24 hours before arrival',
      ],
    },
    {
      icon: Key,
      title: 'Arrival',
      items: [
        'Government photo ID required for all adult guests at check-in',
        'Exact address and entry instructions shared after booking is confirmed',
        'Host is reachable on WhatsApp for any arrival questions',
        'Keys and access code will be provided. Do not share with non-registered guests.',
      ],
    },
    {
      icon: Luggage,
      title: 'What to Bring',
      items: [
        'Government-issued photo ID for each adult guest',
        'Any personal medications and toiletries',
        'Beach/outdoor footwear if visiting the shore',
        'Power sockets are standard Indian type. Bring your own chargers.',
      ],
    },
    {
      icon: Wifi,
      title: 'WiFi & Connectivity',
      items: [
        'High-speed WiFi throughout the villa',
        'Network name and password in the welcome guide on arrival',
        'Power backup available. Generator kicks in during outages.',
      ],
    },
    {
      icon: Car,
      title: 'Parking',
      items: [
        'Ample covered parking available for all guests',
        'Park only in designated areas within the compound',
        'Do not block the gate or neighbour\'s access',
      ],
    },
    {
      icon: ShieldCheck,
      title: 'House Rules Summary',
      items: [
        `Maximum occupancy: ${property?.max_occupancy ?? 12} guests`,
        'Quiet hours: 11 PM to 7 AM',
        'No smoking indoors. Designated outdoor area available.',
        'No pets allowed',
        'No outside guests without prior written approval',
        'Events and celebrations require advance notice and approval',
      ],
    },
  ];

  return (
    <div className="pb-20 md:pb-0" style={{ color: 'var(--ink)' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        className="py-16 sm:py-20"
        style={{ backgroundColor: 'var(--maroon)', color: 'white' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--brass-light)' }}>
            Before You Arrive
          </p>
          <h1
            className="text-5xl sm:text-6xl font-bold italic mb-5"
            style={{ fontFamily: 'var(--font-display)', color: 'white' }}
          >
            Guest Info
          </h1>
          <p className="text-lg text-white/75 leading-relaxed">
            Everything you need for a smooth, enjoyable stay at Villa 19.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">

        {/* ── Info card: contact host ───────────────────────── */}
        <div
          className="p-5 rounded-2xl flex items-start gap-3"
          style={{ backgroundColor: 'var(--maroon-tint)', border: '1px solid var(--border-brass)' }}
        >
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--brass)' }} aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--maroon)' }}>
              Questions? We are on WhatsApp.
            </p>
            <p className="text-base" style={{ color: 'var(--ink-muted)' }}>
              Your host responds within 30 minutes.{' '}
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2" style={{ color: 'var(--brass)' }}>
                Message us →
              </a>
            </p>
          </div>
        </div>

        {/* ── Sections ─────────────────────────────────────── */}
        {sections.map(({ icon: Icon, title, items }) => (
          <div
            key={title}
            className="p-6 rounded-2xl space-y-4"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--maroon-tint)' }}
              >
                <Icon className="w-4.5 h-4.5" style={{ color: 'var(--brass)' }} aria-hidden="true" />
              </div>
              <h2 className="text-base font-bold" style={{ color: 'var(--maroon)' }}>{title}</h2>
            </div>
            <ul className="space-y-2.5">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--ink-muted)' }}>
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
                    style={{ backgroundColor: 'var(--brass)' }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* ── Emergency contacts ───────────────────────────── */}
        <div
          className="p-6 rounded-2xl space-y-3"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
        >
          <h2 className="text-base font-bold" style={{ color: 'var(--maroon)' }}>Emergency Contacts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {[
              { label: 'Your Host (WhatsApp)',    value: `+${whatsappNumber}` },
              { label: 'Police',                  value: '100' },
              { label: 'Ambulance',               value: '108' },
              { label: 'Nearest Hospital',        value: 'A.J. Hospital, Mangalore' },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ backgroundColor: 'var(--paper-sunk)', border: '1px solid var(--border-subtle)' }}
              >
                <span style={{ color: 'var(--ink-muted)' }}>{label}</span>
                <span className="font-semibold" style={{ color: 'var(--ink)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────────── */}
        <div
          className="p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ backgroundColor: 'var(--maroon)', color: 'white' }}
        >
          <div>
            <p className="font-bold">Still have questions?</p>
            <p className="text-sm text-white/70 mt-0.5">We are happy to help before and during your stay.</p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-base flex-shrink-0 transition-all"
            style={{ backgroundColor: '#25D366', color: 'white' }}
          >
            <MessageSquare className="w-4 h-4" aria-hidden="true" /> WhatsApp Us
          </a>
        </div>

      </div>
    </div>
  );
}
