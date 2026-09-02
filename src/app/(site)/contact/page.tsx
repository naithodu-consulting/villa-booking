import React from 'react';
import type { Metadata } from 'next';
import { MapPin, MessageSquare, Mail, Phone, Clock } from 'lucide-react';
import { getProperty } from '@/lib/data';
import EnquiryForm from '@/components/guest/EnquiryForm';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Villa 19 by Habbaa. WhatsApp, email, or call. We respond within 30 minutes.',
  openGraph: {
    title: 'Contact | Villa 19 by Habbaa',
    description: 'Reach us on WhatsApp, email, or phone. We respond within 30 minutes.',
    url: 'https://habbaa.in/contact',
  },
  twitter: {
    title: 'Contact | Villa 19 by Habbaa',
    description: 'WhatsApp, email, or call. We respond within 30 minutes.',
  },
};

export default async function ContactPage() {
  const property = await getProperty();
  const whatsappNumber = property?.whatsapp_number ?? '919876543210';
  const email = process.env.PROPERTY_EMAIL ?? 'bookings@habbaa.in';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I'd like to enquire about ${property?.name ?? 'Villa 19'}`)}`;

  return (
    <div className="pb-20 md:pb-0" style={{ color: 'var(--ink)' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        className="py-16 sm:py-20"
        style={{ backgroundColor: 'var(--maroon)', color: 'white' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1
            className="text-5xl sm:text-6xl font-bold italic mb-5"
            style={{ fontFamily: 'var(--font-display)', color: 'white' }}
          >
            Contact Us
          </h1>
          <p className="text-lg text-white/75 leading-relaxed">
            We respond within 30 minutes on WhatsApp. Any time, any day.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">

        {/* ── Contact options ──────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3 p-6 rounded-2xl text-center transition-all hover:shadow-md"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(37,211,102,0.1)' }}
            >
              <MessageSquare className="w-6 h-6" style={{ color: '#1a9e55' }} aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-base mb-0.5" style={{ color: 'var(--ink)' }}>WhatsApp</p>
              <p className="text-base" style={{ color: 'var(--ink-muted)' }}>Fastest response</p>
              <p className="text-sm mt-1 font-semibold" style={{ color: '#1a9e55' }}>Message Us →</p>
            </div>
          </a>

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
              <p className="text-sm mt-1 font-semibold" style={{ color: 'var(--brass)' }}>Send Email →</p>
            </div>
          </a>

          {/* Call */}
          <a
            href={`tel:+${whatsappNumber}`}
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
              <p className="text-base" style={{ color: 'var(--ink-muted)' }}>+{whatsappNumber}</p>
              <p className="text-sm mt-1 font-semibold" style={{ color: 'var(--brass)' }}>Call Now →</p>
            </div>
          </a>

        </div>

        {/* ── Response times ───────────────────────────────── */}
        <div
          className="p-6 rounded-2xl space-y-3"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4" style={{ color: 'var(--brass)' }} aria-hidden="true" />
            <p className="text-sm font-bold" style={{ color: 'var(--maroon)' }}>Response Times</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {[
              { channel: 'WhatsApp',  time: 'Within 30 min', note: 'Recommended' },
              { channel: 'Email',     time: 'Within 4 hours', note: '' },
              { channel: 'Phone',     time: 'During business hours', note: '9 AM to 9 PM IST' },
            ].map(({ channel, time, note }) => (
              <div
                key={channel}
                className="p-3 rounded-xl"
                style={{ backgroundColor: 'var(--paper-sunk)', border: '1px solid var(--border-subtle)' }}
              >
                <p className="font-bold" style={{ color: 'var(--ink)' }}>{channel}</p>
                <p style={{ color: 'var(--ink-muted)' }}>{time}</p>
                {note && <p className="font-semibold mt-0.5" style={{ color: 'var(--brass)' }}>{note}</p>}
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
              <p className="text-sm mt-2" style={{ color: 'var(--ink-faint)' }}>
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
            <p className="font-bold text-base" style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)' }}>
              Send an Enquiry
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--ink-muted)' }}>
              Not ready to book yet? Ask us anything: dates, availability, group requirements.
            </p>
          </div>
          <EnquiryForm />
        </div>

      </div>
    </div>
  );
}
