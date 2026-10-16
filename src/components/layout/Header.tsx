'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NavLinkBase from '@/components/layout/NavLinkBase';
import BookNowLink from '@/components/guest/BookNowLink';
import Image from 'next/image';
import { X, Phone } from 'lucide-react';
import { EVENTS_PAGE_ENABLED } from '@/lib/features';
import { SHOW_STAY_GUIDE } from '@/lib/site-sections';

interface HeaderProps {
  propertyName: string;
  /** Absent when no number is configured: the drawer's Call button is then hidden. */
  phoneNumber?: string;
  showJournal?: boolean;
}

// Desktop nav — kept minimal for clean look
const NAV_LINKS = [
  { href: '/',          label: 'Home'      },
  { href: '/the-villa', label: 'The Villa' },
  { href: '/rooms',     label: 'Rooms'     },
  { href: '/gallery',   label: 'Gallery'   },
];

// Mobile drawer — full sitemap
const DRAWER_LINKS = [
  { href: '/',           label: 'Home'       },
  { href: '/the-villa',  label: 'The Villa'  },
  { href: '/rooms',      label: 'Rooms'      },
  { href: '/gallery',    label: 'Gallery'    },
  ...(EVENTS_PAGE_ENABLED ? [{ href: '/events', label: 'Events' }] : []),
  ...(SHOW_STAY_GUIDE ? [{ href: '/stay-guide', label: 'Stay Guide' }] : []),
  { href: '/faq',        label: 'FAQs'       },
];

