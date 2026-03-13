'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, ShieldAlert } from 'lucide-react';
import { VerifiedBadge } from '@/components/shared/verified-badge';
import { placeholderImage } from '@/lib/utils';
import { hapticFeedback } from '@/lib/telegram';
import { useTranslation } from '@/lib/i18n';
import { useFavorites } from '@/hooks/use-favorites';
import type { Tour, TourHotel } from '@/types';

interface TourCardCatalogProps {
  tour: Tour;
}

function getMaxHotelStars(tour: Tour): number | null {
  const hotels = (tour.hotels as TourHotel[]) ?? [];
  if (hotels.length > 0) {
    const maxStars = Math.max(...hotels.filter(h => h.stars).map(h => h.stars!));
    return maxStars > 0 ? maxStars : null;
  }
  return tour.hotel_stars ?? null;
}

export function TourCardCatalog({ tour }: TourCardCatalogProps) {
  const { t } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const agencyName = tour.agency?.name ?? 'Agency';
  const isVerified = tour.agency?.is_verified ?? false;
  const isApproved = tour.agency?.is_approved ?? false;
  const nightsText = tour.duration_days
    ? `${tour.duration_days} ${tour.duration_days > 1 ? t.common.nights : t.common.night}`
    : null;
  const location = [tour.city, tour.country].filter(Boolean).join(', ');
  const maxStars = getMaxHotelStars(tour);
  const liked = isFavorite(tour.id);

  return (
    <div className="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
      {/* Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <Image
          src={tour.cover_image_url || placeholderImage(800, 450, tour.title)}
          alt={tour.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 480px"
        />

        {/* Favorite button */}
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); hapticFeedback('light'); toggleFavorite(tour.id); }}
            className="p-2 bg-white/90 backdrop-blur rounded-full text-slate-900 shadow-lg hover:bg-white transition-colors"
          >
            <Heart className={`h-5 w-5 ${liked ? 'text-red-500 fill-red-500' : ''}`} />
          </button>
        </div>

        {/* Verified / Unverified badge */}
        {isVerified && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/90 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
              <VerifiedBadge size="sm" className="text-white h-3 w-3" />
              {t.common.verified}
            </span>
          </div>
        )}
        {!isVerified && isApproved && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/90 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
              <ShieldAlert className="h-3 w-3" />
            </span>
          </div>
        )}

        {/* Featured badge */}
        {tour.is_featured && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2.5 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
              {t.common.premiumSelection}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <Link href={`/tours/${tour.slug}`} className="block p-4">
        {/* Title + Rating */}
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-lg font-bold text-slate-900 leading-tight line-clamp-2 flex-1 mr-2">
            {tour.title}
          </h3>
          {maxStars && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-400/10 text-yellow-700 rounded text-xs font-bold shrink-0">
              <Star className="h-3 w-3 fill-current" />
              {maxStars.toFixed(1)}
            </div>
          )}
        </div>

        {/* Location + Duration */}
        <p className="text-slate-500 text-sm mb-3">
          {location}
          {nightsText ? ` • ${nightsText}` : ''}
        </p>

        {/* Agency */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-slate-400">{t.common.by}</span>
          <span className="text-xs font-semibold text-slate-700">{agencyName}</span>
          {isVerified && <VerifiedBadge size="sm" />}
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <span className="text-xs text-slate-400 block">{t.common.from}</span>
            {tour.old_price && tour.old_price > tour.price && (
              <span className="text-xs text-slate-400 line-through mr-1">
                ${tour.old_price.toLocaleString()}
              </span>
            )}
            <span className="text-xl font-bold text-primary">
              ${tour.price.toLocaleString()}
            </span>
          </div>
          <span className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors">
            {t.common.viewDetails}
          </span>
        </div>
      </Link>
    </div>
  );
}
