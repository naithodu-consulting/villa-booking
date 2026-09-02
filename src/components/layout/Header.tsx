'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}

interface HeaderProps {
  propertyName: string;
  whatsappUrl: string;
}

const NAV_LINKS = [
  { href: '/',            label: 'Home' },
  { href: '/the-villa',   label: 'The Villa' },
  { href: '/rooms',       label: 'Rooms' },
  { href: '/gallery',     label: 'Gallery' },
  { href: '/events',      label: 'Events' },
  { href: '/stay-guide',  label: 'Stay Guide' },
];

const DRAWER_EXTRA_LINKS = [
  { href: '/testimonials', label: 'Testimonials' },
  { href: '/contact',      label: 'Contact Us' },
];

export default function Header({ propertyName, whatsappUrl }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <header
        className="sticky top-0 z-40 px-4 sm:px-8 lg:px-12 py-3.5 flex items-center justify-between"
        style={{
          backgroundColor: 'var(--maroon)',
          boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,0.18)' : 'none',
          transition: 'box-shadow 0.2s ease',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3" aria-label={`${propertyName} home`}>
          <Image
            src="/habbaa-logo-white.svg"
            alt="Habbaa"
            width={44}
            height={44}
            className="rounded-full"
            priority
          />
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight text-white">{propertyName}</span>
            <span
              className="text-[11px] font-semibold tracking-widest uppercase mt-0.5"
              style={{ color: 'var(--brass-light)' }}
            >
              By Habbaa
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden md:flex items-center gap-6 text-[15px] font-semibold"
          aria-label="Main navigation"
          style={{ color: 'rgba(255,255,255,0.75)' }}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="hover:text-white transition-colors py-1"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/admin/login"
            className="px-3.5 py-2 rounded-lg text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 border border-white/20 transition-all"
          >
            Admin Login
          </Link>
        </nav>

        {/* Mobile: Book CTA + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <a
            href="#book"
            className="px-3.5 py-2 rounded-lg text-sm font-bold text-white border border-white/30 hover:bg-white/10 transition-all"
          >
            Book
          </a>
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            className="p-2 rounded-lg text-white hover:bg-white/10 transition-all"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(60,23,23,0.92)', backdropFilter: 'blur(8px)' }}
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer panel */}
          <div
            className="relative z-10 flex flex-col h-full max-w-xs w-full ml-auto shadow-2xl"
            style={{ backgroundColor: 'var(--maroon-deep)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <span className="text-white font-bold">{propertyName}</span>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Links */}
            <nav className="flex flex-col px-6 py-6 gap-1" aria-label="Mobile navigation">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-3.5 rounded-lg text-white/85 text-base font-semibold hover:bg-white/10 hover:text-white transition-all"
                >
                  {label}
                </Link>
              ))}
              <div className="border-t border-white/10 my-3" />
              {DRAWER_EXTRA_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-white/60 text-sm font-semibold hover:bg-white/10 hover:text-white transition-all"
                >
                  {label}
                </Link>
              ))}
              <div className="border-t border-white/10 my-3" />
              <Link
                href="/admin/login"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-white/40 text-xs font-semibold hover:bg-white/10 hover:text-white transition-all"
              >
                Admin Login
              </Link>
            </nav>

            {/* WhatsApp CTA */}
            <div className="px-6 pb-8 mt-auto">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg font-bold text-sm text-white transition-all hover:brightness-110 active:scale-95"
                style={{ backgroundColor: '#25D366' }}
              >
                <WhatsAppIcon className="w-4 h-4" />
                WhatsApp Enquiry
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
