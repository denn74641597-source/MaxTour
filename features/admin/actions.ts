'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { notifySystemError } from '@/lib/telegram/admin-bot';
import { assertAdminAccess } from './guard';
import { getAdminAgencyDetailById } from './queries';

interface UpdateTourStatusOptions {
  grantApprovalBonus?: boolean;
  bonusAmount?: number;
}

export async function updateTourStatusAction(
  tourId: string,
  status: string,
  options: UpdateTourStatusOptions = {}
) {
  const { userId } = await assertAdminAccess();
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
    await notifySystemError({ source: 'Action: updateTourStatusAction', message: error.message, extra: `Tour: ${tourId}, Status: ${status}` });
    return { error: error.message };
  }

  const shouldGrantBonus = status === 'published' && options.grantApprovalBonus === true;
  if (!shouldGrantBonus) {
    return { success: true, bonusGranted: false, bonusSkipped: true };
  }

  const safeBonusAmount = Number.isFinite(options.bonusAmount)
    ? Math.max(1, Math.floor(Number(options.bonusAmount)))
    : 2;

  const bonusResult = await supabase.rpc('grant_tour_approval_bonus_v1', {
    p_tour_id: tourId,
    p_admin_user_id: userId,
    p_bonus_amount: safeBonusAmount,
  });

  if (bonusResult.error) {
    await notifySystemError({
      source: 'Action: updateTourStatusAction.bonusGrant',
      message: bonusResult.error.message,
      extra: `Tour: ${tourId}, Admin: ${userId}`,
    });
    return {
      success: true,
      bonusGranted: false,
      bonusError: bonusResult.error.message,
    };
  }

  const payload = bonusResult.data as {
    success?: boolean;
    granted?: boolean;
    bonusAmount?: number;
    error?: string;
  } | null;

  if (payload?.success === false) {
    return {
      success: true,
      bonusGranted: false,
      bonusError: payload.error ?? 'bonus_grant_failed',
    };
  }

  return {
    success: true,
    bonusGranted: payload?.granted === true,
    bonusSkipped: payload?.granted === false,
    bonusAmount: Number(payload?.bonusAmount ?? safeBonusAmount),
  };
}

export async function updateAgencyApprovalAction(agencyId: string, approved: boolean) {
  await assertAdminAccess();
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('agencies')
    .update({ is_approved: approved, updated_at: new Date().toISOString() })
    .eq('id', agencyId);

  if (error) {
    await notifySystemError({ source: 'Action: updateAgencyApprovalAction', message: error.message, extra: `Agency: ${agencyId}` });
    return { error: error.message };
  }

  return { success: true };
}

/** Admin: approve coin purchase request — credits coins to agency */
export async function approveCoinRequest(requestId: string) {
  await assertAdminAccess();
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
  if (balanceError) {
    await notifySystemError({ source: 'Action: approveCoinRequest', message: balanceError.message, extra: `Request: ${requestId}` });
    return { error: balanceError.message };
  }

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
  await assertAdminAccess();
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from('coin_requests')
    .update({ status: 'rejected', resolved_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) {
    await notifySystemError({ source: 'Action: rejectCoinRequest', message: error.message, extra: `Request: ${requestId}` });
    return { error: error.message };
  }
  return { success: true };
}

export async function updateLeadStatusAction(leadId: string, status: string) {
  await assertAdminAccess();
  const validStatuses = ['new', 'contacted', 'closed', 'won', 'lost'];
  if (!validStatuses.includes(status)) {
    return { error: 'Invalid status' };
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', leadId);

  if (error) {
    await notifySystemError({
      source: 'Action: updateLeadStatusAction',
      message: error.message,
      extra: `Lead: ${leadId}, Status: ${status}`,
    });
    return { error: error.message };
  }

  return { success: true };
}

/** Admin: fetch one agency drill-down payload for agencies panel */
export async function getAdminAgencyDetailAction(agencyId: string) {
  await assertAdminAccess();
  if (!agencyId) return { error: 'Agency ID is required' };

  try {
    const detail = await getAdminAgencyDetailById(agencyId);
    if (!detail) return { error: 'Agency not found' };
    return { data: detail };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await notifySystemError({
      source: 'Action: getAdminAgencyDetailAction',
      message,
      extra: `Agency: ${agencyId}`,
    });
    return { error: message };
  }
}
