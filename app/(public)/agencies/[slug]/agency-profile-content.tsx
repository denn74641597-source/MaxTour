'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Share2, Globe, Instagram, MessageCircle, Phone, Star, Heart, MapPin, Clock, ChevronRight, ExternalLink, ShieldCheck, Send, Loader2, User, CheckCircle2 } from 'lucide-react';
import { VerifiedBadge } from '@/components/shared/verified-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/lib/i18n';
import { placeholderImage } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFavorites } from '@/hooks/use-favorites';
import { useProfile } from '@/hooks/use-profile';
import { useFollows } from '@/hooks/use-follows';
import { submitReview } from '@/features/agencies/actions';
import type { Agency, Tour, Review, TourHotel } from '@/types';

interface AgencyProfileContentProps {
  agency: Agency;
  tours: Tour[];
  reviews: Review[];
  followersCount: number;
}

type TabKey = 'tours' | 'reviews';

export function AgencyProfileContent({ agency, tours, reviews, followersCount }: AgencyProfileContentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('tours');
  const { profile, loading: profileLoading } = useProfile();
  const { isFollowing, toggleFollow } = useFollows();

  // Review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const telegramLink = agency.telegram_username
    ? `https://t.me/${agency.telegram_username.replace('@', '')}`
    : null;

  // Calculate average rating from reviews
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'tours', label: t.agencyProfile.activeTours },
    { key: 'reviews', label: t.agencyProfile.reviews },
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-white/95 backdrop-blur z-10">
        <button onClick={() => router.back()} className="p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="font-semibold text-sm">{t.agencyProfile.title}</h2>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: agency.name, url: window.location.href });
            }
          }}
          className="p-1"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>

      {/* Logo + Name + Badges */}
      <div className="flex flex-col items-center px-4 pt-2 pb-4">
        <div className="relative h-24 w-24 rounded-full overflow-hidden ring-4 ring-primary/20 bg-muted mb-3">
          <Image
            src={agency.logo_url || placeholderImage(200, 200, agency.name[0])}
            alt={agency.name}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>
        <h1 className="text-xl font-bold mb-1.5">{agency.name}</h1>
        {/* Verified + Approved badges */}
        <div className="flex items-center gap-2 mb-2">
          {agency.is_approved && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t.agencyView.approved}
            </span>
          )}
          {agency.is_verified && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              <VerifiedBadge size="sm" className="text-blue-700 h-3.5 w-3.5" />
              {t.agencyView.verified}
            </span>
          )}
        </div>
        {agency.city && (
          <p className="text-sm text-muted-foreground mb-2">
            {agency.city}, {agency.country}
          </p>
        )}
        {agency.description && (
          <p className="text-sm text-muted-foreground text-center leading-relaxed max-w-sm">
            {agency.description}
          </p>
        )}
        {/* Follow Button */}
        <Button
          variant={isFollowing(agency.id) ? 'outline' : 'default'}
          size="sm"
          className="mt-3 rounded-full px-6"
          onClick={() => toggleFollow(agency.id)}
        >
          {isFollowing(agency.id) ? t.agencyProfile.following : t.agencyProfile.follow}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 px-6 pb-4 max-w-sm mx-auto">
        {avgRating && (
          <div className="flex flex-col items-center bg-slate-50 rounded-2xl py-3">
            <span className="text-lg font-bold flex items-center gap-1">
              {avgRating} <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.agencyProfile.rating}</span>
          </div>
        )}
        <div className="flex flex-col items-center bg-slate-50 rounded-2xl py-3">
          <span className="text-lg font-bold">{followersCount}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.agencyProfile.followers}</span>
        </div>
        <div className="flex flex-col items-center bg-slate-50 rounded-2xl py-3">
          <span className="text-lg font-bold">{tours.length}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.agencyProfile.activeTours}</span>
        </div>
      </div>

      {/* Social Links Row */}
      <div className="grid grid-cols-4 gap-2 px-6 pb-4 max-w-sm mx-auto">
        {agency.instagram_url && (
          <a href={agency.instagram_url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5">
            <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center">
              <Instagram className="h-5 w-5 text-slate-600" />
            </div>
            <span className="text-[10px] text-muted-foreground text-center truncate w-full">{t.agencyProfile.instagram}</span>
          </a>
        )}
        {telegramLink && (
          <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5">
            <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-slate-600" />
            </div>
            <span className="text-[10px] text-muted-foreground text-center truncate w-full">{t.agencyProfile.telegram}</span>
          </a>
        )}
        {agency.phone && (
          <a href={`tel:${agency.phone}`} className="flex flex-col items-center gap-1.5">
            <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center">
              <Phone className="h-5 w-5 text-slate-600" />
            </div>
            <span className="text-[10px] text-muted-foreground text-center truncate w-full">{t.agencyProfile.call}</span>
          </a>
        )}
        {(agency.address || agency.google_maps_url) && (
          <a
            href={agency.google_maps_url || '#'}
            target={agency.google_maps_url ? '_blank' : undefined}
            rel={agency.google_maps_url ? 'noopener noreferrer' : undefined}
            className="flex flex-col items-center gap-1.5"
          >
            <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-slate-600" />
            </div>
            <span className="text-[10px] text-muted-foreground text-center truncate w-full">{t.agencyProfile.location}</span>
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex px-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${
                activeTab === tab.key
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-4">
        {/* Active Tours Tab */}
        {activeTab === 'tours' && (
          <div className="space-y-4">
            {tours.length > 0 ? (
              tours.map((tour) => (
                <AgencyTourCard key={tour.id} tour={tour} />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">{t.agencyProfile.noActiveTours}</p>
                <p className="text-muted-foreground text-xs mt-1">{t.agencyProfile.noActiveToursHint}</p>
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {/* Write Review Form */}
            {!reviewSubmitted ? (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm">{t.agencyProfile.writeReview}</h3>
                  {!profileLoading && !profile ? (
                    <div className="flex items-center gap-2 py-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground flex-1">{t.agencyProfile.loginToReview}</p>
                      <Button size="sm" variant="outline" onClick={() => router.push('/profile')}>
                        Kirish
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Star Rating */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">{t.agencyProfile.yourRating}</p>
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setReviewRating(i + 1)}
                              className="p-0.5"
                            >
                              <Star
                                className={`h-7 w-7 transition-colors ${
                                  i < reviewRating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Comment */}
                      <Textarea
                        placeholder={t.agencyProfile.reviewCommentPlaceholder}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={3}
                      />
                      {reviewError && (
                        <p className="text-xs text-destructive">
                          {reviewError === 'already_reviewed' ? t.agencyProfile.alreadyReviewed : reviewError}
                        </p>
                      )}
                      <Button
                        className="w-full"
                        disabled={reviewRating === 0 || reviewSubmitting}
                        onClick={async () => {
                          setReviewSubmitting(true);
                          setReviewError(null);
                          const result = await submitReview(agency.id, reviewRating, reviewComment || null);
                          if (result.success) {
                            setReviewSubmitted(true);
                          } else {
                            setReviewError(result.error || 'Xatolik yuz berdi');
                          }
                          setReviewSubmitting(false);
                        }}
                      >
                        {reviewSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {t.agencyProfile.submitReview}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4 flex flex-col items-center gap-2 py-6">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  <p className="font-semibold text-sm">{t.agencyProfile.reviewSubmitted}</p>
                </CardContent>
              </Card>
            )}

            {/* Existing Reviews */}
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <Card key={review.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {review.profile?.full_name ?? 'User'}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < review.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              !reviewSubmitted && <p className="text-sm text-muted-foreground text-center py-4">{t.agencyProfile.noReviews}</p>
            )}
          </div>
        )}


      </div>

      {/* Verified Badge Card */}
      {agency.is_verified && (
        <div className="px-4 pb-6">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
              <VerifiedBadge className="text-white h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-green-900">{t.agencyProfile.verifiedByMaxTour}</p>
              <p className="text-xs text-green-700 mt-0.5 leading-relaxed">
                {t.agencyProfile.verifiedDescription}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Tour Card for Agency Profile ─── */
function getMaxHotelStars(tour: Tour): number | null {
  const hotels = (tour.hotels as TourHotel[]) ?? [];
  if (hotels.length > 0) {
    const maxStars = Math.max(...hotels.filter(h => h.stars).map(h => h.stars!));
    return maxStars > 0 ? maxStars : null;
  }
  return tour.hotel_stars ?? null;
}

function AgencyTourCard({ tour }: { tour: Tour }) {
  const { t } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const location = [tour.city, tour.country].filter(Boolean).join(', ');
  const maxStars = getMaxHotelStars(tour);
  const liked = isFavorite(tour.id);

  return (
    <Link href={`/tours/${tour.slug}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={tour.cover_image_url || placeholderImage(600, 375, tour.title)}
            alt={tour.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 480px"
          />
          <button
            className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur rounded-full"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(tour.id); }}
          >
            <Heart className={`h-4 w-4 ${liked ? 'text-red-500 fill-red-500' : 'text-slate-600'}`} />
          </button>
          {tour.is_featured && (
            <div className="absolute bottom-3 left-3">
              <span className="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
                {t.common.featured}
              </span>
            </div>
          )}
          {maxStars && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur rounded-lg">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold">{maxStars}</span>
            </div>
          )}
        </div>
        <div className="p-3.5">
          <h3 className="font-bold text-base mb-1 line-clamp-1">{tour.title}</h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            {tour.duration_days && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {tour.duration_days} {t.common.days}
              </span>
            )}
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {location}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div>
              {tour.old_price && (
                <span className="text-xs text-muted-foreground line-through mr-1">${tour.old_price.toLocaleString()}</span>
              )}
              <span className="text-xs text-muted-foreground">{t.common.from} </span>
              <span className="text-lg font-bold text-primary">${tour.price.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground"> / {t.common.perPerson}</span>
            </div>
            <span className="bg-primary text-white px-4 py-1.5 rounded-full text-xs font-semibold">
              {t.common.book}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
