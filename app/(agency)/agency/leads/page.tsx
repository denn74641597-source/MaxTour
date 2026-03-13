import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AgencyLeadsContent } from './leads-content';
import type { Lead } from '@/types';

async function getAgencyLeads() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { leads: [], agencyId: null };

  const { data: agency } = await supabase
    .from('agencies')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!agency) return { leads: [], agencyId: null };

  const { data } = await supabase
    .from('leads')
    .select('*, tour:tours(id, title)')
    .eq('agency_id', agency.id)
    .order('created_at', { ascending: false });

  return { leads: (data as Lead[]) ?? [], agencyId: agency.id };
}

export default async function AgencyLeadsPage() {
  const { leads } = await getAgencyLeads();

  return <AgencyLeadsContent initialLeads={leads} />;
}
