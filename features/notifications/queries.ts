import 'server-only';
import { cache } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  NOTIFICATION_PREFERENCE_KEYS,
  type NotificationLogEntry,
  type NotificationPreferenceKey,
  type NotificationPreferences,
} from '@/types';

/** Returns default preferences object (all true) for the given user. */
export function buildDefaultNotificationPreferences(userId: string): NotificationPreferences {
  const now = new Date().toISOString();
  const base: NotificationPreferences = {
    user_id: userId,
    created_at: now,
    updated_at: now,
  };
  for (const key of NOTIFICATION_PREFERENCE_KEYS) {
    (base as Record<string, unknown>)[key] = true;
  }
  return base;
}

/**
 * Fetch notification preferences for the given user.
 * If no row exists yet, returns defaults (all preferences enabled).
 * Cached per request.
 */
export const getNotificationPreferences = cache(
  async (userId: string): Promise<NotificationPreferences> => {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[notifications] getNotificationPreferences error:', error.message);
      return buildDefaultNotificationPreferences(userId);
    }
    if (!data) return buildDefaultNotificationPreferences(userId);
    return data as NotificationPreferences;
  },
);

/** Fetch the most recent notification log entries (admin / user diagnostic). */
export async function getRecentNotificationLog(limit = 50): Promise<NotificationLogEntry[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('notification_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('[notifications] getRecentNotificationLog error:', error.message);
    return [];
  }
  return (data ?? []) as NotificationLogEntry[];
}

export { NOTIFICATION_PREFERENCE_KEYS };
export type { NotificationPreferenceKey, NotificationPreferences };
