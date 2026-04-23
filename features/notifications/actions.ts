'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  NOTIFICATION_PREFERENCE_KEYS,
  type NotificationPreferenceKey,
  type NotificationPreferences,
} from '@/types';

const ALLOWED = new Set<string>(NOTIFICATION_PREFERENCE_KEYS);

/**
 * Update the current user's notification preferences (upsert).
 * Accepts a partial map of preference keys → boolean values. Unknown keys are dropped.
 */
export async function updateNotificationPreferencesAction(
  updates: Partial<Record<NotificationPreferenceKey, boolean>>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated' };

  // Strip unknown keys & non-boolean values to avoid garbage being written.
  const safe: Record<string, unknown> = { user_id: user.id, updated_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(updates)) {
    if (ALLOWED.has(key) && typeof value === 'boolean') safe[key] = value;
  }

  const { error } = await supabase
    .from('notification_preferences')
    .upsert(safe as Partial<NotificationPreferences>, { onConflict: 'user_id' });

  if (error) {
    console.error('[notifications] updateNotificationPreferencesAction error:', error.message);
    return { success: false, error: error.message };
  }

  revalidatePath('/profile/notifications');
  return { success: true };
}

/**
 * Save a freshly-acquired Web Push / Expo Push token to the current user's profile.
 * No-op if user is not signed in.
 */
export async function savePushTokenAction(token: string): Promise<{ success: boolean }> {
  if (!token || typeof token !== 'string') return { success: false };
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase
    .from('profiles')
    .update({ push_token: token })
    .eq('id', user.id);

  if (error) {
    console.error('[notifications] savePushTokenAction error:', error.message);
    return { success: false };
  }
  return { success: true };
}
