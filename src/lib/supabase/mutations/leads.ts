import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveSupabaseClient } from '../client';
import type { LeadStatus } from '../../../types';

export interface SubmitLeadInput {
  tourId: string;
  agencyId: string;
  fullName: string;
  phone: string;
  peopleCount: number;
  telegramUsername?: string;
  comment?: string;
}

export async function submitLead(
  input: SubmitLeadInput,
  client?: SupabaseClient
): Promise<void> {
  const supabase = resolveSupabaseClient(client);
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const userId = authData.user?.id;
  if (!userId) throw new Error('Authentication required');

  const { error } = await supabase.from('leads').insert({
    tour_id: input.tourId,
    agency_id: input.agencyId,
    user_id: userId,
    full_name: input.fullName,
    phone: input.phone,
    people_count: input.peopleCount,
    telegram_username: input.telegramUsername || null,
    comment: input.comment || null,
    status: 'new',
  });

  if (error) throw error;
}

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
  client?: SupabaseClient
): Promise<void> {
  const supabase = resolveSupabaseClient(client);
  const { error } = await supabase
    .from('leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', leadId);

  if (error) throw error;
}
