import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes — skip auth entirely for faster response
  const isProtected =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/agency');

  if (!isProtected) {
    return NextResponse.next();
  }

  const { supabaseResponse, user, supabase } = await updateSession(request);

  // Admin login page — always accessible
  if (pathname === '/admin/login') {
    return supabaseResponse;
  }

  // Protected routes — redirect to appropriate login
  if (pathname.startsWith('/admin') && !user) {
    const loginUrl = new URL('/admin/login', request.nextUrl);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/agency') && !user) {
    const loginUrl = new URL('/profile', request.nextUrl);
    return NextResponse.redirect(loginUrl);
  }

  // Admin/Agency role check — single query for both
  if (user && supabase) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
      const loginUrl = new URL('/admin/login', request.nextUrl);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith('/agency') && profile?.role !== 'agency_manager' && profile?.role !== 'admin') {
      const homeUrl = new URL('/', request.nextUrl);
      return NextResponse.redirect(homeUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
