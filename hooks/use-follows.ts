'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AgencyFollow {
  id: string;
  user_id: string;
  agency_id: string;
  created_at: string;
}

const STORAGE_KEY = 'maxtour_follows';

function readCache(): AgencyFollow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCache(follows: AgencyFollow[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(follows));
  } catch {
    // quota exceeded – ignore
  }
}

export function useFollows() {
  const [follows, setFollows] = useState<AgencyFollow[]>(readCache);
  const [loading, setLoading] = useState(false);
  const supabaseRef = useRef(createClient());

  const fetchFollows = useCallback(async () => {
    const supabase = supabaseRef.current;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setFollows([]);
      writeCache([]);
      return;
    }

    const { data, error } = await supabase
      .from('agency_follows')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('fetchFollows error:', error);
      return;
    }
    const result = data ?? [];
    setFollows(result);
    writeCache(result);
  }, []);

  const toggleFollow = useCallback(async (agencyId: string) => {
    const supabase = supabaseRef.current;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const existing = follows.find((f) => f.agency_id === agencyId);
    if (existing) {
      const next = follows.filter((f) => f.id !== existing.id);
      setFollows(next);
      writeCache(next);
      await supabase.from('agency_follows').delete().eq('id', existing.id);
    } else {
      const tempId = `temp-${agencyId}`;
      const optimistic: AgencyFollow = { id: tempId, user_id: user.id, agency_id: agencyId, created_at: new Date().toISOString() };
      const next = [...follows, optimistic];
      setFollows(next);
      writeCache(next);
      const { data, error } = await supabase
        .from('agency_follows')
        .insert({ user_id: user.id, agency_id: agencyId })
        .select()
        .single();
      if (error) {
        console.error('toggleFollow insert error:', error);
        const reverted = follows.filter((f) => f.id !== tempId);
        setFollows(reverted);
        writeCache(reverted);
      } else if (data) {
        setFollows((prev) => {
          const updated = prev.map((f) => (f.id === tempId ? data : f));
          writeCache(updated);
          return updated;
        });
      }
    }
  }, [follows]);

  const followedIds = useMemo(() => new Set(follows.map((f) => f.agency_id)), [follows]);

  const isFollowing = useCallback(
    (agencyId: string): boolean => followedIds.has(agencyId),
    [followedIds]
  );

  const followedAgencyIds = useMemo(() => follows.map((f) => f.agency_id), [follows]);

  useEffect(() => {
    fetchFollows();
  }, [fetchFollows]);

  return { follows, loading, toggleFollow, isFollowing, followedAgencyIds, refetch: fetchFollows };
}
