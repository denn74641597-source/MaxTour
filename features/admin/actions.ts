'use server';

import { createAdminClient } from '@/lib/supabase/server';

export async function updateTourStatusAction(tourId: string, status: string) {
  const validStatuses = ['draft', 'pending', 'published', 'archived'];
  if (!validStatuses.includes(status)) {
    return { error: 'Invalid status' };
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('tours')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', tourId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updateAgencyApprovalAction(agencyId: string, approved: boolean) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('agencies')
    .update({ is_approved: approved, updated_at: new Date().toISOString() })
    .eq('id', agencyId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/** Admin: approve coin purchase request — credits coins to agency */
export async function approveCoinRequest(requestId: string) {
  const supabase = await createAdminClient();

  const { data: req } = await supabase
    .from('coin_requests')
    .select('*')
    .eq('id', requestId)
    .eq('status', 'pending')
    .single();
  if (!req) return { error: 'Request not found or already resolved' };

  // Get current balance
  const { data: agency } = await supabase
    .from('agencies')
    .select('maxcoin_balance')
    .eq('id', req.agency_id)
    .single();
  const currentBalance = (agency as { maxcoin_balance: number } | null)?.maxcoin_balance ?? 0;

  // Credit coins
  const { error: balanceError } = await supabase
    .from('agencies')
    .update({ maxcoin_balance: currentBalance + req.coins })
    .eq('id', req.agency_id);
  if (balanceError) return { error: balanceError.message };

  // Mark request approved
  await supabase
    .from('coin_requests')
    .update({ status: 'approved', resolved_at: new Date().toISOString() })
    .eq('id', requestId);

  // Record transaction
  await supabase.from('maxcoin_transactions').insert({
    agency_id: req.agency_id,
    amount: req.coins,
    type: 'purchase',
    description: `${req.coins} MC sotib olindi (${Number(req.price_uzs).toLocaleString()} UZS)`,
  });

  return { success: true };
}

/** Admin: reject coin purchase request */
export async function rejectCoinRequest(requestId: string) {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from('coin_requests')
    .update({ status: 'rejected', resolved_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) return { error: error.message };
  return { success: true };
}
