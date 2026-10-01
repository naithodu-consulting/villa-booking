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
}

export const CANCELLATION_TIERS: CancellationTier[] = [
  { when: '30 or more days before', amount: '100%' },
  { when: '15 to 29 days before',   amount: '50%'  },
  { when: 'Under 15 days before',   amount: '0%'   },
];

export const SECURITY_DEPOSIT_TERMS =
  'A security deposit, where applicable, will be collected at check-in. Subject to property inspection following check-out, the refundable deposit will be processed within 5 working days and returned to the original payment method.';
