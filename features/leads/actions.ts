'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { leadFormSchema, type LeadFormData } from '@/lib/validators';

export async function submitLead(tourId: string, agencyId: string, formData: LeadFormData) {
  const parsed = leadFormSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: 'Invalid form data' };
  }

  const supabase = await createServerSupabaseClient();

  // Get current user if authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('leads').insert({
    tour_id: tourId,
    agency_id: agencyId,
    user_id: user?.id ?? null,
    full_name: parsed.data.full_name,
    phone: parsed.data.phone,
    people_count: parsed.data.people_count ?? 1,
    telegram_username: parsed.data.telegram_username ?? null,
    comment: parsed.data.comment ?? null,
    status: 'new',
  });

  if (error) {
    console.error('Lead submission error:', error);
    return { success: false, error: 'Failed to submit request' };
  }

  return { success: true };
}
