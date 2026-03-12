'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Favorite } from '@/types';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  async function fetchFavorites() {
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
  }

  async function toggleFavorite(tourId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const existing = favorites.find((f) => f.tour_id === tourId);
    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id);
      setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
    } else {
      const { data } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, tour_id: tourId })
        .select()
        .single();
      if (data) setFavorites((prev) => [data, ...prev]);
    }
  }

  function isFavorite(tourId: string): boolean {
    return favorites.some((f) => f.tour_id === tourId);
  }

  useEffect(() => {
    fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { favorites, loading, toggleFavorite, isFavorite, refetch: fetchFavorites };
}
