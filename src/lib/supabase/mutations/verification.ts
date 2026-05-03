import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveSupabaseClient } from '../client';

export interface VerificationFormInput {
  company_name: string;
  registered_name: string;
  country: string;
  office_address: string;
  work_phone: string;
  work_email: string;
  telegram_link: string;
  instagram_url: string;
  website_url: string;
  inn: string;
  registration_number: string;
  certificate_pdf_url: string;
  license_pdf_url: string;
}

export async function submitVerificationFormRequest(
  agencyId: string,
  formData: VerificationFormInput,
  client?: SupabaseClient
): Promise<{ success?: true; error?: string }> {
  const supabase = resolveSupabaseClient(client);

  const { data: existing } = await supabase
    .from('verification_requests')
    .select('id, status')
    .eq('agency_id', agencyId)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    return { error: "Allaqachon kutilayotgan so'rov mavjud" };
  }

  const { error } = await supabase.from('verification_requests').insert({
    agency_id: agencyId,
    certificate_url: formData.certificate_pdf_url || null,
    form_data: formData,
  });

  if (error) return { error: error.message };
  return { success: true };
}
