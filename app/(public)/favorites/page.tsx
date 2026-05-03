'use client';

import { useState, useEffect } from 'react';
import { useFavorites } from '@/hooks/use-favorites';
import { useFollows } from '@/hooks/use-follows';
import { TourCard } from '@/components/shared/tour-card';
import { EmptyState } from '@/components/shared/empty-state';
import { TourListSkeleton } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Heart, Users, Building2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { VerifiedBadge } from '@/components/shared/verified-badge';
import type { Agency } from '@/types';

type TabKey = 'subscriptions' | 'favorites';

export default function FavoritesPage() {
  const { favorites, loading: favLoading } = useFavorites();
  const { followedAgencyIds, loading: followsLoading, toggleFollow, isFollowing } = useFollows();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('subscriptions');

  // Followed agencies data
  const [followedAgencies, setFollowedAgencies] = useState<Agency[]>([]);
  const [agenciesLoading, setAgenciesLoading] = useState(true);

  // All agencies for "no follows" state
  const [allAgencies, setAllAgencies] = useState<Agency[]>([]);

  // Fetch followed agencies
  useEffect(() => {
    if (followsLoading) return;

    const fetchAgencies = async () => {
      const supabase = createClient();

      if (followedAgencyIds.length > 0) {
        const { data } = await supabase
          .from('agencies')
          .select('*')
          .in('id', followedAgencyIds)
          .eq('is_approved', true);
        setFollowedAgencies(data ?? []);
      } else {
        setFollowedAgencies([]);
        // Load all agencies as fallback
        const { data } = await supabase
          .from('agencies')
          .select('*')
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .limit(20);
        setAllAgencies(data ?? []);
      }
      setAgenciesLoading(false);
    };

    fetchAgencies();
  }, [followsLoading, followedAgencyIds]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'subscriptions', label: t.favorites.subscriptionsTab },
    { key: 'favorites', label: t.favorites.favoritesTab },
  ];

  const loading = activeTab === 'subscriptions' ? (followsLoading || agenciesLoading) : favLoading;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="sticky top-[var(--public-header-height)] z-30 market-glass rounded-2xl">
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
        <div className="market-section p-4 md:p-6">
          <TourListSkeleton count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sticky Tabs */}
      <div className="sticky top-[var(--public-header-height)] z-30 market-glass rounded-2xl">
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
      <div className="market-section p-4 md:p-6">
        {/* Subscriptions Tab — list of followed agencies */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            {followedAgencyIds.length > 0 ? (
              followedAgencies.length > 0 ? (
                <div className="bg-surface rounded-[1.5rem] shadow-ambient overflow-hidden divide-y divide-muted">
                  {followedAgencies.map((agency) => (
                    <div key={agency.id} className="flex items-center gap-3 px-4 py-3">
                      <Link href={`/agencies/${agency.slug}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-11 h-11 rounded-full overflow-hidden bg-muted">
                            {agency.logo_url ? (
                              <Image
                                src={agency.logo_url}
                                alt={agency.name}
                                width={44}
                                height={44}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                <Building2 className="h-5 w-5 text-primary/60" />
                              </div>
                            )}
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
                        variant="outline"
                        size="sm"
                        className="rounded-full px-4 shrink-0"
                        onClick={() => toggleFollow(agency.id)}
                      >
                        {t.agencyProfile.following}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={t.favorites.noFollows}
                  description={t.favorites.noFollowsHint}
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
                                {agency.logo_url ? (
                                  <Image
                                    src={agency.logo_url}
                                    alt={agency.name}
                                    width={48}
                                    height={48}
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">{agency.name?.[0]?.toUpperCase() || 'M'}</span>
                                  </div>
                                )}
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
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
