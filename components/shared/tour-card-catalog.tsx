'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, MapPin, Zap, Flame } from 'lucide-react';
import { VerifiedBadge } from '@/components/shared/verified-badge';
import { placeholderImage, formatPrice } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { pickTourTitle } from '@/lib/i18n/tour-i18n';
import { useFavorites } from '@/hooks/use-favorites';
import { useFollows } from '@/hooks/use-follows';
import type { Tour } from '@/types';

interface TourCardCatalogProps {
  tour: Tour;
  isPromoted?: boolean;
  isHotDeal?: boolean;
  isHotTour?: boolean;
}

export function TourCardCatalog({ tour, isPromoted, isHotDeal, isHotTour }: TourCardCatalogProps) {
  const { t, language } = useTranslation();
  const title = pickTourTitle(tour, language);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isFollowing, toggleFollow } = useFollows();
  const agencyName = tour.agency?.name ?? 'Agency';
  const isVerified = tour.agency?.is_verified ?? false;
  const agencySlug = tour.agency?.slug;
  const agencyLogo = tour.agency?.logo_url;
  const agencyId = tour.agency?.id;
  const nightsText = tour.duration_days
    ? `${tour.duration_days} ${t.common.days}${tour.duration_nights ? ` | ${tour.duration_nights} ${t.common.nights}` : ''}`
    : null;
  const location = (() => {
    if (tour.tour_type === 'domestic') {
      return [tour.district, tour.region || 'O\'zbekiston'].filter(Boolean).join(', ');
    }
    const parts = [tour.city, ...(tour.destinations ?? [])].filter((c): c is string => Boolean(c));
    const unique = [...new Set(parts.map(p => p.includes(' - ') ? p.split(' - ')[1] || p : p))];
    return unique.length > 0 ? unique.join(', ') : (tour.country || '');
  })();
  const liked = isFavorite(tour.id);

  return (
    <div className="group relative overflow-hidden rounded-[1.6rem] bg-white/92 shadow-[0_28px_48px_-32px_rgba(15,23,42,0.62)] market-subtle-border transition-transform duration-300 hover:-translate-y-0.5">
      {/* Agency Header */}
      <div className="flex items-center gap-2.5 px-4 py-3.5">
        <Link
          href={agencySlug ? `/agencies/${agencySlug}` : '#'}
          className="flex items-center gap-2.5 flex-1 min-w-0"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-muted shrink-0">
            {agencyLogo ? (
              <Image
                src={agencyLogo}
                alt={agencyName}
                width={32}
                height={32}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center">
                <span className="text-white font-bold text-xs">{agencyName?.[0]?.toUpperCase() || 'M'}</span>
              </div>
            )}
          </div>
          <span className="text-sm font-semibold truncate">{agencyName}</span>
          {isVerified && <VerifiedBadge size="sm" />}
        </Link>
        {agencyId && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFollow(agencyId); }}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
              isFollowing(agencyId)
                ? 'text-slate-500 bg-slate-100'
                : 'text-primary bg-primary/10'
            }`}
          >
            {isFollowing(agencyId) ? t.agencyProfile.following : t.agencyProfile.follow}
          </button>
        )}
      </div>

      {/* Image */}
      <div className="relative aspect-[5/4] md:aspect-[4/3] w-full overflow-hidden">
        <Image
          src={tour.cover_image_url || placeholderImage(800, 1000, title)}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Promoted/featured star badge */}
        {(tour.is_featured || isPromoted) && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center justify-center p-1.5 bg-gradient-to-br from-amber-400 to-yellow-500 backdrop-blur rounded-full shadow-lg">
              <Star className="h-4 w-4 text-white fill-white" />
            </span>
          </div>
        )}
        {/* Hot deal lightning badge */}
        {isHotDeal && !tour.is_featured && !isPromoted && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center justify-center p-1.5 bg-gradient-to-br from-blue-400 to-indigo-500 backdrop-blur rounded-full shadow-lg">
              <Zap className="h-4 w-4 text-white fill-white" />
            </span>
          </div>
        )}
        {/* Hot tour fire badge */}
        {isHotTour && !isHotDeal && !tour.is_featured && !isPromoted && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center justify-center p-1.5 bg-gradient-to-br from-orange-400 to-red-500 backdrop-blur rounded-full shadow-lg">
              <Flame className="h-4 w-4 text-white fill-white" />
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <Link href={`/tours/${tour.slug}`} className="block p-4 md:p-5">
        {/* Title + Favorites */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-lg font-bold text-foreground leading-tight line-clamp-2">
            {title}
          </h3>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(tour.id); }}
            className="shrink-0 mt-0.5"
          >
            <Heart className={`h-5 w-5 ${liked ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
          </button>
        </div>

        {/* Location + Duration */}
        <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{location}</span>
          {nightsText ? <span className="shrink-0"> • {nightsText}</span> : null}
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between border-t border-slate-200/70 pt-3">
          <div>
            {tour.old_price && tour.old_price > tour.price && (
              <span className="text-xs text-muted-foreground line-through block mb-0.5">
                {formatPrice(tour.old_price, tour.currency)}
              </span>
            )}
            <span className="text-xl font-bold text-primary">
              {formatPrice(tour.price, tour.currency)}
            </span>
            <span className="ml-1 text-xs text-muted-foreground">{t.common.from}</span>
          </div>
          <span className="rounded-lg bg-[linear-gradient(120deg,#0f648f,#0e7ca4)] px-4 py-2 text-sm font-semibold text-white transition-colors">
            {t.common.viewDetails}
          </span>
        </div>
      </Link>
    </div>
  );
}
