import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.APP_URL ?? 'https://habbaa.in').replace(/\/$/, '');
  const now = new Date();

  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '',             priority: 1.0,  changeFrequency: 'weekly' },
    { path: '/book',        priority: 0.9,  changeFrequency: 'weekly' },
    { path: '/the-villa',   priority: 0.85, changeFrequency: 'monthly' },
    { path: '/rooms',       priority: 0.8,  changeFrequency: 'monthly' },
    { path: '/gallery',     priority: 0.75, changeFrequency: 'weekly' },
    { path: '/events',      priority: 0.75, changeFrequency: 'monthly' },
    { path: '/stay-guide',   priority: 0.7,  changeFrequency: 'monthly' },
    { path: '/testimonials', priority: 0.6,  changeFrequency: 'weekly' },
    { path: '/about',       priority: 0.5,  changeFrequency: 'yearly' },
    { path: '/contact',     priority: 0.5,  changeFrequency: 'yearly' },
    { path: '/privacy',     priority: 0.3,  changeFrequency: 'yearly' },
    { path: '/terms',       priority: 0.3,  changeFrequency: 'yearly' },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
