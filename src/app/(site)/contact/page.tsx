import React from 'react';
import type { Metadata } from 'next';
import { pageMetadata, breadcrumbJsonLd } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import { MapPin, Mail, Phone, Clock } from 'lucide-react';
import { getProperty } from '@/lib/data';
import EnquiryForm from '@/components/guest/EnquiryForm';
import { formatPhone } from '@/lib/format';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}
export const metadata: Metadata = pageMetadata({
  title: 'Contact & Enquiries',
  path: '/contact',
  description:
    'Contact Villa 19 by Habbaa in Mangalore by WhatsApp, email or phone. Ask about dates, group stays or celebrations, and get a quick reply from your host.',
});

export default async function ContactPage() {
  const property = await getProperty();
  // Nothing here invents a number: a card is shown only when its value is set.
  const whatsappNumber = property?.whatsapp_number;
  const phoneNumber = process.env.PROPERTY_PHONE ?? whatsappNumber;
  const email = process.env.PROPERTY_EMAIL ?? 'hello@habbaa.in';
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I'd like to enquire about ${property?.name ?? 'Villa 19'}`)}`
    : undefined;

  return (
    <div className="pb-0" style={{ color: 'var(--ink)' }}>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Contact Us', path: '/contact' }])} />

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
          <h1
            className="text-5xl sm:text-6xl font-bold mb-5"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}
          >
            Contact Us
          </h1>
          <p className="text-lg leading-relaxed text-[var(--ink-muted)]">
            WhatsApp is the fastest way to reach us. We reply as quickly as we can.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">

        {/* ── Contact options ──────────────────────────────── */}
        {/* Columns follow the number of channels actually configured, so a missing
            WhatsApp or phone number leaves a balanced row rather than a gap. */}
        <div className={`grid grid-cols-1 gap-4 ${[whatsappUrl, phoneNumber].filter(Boolean).length === 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>

          {/* WhatsApp */}
          {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3 p-6 rounded-2xl text-center transition-all hover:shadow-md"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--maroon-tint)', color: 'var(--brass)' }}
            >
              <WhatsAppIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-base mb-0.5" style={{ color: 'var(--ink)' }}>WhatsApp</p>
              <p className="text-base" style={{ color: 'var(--ink-muted)' }}>Fastest response</p>
              <p className="text-sm mt-1 font-semibold" style={{ color: 'var(--brass-ink)' }}>Message Us →</p>
            </div>
          </a>
          )}

          {/* Email */}
          <a
            href={`mailto:${email}`}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl text-center transition-all hover:shadow-md"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--maroon-tint)' }}
            >
              <Mail className="w-6 h-6" style={{ color: 'var(--brass)' }} aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-base mb-0.5" style={{ color: 'var(--ink)' }}>Email</p>
              <p className="text-base" style={{ color: 'var(--ink-muted)' }}>{email}</p>
              <p className="text-sm mt-1 font-semibold" style={{ color: 'var(--brass-ink)' }}>Send Email →</p>
            </div>
          </a>

          {/* Call */}
          {phoneNumber && (
          <a
            href={`tel:+${phoneNumber}`}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl text-center transition-all hover:shadow-md"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--maroon-tint)' }}
            >
              <Phone className="w-6 h-6" style={{ color: 'var(--brass)' }} aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-base mb-0.5" style={{ color: 'var(--ink)' }}>Call Us</p>
              <p className="text-base" style={{ color: 'var(--ink-muted)' }}>{formatPhone(phoneNumber)}</p>
              <p className="text-sm mt-1 font-semibold" style={{ color: 'var(--brass-ink)' }}>Call Now →</p>
            </div>
          </a>
          )}

        </div>

        {/* ── Response times ───────────────────────────────── */}
        <div
          className="p-6 rounded-2xl space-y-3"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4" style={{ color: 'var(--brass)' }} aria-hidden="true" />
            <p className="text-sm font-bold" style={{ color: 'var(--maroon)' }}>How to reach us</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {[
              { channel: 'WhatsApp',  time: 'Fastest way to reach us',   note: 'Recommended' },
              { channel: 'Email',     time: 'Best for detailed enquiries', note: '' },
              { channel: 'Phone',     time: 'Available 9 AM to 9 PM IST',  note: '' },
            ].map(({ channel, time, note }) => (
              <div
                key={channel}
                className="p-3 rounded-xl"
                style={{ backgroundColor: 'var(--paper-sunk)', border: '1px solid var(--border-subtle)' }}
              >
                <p className="font-bold" style={{ color: 'var(--ink)' }}>{channel}</p>
                <p style={{ color: 'var(--ink-muted)' }}>{time}</p>
                {note && <p className="font-semibold mt-0.5" style={{ color: 'var(--brass-ink)' }}>{note}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* ── Address ──────────────────────────────────────── */}
        {property && (
          <div
            className="p-6 rounded-2xl flex items-start gap-3"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
          >
            <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--brass)' }} aria-hidden="true" />
            <div>
              <p className="text-base font-bold mb-0.5" style={{ color: 'var(--maroon)' }}>Property Address</p>
              <p className="text-base" style={{ color: 'var(--ink-muted)' }}>{property.address}</p>
              <p className="text-base" style={{ color: 'var(--ink-muted)' }}>{property.city}, {property.state} {property.pincode}</p>
              <p className="text-sm mt-2" style={{ color: 'var(--ink-muted)' }}>
                Exact address and directions shared after booking confirmation.
              </p>
            </div>
          </div>
        )}

        {/* ── Enquiry Form ─────────────────────────────────── */}
        <div
          className="p-6 rounded-3xl space-y-4"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
        >
          <div>
            <p className="font-bold text-lg" style={{ color: 'var(--maroon)' }}>
              Send an Enquiry
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--ink-muted)' }}>
              Not ready to book yet? Ask us anything: dates, availability, group requirements.
            </p>
          </div>
          <EnquiryForm maxGuests={property?.max_occupancy ?? 14} />
        </div>

      </div>
    </div>
  );
}
