export type DomainTarget = 'mxtr' | 'agency' | 'remote' | 'unknown';

export type RouteArea = 'public' | 'agency' | 'admin';

export interface HostContext {
  hostname: string;
  domainTarget: DomainTarget;
  isDevelopmentHost: boolean;
}
