'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n';
import { formatPrice, formatDate } from '@/lib/utils';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { deleteTourAction } from '@/features/tours/actions';
import { toast } from 'sonner';

interface AgencyToursContentProps {
  tours: any[];
}

export function AgencyToursContent({ tours }: AgencyToursContentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteTourAction(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (result.error) {
      toast.error('Tizimda xatolik');
    } else {
      toast.success(t.agencyTours.tourDeleted);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t.agencyTours.title}</h1>
          <p className="text-sm text-muted-foreground">{tours.length} ta tur</p>
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
                        <span className="text-[10px] text-tertiary font-medium">★ {t.common.featured}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Link href={`/agency/tours/${tour.id}/edit`}>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget({ id: tour.id, title: tour.title })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
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

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.agencyTours.deleteTour}</DialogTitle>
            <DialogDescription>
              <strong>{deleteTarget?.title}</strong>
              <br />
              {t.agencyTours.deleteTourConfirm}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t.common.cancel}
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t.agencyTours.deleting : t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
