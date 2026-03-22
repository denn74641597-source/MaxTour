'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFavorites } from '@/hooks/use-favorites';
import { useFollows } from '@/hooks/use-follows';
import { TourCard } from '@/components/shared/tour-card';
import { TourCardCatalog } from '@/components/shared/tour-card-catalog';
import { EmptyState } from '@/components/shared/empty-state';
import { TourListSkeleton } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Heart, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { placeholderImage } from '@/lib/utils';
import { VerifiedBadge } from '@/components/shared/verified-badge';
import type { Tour, Agency } from '@/types';

type TabKey = 'subscriptions' | 'favorites';

export default function FavoritesPage() {
  const { favorites, loading: favLoading } = useFavorites();
  const { followedAgencyIds, loading: followsLoading, toggleFollow, isFollowing } = useFollows();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('subscriptions');

  // Followed agency tours
  const [followedTours, setFollowedTours] = useState<Tour[]>([]);
  const [toursLoading, setToursLoading] = useState(true);

  // All agencies for "no follows" state
  const [allAgencies, setAllAgencies] = useState<Agency[]>([]);
  const [agenciesLoading, setAgenciesLoading] = useState(false);

  // Fetch tours from followed agencies
  useEffect(() => {
    if (followsLoading) return;

    const fetchFollowedTours = async () => {
      if (followedAgencyIds.length === 0) {
        setFollowedTours([]);
        setToursLoading(false);
        // Load agencies list as fallback
        setAgenciesLoading(true);
        const supabase = createClient();
        const { data } = await supabase
          .from('agencies')
          .select('*')
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .limit(20);
        setAllAgencies(data ?? []);
        setAgenciesLoading(false);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from('tours')
        .select('*, agency:agencies(id, name, slug, logo_url, is_verified, is_approved)')
        .eq('status', 'published')
        .in('agency_id', followedAgencyIds)
        .order('created_at', { ascending: false })
        .limit(50);

      setFollowedTours(data ?? []);
      setToursLoading(false);
    };

    fetchFollowedTours();
  }, [followsLoading, followedAgencyIds]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'subscriptions', label: t.favorites.subscriptionsTab },
    { key: 'favorites', label: t.favorites.favoritesTab },
  ];

  const loading = activeTab === 'subscriptions' ? (followsLoading || toursLoading) : favLoading;

  if (loading) {
    return (
      <div>
        <div className="sticky top-[56px] z-40 glass-nav">
          <div className="flex px-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className="flex-1 py-3 text-sm font-medium text-center text-muted-foreground"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="px-4 py-4">
          <TourListSkeleton count={4} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Sticky Tabs */}
      <div className="sticky top-[56px] z-40 glass-nav">
        <div className="flex px-6">
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
        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            {followedAgencyIds.length > 0 ? (
              followedTours.length > 0 ? (
                followedTours.map((tour) => (
                  <TourCardCatalog key={tour.id} tour={tour} />
                ))
              ) : (
                <EmptyState
                  title={t.tours.noToursFound}
                  description={t.tours.noToursHint}
                />
              )
            ) : (
              <div className="space-y-6">
                <EmptyState
                  icon={<Users className="h-12 w-12 text-muted-foreground/50 mb-4" />}
                  title={t.favorites.noFollows}
                  description={t.favorites.noFollowsHint}
                />
                {!agenciesLoading && allAgencies.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm mb-4">{t.favorites.followAgencies}</h3>
                    <div className="space-y-3">
                      {allAgencies.map((agency) => (
                        <div key={agency.id} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-[1.5rem]">
                          <Link href={`/agencies/${agency.slug}`} className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="relative shrink-0">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-surface">
                                <Image
                                  src={agency.logo_url || placeholderImage(100, 100, agency.name[0])}
                                  alt={agency.name}
                                  width={48}
                                  height={48}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                              {agency.is_verified && (
                                <div className="absolute -bottom-0.5 -right-0.5 bg-surface rounded-full p-[1px]">
                                  <VerifiedBadge size="sm" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{agency.name}</p>
                              {agency.city && (
                                <p className="text-xs text-muted-foreground truncate">{agency.city}</p>
                              )}
                            </div>
                          </Link>
                          <Button
                            variant={isFollowing(agency.id) ? 'outline' : 'default'}
                            size="sm"
                            className="rounded-full px-4 shrink-0"
                            onClick={() => toggleFollow(agency.id)}
                          >
                            {isFollowing(agency.id) ? t.agencyProfile.following : t.agencyProfile.follow}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div>
            {favorites.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {favorites.map((fav) =>
                  fav.tour ? <TourCard key={fav.id} tour={fav.tour} /> : null
                )}
              </div>
            ) : (
              <EmptyState
                icon={<Heart className="h-12 w-12 text-muted-foreground/50 mb-4" />}
                title={t.favorites.empty}
                description={t.favorites.emptyHint}
                action={
                  <Link href="/tours">
                    <Button size="sm">{t.favorites.browseTours}</Button>
                  </Link>
                }
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
