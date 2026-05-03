'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';

const ALLOWED_ROLES = new Set<Profile['role']>(['user', 'agency_manager', 'admin']);

interface UseProfileState {
  profile: Profile | null;
  loading: boolean;
  roleResolved: boolean;
  pendingDeletion: boolean;
  sessionExpired: boolean;
  error: string | null;
}

/** Hook to get the current user's profile on the client side */
export function useProfile() {
  const [state, setState] = useState<UseProfileState>({
    profile: null,
    loading: true,
    roleResolved: false,
    pendingDeletion: false,
    sessionExpired: false,
    error: null,
  });

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    async function signOutLocalFirst() {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        await supabase.auth.signOut().catch(() => undefined);
      }
    }

    async function fetchProfile() {
      if (!isMounted) return;
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (!isMounted) return;
          setState({
            profile: null,
            loading: false,
            roleResolved: false,
            pendingDeletion: false,
            sessionExpired: false,
            error: null,
          });
          return;
        }

        if (
          typeof session.expires_at === 'number' &&
          session.expires_at * 1000 <= Date.now()
        ) {
          await signOutLocalFirst();
          if (!isMounted) return;
          setState({
            profile: null,
            loading: false,
            roleResolved: false,
            pendingDeletion: false,
            sessionExpired: true,
            error: null,
          });
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select(
            'id, role, full_name, telegram_username, phone, email, avatar_url, push_token, deletion_requested_at, created_at, updated_at'
          )
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          if (!isMounted) return;
          setState({
            profile: null,
            loading: false,
            roleResolved: true,
            pendingDeletion: false,
            sessionExpired: false,
            error: error.message,
          });
          return;
        }

        if (!data) {
          if (!isMounted) return;
          setState({
            profile: null,
            loading: false,
            roleResolved: true,
            pendingDeletion: false,
            sessionExpired: false,
            error: null,
          });
          return;
        }

        if (data.deletion_requested_at) {
          await signOutLocalFirst();
          if (!isMounted) return;
          setState({
            profile: null,
            loading: false,
            roleResolved: false,
            pendingDeletion: true,
            sessionExpired: false,
            error: null,
          });
          return;
        }

        if (!ALLOWED_ROLES.has(data.role)) {
          await signOutLocalFirst();
          if (!isMounted) return;
          setState({
            profile: null,
            loading: false,
            roleResolved: false,
            pendingDeletion: false,
            sessionExpired: false,
            error: 'Role is not allowed',
          });
          return;
        }

        if (!isMounted) return;
        setState({
          profile: data as Profile,
          loading: false,
          roleResolved: true,
          pendingDeletion: false,
          sessionExpired: false,
          error: null,
        });
      } catch (error) {
        if (!isMounted) return;
        setState({
          profile: null,
          loading: false,
          roleResolved: false,
          pendingDeletion: false,
          sessionExpired: false,
          error: error instanceof Error ? error.message : 'Failed to load profile',
        });
      }
    }

    fetchProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        if (!isMounted) return;
        setState({
          profile: null,
          loading: false,
          roleResolved: false,
          pendingDeletion: false,
          sessionExpired: false,
          error: null,
        });
        return;
      }

      setState((prev) => ({
        ...prev,
        loading: true,
        roleResolved: false,
        pendingDeletion: false,
      }));
      fetchProfile();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    ...state,
    acknowledgePendingDeletion: () =>
      setState((prev) => ({ ...prev, pendingDeletion: false })),
  };
}
