import type { AdminTourPanelItem } from '@/features/admin/types';

export type TourStatusKey = 'draft' | 'pending' | 'published' | 'archived';

export interface TourStatusMeta {
  label: string;
  tone: string;
}

export const TOUR_STATUS_META: Record<TourStatusKey, TourStatusMeta> = {
  draft: { label: 'Draft', tone: 'bg-slate-100 text-slate-700 border-slate-200' },
  pending: { label: 'Pending', tone: 'bg-amber-100 text-amber-700 border-amber-200' },
  published: { label: 'Published', tone: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  archived: { label: 'Archived', tone: 'bg-rose-100 text-rose-700 border-rose-200' },
};

export interface TourQualityWarning {
  key: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
}

export function toTourStatus(status: string): TourStatusKey {
  if (status === 'pending') return 'pending';
  if (status === 'published') return 'published';
  if (status === 'archived') return 'archived';
  return 'draft';
}

export function resolveLocation(tour: AdminTourPanelItem): string {
  const tourType = tour.tour_type ?? null;
  if (tourType === 'domestic') {
    const domestic = [tour.district, tour.region]
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .join(', ');
    if (domestic) return domestic;
  }

  const common = [tour.city, tour.country]
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .join(', ');
  if (common) return common;

  return 'Not provided';
}

export function collectTourImageUrls(tour: AdminTourPanelItem): string[] {
  const gallery = (tour.images ?? [])
    .map((item) => item.image_url)
    .filter((url): url is string => typeof url === 'string' && url.trim().length > 0);

  const hotelImages = (tour.hotel_images ?? []).filter(
    (url): url is string => typeof url === 'string' && url.trim().length > 0
  );

  const merged = [tour.cover_image_url, ...gallery, ...hotelImages].filter(
    (url): url is string => typeof url === 'string' && url.trim().length > 0
  );

  return Array.from(new Set(merged));
}

export function buildTourQualityWarnings(tour: AdminTourPanelItem): TourQualityWarning[] {
  const warnings: TourQualityWarning[] = [];
  const allImages = collectTourImageUrls(tour);
  const hasDescription = Boolean(
    (tour.short_description && tour.short_description.trim().length > 0) ||
      (tour.full_description && tour.full_description.trim().length > 0)
  );
  const hasLocation = Boolean(
    (tour.country && tour.country.trim().length > 0) ||
      (tour.city && tour.city.trim().length > 0) ||
      (tour.region && tour.region.trim().length > 0) ||
      (tour.district && tour.district.trim().length > 0)
  );
  const hasOperatorContact = Boolean(
    (tour.operator_phone && tour.operator_phone.trim().length > 0) ||
      (tour.operator_telegram_username &&
        tour.operator_telegram_username.trim().length > 0)
  );
  const hasAgencyContact = Boolean(
    (tour.agency?.phone && tour.agency.phone.trim().length > 0) ||
      (tour.agency?.telegram_username && tour.agency.telegram_username.trim().length > 0)
  );

  if (allImages.length === 0) {
    warnings.push({ key: 'missing-image', label: 'No images attached', severity: 'high' });
  }
  if (tour.price == null || tour.price <= 0) {
    warnings.push({ key: 'missing-price', label: 'Price is missing or zero', severity: 'high' });
  }
  if (!hasLocation) {
    warnings.push({ key: 'missing-location', label: 'Destination is incomplete', severity: 'medium' });
  }
  if (!hasDescription) {
    warnings.push({ key: 'missing-description', label: 'Description is missing', severity: 'medium' });
  }
  if (!tour.agency?.id) {
    warnings.push({ key: 'missing-agency', label: 'Agency relation is missing', severity: 'high' });
  }
  if (
    tour.departure_date &&
    tour.return_date &&
    new Date(tour.return_date).getTime() < new Date(tour.departure_date).getTime()
  ) {
    warnings.push({ key: 'invalid-schedule', label: 'Return date is before departure', severity: 'high' });
  }
  if (tour.agency && tour.agency.is_approved === false) {
    warnings.push({ key: 'agency-unapproved', label: 'Agency is not approved', severity: 'high' });
  }
  if (tour.agency && tour.agency.is_verified === false) {
    warnings.push({ key: 'agency-unverified', label: 'Agency is not verified', severity: 'medium' });
  }
  if (!hasOperatorContact && !hasAgencyContact) {
    warnings.push({ key: 'missing-contact', label: 'No contact information', severity: 'medium' });
  }

  return warnings;
}
