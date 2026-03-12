import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { getFeaturedItems } from '@/features/admin/queries';
import { formatDate } from '@/lib/utils';
import { Star } from 'lucide-react';

export default async function AdminFeaturedPage() {
  const items = await getFeaturedItems();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Featured Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage featured tours and agencies on the marketplace
        </p>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item: any) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">
                      {item.tour?.title ?? item.agency?.name ?? 'Item'}
                    </h3>
                    <p className="text-xs text-muted-foreground capitalize">
                      {item.placement_type.replace('_', ' ')} · {formatDate(item.starts_at)} → {formatDate(item.ends_at)}
                    </p>
                  </div>
                  <StatusBadge
                    status={new Date(item.ends_at) > new Date() ? 'active' : 'expired'}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Star className="h-12 w-12 text-muted-foreground/50 mb-4" />}
          title="No featured items"
          description="Add featured placements for tours or agencies."
        />
      )}
    </div>
  );
}
