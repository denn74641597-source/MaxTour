import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AgencyToursContent } from './agency-tours-content';

async function getAgencyTours() {
  const supabase = await createServerSupabaseClient();
  const { data: agency } = await supabase.from('agencies').select('id').limit(1).single();
  if (!agency) return [];

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
