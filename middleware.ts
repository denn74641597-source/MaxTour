import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const mode = request.nextUrl.searchParams.get('mode');

  // Any URL with ?mode=admin that is NOT an admin route → redirect to admin panel
  if (mode === 'admin' && !pathname.startsWith('/admin')) {
    const adminAuth = request.cookies.get('admin_authenticated')?.value;
    if (adminAuth === 'true') {
      const dashUrl = new URL('/admin', request.nextUrl);
      dashUrl.searchParams.set('mode', 'admin');
      return NextResponse.redirect(dashUrl);
    } else {
      const loginUrl = new URL('/admin/login', request.nextUrl);
      loginUrl.searchParams.set('mode', 'admin');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Admin panel: only accessible via ?mode=admin query parameter
  if (pathname.startsWith('/admin')) {
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

  // Agency routes — require Supabase auth (role checked in layout)
  if (pathname.startsWith('/agency')) {
    const { supabaseResponse, user } = await updateSession(request);

    if (!user) {
      const loginUrl = new URL('/profile', request.nextUrl);
      return NextResponse.redirect(loginUrl);
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
