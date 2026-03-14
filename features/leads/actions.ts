'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

const serverLeadSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(7),
  people_count: z.coerce.number().int().min(1).max(100).default(1),
  telegram_username: z.string().optional(),
  comment: z.string().max(500).optional(),
});

export async function submitLead(tourId: string, agencyId: string, formData: Record<string, unknown>) {
  const parsed = serverLeadSchema.safeParse(formData);
  if (!parsed.success) {
    console.error('Lead validation error:', parsed.error.flatten());
    return { success: false, error: 'Invalid form data' };
  }

  const supabase = await createServerSupabaseClient();

  // Get current user if authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const insertData: Record<string, unknown> = {
    tour_id: tourId,
    agency_id: agencyId,
    user_id: user?.id ?? null,
    full_name: parsed.data.full_name,
    phone: parsed.data.phone,
    people_count: parsed.data.people_count ?? 1,
    telegram_username: parsed.data.telegram_username ?? null,
    comment: parsed.data.comment ?? null,
    status: 'new',
  };

  let { error } = await supabase.from('leads').insert(insertData);

  // Retry without people_count if column doesn't exist yet
  if (error && error.message?.includes('people_count')) {
    delete insertData.people_count;
    ({ error } = await supabase.from('leads').insert(insertData));
  }

  if (error) {
    console.error('Lead submission error:', error);
    return { success: false, error: 'Failed to submit request' };
  }

  return { success: true };
}
