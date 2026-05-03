'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, MapPin, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { formatDate, formatPrice, placeholderImage } from '@/lib/utils';
import { deleteTourAction } from '@/features/tours/actions';

type TourStatus = 'draft' | 'pending' | 'published' | 'archived';

interface AgencyToursContentProps {
  tours: {
    id: string;
    title: string;
    status: string;
    cover_image_url: string | null;
    is_featured?: boolean | null;
    country?: string | null;
    region?: string | null;
    city?: string | null;
    departure_date?: string | null;
    seats_left?: number | null;
    price: number;
    currency?: string | null;
  }[];
}

const STATUS_FILTERS: Array<TourStatus> = ['pending', 'published', 'draft', 'archived'];

export function AgencyToursContent({ tours }: AgencyToursContentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TourStatus>('all');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totals = useMemo(() => {
    const initial = {
      total: tours.length,
      pending: 0,
      published: 0,
      draft: 0,
      archived: 0,
    };
    for (const tour of tours) {
      if (tour.status === 'pending') initial.pending += 1;
      if (tour.status === 'published') initial.published += 1;
      if (tour.status === 'draft') initial.draft += 1;
      if (tour.status === 'archived') initial.archived += 1;
    }
    return initial;
  }, [tours]);

  const filteredTours = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tours.filter((tour) => {
      if (statusFilter !== 'all' && tour.status !== statusFilter) {
        return false;
      }
      if (!query) return true;
      return tour.title.toLowerCase().includes(query);
    });
  }, [search, statusFilter, tours]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteTourAction(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (result.error) {
      toast.error('Tizimda xatolik');
      return;
    }
    toast.success(t.agencyTours.tourDeleted);
    router.refresh();
  }

  const hasFilters = search.trim().length > 0 || statusFilter !== 'all';

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100/60 p-5 shadow-[0_24px_56px_-36px_rgba(15,23,42,0.5)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t.agencyTours.title}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {t.agencyTours.listSubtitle}
            </p>
          </div>
          <Link href="/agency/tours/new">
            <Button className="h-10 rounded-xl px-4">
              <Plus className="mr-2 h-4 w-4" />
              {t.agencyTours.newTour}
            </Button>
          </Link>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <Card className="border-slate-200 bg-white/90">
            <CardContent className="p-3">
              <p className="text-xs text-slate-500">{t.agencyTours.statsTotal}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{totals.total}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/70">
            <CardContent className="p-3">
              <p className="text-xs text-amber-700">{t.agencyTours.statsPending}</p>
              <p className="mt-1 text-xl font-bold text-amber-800">{totals.pending}</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50/70">
            <CardContent className="p-3">
              <p className="text-xs text-emerald-700">{t.agencyTours.statsPublished}</p>
              <p className="mt-1 text-xl font-bold text-emerald-800">{totals.published}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-slate-100/80">
            <CardContent className="p-3">
              <p className="text-xs text-slate-600">{t.agencyTours.statsDraft}</p>
              <p className="mt-1 text-xl font-bold text-slate-700">{totals.draft}</p>
            </CardContent>
          </Card>
          <Card className="border-rose-200 bg-rose-50/70">
            <CardContent className="p-3">
              <p className="text-xs text-rose-700">{t.agencyTours.statsArchived}</p>
              <p className="mt-1 text-xl font-bold text-rose-800">{totals.archived}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.agencyTours.searchPlaceholder}
              className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
              onClick={() => setStatusFilter('all')}
            >
              {t.common.all}
            </Button>
            {STATUS_FILTERS.map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => setStatusFilter(status)}
              >
                {t.statusLabels[status]}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {filteredTours.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTours.map((tour) => (
            <Card
              key={tour.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_40px_-34px_rgba(15,23,42,0.65)] transition-all hover:-translate-y-0.5 hover:shadow-[0_26px_44px_-32px_rgba(15,23,42,0.68)]"
            >
              <CardContent className="p-0">
                <div className="flex">
                  <div className="relative w-32 shrink-0">
                    <Image
                      src={tour.cover_image_url || placeholderImage(200, 200, tour.title)}
                      alt={tour.title}
                      fill
                      className="object-cover"
                    />
                    {tour.is_featured && (
                      <div className="absolute left-2 top-2 rounded-full bg-violet-600/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {t.common.featured}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{tour.title}</h3>
                      <StatusBadge status={tour.status} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      {(tour.country || tour.region) && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {tour.region || tour.country}
                          {tour.city ? `, ${tour.city}` : ''}
                        </span>
                      )}
                      {tour.departure_date && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(tour.departure_date)}
                        </span>
                      )}
                      {tour.seats_left != null && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {tour.seats_left}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">
                        {formatPrice(tour.price, tour.currency)}
                      </span>
                      <div className="flex gap-1.5">
                        <Link href={`/agency/tours/${tour.id}/edit`}>
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget({ id: tour.id, title: tour.title })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tours.length > 0 && hasFilters ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-7">
          <EmptyState
            title={t.agencyTours.noFilteredTours}
            description={t.agencyTours.noFilteredToursHint}
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
              >
                {t.agencyTours.resetFilters}
              </Button>
            }
          />
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-7">
          <EmptyState
            title={t.agencyTours.noTours}
            description={t.agencyTours.noToursHint}
            action={
              <Link href="/agency/tours/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t.agencyTours.createTour}
                </Button>
              </Link>
            }
          />
        </section>
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
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? t.agencyTours.deleting : t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
