'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, MapPin, Zap, Flame } from 'lucide-react';
import { VerifiedBadge } from '@/components/shared/verified-badge';
import { placeholderImage, formatComboCities } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useFavorites } from '@/hooks/use-favorites';
import { useFollows } from '@/hooks/use-follows';
import type { Tour, TourHotel } from '@/types';

interface TourCardCatalogProps {
  tour: Tour;
  isPromoted?: boolean;
  isHotDeal?: boolean;
  isHotTour?: boolean;
}

function getMaxHotelStars(tour: Tour): number | null {
  const hotels = (tour.hotels as TourHotel[]) ?? [];
  if (hotels.length > 0) {
    const maxStars = Math.max(...hotels.filter(h => h.stars).map(h => h.stars!));
    return maxStars > 0 ? maxStars : null;
  }
  return tour.hotel_stars ?? null;
}

export function TourCardCatalog({ tour, isPromoted, isHotDeal, isHotTour }: TourCardCatalogProps) {
  const { t } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isFollowing, toggleFollow } = useFollows();
  const agencyName = tour.agency?.name ?? 'Agency';
  const isVerified = tour.agency?.is_verified ?? false;
  const isApproved = tour.agency?.is_approved ?? false;
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
    // Combo tour with destinations
    if (tour.destinations && tour.destinations.length > 1) {
      return formatComboCities(tour.destinations);
    }
    return tour.city || tour.country;
  })();
  const maxStars = getMaxHotelStars(tour);
  const liked = isFavorite(tour.id);

  return (
    <div className="group relative bg-surface rounded-[1.5rem] overflow-hidden shadow-ambient">
      {/* Agency Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5">
        <Link
          href={agencySlug ? `/agencies/${agencySlug}` : '#'}
          className="flex items-center gap-2.5 flex-1 min-w-0"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-muted shrink-0">
            <Image
              src={agencyLogo || placeholderImage(64, 64, agencyName[0])}
              alt={agencyName}
              width={32}
              height={32}
              className="object-cover w-full h-full"
            />
          </div>
          <span className="text-sm font-semibold truncate">{agencyName}</span>
          {isVerified && <VerifiedBadge size="sm" />}
        </Link>
        {agencyId && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFollow(agencyId); }}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
              isFollowing(agencyId)
                ? 'text-muted-foreground bg-muted'
                : 'text-primary bg-primary/10'
            }`}
          >
            {isFollowing(agencyId) ? t.agencyProfile.following : t.agencyProfile.follow}
          </button>
        )}
      </div>

      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden">
        <Image
          src={tour.cover_image_url || placeholderImage(800, 1000, tour.title)}
          alt={tour.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 480px"
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
      <Link href={`/tours/${tour.slug}`} className="block p-4">
        {/* Title + Favorites */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-lg font-bold text-foreground leading-tight line-clamp-2">
            {tour.title}
          </h3>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(tour.id); }}
            className="shrink-0 mt-0.5"
          >
            <Heart className={`h-5 w-5 ${liked ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
          </button>
        </div>

        {/* Location + Duration */}
        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{location}</span>
          {nightsText ? <span className="shrink-0"> • {nightsText}</span> : null}
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-3">
          <div>
            {tour.old_price && tour.old_price > tour.price && (
              <span className="text-xs text-muted-foreground line-through block mb-0.5">
                ${tour.old_price.toLocaleString()}
              </span>
            )}
            <span className="text-xl font-bold text-primary">
              ${tour.price.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground ml-1">{t.common.from}</span>
          </div>
          <span className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors">
            {t.common.viewDetails}
          </span>
        </div>
      </Link>
    </div>
  );
}