export default function Header({ propertyName, phoneNumber, showJournal = false }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

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
        className="sticky top-0 z-40 px-6 sm:px-8 lg:px-12 h-[80px]"
        style={{
          backgroundColor: 'var(--maroon-deep)',
          borderBottom: '1px solid rgba(168,116,50,0.28)',
          boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.22)' : 'none',
          transition: 'box-shadow 0.2s ease',
        }}
      >
        {/* ── Desktop: 3-column grid — nav | logo | actions ── */}
        <div className="hidden md:grid h-full" style={{ gridTemplateColumns: '1fr auto 1fr' }}>

          {/* Left — nav links */}
          <nav className="flex items-center gap-1 h-full -ml-2.5 lg:-ml-3.5" aria-label="Main navigation">
            {NAV_LINKS.map(({ href, label }) => (
              <NavLink key={href} href={href} label={label} />
            ))}
          </nav>

          {/* Center — logo lockup: matches hero title proportions and alignment */}
          <Link
            href="/"
            className="flex flex-col items-end self-center group py-2"
            aria-label={`${propertyName} by Habbaa home`}
          >
            <Image
              src="/villa19-wordmark-knockout.svg"
              alt={propertyName}
              width={132}
              height={30}
              priority
              className="block w-[132px] h-auto transition-opacity group-hover:opacity-90"
            />
            <Image
              src="/by-habbaa-white.svg"
              alt="by Habbaa"
              width={70}
              height={25}
              priority
              className="block w-[60px] h-auto"
              style={{ marginTop: '6px' }}
            />
          </Link>

          {/* Right — actions */}
          <div className="flex items-center justify-end">
            <BookNowLink
              className="px-6 py-2.5 rounded text-[13px] font-bold uppercase"
              style={{
                background: 'var(--paper)',
                color: 'var(--maroon)',
                letterSpacing: '1.2px',
                border: '1px solid rgba(251,247,241,0.9)',
                transition: 'background 0.18s ease, color 0.18s ease',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = 'var(--maroon)';
                el.style.color = 'var(--paper)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = 'var(--paper)';
                el.style.color = 'var(--maroon)';
              }}
            >
              Book Now
            </BookNowLink>
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
          <Link
            href="/"
            className="flex flex-col items-end"
            aria-label={`${propertyName} by Habbaa home`}
          >
            <Image
              src="/villa19-wordmark-knockout.svg"
              alt={propertyName}
              width={107}
              height={24}
              priority
              className="block w-[107px] h-auto"
            />
            <Image
              src="/by-habbaa-white.svg"
              alt="by Habbaa"
              width={46}
              height={16}
              priority
              className="block w-[46px] h-auto"
              style={{ marginTop: '-3px' }}
            />
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

          {/* Drawer panel — left side, matching the hamburger button position */}
          <div
            className="absolute top-0 left-0 bottom-0 flex flex-col w-[85vw] max-w-sm shadow-2xl"
            style={{ backgroundColor: 'var(--paper)' }}
          >
            {/* Drawer header — logo + close */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ backgroundColor: 'var(--maroon-deep)', borderBottom: '1px solid rgba(168,116,50,0.28)' }}
            >
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-end"
                aria-label={`${propertyName} by Habbaa home`}
              >
                <Image
                  src="/villa19-wordmark-knockout.svg"
                  alt={propertyName}
                  width={90}
                  height={20}
                  className="block w-[90px] h-auto"
                />
                <Image
                  src="/by-habbaa-white.svg"
                  alt="by Habbaa"
                  width={39}
                  height={13}
                  className="block w-[39px] h-auto"
                  style={{ marginTop: '-2.5px' }}
                />
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
              {(showJournal
                ? [...DRAWER_LINKS.slice(0, -2), { href: '/journal', label: 'Journal' }, ...DRAWER_LINKS.slice(-2)]
                : DRAWER_LINKS
              ).map(({ href, label }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <NavLinkBase
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className="flex items-center px-3 py-3.5 text-[15px] font-semibold rounded-lg transition-colors duration-150"
                    style={{
                      color: active ? 'var(--maroon)' : 'var(--ink)',
                      backgroundColor: active ? 'rgba(92,23,50,0.07)' : '',
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(92,23,50,0.05)'; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = ''; }}
                  >
                    {label}
                  </NavLinkBase>
                );
              })}
            </nav>

            {/* Bottom CTAs */}
            <div
              className="flex flex-col gap-2.5 px-4 pb-8 pt-4 shrink-0"
              style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}
            >
              <BookNowLink
                onActivate={() => setMenuOpen(false)}
                className="btn-brass-filled flex items-center justify-center py-3.5 rounded-lg"
              >
                Book Now
              </BookNowLink>
              {/* Call, not WhatsApp. The drawer and the homepage's fixed CTA
                  bar are both md:hidden, so on a phone they are always on
                  screen together, and the bar's Enquire Now is already
                  WhatsApp. Offering it twice crowded out the one channel with
                  no always-reachable button of its own. */}
              {phoneNumber && (
                <a
                  href={`tel:+${phoneNumber}`}
                  onClick={() => setMenuOpen(false)}
                  /* Not btn-wa-ghost, which the WhatsApp button used: it is
                     WhatsApp green, and a phone number is not WhatsApp.
                     btn-secondary is the system's pair for a filled button,
                     and the -solid variant exists for exactly this ground,
                     where a transparent fill reads as washed out. */
                  className="btn-secondary btn-secondary-solid flex items-center justify-center gap-2 py-3.5 rounded-lg"
                >
                  <Phone className="w-4 h-4" aria-hidden="true" />
                  Call
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
  // Lighter than --brass-light: Cormorant's hairlines need extra contrast on maroon.
  const idle = '#DDB57A';
  return (
    <NavLinkBase
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className="flex items-center whitespace-nowrap text-[17px] mx-2.5 lg:text-[20px] lg:mx-3.5 font-semibold pt-px h-full transition-colors duration-150"
      style={{
        color: isActive ? '#fff' : idle,
        fontFamily: 'var(--font-display)',
        letterSpacing: '0.02em',
        borderBottom: isActive ? '2px solid rgba(201,148,74,0.75)' : '2px solid transparent',
      }}
      onMouseEnter={e => {
        if (isActive) return;
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.color = '#fff';
        el.style.borderBottomColor = 'rgba(201,148,74,0.45)';
      }}
      onMouseLeave={e => {
        if (isActive) return;
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.color = idle;
        el.style.borderBottomColor = 'transparent';
      }}
    >
      {label}
    </NavLinkBase>
  );
}
