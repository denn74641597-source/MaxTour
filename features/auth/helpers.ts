import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Profile, UserRole } from '@/types';

/**
 * Get the current authenticated user's profile.
 * Returns null if not authenticated.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

/**
 * Check if the current user has one of the allowed roles.
 * Returns the profile if authorized, null otherwise.
 */
export async function requireRole(
  ...allowedRoles: UserRole[]
): Promise<Profile | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  if (!allowedRoles.includes(profile.role)) return null;
  return profile;
}

/**
 * Get the agency owned by the current user (for agency_manager role).
 */
export async function getCurrentAgency() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'agency_manager') return null;

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('agencies')
    .select('*')
    .eq('owner_id', profile.id)
    .single();

  return data;
}
