'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CalendarClock,
  Clock3,
  Heart,
  Loader2,
  MapPin,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useTranslation } from '@/lib/i18n';
import { pickTourTitle } from '@/lib/i18n/tour-i18n';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, placeholderImage } from '@/lib/utils';
import { useProfile } from '@/hooks/use-profile';
import { VerifiedBadge } from '@/components/shared/verified-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Agency, Tour } from '@/types';

type TabKey = 'subscriptions' | 'favorites';
type FavoriteSortKey =
  | 'newest'
  | 'oldest'
  | 'priceAsc'
  | 'priceDesc'
  | 'departureDate';

const PAGE_SIZE = 20;

interface AgencyFollowRow {
  agency_id: string;
  created_at: string | null;
}

interface AgencyCard extends Pick<
  Agency,
  'id' | 'name' | 'slug' | 'logo_url' | 'city' | 'country' | 'is_verified' | 'is_approved'
> {
  followedAt: string | null;
  activeToursCount: number | null;
  latestPublishedTourAt: string | null;
}

interface FavoriteTour extends Pick<
  Tour,
  | 'id'
  | 'slug'
  | 'title'
  | 'title_uz'
  | 'title_ru'
  | 'cover_image_url'
  | 'price'
  | 'old_price'
  | 'currency'
  | 'tour_type'
  | 'region'
  | 'city'
  | 'country'
  | 'district'
  | 'destinations'
  | 'is_featured'
  | 'duration_days'
  | 'duration_nights'
  | 'departure_date'
  | 'status'
  | 'seats_left'
  | 'seats_total'
  | 'category'
> {
  agency:
    | Pick<
        Agency,
        'id' | 'name' | 'slug' | 'logo_url' | 'is_verified' | 'is_approved'
      >
    | null;
}

interface FavoriteRow {
  tour_id: string;
  created_at: string | null;
  tour: FavoriteTour | FavoriteTour[] | null;
}

interface FavoriteEntry {
  tourId: string;
  savedAt: string | null;
  tour: FavoriteTour | null;
}

interface SummaryState {
  favoritesCount: number;
  subscriptionsCount: number;
  recentSavedCount: number;
}

interface CursorState {
  createdAt: string | null;
  id: string | null;
}

function getCursorFilter(
  createdAt: string | null,
  id: string | null,
  idField: 'tour_id' | 'agency_id' | 'id'
) {
  if (!createdAt || !id) return null;
  return `created_at.lt.${createdAt},and(created_at.eq.${createdAt},${idField}.lt.${id})`;
}

function getFavoriteLocationLabel(tour: FavoriteTour, fallback: string): string {
  const districtRegion = [tour.district, tour.region].filter(Boolean).join(', ');
  if (tour.tour_type === 'domestic') {
    return districtRegion || tour.country || fallback;
  }

  const rawDestinations = [tour.city, ...(tour.destinations ?? [])]
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item));

  if (rawDestinations.length > 0) {
    return Array.from(new Set(rawDestinations)).join(', ');
  }

  return [tour.city, tour.country].filter(Boolean).join(', ') || fallback;
}

function toUnixTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDateLabel(value: string | null | undefined, fallback: string): string {
  const stamp = toUnixTimestamp(value);
  if (!stamp) return fallback;
  return new Date(stamp).toLocaleDateString();
}

function mergeById<T extends { id: string }>(prev: T[], next: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of prev) map.set(item.id, item);
  for (const item of next) map.set(item.id, item);
  return Array.from(map.values());
}

function mergeFavorites(prev: FavoriteEntry[], next: FavoriteEntry[]): FavoriteEntry[] {
  const map = new Map<string, FavoriteEntry>();
  for (const item of prev) map.set(item.tourId, item);
  for (const item of next) map.set(item.tourId, item);
  return Array.from(map.values());
}

