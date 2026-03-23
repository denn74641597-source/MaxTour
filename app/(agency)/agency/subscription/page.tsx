import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SubscriptionContent } from './subscription-content';

async function getFollowedAgencies() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('agency_follows')
    .select('id, created_at, agency:agencies(id, name, slug, logo_url, description)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getFollowedAgencies error:', error);
    return [];
  }
  return data ?? [];
}

export default async function SubscriptionPage() {
  const agencies = await getFollowedAgencies();
  return <SubscriptionContent followedAgencies={agencies} />;
}
