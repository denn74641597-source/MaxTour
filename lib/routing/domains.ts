import type { DomainTarget, HostContext } from '@/types/shared';

const PUBLIC_WEB_HOSTS = new Set(['mxtr.uz', 'www.mxtr.uz']);
const ADMIN_WEB_HOSTS = new Set(['remote.mxtr.uz']);

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
