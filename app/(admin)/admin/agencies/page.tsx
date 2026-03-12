import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { VerifiedBadge } from '@/components/shared/verified-badge';
import { getAllAgencies } from '@/features/admin/queries';
import { formatDate } from '@/lib/utils';
import { AdminAgencyActions } from './agency-actions';

export default async function AdminAgenciesPage() {
  const agencies = await getAllAgencies();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Agencies</h1>
        <p className="text-sm text-muted-foreground">{agencies.length} total agencies</p>
      </div>

      <div className="space-y-3">
        {agencies.map((agency: any) => (
          <Card key={agency.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-sm truncate">{agency.name}</h3>
                    {agency.is_verified && <VerifiedBadge size="sm" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {agency.city}, {agency.country} · Owner: {agency.owner?.full_name ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created: {formatDate(agency.created_at)}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <StatusBadge status={agency.is_approved ? 'approved' : 'pending'} />
                    {agency.is_verified && <StatusBadge status="verified" />}
                  </div>
                </div>
                <AdminAgencyActions agencyId={agency.id} isApproved={agency.is_approved} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
