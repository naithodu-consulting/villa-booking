/**
 * Gallery sections, in display order. Keys match the
 * property_images_category_check constraint (00042). The gallery page and the
 * photo viewer both read this list, so a new section is added here once.
 *
 * These five, plus the neighbourhood, are the operator's own folders in the
 * 2026-10-16 delivery. Parking was a section of its own until then; the
 * delivery files its one parking photograph under Outdoor Spaces, so the
 * section is gone (00089). The 'parking' category stays in the database
 * constraint, where another property may still be using it; a row carrying it
 * here would simply not be shown.
 */
export const GALLERY_SECTIONS = [
  { key: 'villa',         label: 'The Villa' },
  { key: 'living_dining', label: 'Living & Dining' },
  { key: 'bedroom',       label: 'Bedrooms' },
  { key: 'bathroom',      label: 'Bathrooms' },
  { key: 'outdoor',       label: 'Outdoor Spaces' },
  { key: 'around',        label: 'Around Villa 19' },
] as const;

export type GalleryCategory = (typeof GALLERY_SECTIONS)[number]['key'];

export const galleryLabel = (key: string) =>
  GALLERY_SECTIONS.find((s) => s.key === key)?.label ?? key;
