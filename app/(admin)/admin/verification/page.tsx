import { getAllVerificationRequests } from '@/features/verification/admin-actions';
import { AdminVerificationContent } from './admin-verification-content';

export const dynamic = 'force-dynamic';

export default async function AdminVerificationPage() {
  try {
    const requests = await getAllVerificationRequests();
    return (
      <AdminVerificationContent
        requests={requests}
        generatedAt={new Date().toISOString()}
      />
    );
  } catch (error) {
    const message =
      error instanceof Error && error.message === 'ADMIN_ACCESS_REQUIRED'
        ? 'Admin access is required to view verification requests.'
        : 'Failed to load verification requests. Please refresh.';
    return (
      <AdminVerificationContent
        requests={[]}
        generatedAt={new Date().toISOString()}
        loadError={message}
      />
    );
  }
}
