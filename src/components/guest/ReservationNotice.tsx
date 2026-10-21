import React from 'react';
import { formatPhone } from '@/lib/format';
import { ENTITY } from '@/lib/entity';

/**
 * What a guest sees everywhere online payment would otherwise begin, while
 * ONLINE_PAYMENTS_ENABLED is off: the two lines they can reach a human on.
 *
 * One component for both surfaces. The same words appear in the dialog that
 * replaces the date picker and on /book itself, which still has to answer a
 * bookmark, a shared link, the journal's "book directly" link and a click that
 * landed before JavaScript was ready. Two copies of this copy would drift.
 *
 * The number and the address are links, not text to retype: on a phone the
 * notice is one tap from a call. Colours follow the light-ground scale in
 * globals.css: --ink for body text and --brass-ink for the accent, which is
 * the only brass that passes contrast as text; the closing line is set in
 * --font-display, the same Cormorant the site uses for every heading.
 */
export default function ReservationNotice({
  phoneNumber,
  email = ENTITY.email,
}: {
  /** Digits as stored in PROPERTY_PHONE; the row is dropped when absent. */
  phoneNumber?: string;
  email?: string;
}) {
  const digits = phoneNumber?.replace(/\D/g, '');
  const phoneDisplay = formatPhone(phoneNumber);

  const linkClass = 'font-bold underline decoration-[1.5px] underline-offset-[3px] transition-opacity hover:opacity-70';

  return (
    <div className="space-y-5">
      <p className="text-[15px] leading-[1.75]" style={{ color: 'var(--ink)' }}>
        To make a reservation, please contact our team at{' '}
        {phoneDisplay && (
          <>
            <a href={`tel:+${digits}`} className={linkClass} style={{ color: 'var(--brass-ink)' }}>
              {phoneDisplay}
            </a>{' '}
            or{' '}
          </>
        )}
        <a
          href={`mailto:${email}`}
          className={`${linkClass} break-words`}
          style={{ color: 'var(--brass-ink)' }}
        >
          {email}
        </a>
        , and we will be happy to assist you with your booking.
      </p>

      <p
        className="text-[15px] leading-[1.75] italic"
        style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)', fontSize: '19px' }}
      >
        We look forward to welcoming you to Villa 19!
      </p>

    </div>
  );
}
