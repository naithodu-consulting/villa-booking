'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface SectionTab {
  id: string;
  label: string;
}

export const HOMEPAGE_TABS: SectionTab[] = [
  { id: 'overview',     label: 'Overview' },
  { id: 'rooms',        label: 'Rooms' },
  { id: 'amenities',    label: 'Amenities' },
  { id: 'location',     label: 'Location' },
  { id: 'reviews',      label: 'Reviews' },
  { id: 'cancellation', label: 'Refund Policy' },
  { id: 'policies',     label: 'Villa Rules' },
  { id: 'faq',          label: "FAQ's" },
];

interface SectionNavProps {
  tabs?: SectionTab[];
}

/**
 * Sticky in-page section navigation menu (styled cleanly like StayVista).
 *
 * Uses the existing page background (var(--paper)) rather than creating a heavy
 * contrasting block. Sits seamlessly below the photo gallery in document flow,
 * and sticks at top-[72px] directly below the main site header upon scroll.
 */
export default function SectionNav({ tabs = HOMEPAGE_TABS }: SectionNavProps) {
  const [activeId, setActiveId] = useState<string>(tabs[0]?.id ?? 'overview');
  const [isSticky, setIsSticky] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isManualScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check horizontal overflow for mobile edge fades
  const updateScrollFades = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  // Update edge fades on mount, resize, and scroll
  useEffect(() => {
    updateScrollFades();
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateScrollFades, { passive: true });
    window.addEventListener('resize', updateScrollFades);

    return () => {
      el.removeEventListener('scroll', updateScrollFades);
      window.removeEventListener('resize', updateScrollFades);
    };
  }, [updateScrollFades]);

  // ScrollSpy to track active section with natural flow
  useEffect(() => {
    const handleWindowScroll = () => {
      // 1. Detect if bar is sticky
      if (navRef.current) {
        const navRect = navRef.current.getBoundingClientRect();
        // Must match the sticky offset below: the bar parks at exactly 80px, so
        // a threshold under that never fires and the stuck styling never shows.
        setIsSticky(navRect.top <= 81);
      }

      // If user recently clicked a tab, let the smooth scroll finish
      if (isManualScrollRef.current) return;

      // 2. Check if at the bottom of the page (activate last tab)
      const scrollY = window.scrollY || window.pageYOffset;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      if (windowHeight + scrollY >= docHeight - 80) {
        const lastTab = tabs[tabs.length - 1];
        if (lastTab) setActiveId(lastTab.id);
        return;
      }

      // 3. Trigger line matching the scroll landing clearance (210px + 5px hysteresis)
      const triggerLine = 215;
      let currentActive = tabs[0]?.id ?? 'overview';

      for (const tab of tabs) {
        const section = document.getElementById(tab.id);
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= triggerLine) {
            currentActive = tab.id;
          }
        }
      }

      setActiveId(currentActive);
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    handleWindowScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [tabs]);

  // Center the active tab in the horizontal scroll container on mobile
  useEffect(() => {
    const container = scrollContainerRef.current;
    const tabEl = tabRefs.current[activeId];
    if (container && tabEl && container.scrollWidth > container.clientWidth) {
      const tabLeft = tabEl.offsetLeft;
      const tabWidth = tabEl.offsetWidth;
      const containerWidth = container.clientWidth;
      const targetScrollLeft = tabLeft - containerWidth / 2 + tabWidth / 2;

      container.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth',
      });
    }
  }, [activeId]);

  // Handle smooth scroll on click
  const handleTabClick = (id: string) => {
    setActiveId(id);
    isManualScrollRef.current = true;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    const targetElement = document.getElementById(id);
    if (targetElement) {
      // Header (80px) + Sticky Nav (48px) = 128px sticky overlay.
      // To show a clear portion of the previous section above the heading (peeking affordance),
      // we need ~80px of visible space above the section heading:
      // stickyClearance = 128px sticky height + 82px peek = 210px.
      // For overview (top of the content), clear just the sticky bars + gentle 16px buffer = 144px.
      const stickyClearance = id === 'overview' ? 144 : 210;
      const elementTop = targetElement.getBoundingClientRect().top + window.scrollY;
      const scrollToY = Math.max(0, elementTop - stickyClearance);

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        top: scrollToY,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }

    // Release lock after smooth scroll animation completes
    scrollTimeoutRef.current = setTimeout(() => {
      isManualScrollRef.current = false;
    }, 600);
  };

  // Keyboard navigation across tabs
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = -1;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    }

    if (nextIndex >= 0) {
      e.preventDefault();
      const nextTab = tabs[nextIndex];
      handleTabClick(nextTab.id);
      tabRefs.current[nextTab.id]?.focus();
    }
  };

  return (
    <nav
      ref={navRef}
      aria-label="Villa sections"
      className="sticky top-[80px] z-30 w-full"
      style={{
        backgroundColor: 'var(--paper-sunk)',
        borderBottom: '2.5px solid rgba(168, 116, 50, 0.45)',
        boxShadow: isSticky
          ? '0 4px 20px rgba(58, 14, 31, 0.14)'
          : '0 2px 4px rgba(58, 14, 31, 0.07)',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Left gradient fade for mobile scroll affordance */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute left-4 sm:left-6 lg:left-8 top-0 bottom-0 w-10 z-10 transition-opacity duration-200 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ background: 'linear-gradient(to right, var(--paper-sunk), transparent)' }}
        />

        {/* Right gradient fade for mobile scroll affordance */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute right-4 sm:right-6 lg:right-8 top-0 bottom-0 w-10 z-10 transition-opacity duration-200 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ background: 'linear-gradient(to left, var(--paper-sunk), transparent)' }}
        />

        {/* Horizontal tabs list */}
        <div
          ref={scrollContainerRef}
          role="tablist"
          aria-label="Section navigation"
          className="shelf-x flex items-stretch overflow-x-auto"
        >
          {tabs.map((tab, index) => {
            const isActive = activeId === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el; }}
                role="tab"
                id={`tab-${tab.id}`}
                aria-controls={tab.id}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleTabClick(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`relative flex items-center justify-center px-4 sm:px-5 py-4 sm:py-[18px] whitespace-nowrap text-[14.5px] sm:text-[15.5px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:ring-inset cursor-pointer select-none ${
                  isActive
                    ? 'font-bold text-[var(--maroon-deep)]'
                    : 'font-semibold text-[var(--ink)] opacity-60 hover:opacity-100'
                }`}
                style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.015em' }}
              >
                {tab.label}

                {/* Active brass underline — sits on top of the nav's bottom border */}
                <span
                  aria-hidden="true"
                  className="absolute bottom-[-2.5px] left-0 right-0 h-[2.5px] transition-opacity duration-150"
                  style={{
                    backgroundColor: 'var(--brass)',
                    opacity: isActive ? 1 : 0,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
