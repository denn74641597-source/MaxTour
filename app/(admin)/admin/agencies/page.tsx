import { getAdminAgenciesOverview } from '@/features/admin/queries';
import { AdminAgenciesContent } from './admin-agencies-content';

export const dynamic = 'force-dynamic';

export default async function AdminAgenciesPage() {
  try {
    const overview = await getAdminAgenciesOverview();
    return (
      <AdminAgenciesContent
        agencies={overview.agencies}
        generatedAt={overview.generatedAt}
      />
    );
  } catch {
    return (
      <AdminAgenciesContent
        agencies={[]}
        generatedAt={new Date().toISOString()}
        loadError="Failed to load agency data. Please refresh."
      />
    );
  }
}
