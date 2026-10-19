import type { MetadataRoute } from 'next';
import { getJournalPosts, isJournalLive } from '@/lib/journal';
import { SITE_URL } from '@/lib/seo';
import { EVENTS_PAGE_ENABLED } from '@/lib/features';
import { SHOW_STAY_GUIDE } from '@/lib/site-sections';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;
  const now = new Date();

  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '',             priority: 1.0,  changeFrequency: 'weekly' },
    { path: '/the-villa',   priority: 0.85, changeFrequency: 'monthly' },
    { path: '/rooms',       priority: 0.8,  changeFrequency: 'monthly' },
    { path: '/gallery',     priority: 0.75, changeFrequency: 'weekly' },
    ...(EVENTS_PAGE_ENABLED ? [{ path: '/events', priority: 0.75, changeFrequency: 'monthly' as const }] : []),
    ...(SHOW_STAY_GUIDE ? [{ path: '/stay-guide', priority: 0.7, changeFrequency: 'monthly' as const }] : []),
    { path: '/faq',          priority: 0.65, changeFrequency: 'monthly' },
    // Both are indexable (neither passes noindex to pageMetadata) and were
    // simply missing. /testimonials stays out on purpose: it does set noindex.
    { path: '/about',        priority: 0.5,  changeFrequency: 'yearly' },
    { path: '/contact',      priority: 0.5,  changeFrequency: 'yearly' },
    { path: '/privacy',     priority: 0.3,  changeFrequency: 'yearly' },
    { path: '/terms',       priority: 0.3,  changeFrequency: 'yearly' },
    { path: '/cancellation', priority: 0.3,  changeFrequency: 'yearly' },
  ];

  const pages: MetadataRoute.Sitemap = routes.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  if (!(await isJournalLive())) return pages;

  const journal: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/journal`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    ...(await getJournalPosts()).filter((p) => !p.draft).map((p) => ({
      url: `${baseUrl}/journal/${p.slug}`,
      lastModified: new Date(p.updatedAt ?? p.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ];
  return [...pages, ...journal];
}
