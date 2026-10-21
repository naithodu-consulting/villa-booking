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
 * notice is one tap from a call. Both paragraphs are the site's body treatment,
 * --font-body at 15px in --ink, the same as any other prose on the site, so the
 * short message reads in one voice. The only accent is --brass-ink on the two
 * links, the one brass that passes contrast as text.
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
      <p className="text-[15px] leading-[1.75]" style={{ color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>
        Online payments will be enabled soon. To make a reservation meanwhile, please contact our
        team at{' '}
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

      <p className="text-[15px] leading-[1.75]" style={{ color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>
        We look forward to welcoming you to Villa 19!
      </p>

    </div>
  );
}
