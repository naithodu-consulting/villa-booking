import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Phone, Mail, MapPin } from 'lucide-react';
import { pageMetadata, breadcrumbJsonLd } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import PageHero from '@/components/layout/PageHero';
import CtaButtons from '@/components/guest/CtaButtons';
import { getProperty } from '@/lib/data';
import { ENTITY } from '@/lib/entity';
import { formatPhone } from '@/lib/format';

export const revalidate = 86400;

export const metadata: Metadata = pageMetadata({
  title: 'Contact Us',
  path: '/contact',
  description:
    'Reach Villa 19 by Habbaa in Mangalore by WhatsApp, phone or email, with our registered office address.',
});

function WhatsAppIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

const EYEBROW = 'text-sm font-bold uppercase tracking-widest pb-2 mb-4';

/**
 * Also serves Razorpay's merchant website check, which wants the registered
 * entity name, its address, a phone number and an email reachable as plain
 * text on a crawlable page. That is why the contact rows print the number and
 * address as text rather than hiding them behind icons, and why the page is
 * indexable where the retired version was noindex.
 */
export default async function ContactPage() {
  const property = await getProperty();
  if (!property) notFound();

  const email = process.env.PROPERTY_EMAIL ?? ENTITY.email;
  const phoneNumber = process.env.PROPERTY_PHONE ?? property.whatsapp_number;
  const whatsappUrl = property.whatsapp_number
    ? `https://wa.me/${property.whatsapp_number}?text=${encodeURIComponent(`Hi, I'd like to know more about ${property.name}`)}`
    : undefined;

  // PROPERTY_PHONE and PROPERTY_WHATSAPP are usually the same line, so every
  // row prints its value: two rows showing one number read as two different
  // contacts when only one of them spelled the number out.
  const contacts = [
    ...(whatsappUrl && property.whatsapp_number
      ? [{ href: whatsappUrl, Icon: WhatsAppIcon, label: 'WhatsApp', value: formatPhone(property.whatsapp_number), external: true }]
      : []),
    ...(phoneNumber
      ? [{ href: `tel:+${phoneNumber}`, Icon: Phone, label: 'Call', value: formatPhone(phoneNumber), external: false }]
      : []),
    { href: `mailto:${email}`, Icon: Mail, label: 'Email', value: email, external: false },
  ];

  return (
    <div className="pb-0" style={{ color: 'var(--ink)' }}>
      <JsonLd data={[breadcrumbJsonLd([{ name: 'Contact', path: '/contact' }])]} />
      <PageHero title="Contact Us" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-12 space-y-10">

        <p className="text-base text-center" style={{ color: 'var(--ink-muted)' }}>
          We are happy to help with availability, bookings or anything else about your stay.
        </p>

        <section>
          <h2 className={EYEBROW} style={{ color: 'var(--brass-ink)', borderBottom: '1px solid var(--border-subtle)' }}>
            Get in Touch
          </h2>
          <ul className="space-y-3">
            {contacts.map(({ href, Icon, label, value, external }) => (
              <li key={label}>
                <a
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="flex items-center gap-4 p-4 rounded-2xl border transition-colors hover:bg-[var(--paper-sunk)]"
                  style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface)' }}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--brass)' }} />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>{label}</span>
                    <span className="block text-sm font-semibold break-all mt-0.5" style={{ color: 'var(--ink)' }}>{value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className={EYEBROW} style={{ color: 'var(--brass-ink)', borderBottom: '1px solid var(--border-subtle)' }}>
            The Villa
          </h2>
          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{property.name}</p>
          <p className="text-sm leading-relaxed mt-1" style={{ color: 'var(--ink-muted)' }}>
            {[property.address, property.city].filter(Boolean).join(', ')}
            {(property.state || property.pincode) && <br />}
            {[property.state, property.pincode].filter(Boolean).join(' ')}
          </p>
          {property.geo_lat && property.geo_lng && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${property.geo_lat},${property.geo_lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold mt-3 hover:underline"
              style={{ color: 'var(--brass-ink)' }}
            >
              <MapPin className="w-4 h-4" aria-hidden="true" />
              View on Google Maps
            </a>
          )}
        </section>

        <section>
          <h2 className={EYEBROW} style={{ color: 'var(--brass-ink)', borderBottom: '1px solid var(--border-subtle)' }}>
            Registered Office
          </h2>
          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{ENTITY.name}</p>
          <p className="text-sm leading-relaxed mt-1" style={{ color: 'var(--ink-muted)' }}>{ENTITY.address}</p>
          <p className="text-xs tabular-nums mt-2" style={{ color: 'var(--ink-muted)' }}>CIN: {ENTITY.cin}</p>
          <p className="text-xs tabular-nums" style={{ color: 'var(--ink-muted)' }}>GSTIN: {ENTITY.gstin}</p>
        </section>

        <section
          className="p-8 rounded-3xl text-center space-y-4"
          style={{ backgroundColor: 'var(--maroon-deep)', color: 'white' }}
        >
          <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Ready to book?
          </h2>
          <p className="text-white/70 text-base">Check the dates you have in mind, or message us first.</p>
          <CtaButtons
            secondary={whatsappUrl
              ? { href: whatsappUrl, external: true, label: 'WhatsApp Us' }
              : { href: `mailto:${email}`, external: true, label: 'Email Us' }}
          />
        </section>
      </div>
    </div>
  );
}
