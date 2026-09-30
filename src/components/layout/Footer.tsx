import React from 'react';
import NavLinkBase from '@/components/layout/NavLinkBase';
import Image from 'next/image';
import { Phone, Mail } from 'lucide-react';

import type { Property } from '@/types';
import { formatPhone } from '@/lib/format';
import { ENTITY } from '@/lib/entity';
import { EVENTS_PAGE_ENABLED } from '@/lib/features';

function WhatsAppIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}

const EXPLORE_LINKS: [string, string][] = [
  ['/',           'Home'],
  ['/the-villa',  'The Villa'],
  ['/rooms',      'Rooms'],
  ['/gallery',    'Gallery'],
  ...(EVENTS_PAGE_ENABLED ? [['/events', 'Events'] as [string, string]] : []),
  ['/stay-guide', 'Stay Guide'],
  ['/about',      'About Us'],
];

const LEGAL_LINKS: [string, string][] = [
  ['/privacy',            'Privacy Policy'],
  ['/terms',              'Terms of Service'],
  ['/terms#cancellation', 'Cancellation Policy'],
];

// Shared heading style for every column — keeps them locked to one baseline.
// Column headings are eyebrows on a dark ground: --brass-light, same as the header nav
// and the "By Habbaa" descriptor (see the colour roles in globals.css).
const COL_HEADING = 'text-xs font-bold uppercase tracking-[1.2px] text-[var(--brass-light)] mb-5';

// Shared link style. 14px, not 13: at 13 the columns read as fine print.
const COL_LINK = 'text-sm text-white/75 hover:text-white transition-colors';

interface FooterProps {
  property: Property;
  /** Absent when no WhatsApp number is configured. */
  whatsappUrl?: string;
  showJournal?: boolean;
}

export default function Footer({ property, whatsappUrl, showJournal = false }: FooterProps) {
  const year = new Date().getFullYear();
  const email = process.env.PROPERTY_EMAIL ?? 'reservations@habbaa.com';
  // No invented number: each contact row renders only if its value is configured.
  const phoneNumber = process.env.PROPERTY_PHONE ?? property.whatsapp_number;

  return (
    <footer className="mt-12 border-t border-white/8" style={{ backgroundColor: 'var(--maroon-deep)' }}>
      <div className="footer-inner max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-12 pb-10 lg:pt-16 lg:pb-14">

        {/* ── Main grid ──────────────────────────────────────────────────────── */}
        {/*
            Mobile: single column, centred.
            lg+: 4 columns — brand is widest (holds logo + company details),
                 then Explore, Contact, and a combined Follow/Legal column.
        */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.9fr_1fr_1.1fr_0.9fr] gap-10 lg:gap-8 text-center lg:text-left">

          {/* ── Col 1: Brand + registered entity ──────────────────────────── */}
          {/* habbaa.com leads its footer with the registered entity block rather
              than burying it in the bottom bar. Same pattern here: the company
              details are a column, not fine print. */}
          <div className="flex flex-col items-center lg:items-start gap-5">
            <Image
              src="/villa19-wordmark-knockout.svg"
              alt={property.name}
              width={143}
              height={32}
            />

            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--brass-light)]">Managed by</p>
              <p className="text-[13px] font-bold tracking-wide text-white/75">{ENTITY.name}</p>
              <p className="text-[13px] text-white/60 leading-snug max-w-[300px] mx-auto lg:mx-0">
                {ENTITY.address}
              </p>
              <p className="text-xs text-white/60 tabular-nums pt-0.5">CIN: {ENTITY.cin}</p>
              <p className="text-xs text-white/60 tabular-nums">GSTIN: {ENTITY.gstin}</p>
            </div>
          </div>

          {/* ── Col 2: Explore — desktop only ─────────────────────────────── */}
          <div className="hidden lg:block">
            <p className={COL_HEADING}>Explore</p>
            <ul className="space-y-3">
              {(showJournal ? [...EXPLORE_LINKS, ['/journal', 'Journal'] as [string, string]] : EXPLORE_LINKS).map(([href, label]) => (
                <li key={href}>
                  <NavLinkBase href={href} className={COL_LINK}>{label}</NavLinkBase>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 3: Contact ────────────────────────────────────────────── */}
          <div>
            <p className={`${COL_HEADING} hidden lg:block`}>Get in Touch</p>

            {/* Mobile: 3-up tap-target buttons */}
            <div className="grid grid-cols-3 gap-2 lg:hidden">
              {[
                ...(whatsappUrl ? [{ label: 'WhatsApp', href: whatsappUrl, Icon: WhatsAppIcon, external: true,
                  bg: 'rgba(37,211,102,0.14)', border: 'rgba(37,211,102,0.34)', color: 'var(--wa-on-dark)' }] : []),
                ...(phoneNumber ? [{ label: 'Call', href: `tel:+${phoneNumber}`, Icon: Phone, external: false,
                  bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.16)', color: 'var(--brass-light)' }] : []),
                { label: 'Email', href: `mailto:${email}`, Icon: Mail, external: false,
                  bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.16)', color: 'var(--brass-light)' },
              ].map(({ label, href, Icon, external, bg, border, color }) => (
                <a
                  key={label}
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl text-[11px] font-bold text-white"
                  style={{ backgroundColor: bg, border: `1px solid ${border}` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                  {label}
                </a>
              ))}
            </div>

            {/* Desktop: clean list with icons */}
            <ul className="hidden lg:flex flex-col gap-4">
              {/* Icons here are list markers, not brand marks, so they all take
                  the same muted tone and brighten together with their label on
                  hover. Previously WhatsApp was green, phone and mail were brass
                  and the social icons were grey, which read as three unrelated
                  systems stacked in adjacent columns. WhatsApp green is still
                  used where it is a real CTA (sticky bar, enquiry card); here the
                  word "WhatsApp" already carries the recognition. */}
              {[
                ...(whatsappUrl ? [{ href: whatsappUrl, Icon: WhatsAppIcon, text: 'WhatsApp', external: true }] : []),
                ...(phoneNumber ? [{ href: `tel:+${phoneNumber}`, Icon: Phone, text: formatPhone(phoneNumber), external: false }] : []),
                { href: `mailto:${email}`, Icon: Mail, text: email,                  external: false },
              ].map(({ href, Icon, text, external }) => (
                <li key={text}>
                  <a
                    href={href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="flex items-start gap-2.5 group"
                  >
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--brass-light)] group-hover:text-white transition-colors" />
                    <span className="text-sm text-white/75 group-hover:text-white transition-colors leading-tight break-all">
                      {text}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* ── Registered entity + copyright ─────────────────────────────────── */}
        {/*
            Kept below the grid so it doesn't compete with the main columns.
            On desktop it reads as a footer-within-a-footer, lighter and quieter.
        */}
        {/* Legal links live here, inline and unlabelled — the same place
            habbaa.com puts theirs. A "Legal" column heading gives boilerplate
            the same visual rank as navigation, which it does not deserve. */}
        <div
          className="mt-10 lg:mt-12 pt-6 border-t flex flex-col-reverse lg:flex-row lg:items-center lg:justify-between gap-4"
          style={{ borderColor: 'rgba(255,255,255,0.10)' }}
        >
          <p className="text-[13px] text-white/60 text-center lg:text-left">
            &copy; {year} Habbaa. All rights reserved.
          </p>

          <div className="flex items-center justify-center lg:justify-end">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {LEGAL_LINKS.map(([href, label]) => (
                <NavLinkBase
                  key={href}
                  href={href}
                  className="text-[13px] text-white/60 hover:text-white transition-colors"
                >
                  {label}
                </NavLinkBase>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
