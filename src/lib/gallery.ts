/**
 * Gallery sections, in display order, per the operator 2026-09-28. Keys match
 * the property_images_category_check constraint (00042). The gallery page and
 * the photo viewer both read this list, so a new section is added here once.
 */
export const GALLERY_SECTIONS = [
  { key: 'villa',         label: 'The Villa' },
  { key: 'living_dining', label: 'Living & Dining' },
  { key: 'bedroom',       label: 'Bedrooms' },
  { key: 'bathroom',      label: 'Bathrooms' },
  { key: 'outdoor',       label: 'Outdoor Spaces' },
  { key: 'parking',       label: 'Parking' },
  { key: 'around',        label: 'Around Villa 19' },
] as const;

export type GalleryCategory = (typeof GALLERY_SECTIONS)[number]['key'];

export const galleryLabel = (key: string) =>
  GALLERY_SECTIONS.find((s) => s.key === key)?.label ?? key;
