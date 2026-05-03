import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Lead } from '@/types';

/** Fetch leads for an agency */
export async function getLeadsByAgency(agencyId: string): Promise<Lead[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('leads')
    .select('*, tour:tours(id, title, slug, cover_image_url, country, city)')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  return data ?? [];
}

/** Update lead status */
export async function updateLeadStatus(leadId: string, status: Lead['status']) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', leadId);

  if (error) throw error;
}
