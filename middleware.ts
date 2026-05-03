import { type NextRequest, NextResponse } from 'next/server';
import { evaluateDomainAccess, getHostContextFromRequest, isStaticOrInternalPath } from '@/lib/routing/guards';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (isStaticOrInternalPath(pathname)) {
    return NextResponse.next();
  }

  const hostContext = getHostContextFromRequest(request);
  const domainAccess = evaluateDomainAccess(pathname, hostContext.domainTarget);
  if (!domainAccess.allow && domainAccess.redirectPath) {
    if (hostContext.domainTarget === 'mxtr' && pathname.startsWith('/admin')) {
      const remoteAdminUrl = new URL(request.url);
      remoteAdminUrl.protocol = 'https:';
      remoteAdminUrl.host = 'remote.mxtr.uz';
      return NextResponse.redirect(remoteAdminUrl);
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = domainAccess.redirectPath;
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  const isAdminRoute = pathname.startsWith('/admin');
  if (isAdminRoute) {
    const { supabaseResponse, user, supabase } = await updateSession(request);
    let isAdmin = false;

    if (user && supabase) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      isAdmin = !error && profile?.role === 'admin';
    }

    if (pathname === '/admin/login') {
      if (isAdmin) {
        const dashboardUrl = request.nextUrl.clone();
        dashboardUrl.pathname = '/admin';
        dashboardUrl.search = '';
        return NextResponse.redirect(dashboardUrl);
      }
      return supabaseResponse;
    }

    if (!isAdmin) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      loginUrl.search = '';
      return NextResponse.redirect(loginUrl);
    }

    return supabaseResponse;
  }

  const { supabaseResponse, user } = await updateSession(request);

  if (pathname.startsWith('/agency')) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/profile';
      loginUrl.search = '';
      return NextResponse.redirect(loginUrl);
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
