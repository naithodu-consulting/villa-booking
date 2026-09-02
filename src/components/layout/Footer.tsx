import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail } from 'lucide-react';

import type { Property } from '@/types';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}

interface FooterProps {
  property: Property;
  whatsappUrl: string;
}

export default function Footer({ property, whatsappUrl }: FooterProps) {
  const year = new Date().getFullYear();
  const email = process.env.PROPERTY_EMAIL ?? 'hello@habbaa.com';

  return (
    <footer className="mt-12 border-t border-white/8 bg-[#562424]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center gap-3">
              <Image
                src="/habbaa-logo-white.svg"
                alt="Habbaa"
                width={48}
                height={48}
                className="rounded-full flex-shrink-0"
              />
              <div>
                <div className="flex flex-col leading-tight">
                  <span className="text-base font-bold text-white">{property.name}</span>
                  <span className="text-xs font-medium tracking-widest text-[#C9944A] uppercase mt-0.5">By Habbaa</span>
                </div>
              </div>
            </div>
            <p className="text-base text-white/60 leading-relaxed max-w-sm">
              A premium private villa retreat on the Karnataka coast. Direct booking. No middlemen, no platform fees.
            </p>
            <div className="flex items-center gap-1.5 text-sm text-white/50">
              <MapPin className="w-3.5 h-3.5 text-[#C9944A] flex-shrink-0" aria-hidden="true" />
              <span>{property.address}, {property.city}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Explore</p>
            <ul className="space-y-2 text-sm text-white/65">
              {[
                ['/',            'Overview'],
                ['/the-villa',   'The Villa'],
                ['/rooms',       'Rooms'],
                ['/gallery',     'Gallery'],
                ['/events',      'Events'],
                ['/faq',         'FAQ'],
                ['/guest-info',  'Guest Info'],
                ['/reviews',     'Reviews'],
                ['/about',      'About Us'],
                ['/contact',     'Contact'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-[#C9944A] transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Contact Us</p>
            <div className="space-y-2.5 text-sm text-white/65">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" /> WhatsApp
              </a>
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 hover:text-[#C9944A] transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-[#C9944A]" aria-hidden="true" /> {email}
              </a>
              <a
                href={`tel:+${property.whatsapp_number ?? '919876543210'}`}
                className="flex items-center gap-2 hover:text-[#C9944A] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#C9944A]" aria-hidden="true" /> Call Us
              </a>
            </div>
            <div className="pt-2 space-y-1.5">
              <p className="font-bold text-white/50 uppercase tracking-wider text-xs pt-2">Legal</p>
              <Link href="/terms" className="block text-sm text-white/65 hover:text-[#C9944A] transition-colors">
                Terms &amp; Conditions
              </Link>
              <Link href="/privacy" className="block text-sm text-white/65 hover:text-[#C9944A] transition-colors">
                Privacy Policy
              </Link>
              <Link href="#cancellation" className="block text-sm text-white/65 hover:text-[#C9944A] transition-colors">
                Cancellation Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>© {year} {property.name}. All rights reserved.</p>
          <p>Direct booking platform · Powered by Razorpay</p>
        </div>
      </div>
    </footer>
  );
}
