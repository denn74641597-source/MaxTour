import { getAccountDeletionPanelData } from '@/features/account-deletions/actions';
import { AdminAccountDeletionsContent } from './admin-account-deletions-content';

export const dynamic = 'force-dynamic';

export default async function AdminAccountDeletionsPage() {
  const payload = await getAccountDeletionPanelData();
  return <AdminAccountDeletionsContent payload={payload} />;
}
