import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail, MessageSquare } from 'lucide-react';
import type { Property } from '@/types';

interface FooterProps {
  property: Property;
  whatsappUrl: string;
}

export default function Footer({ property, whatsappUrl }: FooterProps) {
  const year = new Date().getFullYear();
  const email = process.env.PROPERTY_EMAIL ?? 'bookings@ooruda.com';

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
                ['/about',       'About Habbaa'],
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
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" /> WhatsApp
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
