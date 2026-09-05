'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X } from 'lucide-react';

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

// Desktop nav — kept minimal for clean look
const NAV_LINKS = [
  { href: '/the-villa', label: 'The Villa' },
  { href: '/events',    label: 'Events'    },
  { href: '/contact',   label: 'Contact Us'},
];

// Mobile drawer — full sitemap
const DRAWER_LINKS = [
  { href: '/',           label: 'Home'       },
  { href: '/the-villa',  label: 'The Villa'  },
  { href: '/rooms',      label: 'Rooms'      },
  { href: '/gallery',    label: 'Gallery'    },
  { href: '/events',     label: 'Events'     },
  { href: '/stay-guide', label: 'Stay Guide' },
  { href: '/contact',    label: 'Contact Us' },
  { href: '/testimonials', label: 'Testimonials' },
];

export default function Header({ propertyName, whatsappUrl }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <header
        className="sticky top-0 z-40 px-6 sm:px-8 lg:px-12"
        style={{
          backgroundColor: 'var(--maroon-deep)',
          borderBottom: '1px solid rgba(168,116,50,0.28)',
          boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.22)' : 'none',
          transition: 'box-shadow 0.2s ease',
          height: '72px',
        }}
      >
        {/* ── Desktop: 3-column grid — nav | logo | actions ── */}
        <div className="hidden md:grid h-full" style={{ gridTemplateColumns: '1fr auto 1fr' }}>

          {/* Left — nav links */}
          <nav className="flex items-center gap-1 h-full" aria-label="Main navigation">
            {NAV_LINKS.map(({ href, label }) => (
              <NavLink key={href} href={href}>{label}</NavLink>
            ))}
          </nav>

          {/* Center — logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 self-center"
            aria-label={`${propertyName} home`}
          >
            <Image
              src="/habbaa-logo-white.svg"
              alt="Habbaa"
              width={48}
              height={48}
              className="rounded-full"
              style={{ border: '1px solid rgba(201,148,74,0.35)' }}
              priority
            />
            <div className="flex flex-col leading-none gap-[3px]">
              <span
                className="text-[19px] text-white leading-none"
                style={{ fontFamily: 'var(--font-brand)', fontWeight: 600, letterSpacing: '0.03em' }}
              >
                {propertyName}
              </span>
              <span
                className="text-[9px] font-bold uppercase leading-none"
                style={{ color: 'var(--brass-light)', letterSpacing: '0.18em' }}
              >
                By Habbaa
              </span>
            </div>
          </Link>

          {/* Right — actions */}
          <div className="flex items-center justify-end">
            <Link
              href="/book"
              className="px-6 py-2.5 rounded text-[13px] font-bold uppercase"
              style={{
                background: '#FBF7F1',
                color: 'var(--maroon)',
                letterSpacing: '1.2px',
                border: '1px solid rgba(251,247,241,0.9)',
                transition: 'background 0.18s ease, color 0.18s ease',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = 'var(--maroon)';
                el.style.color = '#FBF7F1';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = '#FBF7F1';
                el.style.color = 'var(--maroon)';
              }}
            >
              Book Now
            </Link>
          </div>
        </div>

        {/* ── Mobile: hamburger | logo (center) | book ── */}
        <div className="flex md:hidden items-center justify-between h-full">

          {/* Left — hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            className="flex flex-col items-center justify-center gap-[5px] w-9 h-9 rounded"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <span className="block w-4 h-[1.5px] rounded-full" style={{ background: 'rgba(255,255,255,0.75)' }} />
            <span className="block w-4 h-[1.5px] rounded-full" style={{ background: 'rgba(255,255,255,0.75)' }} />
            <span className="block w-4 h-[1.5px] rounded-full" style={{ background: 'rgba(255,255,255,0.75)' }} />
          </button>

          {/* Center — logo */}
          <Link href="/" className="flex items-center gap-2" aria-label={`${propertyName} home`}>
            <Image
              src="/habbaa-logo-white.svg"
              alt="Habbaa"
              width={48}
              height={48}
              className="rounded-full"
              style={{ border: '1px solid rgba(201,148,74,0.35)' }}
              priority
            />
            <div className="flex flex-col leading-none gap-[2px]">
              <span
                className="text-[20px] text-white leading-none"
                style={{ fontFamily: 'var(--font-brand)', fontWeight: 600, letterSpacing: '0.03em' }}
              >
                {propertyName}
              </span>
              <span
                className="text-[10px] font-bold uppercase leading-none"
                style={{ color: 'var(--brass-light)', letterSpacing: '0.16em' }}
              >
                By Habbaa
              </span>
            </div>
          </Link>

          {/* Right — spacer to keep logo centered */}
          <div className="w-9" />
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(30,10,10,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer panel */}
          <div
            className="absolute top-0 right-0 bottom-0 flex flex-col w-[85vw] max-w-sm shadow-2xl"
            style={{ backgroundColor: 'var(--paper)' }}
          >
            {/* Drawer header — logo + close */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ backgroundColor: 'var(--maroon-deep)', borderBottom: '1px solid rgba(168,116,50,0.28)' }}
            >
              <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5">
                <Image
                  src="/habbaa-logo-white.svg"
                  alt="Habbaa"
                  width={32}
                  height={32}
                  className="rounded-full"
                  style={{ border: '1px solid rgba(201,148,74,0.35)' }}
                />
                <div className="flex flex-col leading-none gap-[3px]">
                  <span
                    className="text-[17px] text-white leading-none"
                    style={{ fontFamily: 'var(--font-brand)', fontWeight: 600, letterSpacing: '0.03em' }}
                  >
                    {propertyName}
                  </span>
                  <span
                    className="text-[8px] font-bold uppercase leading-none"
                    style={{ color: 'var(--brass-light)', letterSpacing: '0.18em' }}
                  >
                    By Habbaa
                  </span>
                </div>
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation menu"
                className="flex items-center justify-center w-8 h-8 rounded"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Nav links — full sitemap */}
            <nav
              className="flex flex-col px-3 py-3 flex-1 overflow-y-auto"
              aria-label="Mobile navigation"
            >
              {DRAWER_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center px-3 py-3.5 text-[15px] font-semibold rounded-lg transition-colors duration-150"
                  style={{ color: 'var(--ink)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(90,38,38,0.05)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = ''; }}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Bottom CTAs */}
            <div
              className="flex flex-col gap-2.5 px-4 pb-8 pt-4 shrink-0"
              style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}
            >
              <Link
                href="/book"
                onClick={() => setMenuOpen(false)}
                className="btn-brass-filled flex items-center justify-center py-3.5 rounded-lg"
              >
                Book Now
              </Link>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="btn-wa flex items-center justify-center gap-2 py-3.5 rounded-lg"
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

/* Extracted to avoid repeating inline hover logic in JSX */
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center text-lg font-semibold px-3.5 h-full transition-colors duration-150"
      style={{ color: 'var(--brass-light)', letterSpacing: '0.01em', borderBottom: '2px solid transparent' }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.color = '#fff';
        el.style.borderBottomColor = 'rgba(201,148,74,0.45)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.color = 'var(--brass-light)';
        el.style.borderBottomColor = 'transparent';
      }}
    >
      {children}
    </Link>
  );
}
