import React from 'react';
import type { Metadata } from 'next';
import { pageMetadata, breadcrumbJsonLd } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JournalCover from '@/components/guest/JournalCover';
import PageHero from '@/components/layout/PageHero';
import {
  getJournalPosts, isJournalLive, formatJournalDate, JOURNAL_CATEGORIES, type JournalPost,
} from '@/lib/journal';

export const metadata: Metadata = pageMetadata({
  title: 'Journal: Mangalore Guides & Stay Tips',
  path: '/journal',
  description:
    'Local guides to Mangalore and practical advice for planning a stay at Villa 19: the best seasons, beaches near Urwa, food, and planning group trips.',
});

function PostMeta({ post }: { post: JournalPost }) {
  return (
    <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
      {formatJournalDate(post.publishedAt)} · {post.readingMinutes} min read
      {post.draft && <span className="ml-2 font-bold" style={{ color: 'var(--error)' }}>DRAFT</span>}
    </p>
  );
}

function CategoryLabel({ post }: { post: JournalPost }) {
  return (
    <p className="eyebrow-hero mb-4">
      {JOURNAL_CATEGORIES[post.category]}
    </p>
  );
}

export default async function JournalPage() {
  const posts = await getJournalPosts();
  if (process.env.NODE_ENV === 'production' && !(await isJournalLive())) notFound();

  const [featured, ...rest] = posts;

  return (
    <div className="pb-0" style={{ color: 'var(--ink)' }}>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Journal', path: '/journal' }])} />

      {/* ── Page Hero ── */}
      <PageHero title="Journal" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12 space-y-12">

        {featured && (
          <Link
            href={`/journal/${featured.slug}`}
            className="group grid md:grid-cols-2 rounded-3xl overflow-hidden transition-shadow hover:shadow-lg"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[320px] overflow-hidden">
              <JournalCover post={featured} sizes="(max-width: 768px) 100vw, 50vw" priority />
            </div>
            <div className="p-6 sm:p-10 flex flex-col justify-center gap-4">
              <CategoryLabel post={featured} />
              <h2
                className="text-3xl sm:text-4xl font-bold leading-tight group-hover:underline decoration-1 underline-offset-4"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}
              >
                {featured.title}
              </h2>
              <p className="text-base leading-relaxed" style={{ color: 'var(--ink-muted)' }}>{featured.excerpt}</p>
              <PostMeta post={featured} />
            </div>
          </Link>
        )}

        {rest.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-6">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/journal/${post.slug}`}
                className="group flex flex-col rounded-3xl overflow-hidden transition-shadow hover:shadow-lg"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <JournalCover post={post} sizes="(max-width: 640px) 100vw, 50vw" />
                </div>
                <div className="p-6 flex flex-col gap-3 flex-1">
                  <CategoryLabel post={post} />
                  <h2
                    className="text-2xl font-bold leading-snug group-hover:underline decoration-1 underline-offset-4"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}
                  >
                    {post.title}
                  </h2>
                  <p className="text-[15px] leading-relaxed flex-1" style={{ color: 'var(--ink-muted)' }}>{post.excerpt}</p>
                  <PostMeta post={post} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
