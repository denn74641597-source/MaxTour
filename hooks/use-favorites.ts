'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Favorite } from '@/types';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());

  const fetchFavorites = useCallback(async () => {
    const supabase = supabaseRef.current;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('favorites')
      .select('*, tour:tours(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setFavorites(data ?? []);
    setLoading(false);
  }, []);

  const toggleFavorite = useCallback(async (tourId: string) => {
    const supabase = supabaseRef.current;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const existing = favorites.find((f) => f.tour_id === tourId);
    if (existing) {
      setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
      await supabase.from('favorites').delete().eq('id', existing.id);
    } else {
      setFavorites((prev) => [...prev, { id: `temp-${tourId}`, user_id: user.id, tour_id: tourId, created_at: new Date().toISOString() } as Favorite]);
      const { data } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, tour_id: tourId })
        .select()
        .single();
      if (data) {
        setFavorites((prev) => prev.map((f) => f.id === `temp-${tourId}` ? data : f));
      } else {
        setFavorites((prev) => prev.filter((f) => f.id !== `temp-${tourId}`));
      }
    }
  }, [favorites]);

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.tour_id)), [favorites]);

  const isFavorite = useCallback(
    (tourId: string): boolean => favoriteIds.has(tourId),
    [favoriteIds]
  );

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return { favorites, loading, toggleFavorite, isFavorite, refetch: fetchFavorites };
}
