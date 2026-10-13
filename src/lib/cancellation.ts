import { addDaysISO } from '@/lib/format';

/**
 * The cancellation tiers, in one place. The homepage card and the Terms page
 * both render this list.
 *
 * They used to be hardcoded separately in both, and drifted: the homepage
 * promised 100% at 30+ days while Terms and property_policies said 90%.
 * Resolved in favour of 100% by the operator on 2026-10-01.
 *
 * Windows are exclusive and day 30 pays the top tier: "30 or more" and
 * "15 to 29" must not both claim day 30.
 *
 * property_policies holds the same wording for Ooruda Villa, so a change goes
 * there too (see the latest cancellation migration).
 */
export interface CancellationTier {
  /** Phrase completed by " check-in", e.g. "30 or more days before check-in". */
  when: string;
  /** Refund percentage as shown, e.g. "100%". */
  amount: string;
  /** Lower bound of the window, in whole days before check-in. */
  minDaysBefore: number;
  /** Refund as a fraction of the total paid. */
  fraction: number;
}

/** Ordered widest window first; `cancellationSchedule` relies on that order. */
export const CANCELLATION_TIERS: CancellationTier[] = [
  { when: '30 or more days before', amount: '100%', minDaysBefore: 30, fraction: 1   },
  { when: '15 to 29 days before',   amount: '50%',  minDaysBefore: 15, fraction: 0.5 },
  { when: 'Under 15 days before',   amount: '0%',   minDaysBefore: 0,  fraction: 0   },
];

export interface CancellationDeadline {
  /** The tier's window as dated text, e.g. "Until Wed 21 Oct, 2:00 pm". */
  when: string;
  /** Refund in paise. Zero on the final tier. */
  refundPaise: number;
  /** The tier's percentage, e.g. "100%". */
  amount: string;
}

/**
 * The cancellation tiers as the dates they fall on for one booking, for the
 * confirmation email.
 *
 * Each deadline is the tier's day count back from check-in, at the check-in
 * time: a 2:00 pm check-in on 20 Nov puts the 30-day deadline at 2:00 pm on
 * 21 Oct. Cancelling exactly on a deadline pays the better tier, matching
 * "30 or more days before".
 *
 * Derived from CANCELLATION_TIERS rather than restating the windows, so a
 * change to the policy reaches the email without a second edit.
 */
export function cancellationSchedule(
  checkIn: string,
  checkInTime: string,
  totalPaise: number,
  /** "Wed 21 Oct" for the tier a guest is most likely reading. */
  formatLong: (iso: string) => string,
  /** "21 Oct" for the middle window, where two dates sit in one line. */
  formatShort: (iso: string) => string,
): CancellationDeadline[] {
  const time = checkInTime;
  const long = (days: number) => formatLong(addDaysISO(checkIn, -days));
  const short = (days: number) => formatShort(addDaysISO(checkIn, -days));

  return CANCELLATION_TIERS.map((tier, i) => {
    const prev = CANCELLATION_TIERS[i - 1];
    const when =
      i === 0
        ? `Until ${long(tier.minDaysBefore)}, ${time}`
        : tier.fraction === 0
          ? `After ${long(prev.minDaysBefore)}, ${time}`
          : `${short(prev.minDaysBefore)} ${time} to ${short(tier.minDaysBefore)} ${time}`;

    return { when, refundPaise: Math.round(totalPaise * tier.fraction), amount: tier.amount };
  });
}

export const SECURITY_DEPOSIT_TERMS =
  'A security deposit, where applicable, will be collected upon check-in. Subject to property inspection following check-out, the refundable deposit will be processed within 5 working days and returned to the original payment method.';
