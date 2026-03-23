import { getAllVerificationRequests } from '@/features/verification/actions';
import { AdminVerificationContent } from './admin-verification-content';

export default async function AdminVerificationPage() {
  const requests = await getAllVerificationRequests();
  return <AdminVerificationContent requests={requests} />;
}
