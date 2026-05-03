import { type NextRequest, NextResponse } from 'next/server';
import { evaluateDomainAccess, getHostContextFromRequest, isStaticOrInternalPath } from '@/lib/routing/guards';
import { updateSession } from '@/lib/supabase/middleware';

function redirectToHost(request: NextRequest, host: string, pathname: string, search: string = '') {
  const url = new URL(request.url);
  url.protocol = 'https:';
  url.host = host;
  url.pathname = pathname;
  url.search = search;
  return NextResponse.redirect(url);
}

function redirectToProfile(request: NextRequest, forceMxtrHost: boolean) {
  if (forceMxtrHost) {
    const loginUrl = new URL(request.url);
    const nextUrl = new URL(request.url);

    loginUrl.protocol = 'https:';
    loginUrl.host = 'mxtr.uz';
    loginUrl.pathname = '/profile';
    loginUrl.search = '';

    nextUrl.protocol = 'https:';
    nextUrl.host = 'agency.mxtr.uz';
    loginUrl.searchParams.set('next', `${nextUrl.pathname}${nextUrl.search}`);

    return NextResponse.redirect(loginUrl);
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/profile';
  loginUrl.search = '';
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (isStaticOrInternalPath(pathname)) {
    return NextResponse.next();
  }

  const hostContext = getHostContextFromRequest(request);
  const shouldEnforceDomainSplit = !hostContext.isDevelopmentHost && hostContext.domainTarget !== 'unknown';
  if (shouldEnforceDomainSplit) {
    const domainAccess = evaluateDomainAccess(pathname, hostContext.domainTarget);
    if (!domainAccess.allow && domainAccess.redirectPath) {
      if (hostContext.domainTarget === 'mxtr' && pathname.startsWith('/admin')) {
        return redirectToHost(request, 'remote.mxtr.uz', pathname, request.nextUrl.search);
      }

      if (hostContext.domainTarget === 'mxtr' && pathname.startsWith('/agency')) {
        return redirectToHost(request, 'agency.mxtr.uz', pathname, request.nextUrl.search);
      }

      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = domainAccess.redirectPath;
      redirectUrl.search = '';
      return NextResponse.redirect(redirectUrl);
    }
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

  const { supabaseResponse, user, supabase } = await updateSession(request);

  if (pathname.startsWith('/agency')) {
    if (!user) {
      const forceMxtrHost = hostContext.domainTarget === 'agency' && !hostContext.isDevelopmentHost;
      return redirectToProfile(request, forceMxtrHost);
    }

    let role: string | null = null;
    if (supabase) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (!error) {
        role = profile?.role ?? null;
      }
    }

    if (role !== 'agency_manager') {
      if (role === 'admin' && hostContext.domainTarget === 'agency' && !hostContext.isDevelopmentHost) {
        return redirectToHost(request, 'remote.mxtr.uz', '/admin');
      }

      const forceMxtrHost = hostContext.domainTarget === 'agency' && !hostContext.isDevelopmentHost;
      return redirectToProfile(request, forceMxtrHost);
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
