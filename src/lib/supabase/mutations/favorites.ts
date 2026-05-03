import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveSupabaseClient } from '../client';

export async function toggleFavorite(
  userId: string,
  tourId: string,
  client?: SupabaseClient
): Promise<boolean> {
  const supabase = resolveSupabaseClient(client);

  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('tour_id', tourId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('tour_id', tourId);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, tour_id: tourId });
  if (error) throw error;
  return true;
}
