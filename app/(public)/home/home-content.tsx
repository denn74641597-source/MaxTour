'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { SearchBar } from '@/components/shared/search-bar';
import { AgencyCard } from '@/components/shared/agency-card';
import { HeroBanner } from '@/components/shared/hero-banner';
import { PopularDestinations } from '@/components/shared/popular-destinations';
import { EmptyState } from '@/components/shared/empty-state';
import { placeholderImage, formatPrice } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { HomeFilterChipsClient } from '../home-filter-chips';
import { TOUR_CATEGORIES } from '@/types';
import type { Tour, Agency } from '@/types';

interface HomeContentProps {
  featuredTours: Tour[];
  recentTours: Tour[];
  agencies: Agency[];
  topAgencies?: Agency[];
  popularTours?: Tour[];
  hotTours?: Tour[];
}

export function HomeContent({ featuredTours, recentTours, agencies, topAgencies = [], popularTours = [], hotTours = [] }: HomeContentProps) {
  const { t } = useTranslation();

  const heroTour = featuredTours[0] ?? recentTours[0];
  const hotDeals = recentTours.slice(0, 20);
  const hotToursDisplay = hotTours.slice(0, 20);

  return (
    <div className="px-6 pb-8">
      {/* Search Bar */}
      <div className="mt-4 mb-5">
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-foreground mb-3">{t.home.categories}</h3>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6 pb-1">
          {TOUR_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/tours?category=${cat}`}
              className="shrink-0 px-4 py-2 rounded-full bg-surface ghost-border text-sm font-medium text-foreground hover:bg-primary/5 hover:border-primary transition-all"
            >
              {t.tourCategories[cat]}
            </Link>
          ))}
        </div>
      </div>

      {/* Hero Banner */}
      {heroTour && <div className="mb-10"><HeroBanner tour={heroTour} /></div>}

      {/* Popular Destinations (dynamic - most viewed tours) */}
      <div className="mb-10">
        <PopularDestinations tours={popularTours} />
      </div>

      {/* Verified Agencies */}
      {agencies.length > 0 && (
        <section className="mb-10">
          <h3 className="text-lg font-bold text-foreground mb-4">{t.home.verifiedAgencies}</h3>
          <div className="flex gap-5 overflow-x-auto no-scrollbar items-start py-1 -mx-6 px-6">
            {agencies.map((agency) => (
              <AgencyCard key={agency.id} agency={agency} />
            ))}
          </div>
        </section>
      )}

      {/* Hot Deals / Yaxshi takliflar — 2x2 grid with swipe */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">{t.home.hotDeals}</h3>
        </div>
        {hotDeals.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2 snap-x snap-mandatory">
            {/* Group tours in pairs of 2 for 2x2 grid pages */}
            {Array.from({ length: Math.ceil(hotDeals.length / 4) }).map((_, pageIdx) => (
              <div key={pageIdx} className="grid grid-cols-2 grid-rows-2 gap-3 min-w-[calc(100vw-3rem)] snap-start">
                {hotDeals.slice(pageIdx * 4, pageIdx * 4 + 4).map((tour) => (
                  <HotDealCard key={tour.id} tour={tour} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={t.tours.noToursFound}
            description={t.tours.noToursHint}
          />
        )}
      </section>

      {/* Qaynoq turlar — same 2x2 grid with swipe, price focused */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">{t.home.hotTours}</h3>
        </div>
        {hotToursDisplay.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2 snap-x snap-mandatory">
            {Array.from({ length: Math.ceil(hotToursDisplay.length / 4) }).map((_, pageIdx) => (
              <div key={pageIdx} className="grid grid-cols-2 grid-rows-2 gap-3 min-w-[calc(100vw-3rem)] snap-start">
                {hotToursDisplay.slice(pageIdx * 4, pageIdx * 4 + 4).map((tour) => (
                  <HotTourCard key={tour.id} tour={tour} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={t.tours.noToursFound}
            description={t.tours.noToursHint}
          />
        )}
      </section>

      {/* Top Rated Agencies */}
      {topAgencies.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-foreground mb-4">{t.home.topRated}</h3>
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
            {topAgencies.map((agency) => (
              <TopRatedAgencyCard key={agency.id} agency={agency} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Hot Deal Card — shows image, city name, and price */
function HotDealCard({ tour }: { tour: Tour }) {
  return (
    <Link href={`/tours/${tour.slug}`} className="block">
      <div className="rounded-2xl overflow-hidden bg-surface shadow-ambient">
        <div className="relative aspect-[4/3]">
          <Image
            src={tour.cover_image_url || placeholderImage(400, 300, tour.title)}
            alt={tour.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 45vw, 200px"
          />
        </div>
        <div className="p-2.5">
          <p className="text-xs font-medium text-muted-foreground truncate">{tour.city || tour.country}</p>
          <p className="text-sm font-bold text-primary">${tour.price.toLocaleString()}</p>
        </div>
      </div>
    </Link>
  );
}

/** Hot Tour Card — price focused */
function HotTourCard({ tour }: { tour: Tour }) {
  return (
    <Link href={`/tours/${tour.slug}`} className="block">
      <div className="rounded-2xl overflow-hidden bg-surface shadow-ambient">
        <div className="relative aspect-[4/3]">
          <Image
            src={tour.cover_image_url || placeholderImage(400, 300, tour.title)}
            alt={tour.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 45vw, 200px"
          />
          {/* Price overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2.5">
            <p className="text-white text-lg font-bold">${tour.price.toLocaleString()}</p>
          </div>
        </div>
        <div className="p-2.5">
          <p className="text-xs font-medium text-muted-foreground truncate">{tour.city || tour.country}</p>
          {tour.old_price && (
            <p className="text-xs text-muted-foreground line-through">${tour.old_price.toLocaleString()}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

function TopRatedAgencyCard({ agency }: { agency: Agency }) {
  const { t } = useTranslation();
  const rating = agency.avg_rating ?? 0;

  return (
    <Link href={`/agencies/${agency.slug}`} className="shrink-0 w-40">
      <div className="bg-surface rounded-[1.5rem] p-4 flex flex-col items-center text-center shadow-ambient">
        <div className="w-16 h-16 rounded-full overflow-hidden mb-3 bg-primary/5 ring-2 ring-primary/10">
          <Image
            src={agency.logo_url || placeholderImage(100, 100, agency.name[0])}
            alt={agency.name}
            width={64}
            height={64}
            className="object-cover w-full h-full"
          />
        </div>
        <h4 className="font-bold text-sm text-foreground truncate w-full">{agency.name}</h4>
        <div className="flex items-center gap-0.5 mt-1.5 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${i < Math.round(rating) ? 'text-tertiary fill-tertiary' : 'text-muted fill-muted'}`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1 font-medium">{rating > 0 ? rating.toFixed(1) : ''}</span>
        </div>
        <span className="text-xs font-bold text-primary uppercase tracking-wide">{t.home.viewAgency}</span>
      </div>
    </Link>
  );
}
