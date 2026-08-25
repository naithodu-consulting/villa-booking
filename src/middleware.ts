import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_ROUTES = ['/admin/dashboard', '/admin/bookings', '/admin/property', '/admin/calendar'];
const PUBLIC_ADMIN = ['/admin/login'];

export async function middleware(request: NextRequest) {
  // In dev without Supabase configured, skip auth so the UI is still browsable
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isPublicAdmin = PUBLIC_ADMIN.some((r) => pathname.startsWith(r));

  if (isAdminRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicAdmin && user) {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = '/admin/dashboard';
    return NextResponse.redirect(dashUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*'],
};
