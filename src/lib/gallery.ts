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
 *
 * `hidden` keeps a section's rows in the database but off the page, the same
 * kill-switch idea as `features.ts` and `site-sections.ts`. Nothing is deleted,
 * so bringing one back is a one-line change and no migration.
 */
export const GALLERY_SECTIONS = [
  { key: 'villa',         label: 'The Villa' },
  { key: 'living_dining', label: 'Living & Dining' },
  { key: 'bedroom',       label: 'Bedrooms' },
  { key: 'bathroom',      label: 'Bathrooms' },
  { key: 'outdoor',       label: 'Outdoor Spaces' },
  // Hidden 2026-10-16: the neighbourhood photographs are stock images of
  // nearby attractions, not the operator's own, and are being replaced. The
  // rows stay published for Ooruda Villa; only this flag keeps them off the
  // page. Set to false once the new photographs are in.
  { key: 'around',        label: 'Around Villa 19', hidden: true },
] as const;

export type GalleryCategory = (typeof GALLERY_SECTIONS)[number]['key'];

/**
 * The sections actually rendered. The grid and the viewer's category chips both
 * read this, so a hidden section cannot reappear in one of them.
 */
export const VISIBLE_GALLERY_SECTIONS = GALLERY_SECTIONS.filter(
  (s) => !('hidden' in s && s.hidden),
);

/** Labels resolve for every key, hidden ones included, so captions never break. */
export const galleryLabel = (key: string) =>
  GALLERY_SECTIONS.find((s) => s.key === key)?.label ?? key;

/**
 * Whether a photo's category is shown on the Gallery page.
 *
 * The page filters on this before handing the list to the grid, so a hidden
 * section's photographs are not serialised into the client payload either.
 * Filtering only inside the grid left them out of the DOM but still shipped
 * them to the browser, which is not what "hidden" should mean.
 */
export const isVisibleGalleryCategory = (key: string) =>
  VISIBLE_GALLERY_SECTIONS.some((s) => s.key === key);
