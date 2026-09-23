import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

// AI assistants are welcome, for answering questions and for training alike: a
// villa that wants to be recommended needs to be known. Listed by name so the
// intent is explicit and nobody tightens the wildcard without seeing them.
const AI_CRAWLERS = [
  // Search and answer engines (fetch pages to cite them in answers)
  'OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User',
  'PerplexityBot', 'Perplexity-User',
  // Model training
  'GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /book and /booking/* stay crawlable on purpose: they carry noindex,
        // and Google can only see that tag on pages it is allowed to fetch.
        disallow: ['/api/'],
      },
      { userAgent: AI_CRAWLERS, allow: '/', disallow: ['/api/'] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
