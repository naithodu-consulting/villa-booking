import fs from 'node:fs';
import path from 'node:path';
import type { ComponentType } from 'react';
import { createServiceClient } from '@/lib/supabase/server';
import { SHOW_JOURNAL } from '@/lib/site-sections';

import BestTime, { metadata as bestTimeMeta } from '@/content/journal/best-time-to-visit-mangalore.mdx';
import Beaches, { metadata as beachesMeta } from '@/content/journal/beaches-near-urwa-mangalore.mdx';
import GroupTrip, { metadata as groupTripMeta } from '@/content/journal/planning-a-group-getaway-in-mangalore.mdx';

export const JOURNAL_CATEGORIES = {
  'mangalore-guides': 'Mangalore Guides',
  'plan-your-stay':   'Plan Your Stay',
} as const;

export type JournalCategory = keyof typeof JOURNAL_CATEGORIES;

export interface JournalMeta {
  title: string;
  excerpt: string;
  category: JournalCategory;
  publishedAt: string;
  updatedAt?: string;
  coverImage?: string;
  coverAlt?: string;
  draft?: boolean;
}

/** MDX posts carry a compiled component; posts from Ooruda Villa carry Markdown text. */
export type JournalBody =
  | { kind: 'mdx'; Content: ComponentType }
  | { kind: 'markdown'; markdown: string };

export interface JournalPost extends JournalMeta {
  slug: string;
  readingMinutes: number;
  body: JournalBody;
}

const REGISTRY: { slug: string; meta: JournalMeta; Content: ComponentType }[] = [
  { slug: 'best-time-to-visit-mangalore',          meta: bestTimeMeta,  Content: BestTime  },
  { slug: 'beaches-near-urwa-mangalore',           meta: beachesMeta,   Content: Beaches   },
  { slug: 'planning-a-group-getaway-in-mangalore', meta: groupTripMeta, Content: GroupTrip },
];

/** Below this many published posts the journal stays out of nav, footer and sitemap. */
export const JOURNAL_LAUNCH_MIN_POSTS = 3;

const SHOW_DRAFTS = process.env.NODE_ENV !== 'production';
const PROPERTY_SLUG = 'villa-19';

export { SITE_URL } from '@/lib/seo';

function minutesFor(text: string): number {
  return Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 220));
}

function mdxPosts(): JournalPost[] {
  return REGISTRY
    .filter(({ meta }) => SHOW_DRAFTS || !meta.draft)
    .map(({ slug, meta, Content }) => {
      const file = path.join(process.cwd(), 'src/content/journal', `${slug}.mdx`);
      const text = fs.readFileSync(file, 'utf8').replace(/^export const metadata[\s\S]*?\n};\n/, '');
      return { ...meta, slug, readingMinutes: minutesFor(text), body: { kind: 'mdx', Content } };
    });
}

interface JournalRow {
  slug: string;
  title: string;
  excerpt: string;
  category: JournalCategory;
  body: string;
  cover_image_url: string | null;
  cover_alt: string | null;
  published_at: string;
  updated_at: string;
}

/** Published rows only. A database outage must not take the MDX posts down with it. */
async function dbPosts(): Promise<JournalPost[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('journal_posts')
      .select('slug, title, excerpt, category, body, cover_image_url, cover_alt, published_at, updated_at, properties!inner(slug)')
      .eq('properties.slug', PROPERTY_SLUG)
      .eq('status', 'published');
    if (error || !data) return [];
    return (data as unknown as JournalRow[])
      .filter((r) => r.category in JOURNAL_CATEGORIES)
      .map((r) => ({
        slug: r.slug,
        title: r.title,
        excerpt: r.excerpt,
        category: r.category,
        publishedAt: r.published_at,
        updatedAt: r.updated_at.slice(0, 10),
        coverImage: r.cover_image_url ?? undefined,
        coverAlt: r.cover_alt ?? undefined,
        readingMinutes: minutesFor(r.body),
        body: { kind: 'markdown', markdown: r.body },
      }));
  } catch {
    return [];
  }
}

export async function getJournalPosts(): Promise<JournalPost[]> {
  const fromDb = await dbPosts();
  const dbSlugs = new Set(fromDb.map((p) => p.slug));
  return [...fromDb, ...mdxPosts().filter((p) => !dbSlugs.has(p.slug))]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getJournalPost(slug: string): Promise<JournalPost | undefined> {
  return (await getJournalPosts()).find((p) => p.slug === slug);
}

export async function isJournalLive(): Promise<boolean> {
  if (!SHOW_JOURNAL) return false;
  const posts = await getJournalPosts();
  return posts.filter((p) => !p.draft).length >= JOURNAL_LAUNCH_MIN_POSTS;
}

export function formatJournalDate(iso: string): string {
  return new Date(`${iso}T00:00:00+05:30`).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata',
  });
}
