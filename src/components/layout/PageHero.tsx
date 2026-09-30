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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h1
          className="text-5xl sm:text-6xl font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}
        >
          {title}
        </h1>
        {intro && (
          // 3xl (768px, about 85 characters) is the widest a centred line stays
          // easy to follow; 2xl squeezed two-sentence intros into three lines in
          // a wide band. text-balance splits a two-line intro evenly. 16px on
          // phones, where 18px fits only ~38 characters and stacks five lines.
          <p className="mt-4 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto text-balance text-[var(--ink-muted)]">
            {intro}
          </p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
