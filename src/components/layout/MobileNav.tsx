'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, MessageSquare } from 'lucide-react';

interface MobileNavProps {
  whatsappUrl: string;
  adminLoginHref: string;
}

const NAV_LINKS = [
  { href: '#overview', label: 'Overview' },
  { href: '#rooms', label: 'Rooms' },
  { href: '#amenities', label: 'Amenities' },
  { href: '#location', label: 'Location' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#faq', label: 'FAQ' },
  { href: '#policies', label: 'House Rules' },
  { href: '#cancellation', label: 'Cancellation' },
];

export default function MobileNav({ whatsappUrl, adminLoginHref }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setIsOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
      >
        <Menu className="w-5 h-5" aria-hidden="true" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#0E1F3B]/70 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer — light panel slides in from right */}
      <nav
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed top-0 right-0 bottom-0 z-50 w-72 bg-white border-l border-[rgba(0,0,0,0.09)] flex flex-col transition-transform duration-300 shadow-xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-[rgba(0,0,0,0.09)] bg-[#0E1F3B]">
          <p className="text-sm font-bold text-white">Menu</p>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation menu"
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto p-4 space-y-1">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-semibold text-[#4A5568] hover:text-[#0E1F3B] hover:bg-[#F0EBE0] transition-all"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div className="p-4 border-t border-[rgba(0,0,0,0.09)] space-y-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-[rgba(30,138,122,0.08)] border border-[rgba(30,138,122,0.25)] text-[#1E8A7A] text-sm font-bold hover:bg-[rgba(30,138,122,0.14)] transition-all"
          >
            <MessageSquare className="w-4 h-4" aria-hidden="true" /> WhatsApp Enquiry
          </a>
          <Link
            href={adminLoginHref}
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-full px-4 py-3 rounded-xl bg-[#F0EBE0] border border-[rgba(0,0,0,0.09)] text-[#4A5568] text-sm font-semibold hover:bg-[#E8E2D5] transition-all"
          >
            Admin Login
          </Link>
        </div>
      </nav>
    </div>
  );
}
