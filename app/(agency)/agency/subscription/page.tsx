import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getMyAgency } from '@/features/agencies/queries';
import { SubscriptionContent } from './subscription-content';

async function getFollowers(agencyId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('agency_follows')
    .select('id, created_at, profile:profiles(id, full_name, avatar_url, telegram_username)')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getFollowers error:', error);
    return [];
  }
  return data ?? [];
}

export default async function SubscriptionPage() {
  const agency = await getMyAgency();
  const followers = agency ? await getFollowers(agency.id) : [];
  return <SubscriptionContent followers={followers} />;
}
