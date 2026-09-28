import Image from 'next/image';
import type { JournalPost } from '@/lib/journal';

/** Real photo when the post has one; otherwise a branded panel, never a stock stand-in. */
export default function JournalCover({
  post, sizes, priority, compact = false,
}: { post: JournalPost; sizes: string; priority?: boolean; compact?: boolean }) {
  if (post.coverImage) {
    return (
      <Image
        src={post.coverImage}
        alt={post.coverAlt ?? ''}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    );
  }

  if (compact) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ backgroundColor: 'var(--maroon-deep)' }}
        aria-hidden="true"
      >
        <Image src="/villa19-wordmark-knockout.svg" alt="" width={80} height={18} />
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ backgroundColor: 'var(--maroon-deep)' }}
      aria-hidden="true"
    >
      <Image src="/villa19-wordmark-knockout.svg" alt="" width={116} height={26} />
      <span className="block w-10 h-px" style={{ backgroundColor: 'rgba(201,148,74,0.5)' }} />
      <span className="text-[11px] font-bold uppercase tracking-[0.25em] whitespace-nowrap" style={{ color: 'var(--brass-light)' }}>
        Journal
      </span>
    </div>
  );
}
