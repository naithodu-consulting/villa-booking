/**
 * The registered company behind the site. Shown in the footer and printed as
 * the supplier on every GST invoice, so there is one copy to keep correct.
 * Confirmed by the operator 2026-09-08.
 */
export const ENTITY = {
  name: 'HABBAA SOLUTIONS PVT LTD',
  address: '209, Citadel Prism, PVS Kalakunj Road, Kodialbail, Mangalore 575003',
  cin: 'U47711KA2025PTC207750',
  /** Reply-to for guests, and the address guest email is sent from. */
  email: 'reservations@habbaa.com',
  gstin: '29AAICH1682G1ZD',
  /** Karnataka. Also the place of supply: GST on accommodation follows the property. */
  stateCode: '29',
  stateName: 'Karnataka',
} as const;
