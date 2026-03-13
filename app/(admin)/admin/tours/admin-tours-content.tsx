'use client';

import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { useTranslation } from '@/lib/i18n';
import { formatDate, formatPrice } from '@/lib/utils';
import { AdminTourActions } from './tour-actions';

interface AdminToursContentProps {
  tours: any[];
}

export function AdminToursContent({ tours }: AdminToursContentProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{t.admin.toursModeration}</h1>
        <p className="text-sm text-muted-foreground">{tours.length} {t.admin.totalToursCount.toLowerCase()}</p>
      </div>

      <div className="space-y-3">
        {tours.map((tour: any) => (
          <Card key={tour.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{tour.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {tour.agency?.name ?? 'Agency'} · {tour.country}
                    {tour.departure_date ? ` · ${formatDate(tour.departure_date)}` : ''}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={tour.status} />
                    <span className="text-xs font-medium">{formatPrice(tour.price, tour.currency)}</span>
                    {tour.is_featured && (
                      <span className="text-[10px] text-amber-600 font-medium">★ {t.common.featured}</span>
                    )}
                  </div>
                </div>
                <AdminTourActions tourId={tour.id} currentStatus={tour.status} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
