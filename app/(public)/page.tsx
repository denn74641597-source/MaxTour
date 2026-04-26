import { Suspense } from 'react';
import { getHomeFeaturedTours, getHomePopularPlaces, getHomePopularTours, getHomePromotedTours } from '@/features/tours/queries';
import { getHomeVerifiedAgencies, getHomeTopRatedAgencies } from '@/features/agencies/queries';
import { notifySystemError } from '@/lib/telegram/admin-bot';
import { HomeContent, HomeAgenciesSection } from './home/home-content';
import { HomeHotDealsSection, HomeHotToursSection, HomeTopRatedSection } from './home/home-interactive';
import { HomeFavoritesProvider } from './home/home-favorites-provider';
import { Skeleton } from '@/components/ui/skeleton';
import type { PopularPlace, Tour } from '@/types';

export default async function HomePage() {
  let featuredTours: Tour[] = [];
  let popularTours: Tour[] = [];
  let promotedFeatured: Tour[] = [];
  let popularPlaces: PopularPlace[] = [];

  try {
    [featuredTours, popularTours, promotedFeatured, popularPlaces] = await Promise.all([
      getHomeFeaturedTours(),
      getHomePopularTours(10),
      getHomePromotedTours('featured', 12),
      getHomePopularPlaces(12),
    ]);
  } catch (error) {
    console.error('HomePage critical data fetch error:', error);
    await notifySystemError({ source: 'Page: HomePage (critical)', message: error instanceof Error ? error.message : 'Critical data fetch error' });
  }

  return (
    <div className="px-6 md:px-8 lg:px-0 pb-8">
      <HomeContent
        featuredTours={promotedFeatured.length > 0 ? promotedFeatured : featuredTours}
        popularTours={popularTours}
        popularPlaces={popularPlaces}
      />
      <Suspense fallback={<AgenciesSkeleton />}>
        <DeferredAgencies />
      </Suspense>
      <HomeFavoritesProvider>
        <Suspense fallback={<GridSkeleton />}>
          <DeferredHotDeals />
        </Suspense>
        <Suspense fallback={<GridSkeleton />}>
          <DeferredHotTours />
        </Suspense>
      </HomeFavoritesProvider>
      <Suspense fallback={<TopRatedSkeleton />}>
        <DeferredTopRated />
      </Suspense>
    </div>
  );
}

/* ─── Deferred async server components (streamed via Suspense) ─── */

async function DeferredAgencies() {
  let agencies: Awaited<ReturnType<typeof getHomeVerifiedAgencies>> = [];
  try {
    agencies = await getHomeVerifiedAgencies(6);
  } catch (error) {
    console.error('DeferredAgencies error:', error);
    await notifySystemError({ source: 'Page: HomePage DeferredAgencies', message: error instanceof Error ? error.message : 'Agencies fetch error' });
    return null;
  }
  if (agencies.length === 0) return null;
  return <HomeAgenciesSection agencies={agencies} />;
}

async function DeferredHotDeals() {
  let hotDeals: Tour[] = [];
  try {
    hotDeals = await getHomePromotedTours('hot_deals', 20);
  } catch (error) {
    console.error('DeferredHotDeals error:', error);
    await notifySystemError({ source: 'Page: HomePage DeferredHotDeals', message: error instanceof Error ? error.message : 'Hot deals fetch error' });
  }
  return <HomeHotDealsSection hotDeals={hotDeals} />;
}

async function DeferredHotTours() {
  let hotTours: Tour[] = [];
  try {
    hotTours = await getHomePromotedTours('hot_tours', 20);
  } catch (error) {
    console.error('DeferredHotTours error:', error);
    await notifySystemError({ source: 'Page: HomePage DeferredHotTours', message: error instanceof Error ? error.message : 'Hot tours fetch error' });
  }
  return <HomeHotToursSection hotTours={hotTours} />;
}

async function DeferredTopRated() {
  let topAgencies: Awaited<ReturnType<typeof getHomeTopRatedAgencies>> = [];
  try {
    topAgencies = await getHomeTopRatedAgencies(6);
  } catch (error) {
    console.error('DeferredTopRated error:', error);
    await notifySystemError({ source: 'Page: HomePage DeferredTopRated', message: error instanceof Error ? error.message : 'Top rated fetch error' });
    return null;
  }
  if (topAgencies.length === 0) return null;
  return <HomeTopRatedSection topAgencies={topAgencies} />;
}

/* ─── Skeleton fallbacks for Suspense ─── */

function AgenciesSkeleton() {
  return (
    <div className="mb-10 space-y-4">
      <Skeleton className="h-5 w-48" />
      <div className="flex gap-5 overflow-hidden -mx-6 px-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="mb-10 space-y-4">
      <Skeleton className="h-5 w-32" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden">
            <Skeleton className="aspect-square w-full" />
            <div className="p-2.5 space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-1/2" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopRatedSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-36" />
      <div className="flex gap-4 overflow-hidden -mx-6 px-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="shrink-0 w-40 rounded-[1.5rem] p-4 flex flex-col items-center">
            <Skeleton className="w-16 h-16 rounded-full mb-3" />
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
