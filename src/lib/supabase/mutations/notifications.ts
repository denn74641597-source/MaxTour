import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveSupabaseClient } from '../client';

export async function saveNotificationPreferences(
  userId: string,
  preferences: Record<string, boolean>,
  client?: SupabaseClient
): Promise<void> {
  const supabase = resolveSupabaseClient(client);
  const { error } = await supabase.from('notification_preferences').upsert(
    {
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    throw error;
  }
}
