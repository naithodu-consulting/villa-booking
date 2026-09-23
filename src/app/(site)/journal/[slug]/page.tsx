import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import BookNowLink from '@/components/guest/BookNowLink';
import JournalCover from '@/components/guest/JournalCover';
import JournalBody from '@/components/guest/JournalBody';
import {
  getJournalPost, getJournalPosts, formatJournalDate, JOURNAL_CATEGORIES, SITE_URL,
} from '@/lib/journal';

// Posts published later from Ooruda Villa render on first visit, then stay cached.
export async function generateStaticParams() {
  return (await getJournalPosts()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getJournalPost(slug);
  if (!post) return {};
  const url = `${SITE_URL}/journal/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    robots: post.draft ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function JournalPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getJournalPost(slug);
  if (!post) notFound();

  const url = `${SITE_URL}/journal/${post.slug}`;
  const related = (await getJournalPosts())
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category))
    .slice(0, 2);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt ?? post.publishedAt,
      mainEntityOfPage: url,
      image: post.coverImage ? [post.coverImage] : undefined,
      author: { '@type': 'Organization', name: 'Habbaa', url: SITE_URL },
      publisher: { '@type': 'Organization', name: 'Habbaa', url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Journal', item: `${SITE_URL}/journal` },
        { '@type': 'ListItem', position: 3, name: post.title, item: url },
      ],
    },
  ];

  return (
    <div className="pb-0" style={{ color: 'var(--ink)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      {/* ── Title band ────────────────────────────────────── */}
      <section
        className="py-10 sm:py-14"
        style={{ backgroundColor: 'var(--paper-sunk)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Link
            href="/journal"
            className="inline-flex items-center gap-1 text-sm font-semibold mb-6 hover:underline underline-offset-4"
            style={{ color: 'var(--brass-ink)' }}
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            Journal
          </Link>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--brass-ink)' }}>
            {JOURNAL_CATEGORIES[post.category]}
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold mb-5 leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}
          >
            {post.title}
          </h1>
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
            {formatJournalDate(post.publishedAt)} · {post.readingMinutes} min read
            {post.draft && <span className="ml-2 font-bold" style={{ color: 'var(--error)' }}>DRAFT</span>}
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {post.coverImage && (
          <div className="relative aspect-[16/9] rounded-3xl overflow-hidden mb-10">
            <JournalCover post={post} sizes="(max-width: 1024px) 100vw, 1024px" priority />
          </div>
        )}

        <article className="max-w-[68ch] mx-auto">
          <p className="text-lg leading-relaxed mb-8" style={{ color: 'var(--ink-muted)' }}>{post.excerpt}</p>
          <JournalBody body={post.body} />
        </article>

        {related.length > 0 && (
          <aside className="mt-16 pt-10" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <h2 className="text-sm font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--brass-ink)' }}>
              Keep reading
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/journal/${r.slug}`}
                  className="group flex gap-4 items-start p-4 rounded-2xl transition-shadow hover:shadow-md"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden">
                    <JournalCover post={r} sizes="96px" compact />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--brass-ink)' }}>
                      {JOURNAL_CATEGORIES[r.category]}
                    </p>
                    <p
                      className="text-lg font-bold leading-snug group-hover:underline underline-offset-4"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}
                    >
                      {r.title}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>{r.readingMinutes} min read</p>
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        )}

        {/* ── CTA ──────────────────────────────────────────── */}
        <section
          className="mt-12 p-8 rounded-3xl text-center space-y-4"
          style={{ backgroundColor: 'var(--maroon-deep)', color: 'white' }}
        >
          <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Make Villa 19 your base in Mangalore
          </h2>
          <p className="text-white/70 text-base">The whole villa for your group. Book directly, no platform fees.</p>
          <BookNowLink className="btn-brass-filled inline-block px-8 py-3.5 rounded-xl mt-2">
            Check Availability
          </BookNowLink>
        </section>
      </div>
    </div>
  );
}
