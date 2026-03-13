import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SubscriptionContent } from './subscription-content';

async function getSubscriptionData() {
  const supabase = await createServerSupabaseClient();

  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price_monthly', { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let currentSub = null;
  if (user) {
    const { data: agency } = await supabase
      .from('agencies')
      .select('id')
      .eq('owner_id', user.id)
      .single();
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
  }

  return { plans: plans ?? [], currentSub };
}

export default async function SubscriptionPage() {
  const { plans, currentSub } = await getSubscriptionData();
  return <SubscriptionContent plans={plans} currentSub={currentSub} />;
}
