import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { bearerSecretMatches } from '@/lib/signature';

/**
 * Called by Ooruda Villa after it changes content this site renders: a journal
 * post, nearby places, policies. Content pages are rendered once and cached, so
 * without this call an edit only appears after the next deploy.
 *
 * Refreshes every page under the site layout (the footer and drawer links can
 * change when the journal goes live) plus the sitemap. Pages re-render on their
 * next visit, not all at once.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CONTENT_REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Revalidation is not configured' }, { status: 503 });
  }
  if (!bearerSecretMatches(secret, request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  revalidatePath('/', 'layout');
  revalidatePath('/sitemap.xml');

  return NextResponse.json({ revalidated: true, at: new Date().toISOString() });
}