export default function FavoritesPage() {
  const supabase = useMemo<SupabaseClient>(() => createClient(), []);
  const { t, language } = useTranslation();
  const {
    profile,
    loading: profileLoading,
    pendingDeletion,
    sessionExpired,
    error: profileError,
  } = useProfile();

  const [activeTab, setActiveTab] = useState<TabKey>('subscriptions');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const [summary, setSummary] = useState<SummaryState>({
    favoritesCount: 0,
    subscriptionsCount: 0,
    recentSavedCount: 0,
  });

  const [favoriteEntries, setFavoriteEntries] = useState<FavoriteEntry[]>([]);
  const [followedAgencies, setFollowedAgencies] = useState<AgencyCard[]>([]);
  const [suggestedAgencies, setSuggestedAgencies] = useState<AgencyCard[]>([]);

  const [favoritesCursor, setFavoritesCursor] = useState<CursorState>({
    createdAt: null,
    id: null,
  });
  const [followsCursor, setFollowsCursor] = useState<CursorState>({
    createdAt: null,
    id: null,
  });
  const [suggestedCursor, setSuggestedCursor] = useState<CursorState>({
    createdAt: null,
    id: null,
  });

  const [hasMoreFavorites, setHasMoreFavorites] = useState(false);
  const [hasMoreFollows, setHasMoreFollows] = useState(false);
  const [hasMoreSuggested, setHasMoreSuggested] = useState(false);

  const [initialLoading, setInitialLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMoreFavorites, setLoadingMoreFavorites] = useState(false);
  const [loadingMoreFollows, setLoadingMoreFollows] = useState(false);
  const [loadingMoreSuggested, setLoadingMoreSuggested] = useState(false);
  const [mutatingFollowIds, setMutatingFollowIds] = useState<string[]>([]);
  const [mutatingFavoriteIds, setMutatingFavoriteIds] = useState<string[]>([]);

  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const [subscriptionsError, setSubscriptionsError] = useState<string | null>(null);
  const [suggestedError, setSuggestedError] = useState<string | null>(null);

  const [subscriptionsSearch, setSubscriptionsSearch] = useState('');
  const [favoritesSearch, setFavoritesSearch] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('__all__');
  const [categoryFilter, setCategoryFilter] = useState('__all__');
  const [statusFilter, setStatusFilter] = useState('__all__');
  const [favoritesSort, setFavoritesSort] = useState<FavoriteSortKey>('newest');

  const profileId = profile?.id ?? null;
  const showingSuggested = followedAgencies.length === 0 && suggestedAgencies.length > 0;

  const updateOnlineState = useCallback(() => {
    if (typeof navigator === 'undefined') return;
    setIsOnline(navigator.onLine);
  }, []);

  useEffect(() => {
    updateOnlineState();
    window.addEventListener('online', updateOnlineState);
    window.addEventListener('offline', updateOnlineState);
    return () => {
      window.removeEventListener('online', updateOnlineState);
      window.removeEventListener('offline', updateOnlineState);
    };
  }, [updateOnlineState]);

  const enrichAgencyMetrics = useCallback(
    async (agencies: AgencyCard[]): Promise<AgencyCard[]> => {
      if (agencies.length === 0) return [];

      const ids = agencies.map((agency) => agency.id);
      const { data, error } = await supabase
        .from('tours')
        .select('agency_id, created_at')
        .in('agency_id', ids)
        .eq('status', 'published');

      if (error || !data) {
        return agencies.map((agency) => ({
          ...agency,
          activeToursCount: agency.activeToursCount ?? null,
          latestPublishedTourAt: agency.latestPublishedTourAt ?? null,
        }));
      }

      const counts = new Map<string, number>();
      const latestByAgency = new Map<string, string>();

      for (const row of data as Array<{ agency_id: string; created_at: string | null }>) {
        const count = counts.get(row.agency_id) ?? 0;
        counts.set(row.agency_id, count + 1);

        if (row.created_at) {
          const prev = latestByAgency.get(row.agency_id);
          if (!prev || row.created_at > prev) {
            latestByAgency.set(row.agency_id, row.created_at);
          }
        }
      }

      return agencies.map((agency) => ({
        ...agency,
        activeToursCount: counts.get(agency.id) ?? 0,
        latestPublishedTourAt: latestByAgency.get(agency.id) ?? null,
      }));
    },
    [supabase]
  );

  const loadSuggested = useCallback(
    async (append: boolean) => {
      const cursor = append ? suggestedCursor : { createdAt: null, id: null };

      let query = supabase
        .from('agencies')
        .select(
          'id, name, slug, logo_url, city, country, is_verified, is_approved, created_at'
        )
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });

      const filter = getCursorFilter(cursor.createdAt, cursor.id, 'id');
      if (filter) query = query.or(filter);

      const { data, error } = await query.limit(PAGE_SIZE + 1);
      if (error) {
        setSuggestedError(error.message);
        return;
      }

      const rows = (data ?? []) as Array<
        Pick<
          Agency,
          'id' | 'name' | 'slug' | 'logo_url' | 'city' | 'country' | 'is_verified' | 'is_approved'
        > & { created_at: string | null }
      >;
      const hasMore = rows.length > PAGE_SIZE;
      const slice = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

      const mapped = slice.map(
        (item): AgencyCard => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          logo_url: item.logo_url,
          city: item.city,
          country: item.country,
          is_verified: item.is_verified,
          is_approved: item.is_approved,
          followedAt: null,
          activeToursCount: null,
          latestPublishedTourAt: null,
        })
      );

      const enriched = await enrichAgencyMetrics(mapped);
      setSuggestedAgencies((prev) => (append ? mergeById(prev, enriched) : enriched));

      const next = slice[slice.length - 1];
      setSuggestedCursor({
        createdAt: hasMore ? next?.created_at ?? null : null,
        id: hasMore ? next?.id ?? null : null,
      });
      setHasMoreSuggested(hasMore);
      setSuggestedError(null);

    },
    [enrichAgencyMetrics, suggestedCursor, supabase]
  );

  const loadFollowedAgencies = useCallback(
    async (userId: string, append: boolean) => {
      const cursor = append ? followsCursor : { createdAt: null, id: null };

      let followsQuery = supabase
        .from('agency_follows')
        .select('agency_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .order('agency_id', { ascending: false });

      const filter = getCursorFilter(cursor.createdAt, cursor.id, 'agency_id');
      if (filter) followsQuery = followsQuery.or(filter);

      const { data: followData, error: followError } = await followsQuery.limit(
        PAGE_SIZE + 1
      );

      if (followError) {
        setSubscriptionsError(followError.message);
        return;
      }

      const rows = (followData ?? []) as AgencyFollowRow[];
      const hasMore = rows.length > PAGE_SIZE;
      const slice = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
      const ids = slice.map((row) => row.agency_id);

      if (ids.length === 0) {
        if (!append) {
          setFollowedAgencies([]);
          setHasMoreFollows(false);
          setFollowsCursor({ createdAt: null, id: null });
          await loadSuggested(false);
        }
        return;
      }

      const { data: agencies, error: agenciesError } = await supabase
        .from('agencies')
        .select('id, name, slug, logo_url, city, country, is_verified, is_approved')
        .in('id', ids)
        .eq('is_approved', true);

      if (agenciesError) {
        setSubscriptionsError(agenciesError.message);
        return;
      }

      const followsByAgency = new Map<string, string | null>(
        slice.map((row) => [row.agency_id, row.created_at ?? null])
      );
      const order = new Map<string, number>(ids.map((id, idx) => [id, idx]));

      const mapped = ((agencies ?? []) as Array<
        Pick<
          Agency,
          'id' | 'name' | 'slug' | 'logo_url' | 'city' | 'country' | 'is_verified' | 'is_approved'
        >
      >)
        .slice()
        .sort(
          (left, right) =>
            (order.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
            (order.get(right.id) ?? Number.MAX_SAFE_INTEGER)
        )
        .map(
          (agency): AgencyCard => ({
            ...agency,
            followedAt: followsByAgency.get(agency.id) ?? null,
            activeToursCount: null,
            latestPublishedTourAt: null,
          })
        );

      const enriched = await enrichAgencyMetrics(mapped);
      setFollowedAgencies((prev) => (append ? mergeById(prev, enriched) : enriched));
      setSuggestedAgencies([]);
      setHasMoreSuggested(false);
      setSuggestedCursor({ createdAt: null, id: null });

      const next = slice[slice.length - 1];
      setFollowsCursor({
        createdAt: hasMore ? next?.created_at ?? null : null,
        id: hasMore ? next?.agency_id ?? null : null,
      });
      setHasMoreFollows(hasMore);
      setSubscriptionsError(null);
      setSuggestedError(null);
    },
    [enrichAgencyMetrics, followsCursor, loadSuggested, supabase]
  );

  const loadFavorites = useCallback(
    async (userId: string, append: boolean) => {
      const cursor = append ? favoritesCursor : { createdAt: null, id: null };

      let query = supabase
        .from('favorites')
        .select(
          'tour_id, created_at, tour:tours(id, slug, title, title_uz, title_ru, cover_image_url, price, old_price, currency, tour_type, region, city, country, district, destinations, is_featured, duration_days, duration_nights, departure_date, status, seats_left, seats_total, category, agency:agencies(id, name, slug, logo_url, is_verified, is_approved))'
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .order('tour_id', { ascending: false });

      const filter = getCursorFilter(cursor.createdAt, cursor.id, 'tour_id');
      if (filter) query = query.or(filter);

      const { data, error } = await query.limit(PAGE_SIZE + 1);
      if (error) {
        setFavoritesError(error.message);
        return;
      }

      const rows = (data ?? []) as unknown as FavoriteRow[];
      const hasMore = rows.length > PAGE_SIZE;
      const slice = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

      const mapped = slice.map(
        (row): FavoriteEntry => {
          const rawTour = row.tour;
          const tour = Array.isArray(rawTour) ? (rawTour[0] ?? null) : rawTour;
          return {
            tourId: row.tour_id,
            savedAt: row.created_at,
            tour,
          };
        }
      );

      setFavoriteEntries((prev) =>
        append ? mergeFavorites(prev, mapped) : mapped
      );

      const next = slice[slice.length - 1];
      setFavoritesCursor({
        createdAt: hasMore ? next?.created_at ?? null : null,
        id: hasMore ? next?.tour_id ?? null : null,
      });
      setHasMoreFavorites(hasMore);
      setFavoritesError(null);
    },
    [favoritesCursor, supabase]
  );

  const loadSummary = useCallback(
    async (userId: string) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 14);

      const [favoritesCountResult, subscriptionsCountResult, recentSavedResult] =
        await Promise.all([
          supabase
            .from('favorites')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId),
          supabase
            .from('agency_follows')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId),
          supabase
            .from('favorites')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', cutoff.toISOString()),
        ]);

      setSummary({
        favoritesCount: favoritesCountResult.count ?? 0,
        subscriptionsCount: subscriptionsCountResult.count ?? 0,
        recentSavedCount: recentSavedResult.count ?? 0,
      });
    },
    [supabase]
  );

  const loadInitialData = useCallback(
    async (userId: string, mode: 'initial' | 'refresh') => {
      if (mode === 'initial') {
        setInitialLoading(true);
      } else {
        setRefreshing(true);
      }

      setFavoritesError(null);
      setSubscriptionsError(null);
      setSuggestedError(null);
      setFavoritesCursor({ createdAt: null, id: null });
      setFollowsCursor({ createdAt: null, id: null });
      setSuggestedCursor({ createdAt: null, id: null });

      try {
        await Promise.all([
          loadFavorites(userId, false),
          loadFollowedAgencies(userId, false),
          loadSummary(userId),
        ]);
        setLastUpdatedAt(new Date());
      } finally {
        if (mode === 'initial') {
          setInitialLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [loadFavorites, loadFollowedAgencies, loadSummary]
  );

  useEffect(() => {
    if (!profileId) {
      setFavoriteEntries([]);
      setFollowedAgencies([]);
      setSuggestedAgencies([]);
      setSummary({
        favoritesCount: 0,
        subscriptionsCount: 0,
        recentSavedCount: 0,
      });
      setLastUpdatedAt(null);
      return;
    }

    void loadInitialData(profileId, 'initial');
  }, [profileId, loadInitialData]);

  const handleRefresh = useCallback(async () => {
    if (!profileId) return;
    await loadInitialData(profileId, 'refresh');
  }, [loadInitialData, profileId]);

  const handleLoadMoreFavorites = useCallback(async () => {
    if (!profileId || !hasMoreFavorites || loadingMoreFavorites) return;
    setLoadingMoreFavorites(true);
    try {
      await loadFavorites(profileId, true);
    } finally {
      setLoadingMoreFavorites(false);
    }
  }, [hasMoreFavorites, loadFavorites, loadingMoreFavorites, profileId]);

  const handleLoadMoreAgencies = useCallback(async () => {
    if (!profileId) return;

    if (followedAgencies.length > 0) {
      if (!hasMoreFollows || loadingMoreFollows) return;
      setLoadingMoreFollows(true);
      try {
        await loadFollowedAgencies(profileId, true);
      } finally {
        setLoadingMoreFollows(false);
      }
      return;
    }

    if (!hasMoreSuggested || loadingMoreSuggested) return;
    setLoadingMoreSuggested(true);
    try {
      await loadSuggested(true);
    } finally {
      setLoadingMoreSuggested(false);
    }
  }, [
    followedAgencies.length,
    hasMoreFollows,
    hasMoreSuggested,
    loadFollowedAgencies,
    loadSuggested,
    loadingMoreFollows,
    loadingMoreSuggested,
    profileId,
  ]);

  const handleToggleFollow = useCallback(
    async (agencyId: string) => {
      if (!profileId) return;

      const alreadyFollowing = followedAgencies.some((agency) => agency.id === agencyId);
      if (alreadyFollowing && !window.confirm(t.favorites.unfollowConfirm)) {
        return;
      }

      const previousFollowed = followedAgencies;
      const previousSuggested = suggestedAgencies;

      if (alreadyFollowing) {
        setFollowedAgencies((prev) => prev.filter((agency) => agency.id !== agencyId));
      } else {
        const fromSuggested = suggestedAgencies.find((agency) => agency.id === agencyId);
        if (fromSuggested) {
          setSuggestedAgencies((prev) => prev.filter((agency) => agency.id !== agencyId));
          setFollowedAgencies((prev) => [
            {
              ...fromSuggested,
              followedAt: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      }

      setMutatingFollowIds((prev) => [...prev, agencyId]);

      try {
        if (alreadyFollowing) {
          const { error } = await supabase
            .from('agency_follows')
            .delete()
            .eq('user_id', profileId)
            .eq('agency_id', agencyId);
          if (error) throw error;
          toast.success(t.favorites.unfollowed);
        } else {
          const { error } = await supabase
            .from('agency_follows')
            .insert({ user_id: profileId, agency_id: agencyId });
          if (error) throw error;
          toast.success(t.favorites.followed);
        }

        await Promise.all([
          loadFollowedAgencies(profileId, false),
          loadSummary(profileId),
        ]);
      } catch (error) {
        setFollowedAgencies(previousFollowed);
        setSuggestedAgencies(previousSuggested);
        const message =
          error instanceof Error ? error.message : t.favorites.actionFailed;
        toast.error(message);
      } finally {
        setMutatingFollowIds((prev) => prev.filter((id) => id !== agencyId));
      }
    },
    [
      followedAgencies,
      loadFollowedAgencies,
      loadSummary,
      profileId,
      suggestedAgencies,
      supabase,
      t.favorites.actionFailed,
      t.favorites.followed,
      t.favorites.unfollowConfirm,
      t.favorites.unfollowed,
    ]
  );

  const handleRemoveFavorite = useCallback(
    async (tourId: string) => {
      if (!profileId) return;
      if (!window.confirm(t.favorites.removeConfirm)) return;

      const previous = favoriteEntries;
      setFavoriteEntries((prev) => prev.filter((entry) => entry.tourId !== tourId));
      setMutatingFavoriteIds((prev) => [...prev, tourId]);

      try {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', profileId)
          .eq('tour_id', tourId);

        if (error) throw error;
        toast.success(t.favorites.removed);
        await loadSummary(profileId);
      } catch (error) {
        setFavoriteEntries(previous);
        const message =
          error instanceof Error ? error.message : t.favorites.actionFailed;
        toast.error(message);
      } finally {
        setMutatingFavoriteIds((prev) => prev.filter((id) => id !== tourId));
      }
    },
    [
      favoriteEntries,
      loadSummary,
      profileId,
      supabase,
      t.favorites.actionFailed,
      t.favorites.removeConfirm,
      t.favorites.removed,
    ]
  );

  const sourceAgencies = followedAgencies.length > 0 ? followedAgencies : suggestedAgencies;

  const filteredAgencies = useMemo(() => {
    const query = subscriptionsSearch.trim().toLowerCase();
    if (!query) return sourceAgencies;

    return sourceAgencies.filter((agency) =>
      [agency.name, agency.city, agency.country]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [sourceAgencies, subscriptionsSearch]);

  const destinationOptions = useMemo(() => {
    const values = new Set<string>();
    for (const entry of favoriteEntries) {
      const tour = entry.tour;
      if (!tour) continue;
      if (tour.city) values.add(tour.city);
      if (tour.region) values.add(tour.region);
      if (tour.country) values.add(tour.country);
      for (const destination of tour.destinations ?? []) {
        const trimmed = destination?.trim();
        if (trimmed) values.add(trimmed);
      }
    }
    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [favoriteEntries]);

  const categoryOptions = useMemo(() => {
    const values = new Set<string>();
    for (const entry of favoriteEntries) {
      const category = entry.tour?.category;
      if (category) values.add(category);
    }
    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [favoriteEntries]);

  const statusOptions = useMemo(() => {
    const values = new Set<string>();
    for (const entry of favoriteEntries) {
      const status = entry.tour?.status;
      if (status) values.add(status);
    }
    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [favoriteEntries]);

  const filteredFavorites = useMemo(() => {
    const query = favoritesSearch.trim().toLowerCase();
    let items = favoriteEntries.filter((entry): entry is FavoriteEntry & { tour: FavoriteTour } =>
      Boolean(entry.tour)
    );

    if (query) {
      items = items.filter((entry) => {
        const tour = entry.tour;
        const title = pickTourTitle(tour, language).toLowerCase();
        const source = [
          title,
          tour.city,
          tour.region,
          tour.country,
          ...(tour.destinations ?? []),
          tour.agency?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return source.includes(query);
      });
    }

    if (destinationFilter !== '__all__') {
      items = items.filter((entry) => {
        const tour = entry.tour;
        return (
          tour.city === destinationFilter ||
          tour.region === destinationFilter ||
          tour.country === destinationFilter ||
          (tour.destinations ?? []).includes(destinationFilter)
        );
      });
    }

    if (categoryFilter !== '__all__') {
      items = items.filter((entry) => entry.tour.category === categoryFilter);
    }

    if (statusFilter !== '__all__') {
      items = items.filter((entry) => entry.tour.status === statusFilter);
    }

    items = items.slice().sort((left, right) => {
      if (favoritesSort === 'newest') {
        return (
          (toUnixTimestamp(right.savedAt) ?? 0) - (toUnixTimestamp(left.savedAt) ?? 0)
        );
      }
      if (favoritesSort === 'oldest') {
        return (
          (toUnixTimestamp(left.savedAt) ?? 0) - (toUnixTimestamp(right.savedAt) ?? 0)
        );
      }
      if (favoritesSort === 'priceAsc') {
        return left.tour.price - right.tour.price;
      }
      if (favoritesSort === 'priceDesc') {
        return right.tour.price - left.tour.price;
      }

      const leftDate = toUnixTimestamp(left.tour.departure_date);
      const rightDate = toUnixTimestamp(right.tour.departure_date);
      if (leftDate === null && rightDate === null) return 0;
      if (leftDate === null) return 1;
      if (rightDate === null) return -1;
      return leftDate - rightDate;
    });

    return items;
  }, [
    categoryFilter,
    destinationFilter,
    favoriteEntries,
    favoritesSearch,
    favoritesSort,
    language,
    statusFilter,
  ]);

  const hasFavoriteFilters =
    favoritesSearch.trim().length > 0 ||
    destinationFilter !== '__all__' ||
    categoryFilter !== '__all__' ||
    statusFilter !== '__all__' ||
    favoritesSort !== 'newest';

  const hasSubscriptionFilters = subscriptionsSearch.trim().length > 0;

  const resetFavoriteFilters = useCallback(() => {
    setFavoritesSearch('');
    setDestinationFilter('__all__');
    setCategoryFilter('__all__');
    setStatusFilter('__all__');
    setFavoritesSort('newest');
  }, []);

  const tabs: { key: TabKey; label: string }[] = useMemo(
    () => [
      { key: 'subscriptions', label: t.favorites.subscriptionsTab },
      { key: 'favorites', label: t.favorites.favoritesTab },
    ],
    [t.favorites.favoritesTab, t.favorites.subscriptionsTab]
  );

  const tabsLoading = initialLoading && Boolean(profileId);
  const subscriptionsErrorMessage = subscriptionsError ?? suggestedError;

  if (profileLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Card className="market-section rounded-3xl border-none">
          <CardContent className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pendingDeletion) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Card className="rounded-3xl border-amber-200 bg-amber-50/80">
          <CardHeader>
            <CardTitle className="text-lg text-amber-900">
              {t.favorites.pendingDeletionTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-amber-900">
            <p>{t.favorites.pendingDeletionHint}</p>
            <a href="mailto:support@maxtour.uz?subject=Account%20Recovery%20Request">
              <Button>{t.favorites.contactSupport}</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profileId) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 lg:py-10">
        {sessionExpired ? (
          <Card className="rounded-2xl border-amber-200 bg-amber-50/80">
            <CardContent className="flex items-start gap-2 p-4 text-sm text-amber-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{t.favorites.sessionExpired}</p>
            </CardContent>
          </Card>
        ) : null}

        {profileError ? (
          <Card className="rounded-2xl border-destructive/40 bg-destructive/5">
            <CardContent className="p-4 text-sm text-destructive">
              {profileError}
            </CardContent>
          </Card>
        ) : null}

        <Card className="market-section market-subtle-border overflow-hidden rounded-3xl border-none">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                MaxTour account
              </div>
              <h1 className="mt-4 text-2xl font-bold lg:text-3xl">
                {t.favorites.authTitle}
              </h1>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground lg:text-base">
                {t.favorites.authHint}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/profile">
                  <Button>{t.favorites.login}</Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline">{t.favorites.register}</Button>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/30 bg-white/50 p-4 backdrop-blur">
              <p className="text-sm font-semibold text-slate-900">
                {t.favorites.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.favorites.authFeatureHint}
              </p>
              <div className="mt-4 space-y-2.5 text-sm">
                <div className="flex items-center gap-2 rounded-xl bg-background/80 p-3">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{t.favorites.subscriptionsTab}</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-background/80 p-3">
                  <Heart className="h-4 w-4 text-rose-500" />
                  <span>{t.favorites.favoritesTab}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 lg:py-8">
      {!isOnline ? (
        <Card className="rounded-2xl border-amber-200 bg-amber-50/80">
          <CardContent className="flex items-start gap-2 p-4 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{t.favorites.offlineHint}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="market-section market-subtle-border rounded-3xl border-none">
        <CardContent className="space-y-6 p-5 md:p-7 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                MaxTour
              </p>
              <h1 className="text-2xl font-bold md:text-3xl">{t.favorites.title}</h1>
              <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                {t.favorites.subtitle}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => void handleRefresh()}
                disabled={refreshing || tabsLoading}
              >
                {(refreshing || tabsLoading) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                {t.favorites.refresh}
              </Button>
              <span className="text-xs text-muted-foreground">
                {t.favorites.lastUpdated}:{' '}
                {lastUpdatedAt
                  ? lastUpdatedAt.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : t.favorites.notAvailable}
              </span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <button
              type="button"
              onClick={() => setActiveTab('favorites')}
              className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-left transition hover:border-primary/40 hover:shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                {t.favorites.summaryFavorites}
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.favoritesCount}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('subscriptions')}
              className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-left transition hover:border-primary/40 hover:shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                {t.favorites.summarySubscriptions}
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.subscriptionsCount}
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('favorites');
                setFavoritesSort('newest');
              }}
              className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-left transition hover:border-primary/40 hover:shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                {t.favorites.summaryRecentlySaved}
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.recentSavedCount}
              </p>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white/65">
            <div className="flex border-b border-slate-200 px-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex-1 py-3 text-sm font-medium transition ${
                    activeTab === tab.key
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key ? (
                    <span className="absolute inset-x-8 bottom-0 h-0.5 rounded-full bg-primary" />
                  ) : null}
                </button>
              ))}
            </div>

            <div className="p-4 md:p-5">
              {tabsLoading ? (
                <div className="flex min-h-[340px] items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : null}

              {!tabsLoading && activeTab === 'subscriptions' ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={subscriptionsSearch}
                        onChange={(event) => setSubscriptionsSearch(event.target.value)}
                        placeholder={t.favorites.searchSubscriptionsPlaceholder}
                        className="pl-9"
                      />
                    </div>
                    <Badge
                      variant="outline"
                      className="w-fit rounded-full border-slate-300 bg-slate-50 px-3 py-1 text-xs"
                    >
                      {showingSuggested
                        ? t.favorites.followAgencies
                        : t.favorites.subscriptionsTab}
                    </Badge>
                  </div>

                  {subscriptionsErrorMessage ? (
                    <Card className="rounded-2xl border-destructive/40 bg-destructive/5">
                      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                        <p className="text-sm text-destructive">{subscriptionsErrorMessage}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleRefresh()}
                        >
                          {t.favorites.refresh}
                        </Button>
                      </CardContent>
                    </Card>
                  ) : null}

                  {showingSuggested ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
                      <div className="flex items-start gap-3">
                        <Users className="mt-0.5 h-4 w-4 text-slate-500" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {t.favorites.noFollows}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t.favorites.noFollowsHint}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {!subscriptionsErrorMessage && filteredAgencies.length === 0 ? (
                    <Card className="rounded-2xl border-slate-200">
                      <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-6 text-center">
                        <Users className="h-8 w-8 text-muted-foreground/70" />
                        <p className="font-semibold">{t.favorites.noFollows}</p>
                        <p className="max-w-md text-sm text-muted-foreground">
                          {hasSubscriptionFilters
                            ? t.favorites.noFilteredResultsHint
                            : t.favorites.noFollowsHint}
                        </p>
                        {hasSubscriptionFilters ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSubscriptionsSearch('')}
                          >
                            {t.favorites.resetFilters}
                          </Button>
                        ) : (
                          <Link href="/agencies">
                            <Button size="sm">{t.favorites.discoverAgencies}</Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-3 lg:grid-cols-2">
                      {filteredAgencies.map((agency) => {
                        const isFollowing = followedAgencies.some(
                          (followed) => followed.id === agency.id
                        );
                        const isMutating = mutatingFollowIds.includes(agency.id);

                        return (
                          <Card key={agency.id} className="rounded-2xl border-slate-200">
                            <CardContent className="space-y-4 p-4">
                              <div className="flex items-start gap-3">
                                <Link
                                  href={`/agencies/${agency.slug}`}
                                  className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-100"
                                >
                                  {agency.logo_url ? (
                                    <Image
                                      src={agency.logo_url}
                                      alt={agency.name}
                                      fill
                                      className="object-cover"
                                      sizes="56px"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-primary/10">
                                      <Building2 className="h-5 w-5 text-primary/70" />
                                    </div>
                                  )}
                                  {agency.is_verified ? (
                                    <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-px">
                                      <VerifiedBadge size="sm" />
                                    </span>
                                  ) : null}
                                </Link>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1">
                                    <Link
                                      href={`/agencies/${agency.slug}`}
                                      className="truncate text-base font-semibold text-slate-900 hover:underline"
                                    >
                                      {agency.name}
                                    </Link>
                                    {agency.is_verified ? (
                                      <BadgeCheck className="h-4 w-4 shrink-0 text-sky-500" />
                                    ) : null}
                                  </div>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {[agency.city, agency.country]
                                      .filter(Boolean)
                                      .join(', ') || t.favorites.notProvided}
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                      {t.favorites.activeToursCount}:{' '}
                                      {agency.activeToursCount ?? t.favorites.notAvailable}
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                      {t.favorites.lastActivity}:{' '}
                                      {formatDateLabel(
                                        agency.latestPublishedTourAt,
                                        t.favorites.notAvailable
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Link href={`/agencies/${agency.slug}`}>
                                  <Button variant="outline" size="sm">
                                    {t.favorites.viewAgency}
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  variant={isFollowing ? 'outline' : 'default'}
                                  disabled={isMutating}
                                  onClick={() => void handleToggleFollow(agency.id)}
                                >
                                  {isMutating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : isFollowing ? (
                                    t.favorites.unfollow
                                  ) : (
                                    t.favorites.followAgency
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {(followedAgencies.length > 0 ? hasMoreFollows : hasMoreSuggested) ? (
                    <div className="flex justify-center pt-1">
                      <Button
                        variant="outline"
                        onClick={() => void handleLoadMoreAgencies()}
                        disabled={loadingMoreFollows || loadingMoreSuggested}
                      >
                        {loadingMoreFollows || loadingMoreSuggested ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t.favorites.loadMore
                        )}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {!tabsLoading && activeTab === 'favorites' ? (
                <div className="space-y-4">
                  <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={favoritesSearch}
                        onChange={(event) => setFavoritesSearch(event.target.value)}
                        placeholder={t.favorites.searchFavoritesPlaceholder}
                        className="pl-9"
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Select
                        value={destinationFilter}
                        onValueChange={(value) => setDestinationFilter(value ?? '__all__')}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t.favorites.destinationFilter} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">{t.favorites.allDestinations}</SelectItem>
                          {destinationOptions.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={favoritesSort}
                        onValueChange={(value) =>
                          setFavoritesSort((value as FavoriteSortKey) ?? 'newest')
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t.favorites.sortBy} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">{t.favorites.sortNewest}</SelectItem>
                          <SelectItem value="oldest">{t.favorites.sortOldest}</SelectItem>
                          <SelectItem value="priceAsc">{t.favorites.sortPriceAsc}</SelectItem>
                          <SelectItem value="priceDesc">{t.favorites.sortPriceDesc}</SelectItem>
                          <SelectItem value="departureDate">
                            {t.favorites.sortDepartureDate}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <Select
                      value={categoryFilter}
                      onValueChange={(value) => setCategoryFilter(value ?? '__all__')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t.favorites.categoryFilter} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">{t.favorites.allCategories}</SelectItem>
                        {categoryOptions.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={statusFilter}
                      onValueChange={(value) => setStatusFilter(value ?? '__all__')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t.favorites.statusFilter} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">{t.favorites.allStatuses}</SelectItem>
                        {statusOptions.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={resetFavoriteFilters}
                      disabled={!hasFavoriteFilters}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      {t.favorites.resetFilters}
                    </Button>
                  </div>

                  {favoritesError ? (
                    <Card className="rounded-2xl border-destructive/40 bg-destructive/5">
                      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                        <p className="text-sm text-destructive">{favoritesError}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleRefresh()}
                        >
                          {t.favorites.refresh}
                        </Button>
                      </CardContent>
                    </Card>
                  ) : null}

                  {!favoritesError && filteredFavorites.length === 0 ? (
                    <Card className="rounded-2xl border-slate-200">
                      <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-3 p-6 text-center">
                        <Heart className="h-8 w-8 text-muted-foreground/70" />
                        <p className="font-semibold">
                          {hasFavoriteFilters ? t.favorites.noFilteredResults : t.favorites.empty}
                        </p>
                        <p className="max-w-md text-sm text-muted-foreground">
                          {hasFavoriteFilters
                            ? t.favorites.noFilteredResultsHint
                            : t.favorites.emptyHint}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {hasFavoriteFilters ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={resetFavoriteFilters}
                            >
                              {t.favorites.resetFilters}
                            </Button>
                          ) : null}
                          <Link href="/tours">
                            <Button size="sm">{t.favorites.browseTours}</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {filteredFavorites.map((entry) => {
                        const tour = entry.tour;
                        const title = pickTourTitle(tour, language);
                        const isMutating = mutatingFavoriteIds.includes(entry.tourId);
                        const location = getFavoriteLocationLabel(tour, t.favorites.notProvided);
                        const statusLabel = tour.status || t.favorites.notAvailable;

                        return (
                          <Card
                            key={entry.tourId}
                            className="group overflow-hidden rounded-2xl border-slate-200"
                          >
                            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                              <Image
                                src={tour.cover_image_url || placeholderImage(800, 500, title)}
                                alt={title}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                className="object-cover transition duration-300 group-hover:scale-[1.02]"
                              />
                              {tour.is_featured ? (
                                <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-semibold text-white">
                                  {t.common.featured}
                                </span>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => void handleRemoveFavorite(entry.tourId)}
                                disabled={isMutating}
                                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/60"
                                aria-label={t.favorites.remove}
                              >
                                {isMutating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Heart className="h-4 w-4 fill-current" />
                                )}
                              </button>
                            </div>

                            <CardContent className="space-y-3 p-4">
                              <div className="space-y-1">
                                <Link
                                  href={`/tours/${tour.slug}`}
                                  className="line-clamp-2 text-base font-semibold text-slate-900 hover:text-primary"
                                >
                                  {title}
                                </Link>
                                <p className="text-xs text-muted-foreground">
                                  {tour.agency?.name ?? t.favorites.notProvided}
                                </p>
                              </div>

                              <div className="grid gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span className="line-clamp-1">{location}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="inline-flex items-center gap-1">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    {tour.duration_days
                                      ? `${tour.duration_days} ${t.common.days}`
                                      : t.favorites.notProvided}
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <CalendarClock className="h-3.5 w-3.5" />
                                    {formatDateLabel(
                                      tour.departure_date,
                                      t.favorites.notProvided
                                    )}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="rounded-full">
                                  {t.common.status}: {statusLabel}
                                </Badge>
                                <Badge variant="outline" className="rounded-full">
                                  {t.favorites.savedOn}:{' '}
                                  {formatDateLabel(entry.savedAt, t.favorites.notProvided)}
                                </Badge>
                              </div>

                              <div className="flex items-center justify-between">
                                <p className="text-lg font-bold text-primary">
                                  {formatPrice(tour.price, tour.currency)}
                                </p>
                                <Link href={`/tours/${tour.slug}`}>
                                  <Button size="sm" variant="outline">
                                    {t.common.viewDetails}
                                  </Button>
                                </Link>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {hasMoreFavorites ? (
                    <div className="flex justify-center pt-1">
                      <Button
                        variant="outline"
                        onClick={() => void handleLoadMoreFavorites()}
                        disabled={loadingMoreFavorites}
                      >
                        {loadingMoreFavorites ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t.favorites.loadMore
                        )}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
