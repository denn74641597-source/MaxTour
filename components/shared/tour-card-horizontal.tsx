'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Heart, ShieldAlert } from 'lucide-react';
import { VerifiedBadge } from '@/components/shared/verified-badge';
import { formatPrice, placeholderImage } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useFavorites } from '@/hooks/use-favorites';
import { useFollows } from '@/hooks/use-follows';
import type { Tour } from '@/types';

interface TourCardHorizontalProps {
  tour: Tour;
}

export function TourCardHorizontal({ tour }: TourCardHorizontalProps) {
  const { t } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isFollowing, toggleFollow, loading: followsLoading } = useFollows();
  const agencyName = tour.agency?.name ?? 'Agency';
  const isVerified = tour.agency?.is_verified ?? false;
  const isApproved = tour.agency?.is_approved ?? false;
  const agencySlug = tour.agency?.slug;
  const agencyLogo = tour.agency?.logo_url;
  const agencyId = tour.agency?.id;
  const liked = isFavorite(tour.id);

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
      {/* Agency Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-50">
        <Link
          href={agencySlug ? `/agencies/${agencySlug}` : '#'}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
            <Image
              src={agencyLogo || placeholderImage(56, 56, agencyName[0])}
              alt={agencyName}
              width={28}
              height={28}
              className="object-cover w-full h-full"
            />
          </div>
          <span className="text-xs font-semibold truncate">{agencyName}</span>
          {isVerified && <VerifiedBadge size="sm" />}
        </Link>
        {agencyId && !followsLoading && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFollow(agencyId); }}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors ${
              isFollowing(agencyId)
                ? 'text-slate-500 bg-slate-100'
                : 'text-primary bg-primary/10'
            }`}
          >
            {isFollowing(agencyId) ? t.agencyProfile.following : t.agencyProfile.follow}
          </button>
        )}
      </div>

      <Link href={`/tours/${tour.slug}`}>
        <div className="flex">
        {/* Image */}
        <div className="w-1/3 relative min-h-[120px]">
          <Image
            src={tour.cover_image_url || placeholderImage(300, 300, tour.title)}
            alt={tour.title}
            fill
            className="object-cover"
            sizes="120px"
          />
          {isVerified && (
            <div className="absolute top-2 left-2 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <VerifiedBadge size="sm" className="text-white h-2.5 w-2.5" />
              {t.common.verified}
            </div>
          )}
          {!isVerified && isApproved && (
            <div className="absolute top-2 left-2 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <ShieldAlert className="h-2.5 w-2.5" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="w-2/3 p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-sm leading-tight line-clamp-2 flex-1 mr-2">
                {tour.title}
              </h4>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(tour.id); }}
                className="shrink-0 mt-0.5"
              >
                <Heart className={`h-4 w-4 ${liked ? 'text-red-500 fill-red-500' : 'text-slate-300'}`} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {tour.tour_type === 'domestic'
                ? `${tour.district ? `${tour.district}, ` : ''}${tour.region || 'O\'zbekiston'}`
                : `${tour.city ? `${tour.city}, ` : ''}${tour.country}`
              }
            </p>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              {tour.old_price && tour.old_price > tour.price && (
                <p className="text-xs text-slate-400 line-through">
                  {formatPrice(tour.old_price, tour.currency)}
                </p>
              )}
              <p className="text-lg font-bold text-primary">
                {formatPrice(tour.price, tour.currency)}
              </p>
            </div>
            <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold">
              {t.common.book}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
