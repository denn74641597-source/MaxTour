import { getAllUsers } from '@/features/admin/queries';
import { AdminUsersContent } from './admin-users-content';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  try {
    const users = await getAllUsers();
    return <AdminUsersContent users={users} />;
  } catch {
    return <AdminUsersContent users={[]} />;
  }
}
