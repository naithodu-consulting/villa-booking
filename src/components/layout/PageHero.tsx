import React from 'react';

/**
 * The band at the top of every inner page: title, one intro line, optional
 * actions. Pages used to hand-roll it and drifted apart (40 to 80px of vertical
 * padding, 16 or 20px under the title, intros capped at 576px, 672px or not at
 * all, one at 20px), so it lives here. With the eyebrow labels gone, the band is
 * sized for title plus intro only. Privacy and Terms keep their own compact
 * legal header.
 */
export default function PageHero({
  title,
  children,
}: {
  title: React.ReactNode;
  /** Actions under the title, e.g. a button. */
  children?: React.ReactNode;
}) {
  return (
    <section
      className="pt-6 pb-2 sm:pt-8 sm:pb-3"
      style={{
        backgroundColor: 'var(--paper)',
        color: 'var(--ink)',
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h1
          className="text-5xl sm:text-6xl font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}
        >
          {title}
        </h1>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
