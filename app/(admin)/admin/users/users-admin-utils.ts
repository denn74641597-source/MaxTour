import type {
  AdminUserAccountState,
  AdminUserActivityStatus,
  AdminUserRole,
} from '@/features/admin/types';

export function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return 'Not available';
  return parsed.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function roleLabel(role: AdminUserRole): string {
  if (role === 'agency_manager') return 'Agency manager';
  if (role === 'admin') return 'Admin';
  return 'User';
}

export function roleTone(role: AdminUserRole): string {
  if (role === 'admin') return 'border-violet-200 bg-violet-50 text-violet-700';
  if (role === 'agency_manager') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

export function accountStateLabel(state: AdminUserAccountState): string {
  if (state === 'deletion_requested') return 'Deletion requested';
  return 'Active';
}

export function accountStateTone(state: AdminUserAccountState): string {
  if (state === 'deletion_requested') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

export function activityLabel(status: AdminUserActivityStatus): string {
  if (status === 'active_30d') return 'Active (30d)';
  if (status === 'quiet_90d') return 'Quiet (31-90d)';
  return 'Dormant (90d+)';
}

export function activityTone(status: AdminUserActivityStatus): string {
  if (status === 'active_30d') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'quiet_90d') return 'border-sky-200 bg-sky-50 text-sky-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

export function safeImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}
