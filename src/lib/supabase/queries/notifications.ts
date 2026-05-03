import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveSupabaseClient } from '../client';
import type { NotificationPreferencesRow } from '../../../types';

export const DEFAULT_NOTIFICATION_PREFERENCES: Required<
  Omit<NotificationPreferencesRow, 'user_id' | 'created_at' | 'updated_at'>
> = {
  new_tour_from_followed: true,
  price_drop: true,
  seats_low: true,
  tour_cancelled: true,
  departure_reminder: true,
  hot_deals: true,
  lead_confirmed: true,
  lead_status_changed: true,
  agency_verified_notify: true,
  weekly_picks: true,
  new_lead: true,
  daily_leads_summary: true,
  pending_leads_reminder: true,
  tour_approved: true,
  tour_rejected: true,
  tour_milestone: true,
  seats_alert: true,
  tour_expiring: true,
  subscription_expiring: true,
  subscription_expired: true,
  new_review: true,
  new_follower: true,
  follower_milestone: true,
  verification_update: true,
};

export async function getNotificationPreferences(
  userId: string,
  client?: SupabaseClient
): Promise<typeof DEFAULT_NOTIFICATION_PREFERENCES> {
  const supabase = resolveSupabaseClient(client);
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  const { user_id, created_at, updated_at, ...rest } = data;
  void user_id;
  void created_at;
  void updated_at;
  return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...rest };
}
