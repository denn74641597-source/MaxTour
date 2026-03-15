'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AgencyFollow {
  id: string;
  user_id: string;
  agency_id: string;
  created_at: string;
}

export function useFollows() {
  const [follows, setFollows] = useState<AgencyFollow[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());

  const fetchFollows = useCallback(async () => {
    const supabase = supabaseRef.current;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('agency_follows')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('fetchFollows error:', error);
    }
    setFollows(data ?? []);
    setLoading(false);
  }, []);

  const toggleFollow = useCallback(async (agencyId: string) => {
    const supabase = supabaseRef.current;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const existing = follows.find((f) => f.agency_id === agencyId);
    if (existing) {
      setFollows((prev) => prev.filter((f) => f.id !== existing.id));
      await supabase.from('agency_follows').delete().eq('id', existing.id);
    } else {
      const tempId = `temp-${agencyId}`;
      setFollows((prev) => [
        ...prev,
        { id: tempId, user_id: user.id, agency_id: agencyId, created_at: new Date().toISOString() },
      ]);
      const { data, error } = await supabase
        .from('agency_follows')
        .insert({ user_id: user.id, agency_id: agencyId })
        .select()
        .single();
      if (error) {
        console.error('toggleFollow insert error:', error);
        setFollows((prev) => prev.filter((f) => f.id !== tempId));
      } else if (data) {
        setFollows((prev) => prev.map((f) => (f.id === tempId ? data : f)));
      } else {
        setFollows((prev) => prev.filter((f) => f.id !== tempId));
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
