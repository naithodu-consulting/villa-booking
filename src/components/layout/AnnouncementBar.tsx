'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';

export interface Announcement {
  id: string;
  text: string;
  /** Shown instead of text below the sm breakpoint, where the full line is
   *  truncated and the useful part (a phone number, the code) gets cut off. */
  shortText?: string;
  /** If provided, renders a copy-able code badge */
  code?: string;
  /** Optional link */
  href?: string;
}

interface AnnouncementBarProps {
  announcements: Announcement[];
}

export default function AnnouncementBar({ announcements }: AnnouncementBarProps) {
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const total = announcements.length;

  const prev = useCallback(() => setIndex(i => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setIndex(i => (i + 1) % total), [total]);

  // Auto-advance every 5 s
  useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next, total]);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (total === 0) return null;

  const current = announcements[index];

  return (
    <div
      className="relative flex items-center justify-center text-center px-10 text-sm font-semibold select-none"
      style={{ backgroundColor: 'var(--cream)', color: 'var(--maroon)', height: '42px', overflow: 'hidden', borderBottom: '1px solid rgba(168,116,50,0.5)' }}
      role="region"
      aria-label="Announcements"
      aria-live="polite"
    >
      {/* Prev arrow */}
      {total > 1 && (
        <button
          onClick={prev}
          aria-label="Previous announcement"
          className="absolute left-3 p-1.5 rounded transition-colors"
          style={{ color: 'var(--ink-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--maroon)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-muted)')}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Message — single line on mobile, truncated */}
      <span className="flex items-center gap-2 min-w-0 justify-center">
        {current.shortText ? (
          <>
            <span className="truncate sm:hidden">{current.shortText}</span>
            <span className="truncate hidden sm:inline">{current.text}</span>
          </>
        ) : (
          <span className="truncate">{current.text}</span>
        )}

        {current.code && (
          <button
            onClick={() => handleCopy(current.code!)}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-bold text-xs transition-all"
            style={{
              letterSpacing: '1.2px',
              backgroundColor: 'rgba(168,116,50,0.16)',
              border: '1px solid rgba(168,116,50,0.55)',
              color: 'var(--brass-ink)',
            }}
            aria-label={`Copy code ${current.code}`}
          >
            {current.code}
            {copied
              ? <Check className="w-3 h-3" style={{ color: 'var(--ok)' }} />
              : <Copy className="w-3 h-3 opacity-60" />
            }
          </button>
        )}
      </span>

      {/* Next arrow */}
      {total > 1 && (
        <button
          onClick={next}
          aria-label="Next announcement"
          className="absolute right-3 p-1.5 rounded transition-colors"
          style={{ color: 'var(--ink-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--maroon)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-muted)')}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-1">
          {announcements.map((_, i) => (
            <span
              key={i}
              className="block rounded-full transition-all"
              style={{
                width: i === index ? '12px' : '4px',
                height: '3px',
                backgroundColor: i === index ? 'var(--brass)' : 'rgba(92,23,50,0.2)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
