import type { NextRequest } from 'next/server';
import type { DomainTarget, RouteArea } from '@/types/shared';
import { resolveHostContext } from './domains';

const INTERNAL_PATH_PREFIXES = ['/_next', '/api', '/favicon.ico'];
const STATIC_FILE_PATTERN = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|json)$/i;

export function isStaticOrInternalPath(pathname: string): boolean {
  if (INTERNAL_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  return STATIC_FILE_PATTERN.test(pathname);
}

export function resolveRouteArea(pathname: string): RouteArea {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/agency')) return 'agency';
  return 'public';
}

export function evaluateDomainAccess(
  pathname: string,
  domainTarget: DomainTarget
): { allow: boolean; redirectPath?: string } {
  if (domainTarget === 'remote') {
    if (pathname === '/') return { allow: false, redirectPath: '/admin' };
    if (!pathname.startsWith('/admin')) {
      return { allow: false, redirectPath: '/admin' };
    }
    return { allow: true };
  }

  if (domainTarget === 'agency') {
    if (pathname === '/') return { allow: false, redirectPath: '/agency' };
    if (!pathname.startsWith('/agency')) {
      return { allow: false, redirectPath: '/agency' };
    }
    return { allow: true };
  }

  if (domainTarget === 'mxtr' && (pathname.startsWith('/admin') || pathname.startsWith('/agency'))) {
    return { allow: false, redirectPath: '/' };
  }

  return { allow: true };
}

export function getHostContextFromRequest(request: NextRequest) {
  return resolveHostContext(request.headers.get('host'));
}
