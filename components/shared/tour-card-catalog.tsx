'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, ShieldAlert } from 'lucide-react';
import { VerifiedBadge } from '@/components/shared/verified-badge';
import { placeholderImage } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useFavorites } from '@/hooks/use-favorites';
import { useFollows } from '@/hooks/use-follows';
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
      const parsed = tour.destinations.map(d => {
        const parts = d.split(' - ');
        return { country: parts[0], city: parts[1] || '' };
      });
      const countries = [...new Set(parsed.map(p => p.country))];
      const cities = parsed.map(p => p.city).filter(Boolean);
      if (cities.length > 0) {
        const countryStr = countries.join(', ');
        const cityStr = cities.join(', ');
        return `${cityStr}, ${countryStr}`;
      }
      return countries.join(', ');
    }
    return [tour.city, tour.country].filter(Boolean).join(', ');
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
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(tour.id); }}
            className="p-2 bg-surface/90 backdrop-blur rounded-full text-foreground shadow-ambient hover:bg-surface transition-colors"
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
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-tertiary/90 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
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
        {/* Title */}
        <div className="mb-1">
          <h3 className="text-lg font-bold text-foreground leading-tight line-clamp-2">
            {tour.title}
          </h3>
        </div>

        {/* Location + Duration */}
        <p className="text-muted-foreground text-sm mb-3">
          {location}
          {nightsText ? ` • ${nightsText}` : ''}
        </p>

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
