'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { useTranslation } from '@/lib/i18n';
import { formatPrice, formatDate } from '@/lib/utils';
import { Plus, Pencil } from 'lucide-react';

interface AgencyToursContentProps {
  tours: any[];
}

export function AgencyToursContent({ tours }: AgencyToursContentProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t.agencyTours.title}</h1>
          <p className="text-sm text-muted-foreground">{tours.length} {t.nav.tours.toLowerCase()}</p>
        </div>
        <Link href="/agency/tours/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" /> {t.agencyTours.newTour}
          </Button>
        </Link>
      </div>

      {tours.length > 0 ? (
        <div className="space-y-3">
          {tours.map((tour) => (
            <Card key={tour.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{tour.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tour.country}{tour.city ? `, ${tour.city}` : ''}
                      {tour.departure_date ? ` · ${formatDate(tour.departure_date)}` : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge status={tour.status} />
                      <span className="text-sm font-medium">
                        {formatPrice(tour.price, tour.currency)}
                      </span>
                      {tour.is_featured && (
                        <span className="text-[10px] text-amber-600 font-medium">★ {t.common.featured}</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/agency/tours/${tour.id}/edit`}>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t.agencyTours.noTours}
          description={t.agencyTours.noToursHint}
          action={
            <Link href="/agency/tours/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> {t.agencyTours.createTour}
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
