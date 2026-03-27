import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Admin panel: only accessible via ?mode=admin query parameter
  if (pathname.startsWith('/admin')) {
    const mode = request.nextUrl.searchParams.get('mode');

    // Admin login page — always accessible if ?mode=admin
    if (pathname === '/admin/login' && mode === 'admin') {
      return NextResponse.next();
    }

    // Block all admin routes that don't have ?mode=admin
    if (mode !== 'admin') {
      return NextResponse.redirect(new URL('/', request.nextUrl));
    }

    // Check admin session cookie
    const adminAuth = request.cookies.get('admin_authenticated')?.value;
    if (adminAuth !== 'true' && pathname !== '/admin/login') {
      const loginUrl = new URL('/admin/login', request.nextUrl);
      loginUrl.searchParams.set('mode', 'admin');
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // Agency routes — require Supabase auth
  if (pathname.startsWith('/agency')) {
    const { supabaseResponse, user, supabase } = await updateSession(request);

    if (!user) {
      const loginUrl = new URL('/profile', request.nextUrl);
      return NextResponse.redirect(loginUrl);
    }

    if (supabase) {
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

  return NextResponse.next();
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
