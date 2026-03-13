import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // Protected routes — redirect to profile/login if not authenticated
  const protectedPaths = ['/agency', '/admin'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const loginUrl = new URL('/profile', request.nextUrl);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes — check role
  if (pathname.startsWith('/admin') && user && supabase) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      const homeUrl = new URL('/', request.nextUrl);
      return NextResponse.redirect(homeUrl);
    }
  }

  // Agency routes — check role
  if (pathname.startsWith('/agency') && user && supabase) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'agency_manager' && profile?.role !== 'admin') {
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
