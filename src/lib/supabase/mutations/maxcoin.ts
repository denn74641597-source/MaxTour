import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveSupabaseClient } from '../client';
import type { PromoteTourResult, PromotionPlacement } from '../../../types';

function createIdempotencyKey(
  agencyId: string,
  tourId: string,
  tierId: string
): string {
  const cryptoObj = (globalThis as {
    crypto?: {
      randomUUID?: () => string;
      getRandomValues?: (arr: Uint8Array) => Uint8Array;
    };
  }).crypto;

  let nonce: string;
  if (cryptoObj?.randomUUID) {
    nonce = cryptoObj.randomUUID().replace(/-/g, '');
  } else if (cryptoObj?.getRandomValues) {
    const buffer = new Uint8Array(16);
    cryptoObj.getRandomValues(buffer);
    nonce = Array.from(buffer, (b) => b.toString(16).padStart(2, '0')).join('');
  } else {
    nonce = `${Date.now().toString(36)}${Math.random()
      .toString(36)
      .slice(2)}${Math.random().toString(36).slice(2)}`;
  }

  return `promote:${agencyId}:${tourId}:${tierId}:${Date.now().toString(
    36
  )}:${nonce}`;
}

function parseLockUntilFromMessage(message: string | undefined): string | undefined {
  if (!message) return undefined;
  const match = message.match(/until\s+([^,\n]+)$/i);
  return match?.[1]?.trim();
}

function normalizePromoteError(message: string | undefined): PromoteTourResult {
  const raw = message || 'Promotion failed';
  if (/insufficient_balance/i.test(raw)) {
    return { errorCode: 'INSUFFICIENT_BALANCE', error: raw };
  }
  if (/tour_already_promoted_or_waitlisted/i.test(raw)) {
    return { errorCode: 'TOUR_ALREADY_PROMOTED_OR_WAITLISTED', error: raw };
  }
  if (/agency_active_placement_locked/i.test(raw)) {
    return {
      errorCode: 'AGENCY_ACTIVE_PLACEMENT_LOCKED',
      error: raw,
      lockUntil: parseLockUntilFromMessage(raw),
    };
  }
  return { errorCode: 'PROMOTION_FAILED', error: raw };
}

export async function purchaseMaxCoins(
  agencyId: string,
  coins: number,
  client?: SupabaseClient
) {
  const supabase = resolveSupabaseClient(client);
  if (coins < 5 || coins > 200) return { error: 'Invalid coin amount' };

  const COIN_PRICE_UZS = 15000;
  const { error } = await supabase
    .from('coin_requests')
    .insert({
      agency_id: agencyId,
      coins,
      price_uzs: coins * COIN_PRICE_UZS,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  return { success: true, pending: true };
}

export async function promoteTour(
  agencyId: string,
  tourId: string,
  tierId: string,
  client?: SupabaseClient
): Promise<PromoteTourResult> {
  const supabase = resolveSupabaseClient(client);
  const { data: tier, error: tierError } = await supabase
    .from('promotion_tiers')
    .select('coins, placement, days')
    .eq('id', tierId)
    .single();

  if (tierError || !tier) {
    return { error: 'Tier not found', errorCode: 'TIER_NOT_FOUND' };
  }

  const placement = tier.placement as PromotionPlacement;
  if (
    placement !== 'featured' &&
    placement !== 'hot_deals' &&
    placement !== 'hot_tours'
  ) {
    return {
      errorCode: 'PROMOTION_FAILED',
      error: 'Unsupported promotion placement',
    };
  }

  const nowIso = new Date().toISOString();
  const { data: activeByPlacement } = await supabase
    .from('tour_promotions')
    .select('id, ends_at')
    .eq('agency_id', agencyId)
    .eq('placement', placement)
    .eq('status', 'active')
    .eq('is_active', true)
    .gte('ends_at', nowIso)
    .limit(1);

  if ((activeByPlacement ?? []).length > 0) {
    return {
      errorCode: 'AGENCY_ACTIVE_PLACEMENT_LOCKED',
      error: 'agency_active_placement_locked',
      lockUntil: activeByPlacement?.[0]?.ends_at,
    };
  }

  const rpcName =
    placement === 'featured'
      ? 'promote_tour_featured_fair_v1'
      : 'promote_tour_fair_v1';

  const { data: fairData, error: fairError } = await supabase.rpc(rpcName, {
    p_agency_id: agencyId,
    p_tour_id: tourId,
    p_tier_id: tierId,
    p_idempotency_key: createIdempotencyKey(agencyId, tourId, tierId),
  });

  if (fairError) {
    const fairMessage = fairError.message || 'Promotion failed';
    const functionMissing =
      /promote_tour_fair_v1|promote_tour_featured_fair_v1|function.+does not exist|Could not find the function/i.test(
        fairMessage
      );

    if (functionMissing) {
      return {
        errorCode: 'PROMOTION_FAILED',
        error: 'Promotion service is unavailable. Please try again later.',
      };
    }
    return normalizePromoteError(fairMessage);
  }

  if (!fairData) {
    return {
      errorCode: 'PROMOTION_FAILED',
      error: 'Promotion service returned empty response',
    };
  }

  const payload = fairData as {
    success?: boolean;
    error?: string;
    status?: 'active' | 'waitlist';
    newBalance?: number;
    currentBalance?: number;
    chargedNow?: boolean;
  };

  if (!payload.success) {
    return normalizePromoteError(payload.error || 'Promotion failed');
  }

  if (payload.status === 'waitlist') {
    return {
      success: true,
      status: 'waitlist',
      chargedNow: payload.chargedNow ?? false,
      currentBalance: payload.currentBalance,
    };
  }

  return {
    success: true,
    status: 'active',
    newBalance: payload.newBalance,
  };
}
