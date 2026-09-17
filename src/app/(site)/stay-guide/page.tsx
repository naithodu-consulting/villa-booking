import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronDown, Clock, Key, Luggage, Wifi, Car, ShieldCheck, Info } from 'lucide-react';
import { getProperty, getFAQs } from '@/lib/data';
import { formatTime12, formatPhone } from '@/lib/format';
import BookNowLink from '@/components/guest/BookNowLink';

export const metadata: Metadata = {
  title: 'Stay Guide',
  description:
    'Everything you need for your stay at Villa 19, Mangalore. Check-in, parking, WiFi, house rules, and answers to common questions.',
  openGraph: {
    title: 'Stay Guide | Villa 19 by Habbaa',
    description: 'Check-in guide, villa rules, FAQs, and emergency contacts for your stay at Villa 19, Mangalore.',
    url: 'https://habbaa.in/stay-guide',
  },
  twitter: {
    title: 'Stay Guide | Villa 19 by Habbaa',
    description: 'Everything you need before and during your stay at Villa 19, Mangalore.',
  },
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}

export default async function StayGuidePage() {
  const property = await getProperty();
  const whatsappNumber = property?.whatsapp_number;
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I have a question about my stay at ${property?.name ?? 'Villa 19'}`)}`
    : undefined;
  const checkIn  = formatTime12(property?.check_in_time  ?? '14:00');
  const checkOut = formatTime12(property?.check_out_time ?? '11:00');

  const faqs = property ? await getFAQs(property.id) : [];
  const faqGroups = faqs.reduce<Record<string, typeof faqs>>((acc, f) => {
    const key = f.category ?? 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  const infoSections = [
    {
      icon: Clock,
      title: 'Check-in & Check-out',
      items: [
        `Check-in from ${checkIn} onwards`,
        `Check-out by ${checkOut}`,
        'Early check-in and late check-out subject to availability. Ask us on WhatsApp.',
        'Self-check-in available. Instructions sent 24 hours before arrival.',
      ],
    },
    {
      icon: Key,
      title: 'Arrival',
      items: [
        'Government photo ID required for all adult guests at check-in',
        'Exact address and entry instructions shared after booking is confirmed',
        'Host is reachable on WhatsApp for any arrival questions',
        'Keys and access code provided. Do not share with non-registered guests.',
      ],
    },
    {
      icon: Luggage,
      title: 'What to Bring',
      items: [
        'Government-issued photo ID for each adult guest',
        'Personal medications and toiletries',
        'Beach or outdoor footwear if visiting the shore',
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
        'Covered parking available for all guests',
        'Park only in designated areas within the compound',
        'Do not block the gate or access for neighbours',
      ],
    },
    {
      icon: ShieldCheck,
      title: 'Villa Rules',
      items: [
        `Maximum occupancy: ${property?.max_occupancy ?? 15} guests`,
        'Quiet hours: 11 PM to 7 AM',
        'No smoking indoors. Designated outdoor area available.',
        'No pets allowed',
        'No outside guests without prior written approval',
        'Events and celebrations require advance notice and approval',
      ],
    },
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
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--brass-ink)' }}>
            Before You Arrive
          </p>
          <h1
            className="text-5xl sm:text-6xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}
          >
            Stay Guide
          </h1>
          <p className="text-lg leading-relaxed text-[var(--ink-muted)]">
            Everything you need for a smooth, enjoyable stay at Villa 19.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* ── WhatsApp prompt ───────────────────────────────── */}
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
              Your host responds within 30 minutes.{whatsappUrl && (
                <>
                  {' '}
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2" style={{ color: 'var(--brass-ink)' }}>
                    Message us
                  </a>
                </>
              )}
            </p>
          </div>
        </div>

        {/* ── Arrival & stay info ───────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} />
            <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
              Before & During Your Stay
            </h2>
          </div>
          <div className="space-y-3">
            {infoSections.map(({ icon: Icon, title, items }) => (
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
                  <h3 className="text-base font-bold" style={{ color: 'var(--maroon)' }}>{title}</h3>
                </div>
                <ul className="space-y-2.5">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--ink-muted)' }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ backgroundColor: 'var(--brass)' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── Emergency contacts ───────────────────────────── */}
        <section
          className="p-6 rounded-2xl space-y-3"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
        >
          <h2 className="text-base font-bold" style={{ color: 'var(--maroon)' }}>Emergency Contacts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {[
              ...(whatsappNumber ? [{ label: 'Your Host (WhatsApp)', value: formatPhone(whatsappNumber) }] : []),
              { label: 'Police',               value: '100' },
              { label: 'Ambulance',            value: '108' },
              { label: 'Nearest Hospital',     value: 'A.J. Hospital, Mangalore' },
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
        </section>

        {/* ── FAQ ──────────────────────────────────────────── */}
        {Object.keys(faqGroups).length > 0 && (
          <section id="faq" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--brass)' }} />
              <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
                Frequently Asked Questions
              </h2>
            </div>
            {Object.entries(faqGroups).map(([category, items]) => (
              <div key={category} className="space-y-2">
                <h3
                  className="text-xs font-bold uppercase tracking-widest pb-2"
                  style={{ color: 'var(--brass-ink)', borderBottom: '1px solid var(--border-subtle)' }}
                >
                  {category}
                </h3>
                {items.map((faq) => (
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
                      <ChevronDown
                        className="w-4 h-4 flex-shrink-0 group-open:rotate-180 transition-transform"
                        style={{ color: 'var(--ink-muted)' }}
                        aria-hidden="true"
                      />
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
            ))}
          </section>
        )}

        {/* ── CTA ──────────────────────────────────────────── */}
        <div
          className="p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ backgroundColor: 'var(--maroon-deep)', color: 'white' }}
        >
          <div>
            <p className="font-bold">Still have questions?</p>
            <p className="text-sm text-white/70 mt-0.5">We are happy to help before and during your stay.</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-frosted flex items-center gap-2 px-6 py-3 rounded-xl"
              >
                <WhatsAppIcon className="w-4 h-4" /> WhatsApp Us
              </a>
            )}
            <BookNowLink
              className="btn-frosted px-6 py-3 rounded-xl"
            >
              Book Now
            </BookNowLink>
          </div>
        </div>

      </div>
    </div>
  );
}
