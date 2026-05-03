'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import {
  Calendar,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  Globe2,
  ImageIcon,
  Info,
  MapPin,
  MessageSquare,
  Phone,
  ShieldAlert,
  Sparkles,
  Tag,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { formatDate, formatPrice, formatNumber, placeholderImage } from '@/lib/utils';
import type { AdminTourPanelItem } from '@/features/admin/types';
import {
  buildTourQualityWarnings,
  collectTourImageUrls,
  resolveLocation,
  TourStatusKey,
} from './tour-admin-utils';
import { TourStatusBadge } from './tour-status-badge';

interface TourDetailSheetProps {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  tour: AdminTourPanelItem | null;
  onRequestStatusChange: (tour: AdminTourPanelItem, nextStatus: TourStatusKey) => void;
  statusBusy: boolean;
}

export function TourDetailSheet({
  open,
  onOpenChange,
  tour,
  onRequestStatusChange,
  statusBusy,
}: TourDetailSheetProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const imageUrls = useMemo(() => (tour ? collectTourImageUrls(tour) : []), [tour]);
  const warnings = useMemo(() => (tour ? buildTourQualityWarnings(tour) : []), [tour]);

  if (!tour) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-[740px]">
          <div className="p-6 text-sm text-slate-500">Tour not available.</div>
        </SheetContent>
      </Sheet>
    );
  }

  const location = resolveLocation(tour);
  const leadCount = tour.leadSummary.count;
  const activePromotionCount = tour.activePromotions.length;
  const contactString = [tour.operator_phone, tour.operator_telegram_username]
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .join(' | ');
  const publicLink = `https://mxtr.uz/tours/${tour.slug}`;
  const canCopyContact = contactString.trim().length > 0;

  function copyText(value: string, label: string) {
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success(`${label} copied`))
      .catch(() => toast.error(`Could not copy ${label.toLowerCase()}`));
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-[840px]">
          <SheetHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-5 text-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <SheetTitle className="text-xl font-semibold text-white">
                  {tour.title}
                </SheetTitle>
                <SheetDescription className="text-slate-300">
                  Moderation, quality control, and marketplace operations.
                </SheetDescription>
              </div>
              <div className="flex items-center gap-2">
                <TourStatusBadge status={tour.status} />
                {tour.is_featured ? (
                  <Badge className="bg-violet-500/20 text-violet-100">Featured</Badge>
                ) : null}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-200">
              <span className="rounded-full border border-slate-600 bg-slate-800/70 px-2 py-1">
                ID: {tour.id}
              </span>
              <span className="rounded-full border border-slate-600 bg-slate-800/70 px-2 py-1">
                {location}
              </span>
              <span className="rounded-full border border-slate-600 bg-slate-800/70 px-2 py-1">
                {formatPrice(tour.price ?? 0, tour.currency)}
              </span>
            </div>
          </SheetHeader>

          <div className="space-y-5 p-5">
            <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
              <div className="rounded-2xl border border-slate-200 bg-slate-100 p-1">
                <PreviewImage
                  src={imageUrls[0] ?? placeholderImage(1200, 700, 'No Cover')}
                  alt={tour.title}
                  onClick={() => setPreviewImage(imageUrls[0] ?? null)}
                  className="h-[240px] md:h-[300px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {imageUrls.slice(1, 5).map((url) => (
                  <PreviewImage
                    key={url}
                    src={url}
                    alt={tour.title}
                    onClick={() => setPreviewImage(url)}
                    className="h-[116px]"
                  />
                ))}
                {imageUrls.length <= 1 ? (
                  <div className="col-span-2 flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
                    Gallery not provided
                  </div>
                ) : null}
              </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList variant="line" className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Itinerary & Details</TabsTrigger>
                <TabsTrigger value="agency">Agency</TabsTrigger>
                <TabsTrigger value="moderation">Moderation</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="quality">Quality</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Stat label="Price" value={formatPrice(tour.price ?? 0, tour.currency)} icon={<Tag className="h-4 w-4" />} />
                  <Stat label="Departure" value={tour.departure_date ? formatDate(tour.departure_date) : 'Not provided'} icon={<Calendar className="h-4 w-4" />} />
                  <Stat
                    label="Duration"
                    value={
                      tour.duration_days
                        ? `${tour.duration_days} days${tour.duration_nights ? ` / ${tour.duration_nights} nights` : ''}`
                        : 'Not provided'
                    }
                    icon={<Clock3 className="h-4 w-4" />}
                  />
                  <Stat
                    label="Seats"
                    value={
                      tour.seats_total != null || tour.seats_left != null
                        ? `${tour.seats_left ?? 'Not set'} / ${tour.seats_total ?? 'Not set'}`
                        : 'Not provided'
                    }
                    icon={<Users className="h-4 w-4" />}
                  />
                  <Stat label="Category" value={tour.category ?? 'Not provided'} icon={<Sparkles className="h-4 w-4" />} />
                  <Stat label="Location" value={location} icon={<MapPin className="h-4 w-4" />} />
                </div>
                <InfoBlock
                  title="Description"
                  icon={<Info className="h-4 w-4 text-slate-500" />}
                  value={tour.full_description || tour.short_description || 'Not provided'}
                />
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <InfoBlock
                  title="Included services"
                  icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                  value={
                    tour.included_services.length > 0
                      ? tour.included_services.join(', ')
                      : 'Not provided'
                  }
                />
                <InfoBlock
                  title="Excluded services"
                  icon={<XCircle className="h-4 w-4 text-rose-600" />}
                  value={
                    tour.excluded_services.length > 0
                      ? tour.excluded_services.join(', ')
                      : 'Not provided'
                  }
                />
                <InfoBlock
                  title="Destinations"
                  icon={<Globe2 className="h-4 w-4 text-slate-500" />}
                  value={
                    tour.destinations.length > 0 ? tour.destinations.join(', ') : 'Not provided'
                  }
                />
                <InfoBlock
                  title="Additional info"
                  icon={<MessageSquare className="h-4 w-4 text-slate-500" />}
                  value={tour.additional_info || 'Not provided'}
                />
              </TabsContent>

              <TabsContent value="agency" className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {tour.agency?.name ?? 'Not linked'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {tour.agency?.slug ? `/${tour.agency.slug}` : 'Slug not provided'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tour.agency?.is_verified ? (
                        <Badge className="bg-sky-100 text-sky-700">Verified</Badge>
                      ) : (
                        <Badge variant="outline">Not verified</Badge>
                      )}
                      {tour.agency?.is_approved ? (
                        <Badge className="bg-emerald-100 text-emerald-700">Approved</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700">Not approved</Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      {tour.agency?.phone || 'Not provided'}
                    </p>
                    <p className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-slate-400" />
                      {tour.agency?.telegram_username || 'Not provided'}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyText(publicLink, 'Tour link')}>
                      <Copy className="h-3.5 w-3.5" />
                      Copy tour link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canCopyContact}
                      onClick={() => copyText(contactString, 'Contact')}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy contact
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.location.href = '/admin/agencies';
                      }}
                    >
                      View agencies
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="moderation" className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <Button
                    disabled={statusBusy || tour.status === 'published'}
                    onClick={() => onRequestStatusChange(tour, 'published')}
                  >
                    Publish
                  </Button>
                  <Button
                    variant="outline"
                    disabled={statusBusy || tour.status === 'pending'}
                    onClick={() => onRequestStatusChange(tour, 'pending')}
                  >
                    Move to pending
                  </Button>
                  <Button
                    variant="outline"
                    disabled={statusBusy || tour.status === 'draft'}
                    onClick={() => onRequestStatusChange(tour, 'draft')}
                  >
                    Save as draft
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={statusBusy || tour.status === 'archived'}
                    onClick={() => onRequestStatusChange(tour, 'archived')}
                  >
                    Archive
                  </Button>
                </div>
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
                  Featured or promotion mutation is not wired in existing admin server actions, so this panel
                  shows promotion data read-only.
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Stat label="Views" value={formatNumber(tour.view_count)} icon={<Eye className="h-4 w-4" />} />
                  <Stat label="Leads" value={formatNumber(leadCount)} icon={<Users className="h-4 w-4" />} />
                  <Stat
                    label="Latest lead"
                    value={tour.leadSummary.latestLeadAt ? formatDate(tour.leadSummary.latestLeadAt) : 'Not available'}
                    icon={<Clock3 className="h-4 w-4" />}
                  />
                  <Stat
                    label="Active promotions"
                    value={formatNumber(activePromotionCount)}
                    icon={<Sparkles className="h-4 w-4" />}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.location.href = `/admin/leads?tourId=${tour.id}`;
                    }}
                  >
                    Open leads
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(publicLink, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    View public page
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="quality" className="space-y-3">
                {warnings.length === 0 ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    No quality warnings detected.
                  </div>
                ) : (
                  warnings.map((warning) => (
                    <div
                      key={warning.key}
                      className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
                    >
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-medium">{warning.label}</p>
                        <p className="text-xs uppercase tracking-wide text-amber-700">
                          {warning.severity} severity
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={Boolean(previewImage)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPreviewImage(null);
        }}
      >
        <DialogContent className="max-w-4xl bg-black p-2">
          <DialogHeader>
            <DialogTitle className="sr-only">Image preview</DialogTitle>
          </DialogHeader>
          {previewImage ? (
            <div className="relative h-[70vh] overflow-hidden rounded-xl">
              <Image
                src={previewImage}
                alt={tour.title}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-1 flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="line-clamp-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function InfoBlock({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-900">
        {icon}
        {title}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{value}</p>
    </div>
  );
}

function PreviewImage({
  src,
  alt,
  className,
  onClick,
}: {
  src: string;
  alt: string;
  className: string;
  onClick: () => void;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-xl bg-slate-200 ${className}`}
    >
      {failed ? (
        <div className="flex h-full items-center justify-center text-slate-500">
          <ImageIcon className="h-6 w-6" />
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          onError={() => setFailed(true)}
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
          sizes="50vw"
        />
      )}
    </button>
  );
}
