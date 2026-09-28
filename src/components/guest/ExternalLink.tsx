'use client';

import React from 'react';

/**
 * An outbound link (new tab) that releases focus after a mouse or touch click.
 *
 * The guest comes back to this tab with focus still on the link, and the next
 * keypress draws the focus ring round it. detail is 0 for keyboard
 * activation, so keyboard users keep their focus. Same fix as NavLinkBase.
 */
export default function ExternalLink({ onClick, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.detail > 0) e.currentTarget.blur();
      }}
    >
      {children}
    </a>
  );
}
