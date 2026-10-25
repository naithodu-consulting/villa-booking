import { addDaysISO } from '@/lib/format';

/**
 * The cancellation tiers, in one place. The homepage card and the Terms page
 * both render this list.
 *
 * They used to be hardcoded separately in both, and drifted: the homepage
 * promised 100% at 30+ days while Terms and property_policies said 90%.
 * Resolved in favour of 100% by the operator on 2026-10-01.
 *
 * Realigned to the Airbnb listing's own tiers on 2026-10-25, so a guest who
 * compares the two channels before booking direct is not quoted two different
 * policies: full refund above 14 days out, 50% from 7 to 14, nothing under 7.
 *
 * Airbnb's own card overlaps at day 14 ("at least 14 days" for the full refund,
 * "7-14 days" for the partial one). The operator resolved it on 2026-10-25 in
 * favour of the partial band, so day 14 pays 50% and the windows are exclusive:
 * "More than 14" and "7 to 14" must not both claim day 14.
 *
 * Confirmed against Airbnb's own booking widget, which is the authority here
 * rather than its policy card: for a 24 Dec check-in it offers "Free
 * cancellation before 10 December", and 10 Dec is the 14-day mark. So Airbnb
 * does not pay a full refund on day 14 either, whatever its card says.
 *
 * "More than 14 days" rather than "15 or more": the same rule, worded to sit
 * next to "7 to 14 days" without a reader having to do the arithmetic to see
 * that the two bands meet.
 *
 * property_policies holds the same wording for Ooruda Villa, so a change goes
 * there too (see the latest cancellation migration).
 */
export interface CancellationTier {
  /** Phrase completed by " check-in", e.g. "More than 14 days before check-in". */
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
  { when: 'More than 14 days before', amount: '100%', minDaysBefore: 15, fraction: 1   },
  { when: '7 to 14 days before',      amount: '50%',  minDaysBefore: 7,  fraction: 0.5 },
  { when: 'Under 7 days before',      amount: '0%',   minDaysBefore: 0,  fraction: 0   },
];

export interface CancellationDeadline {
  /** The tier's window as dated text, e.g. "Until Wed 21 Oct, 11:59 pm". */
  when: string;
  /** Refund in paise. Zero on the final tier. */
  refundPaise: number;
  /** The tier's percentage, e.g. "100%". */
  amount: string;
}

/**
 * Which tiers a given booking can still reach.
 *
 *   full     every tier is ahead of them, including the 100% one
 *   partial  the top tier's deadline passed before they booked
 *   none     they booked inside the last window, so no refund was ever available
 */
export type RefundState = 'full' | 'partial' | 'none';

export interface CancellationOutlook {
  state: RefundState;
  /** Only the tiers still reachable. Empty when the state is 'none'. */
  rows: CancellationDeadline[];
  /** Last moment any refund is available, e.g. "Thu 1 Oct, 11:59 pm". */
  lastRefundableAt?: string;
}

/**
 * Deadlines land at the end of the tier's own last day, not at the check-in
 * time.
 *
 * Counting back from the 3:00 pm check-in produced deadlines like "Wed 16
 * Sept, 3:00 pm": an arbitrary hour a guest has no reason to expect, and one
 * that invites a dispute from anyone who cancels at 4pm that day. An
 * end-of-day deadline is unambiguous.
 *
 * It used to take the day *before* that, as a safety margin so the email could
 * "never promise less than we will honour". That made every tier a day stricter
 * than its own label: with the 14/7 wording and a 24 Dec check-in, the email
 * ended the 50% band on 16 Dec, which is 8 days before check-in, not 7. A
 * margin that contradicts the published policy is not a margin, it is a second
 * policy, and the guest reading the Cancellation page had the better claim.
 *
 * End of the tier's own day is the whole rule now, and it is the right reading
 * of a policy written in whole days: "7 days before check-in" names a day, not
 * an instant, so the whole of that day qualifies. Against a literal count back
 * from the 3:00 pm check-in it errs by nine hours in the guest's favour, which
 * is the safe direction and needs no separate day of padding.
 */
const DEADLINE_TIME = '11:59 pm';
/** The instant after a deadline, for the window that takes over from it. */
const WINDOW_OPENS = '12:00 am';

/** 23:59:59 at the property on the given date. */
function endOfDayIST(iso: string): Date {
  return new Date(`${iso}T23:59:59+05:30`);
}

/**
 * The cancellation tiers as they actually apply to one booking.
 *
 * The ladder used to be rendered in full from the check-in date alone, which
 * meant a guest booking close in was shown deadlines that had already passed
 * before they paid: a stay booked three days out still advertised "100%
 * refunded until <a date last month>". Technically true of the policy, and
 * materially misleading about their own booking.
 *
 * So tiers are filtered against `asOf`, the moment the booking was made, and
 * what survives decides how the email speaks: a full ladder, a narrowed one
 * with the last refundable date called out, or a plain statement that nothing
 * is refundable. The filter uses the same instant the guest is shown, so a
 * surviving row can never carry a deadline that has already gone.
 *
 * Derived from CANCELLATION_TIERS rather than restating the windows, so a
 * change to the policy reaches the email without a second edit.
 */
export function cancellationOutlook(
  checkIn: string,
  totalPaise: number,
  /** When the booking was made, as an ISO timestamp. */
  asOf: string,
  fmt: {
    /** "Wed 21 Oct" */
    long: (iso: string) => string;
    /** "21 Oct" */
    short: (iso: string) => string;
  },
): CancellationOutlook {
  const booked = new Date(asOf);
  /** The tier's last full day: the day it counts back to. */
  const deadlineISO = (days: number) => addDaysISO(checkIn, -days);
  const reachable = (days: number) => endOfDayIST(deadlineISO(days)) >= booked;

  const refundable = CANCELLATION_TIERS.filter((t) => t.fraction > 0);
  const live = refundable.filter((t) => reachable(t.minDaysBefore));

  if (live.length === 0) return { state: 'none', rows: [] };

  const last = live[live.length - 1];
  const rows: CancellationDeadline[] = live.map((tier, i) => {
    const prev = live[i - 1];
    const when = i === 0
      ? `Until ${fmt.long(deadlineISO(tier.minDaysBefore))}, ${DEADLINE_TIME}`
      // Opens the morning after the previous tier closed, rather than restating
      // the same instant as both an end and a beginning.
      : `${fmt.short(addDaysISO(deadlineISO(prev.minDaysBefore), 1))} ${WINDOW_OPENS} to ${fmt.short(deadlineISO(tier.minDaysBefore))} ${DEADLINE_TIME}`;
    return { when, refundPaise: Math.round(totalPaise * tier.fraction), amount: tier.amount };
  });

  // The closing row is what happens after the last refundable deadline.
  const zero = CANCELLATION_TIERS[CANCELLATION_TIERS.length - 1];
  rows.push({
    when: `After ${fmt.long(deadlineISO(last.minDaysBefore))}, ${DEADLINE_TIME}`,
    refundPaise: 0,
    amount: zero.amount,
  });

  return {
    state: live.length === refundable.length ? 'full' : 'partial',
    rows,
    lastRefundableAt: `${fmt.long(deadlineISO(last.minDaysBefore))}, ${DEADLINE_TIME}`,
  };
}

export const SECURITY_DEPOSIT_TERMS =
  'A fully refundable security deposit is collected upon check-in. Subject to property inspection following check-out, the deposit will be processed within 5 working days and returned to the original payment method.';
