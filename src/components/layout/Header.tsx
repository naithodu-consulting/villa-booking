'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, MessageSquare } from 'lucide-react';

interface HeaderProps {
  propertyName: string;
  whatsappUrl: string;
}

const NAV_LINKS = [
  { href: '/',           label: 'Overview' },
  { href: '/the-villa',  label: 'The Villa' },
  { href: '/rooms',      label: 'Rooms' },
  { href: '/gallery',    label: 'Gallery' },
  { href: '/events',     label: 'Events' },
  { href: '/faq',        label: 'FAQ' },
];

const DRAWER_EXTRA_LINKS = [
  { href: '/guest-info', label: 'Guest Info' },
  { href: '/reviews',    label: 'Reviews' },
  { href: '/about',      label: 'About Habbaa' },
  { href: '/contact',    label: 'Contact' },
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
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg font-bold text-sm text-white transition-all"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageSquare className="w-4 h-4" aria-hidden="true" />
                WhatsApp Enquiry
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
