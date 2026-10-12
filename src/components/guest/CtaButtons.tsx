import React from 'react';
import Link from 'next/link';
import BookNowLink from '@/components/guest/BookNowLink';

interface Secondary {
  href: string;
  label: React.ReactNode;
  /** Opens in a new tab (WhatsApp and other outside links). */
  external?: boolean;
}

/**
 * The button pair at the foot of every dark booking panel: brass "Check
 * Availability" first, then one frosted secondary. The Villa page set the
 * pattern; pages used to hand-roll it with drifting sizes, order and labels, so
 * it lives here. Pages without a more useful secondary get "Homepage".
 */
export default function CtaButtons({
  secondary = { href: '/', label: 'Homepage' },
  className = 'justify-center',
}: {
  secondary?: Secondary;
  /** Alignment within the panel; centred by default. */
  className?: string;
}) {
  const secondaryClass = 'btn-frosted inline-flex items-center gap-2 px-6 py-3.5 rounded-xl';
  return (
    <div className={`flex items-center gap-4 flex-wrap pt-2 ${className}`}>
      <BookNowLink className="btn-brass-filled px-8 py-3.5 rounded-xl">
        Check Availability
      </BookNowLink>
      {secondary.external ? (
        <a href={secondary.href} target="_blank" rel="noopener noreferrer" className={secondaryClass}>
          {secondary.label}
        </a>
      ) : (
        <Link href={secondary.href} className={secondaryClass}>
          {secondary.label}
        </Link>
      )}
    </div>
  );
}
