'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { SearchBar } from '@/components/shared/search-bar';
import { TourCardHorizontal } from '@/components/shared/tour-card-horizontal';
import { AgencyCard } from '@/components/shared/agency-card';
import { HeroBanner } from '@/components/shared/hero-banner';
import { PopularDestinations } from '@/components/shared/popular-destinations';
import { EmptyState } from '@/components/shared/empty-state';
import { placeholderImage } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { HomeFilterChipsClient } from '../home-filter-chips';
import type { Tour, Agency } from '@/types';

interface HomeContentProps {
  featuredTours: Tour[];
  recentTours: Tour[];
  agencies: Agency[];
  topAgencies?: Agency[];
}

export function HomeContent({ featuredTours, recentTours, agencies, topAgencies = [] }: HomeContentProps) {
  const { t } = useTranslation();

  const heroTour = featuredTours[0] ?? recentTours[0];
  const hotDeals = recentTours.slice(0, 6);

  return (
    <div className="px-6 pb-8">
      {/* Search Bar */}
      <div className="mt-4 mb-5">
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      {/* Quick Filter Chips */}
      <div className="mb-8">
        <Suspense>
          <HomeFilterChipsClient />
        </Suspense>
      </div>

      {/* Hero Banner */}
      {heroTour && <div className="mb-10"><HeroBanner tour={heroTour} /></div>}

      {/* Popular Destinations */}
      <div className="mb-10"><PopularDestinations /></div>

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

      {/* Hot Deals */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground">{t.home.hotDeals}</h3>
            <span className="flex items-center gap-1 label-meta text-[10px] bg-destructive/10 text-destructive px-2.5 py-1 rounded-full font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              LIVE
            </span>
          </div>
        </div>
        {hotDeals.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {hotDeals.map((tour) => (
              <TourCardHorizontal key={tour.id} tour={tour} />
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
