import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveSupabaseClient } from '../client';

export async function toggleFollow(
  userId: string,
  agencyId: string,
  client?: SupabaseClient
): Promise<boolean> {
  const supabase = resolveSupabaseClient(client);
  const { data: existing, error: existingError } = await supabase
    .from('agency_follows')
    .select('id')
    .eq('user_id', userId)
    .eq('agency_id', agencyId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const { error } = await supabase
      .from('agency_follows')
      .delete()
      .eq('user_id', userId)
      .eq('agency_id', agencyId);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase
    .from('agency_follows')
    .insert({ user_id: userId, agency_id: agencyId });
  if (error) throw error;
  return true;
}

export async function updateAgencyProfile(
  agencyId: string,
  updates: Record<string, unknown>,
  client?: SupabaseClient
) {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('agencies')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', agencyId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function submitReview(
  agencyId: string,
  userId: string,
  rating: number,
  comment: string | null,
  client?: SupabaseClient
): Promise<{ success: boolean; error?: string }> {
  const supabase = resolveSupabaseClient(client);
  if (rating < 1 || rating > 5) {
    return { success: false, error: 'Invalid rating' };
  }

  const { data: existing, error: existingError } = await supabase
    .from('reviews')
    .select('id')
    .eq('agency_id', agencyId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingError) return { success: false, error: 'Failed to submit review' };
  if (existing) return { success: false, error: 'already_reviewed' };

  const { error } = await supabase.from('reviews').insert({
    agency_id: agencyId,
    user_id: userId,
    rating,
    comment: comment ? comment.slice(0, 500) : null,
  });

  if (error) return { success: false, error: 'Failed to submit review' };
  return { success: true };
}
