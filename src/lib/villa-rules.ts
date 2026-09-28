import type { Property } from '@/types';

/**
 * The villa rules, per the operator 2026-09-28. One list for the home page and
 * the Stay Guide, which previously kept separate copies that drifted apart.
 * property_policies (00040) holds the same wording for Ooruda Villa, so a
 * change goes in both places.
 */
export interface VillaRule {
  title: string;
  body: string;
}

export function villaRules(property: Pick<Property, 'base_occupancy' | 'max_occupancy'>): VillaRule[] {
  const firstExtra = property.base_occupancy + 1;
  return [
    { title: 'Registered guests only', body: 'Government photo ID is required at check-in for every guest.' },
    { title: 'Visitors', body: 'Unregistered visitors are not permitted on the premises.' },
    {
      title: 'Occupancy',
      body: `Up to ${property.max_occupancy} guests. The base rate covers ${property.base_occupancy}, with extra-guest charges from guest ${firstExtra}.`,
    },
    { title: 'No parties', body: 'Parties, loud gatherings and commercial activities are not permitted.' },
    { title: 'Quiet hours, 10 PM to 7 AM', body: 'Please keep noise to a minimum and respect the neighbourhood.' },
    { title: 'No smoking indoors', body: 'Smoking is prohibited inside the villa. Cleaning and restoration charges apply for violations.' },
    { title: 'No pets', body: 'Pets are not permitted anywhere on the property.' },
    { title: 'Care for the property', body: 'Guests are responsible for the villa, its furnishings and amenities during their stay.' },
  ];
}
