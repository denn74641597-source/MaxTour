import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getMyAgency } from '@/features/agencies/queries';
import { SubscriptionContent } from './subscription-content';

async function getSubscriptionData() {
  const supabase = await createServerSupabaseClient();

  const [plansRes, agency] = await Promise.all([
    supabase
      .from('subscription_plans')
      .select('*')
      .order('price_monthly', { ascending: true }),
    getMyAgency(),
  ]);

  const plans = plansRes.data ?? [];

  let currentSub = null;
  if (agency) {
    const { data } = await supabase
      .from('agency_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('agency_id', agency.id)
      .eq('status', 'active')
      .limit(1)
      .single();
    currentSub = data;
  }

  return { plans, currentSub };
}

export default async function SubscriptionPage() {
  const { plans, currentSub } = await getSubscriptionData();
  return <SubscriptionContent plans={plans} currentSub={currentSub} />;
}
