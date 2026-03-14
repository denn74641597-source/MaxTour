'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getMyAgency } from './queries';

export async function upsertAgencyProfileAction(payload: {
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  phone: string | null;
  telegram_username: string | null;
  instagram_url: string | null;
  website_url: string | null;
  address: string | null;
  city: string | null;
  country: string;
  google_maps_url: string | null;
}) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Check if agency exists for this user
  const { data: existing } = await supabase
    .from('agencies')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (existing) {
    // Update
    const { error } = await supabase
      .from('agencies')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) return { error: error.message };
    return { success: true };
  } else {
    // Insert
    const { error } = await supabase
      .from('agencies')
      .insert({ ...payload, owner_id: user.id });
    if (error) return { error: error.message };
    return { success: true };
  }
}

export async function getMyAgencyAction() {
  return getMyAgency();
}

export async function incrementAgencyViews(agencyId: string) {
  const supabase = await createServerSupabaseClient();
  // Get current views and increment
  const { data } = await supabase
    .from('agencies')
    .select('profile_views')
    .eq('id', agencyId)
    .single();
  const currentViews = (data as any)?.profile_views ?? 0;
  await supabase
    .from('agencies')
    .update({ profile_views: currentViews + 1 })
    .eq('id', agencyId);
}

export async function submitReview(agencyId: string, rating: number, comment: string | null) {
  if (rating < 1 || rating > 5) return { success: false, error: 'Invalid rating' };

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Check if user already reviewed this agency
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('agency_id', agencyId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return { success: false, error: 'already_reviewed' };
  }

  const { error } = await supabase.from('reviews').insert({
    agency_id: agencyId,
    user_id: user.id,
    rating,
    comment: comment || null,
  });

  if (error) {
    console.error('Review submission error:', error);
    return { success: false, error: 'Failed to submit review' };
  }

  return { success: true };
}
