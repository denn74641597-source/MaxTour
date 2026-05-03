import { getAdminAuditPayload } from '@/features/admin/audit-log';
import { AuditLogContent } from './audit-log-content';

export const dynamic = 'force-dynamic';

export default async function AdminAuditLogPage() {
  try {
    const payload = await getAdminAuditPayload();
    return <AuditLogContent initialPayload={payload} />;
  } catch (error) {
    const message =
      error instanceof Error && error.message === 'ADMIN_ACCESS_REQUIRED'
        ? 'Admin access is required to view the audit log.'
        : 'Failed to load audit sources. Please refresh this page.';

    return <AuditLogContent loadError={message} />;
  }
}
