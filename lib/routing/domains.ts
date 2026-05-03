import type { DomainTarget, HostContext } from '@/types/shared';

const PUBLIC_WEB_HOSTS = new Set(['mxtr.uz', 'www.mxtr.uz']);
const AGENCY_WEB_HOSTS = new Set(['agency.mxtr.uz']);
const ADMIN_WEB_HOSTS = new Set(['remote.mxtr.uz']);
export const AGENCY_PORTAL_ORIGIN = 'https://agency.mxtr.uz';

export function normalizeHostname(rawHost: string | null | undefined): string {
  if (!rawHost) return '';
  return rawHost.split(':')[0]?.trim().toLowerCase() ?? '';
}

export function isDevelopmentHost(hostname: string): boolean {
  if (!hostname) return false;

  return (
    hostname.includes('localhost') ||
    hostname.startsWith('127.0.0.1') ||
    hostname.startsWith('0.0.0.0') ||
    hostname.endsWith('.local')
  );
}

export function resolveDomainTarget(hostname: string): DomainTarget {
  if (ADMIN_WEB_HOSTS.has(hostname)) return 'remote';
  if (AGENCY_WEB_HOSTS.has(hostname)) return 'agency';
  if (PUBLIC_WEB_HOSTS.has(hostname)) return 'mxtr';
  return 'unknown';
}

export function resolveHostContext(rawHost: string | null | undefined): HostContext {
  const hostname = normalizeHostname(rawHost);
  return {
    hostname,
    domainTarget: resolveDomainTarget(hostname),
    isDevelopmentHost: isDevelopmentHost(hostname),
  };
}

export function getAgencyPortalHref(pathname: string = '/agency', currentHostname?: string | null): string {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;

  if (process.env.NODE_ENV !== 'production') {
    return normalizedPath;
  }

  const hostname = normalizeHostname(currentHostname);

  if (hostname && (hostname === 'agency.mxtr.uz' || isDevelopmentHost(hostname))) {
    return normalizedPath;
  }

  return `${AGENCY_PORTAL_ORIGIN}${normalizedPath}`;
}
