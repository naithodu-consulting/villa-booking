import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.APP_URL ?? 'https://villamangalore.com';
  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/book`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
