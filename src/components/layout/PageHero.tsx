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
  intro,
  children,
}: {
  title: React.ReactNode;
  intro?: React.ReactNode;
  /** Actions under the intro, e.g. a button. */
  children?: React.ReactNode;
}) {
  return (
    <section
      className="py-10 sm:py-12"
      style={{
        backgroundColor: 'var(--paper-sunk)',
        color: 'var(--ink)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h1
          className="text-5xl sm:text-6xl font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}
        >
          {title}
        </h1>
        {intro && (
          // 2xl (672px) keeps intros at a comfortable measure, and text-balance
          // splits a two-line intro evenly instead of leaving one word behind.
          <p className="mt-4 text-lg leading-relaxed max-w-2xl mx-auto text-balance text-[var(--ink-muted)]">
            {intro}
          </p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
