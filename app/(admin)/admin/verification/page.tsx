import { getAllVerificationRequests } from '@/features/verification/actions';
import { AdminVerificationContent } from './admin-verification-content';

export const dynamic = 'force-dynamic';

export default async function AdminVerificationPage() {
  const requests = await getAllVerificationRequests();
  return <AdminVerificationContent requests={requests} />;
}
