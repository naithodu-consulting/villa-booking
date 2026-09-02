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
                  <span className="text-sm font-bold text-white">{property.name}</span>
                  <span className="text-[11px] font-medium tracking-widest text-[#C9944A] uppercase mt-0.5">By Habbaa</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-white/55 leading-relaxed max-w-sm">
              A premium private villa retreat on the Karnataka coast. Direct booking. No middlemen, no platform fees.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <MapPin className="w-3.5 h-3.5 text-[#C9944A] flex-shrink-0" aria-hidden="true" />
              <span>{property.address}, {property.city}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Property</p>
            <ul className="space-y-2 text-xs text-white/55">
              {[
                ['#overview', 'Overview'],
                ['#rooms', 'Rooms'],
                ['#amenities', 'Amenities'],
                ['#location', 'Location'],
                ['#reviews', 'Reviews'],
                ['#faq', 'FAQ'],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="hover:text-[#C9944A] transition-colors">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Contact Us</p>
            <div className="space-y-2.5 text-xs text-white/55">
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
              <p className="font-semibold text-white/40 uppercase tracking-wider text-[10px] pt-2">Legal</p>
              <p className="text-white/30 italic text-[11px]">Terms & Conditions - coming soon</p>
              <p className="text-white/30 italic text-[11px]">Privacy Policy - coming soon</p>
              <Link href="#cancellation" className="block text-xs text-white/55 hover:text-[#C9944A] transition-colors">
                Cancellation Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/35">
          <p>© {year} {property.name}. All rights reserved.</p>
          <p>Direct booking platform · Powered by Razorpay</p>
        </div>
      </div>
    </footer>
  );
}
