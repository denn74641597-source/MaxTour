import { createAdminClient } from '@/lib/supabase/server';

/** Admin: get all agencies with approval status */
export async function getAllAgencies() {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from('agencies')
    .select('*, owner:profiles(full_name, telegram_username)')
    .order('created_at', { ascending: false });

  return data ?? [];
}

/** Admin: get all tours for moderation */
export async function getAllTours() {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from('tours')
    .select('*, agency:agencies(id, name, slug)')
    .order('created_at', { ascending: false });

  return data ?? [];
}

/** Admin: approve or reject an agency */
export async function setAgencyApproval(agencyId: string, approved: boolean) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('agencies')
    .update({ is_approved: approved, updated_at: new Date().toISOString() })
    .eq('id', agencyId);

  if (error) throw error;
}

/** Admin: update tour status (publish/reject) */
export async function setTourStatus(tourId: string, status: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('tours')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', tourId);

  if (error) throw error;
}

/** Admin: get subscription overview */
export async function getSubscriptionOverview() {
  const supabase = await createAdminClient();
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price_monthly', { ascending: true });

  const { data: subscriptions } = await supabase
    .from('agency_subscriptions')
    .select('*, agency:agencies(name, slug), plan:subscription_plans(name, price_monthly)')
    .order('created_at', { ascending: false });

  return { plans: plans ?? [], subscriptions: subscriptions ?? [] };
}

/** Admin: get featured items */
export async function getFeaturedItems() {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from('featured_items')
    .select('*, tour:tours(id, title, slug), agency:agencies(id, name, slug)')
    .order('starts_at', { ascending: false });

  return data ?? [];
}

/** Admin: dashboard stats */
export async function getAdminStats() {
  const supabase = await createAdminClient();

  const [agencies, tours, leads, subscriptions, pendingCoinRequests] = await Promise.all([
    supabase.from('agencies').select('id', { count: 'exact', head: true }),
    supabase.from('tours').select('id', { count: 'exact', head: true }),
    supabase.from('leads').select('id', { count: 'exact', head: true }),
    supabase
      .from('agency_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('coin_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);

  return {
    totalAgencies: agencies.count ?? 0,
    totalTours: tours.count ?? 0,
    totalLeads: leads.count ?? 0,
    activeSubscriptions: subscriptions.count ?? 0,
    pendingCoinRequests: pendingCoinRequests.count ?? 0,
  };
}

/** Admin: get coin purchase requests */
export async function getCoinRequests(status?: string) {
  const supabase = await createAdminClient();
  let query = supabase
    .from('coin_requests')
    .select('*, agency:agencies(name, slug, phone, telegram_username)')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data } = await query;
  return data ?? [];
}

/** Admin: get all leads across all agencies with tour & agency info */
export async function getAllLeads() {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from('leads')
    .select('*, tour:tours(id, title, slug, cover_image_url, country, city, price, currency), agency:agencies(id, name, slug, phone, telegram_username)')
    .order('created_at', { ascending: false });

  return data ?? [];
}
