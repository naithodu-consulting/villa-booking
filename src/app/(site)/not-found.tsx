import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Page Not Found — Villa 19 by Habbaa',
};

export default function NotFound() {
  return (
    <div
      className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16"
      style={{ color: 'var(--ink)' }}
    >
      <p
        className="text-xs font-bold uppercase mb-5"
        style={{ color: 'var(--brass-ink)', letterSpacing: '2.5px' }}
      >
        404
      </p>

      <h1
        className="text-4xl sm:text-5xl font-bold mb-5"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}
      >
        Page Not Found
      </h1>

      <p
        className="text-base leading-relaxed max-w-sm mb-10"
        style={{ color: 'var(--ink-muted)' }}
      >
        This page does not exist or is no longer available.
      </p>

      <Link
        href="/"
        className="inline-flex items-center px-8 py-3.5 rounded-xl font-bold text-sm uppercase transition-colors"
        style={{
          backgroundColor: 'var(--maroon)',
          color: '#fff',
          letterSpacing: '1.2px',
        }}
      >
        Back to Homepage
      </Link>
    </div>
  );
}
