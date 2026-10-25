import type { Property } from '@/types';

/**
 * The villa rules, per the operator 2026-09-28, as shown on the home page. The
 * Stay Guide used to carry its own copy, which drifted; it no longer lists them.
 * This is the only published source of the rules: edit them here and nowhere
 * else. The comment here used to say property_policies (00040) held a copy for
 * Ooruda Villa. That was never true; nothing reads that table (verified
 * 2026-10-25, both codebases).
 */
export interface VillaRule {
  title: string;
  body: string;
}

export function villaRules(property: Pick<Property, 'base_occupancy' | 'max_occupancy'>): VillaRule[] {
  return [
    { title: 'Registered guests only', body: 'Government photo ID is required at check-in for every guest.' },
    { title: 'Visitors', body: 'Unregistered visitors are not permitted on the premises.' },
    {
      title: 'Occupancy',
      body: `Up to ${property.max_occupancy} guests are permitted, with charges applicable beyond ${property.base_occupancy} guests.`,
    },
    { title: 'No parties', body: 'Parties, loud gatherings and commercial activities are not permitted.' },
    { title: 'Quiet hours, 10 PM to 7 AM', body: 'Please keep noise to a minimum and respect the neighbourhood.' },
    { title: 'No smoking indoors', body: 'Smoking is prohibited inside the villa. Cleaning and restoration charges apply for violations.' },
    { title: 'No pets', body: 'Pets are not permitted anywhere on the property.' },
    { title: 'Care for the property', body: 'Guests are responsible for using the villa, furnishings and amenities responsibly.' },
  ];
}
