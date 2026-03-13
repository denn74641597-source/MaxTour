import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getMyAgency } from '@/features/agencies/queries';
import { AgencyToursContent } from './agency-tours-content';

async function getAgencyTours() {
  const agency = await getMyAgency();
  if (!agency) return [];

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('tours')
    .select('*')
    .eq('agency_id', agency.id)
    .order('created_at', { ascending: false });

  return data ?? [];
}

export default async function AgencyToursPage() {
  const tours = await getAgencyTours();
  return <AgencyToursContent tours={tours} />;
}
