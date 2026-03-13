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
