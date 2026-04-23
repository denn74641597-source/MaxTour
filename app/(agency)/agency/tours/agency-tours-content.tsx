'use client';

import Link from 'next/link';
import Image from 'next/image';
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
import { formatPrice, formatDate, placeholderImage } from '@/lib/utils';
import { Plus, Pencil, Trash2, MapPin, CalendarDays, Users } from 'lucide-react';
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
        <div className="space-y-3 md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-3 md:space-y-0">
          {tours.map((tour) => (
            <Card key={tour.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex gap-0">
                  {/* Tour Image */}
                  <div className="relative w-28 shrink-0">
                    <Image
                      src={tour.cover_image_url || placeholderImage(200, 200, tour.title)}
                      alt={tour.title}
                      fill
                      className="object-cover"
                    />
                    {tour.is_featured && (
                      <div className="absolute top-1.5 left-1.5 bg-tertiary/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        ★ {t.common.featured}
                      </div>
                    )}
                  </div>
                  {/* Tour Info */}
                  <div className="flex-1 min-w-0 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2">{tour.title}</h3>
                      <StatusBadge status={tour.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                      {(tour.country || tour.region) && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {tour.region || tour.country}{tour.city ? `, ${tour.city}` : ''}
                        </span>
                      )}
                      {tour.departure_date && (
                        <span className="flex items-center gap-0.5">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(tour.departure_date)}
                        </span>
                      )}
                      {tour.seats_left != null && (
                        <span className="flex items-center gap-0.5">
                          <Users className="h-3 w-3" />
                          {tour.seats_left} ta joy
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-primary">
                        {formatPrice(tour.price, tour.currency)}
                      </span>
                      <div className="flex gap-1.5">
                        <Link href={`/agency/tours/${tour.id}/edit`}>
                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg">
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget({ id: tour.id, title: tour.title })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
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
