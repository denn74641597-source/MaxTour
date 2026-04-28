'use server';

import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { notifySystemError } from '@/lib/telegram/admin-bot';

/**
 * Account deletion requests — admin actions.
 *
 * User mobile ilovadan "Hisobni o'chirish" → "So'rov yuborish" qilganda
 * `request-account-deletion` edge function `account_deletion_requests`
 * jadvaliga `pending` yozuv qo'shadi va `profiles.deletion_requested_at`
 * flag qo'yadi (user darhol app'dan chiqariladi).
 *
 * Admin bu yerda:
 *   1) Pending so'rovlarni ko'radi.
 *   2) `approveDeletionRequestAction` — tasdiqlasa, edge function ishga tushadi:
 *      agentlik storage fayllari (logos/, tours/, hotels/, certificates/,
 *      licenses/) o'chiriladi, user/agency DB rows va auth.users hard-delete.
 *   3) `rejectDeletionRequestAction` — rad etsa, `profiles.deletion_requested_at`
 *      tozalanadi va user qayta kira oladi.
 */

export interface AccountDeletionRequest {
  id: string;
  user_id: string;
  agency_id: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  // Joined
  user_full_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  agency_name: string | null;
}

export async function getAllAccountDeletionRequests(): Promise<AccountDeletionRequest[]> {
  const admin = await createAdminClient();

  // RLS bypass qilamiz (service role) chunki status='approved'/'rejected' bo'lsa
  // user profile o'chirilgan bo'ladi va auth.uid orqali ko'rib bo'lmaydi.
  const { data, error } = await admin
    .from('account_deletion_requests')
    .select(`
      id,
      user_id,
      agency_id,
      reason,
      status,
      requested_at,
      reviewed_by,
      reviewed_at,
      admin_notes,
      user:profiles!account_deletion_requests_user_id_fkey(full_name, email, phone),
      agency:agencies(name)
    `)
    .order('requested_at', { ascending: false });

  if (error) {
    await notifySystemError({
      source: 'Action: getAllAccountDeletionRequests',
      message: error.message,
    });
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const user = row.user as { full_name?: string | null; email?: string | null; phone?: string | null } | null;
    const agency = row.agency as { name?: string | null } | null;
    return {
      id: row.id as string,
      user_id: row.user_id as string,
      agency_id: (row.agency_id as string | null) ?? null,
      reason: (row.reason as string | null) ?? null,
      status: row.status as AccountDeletionRequest['status'],
      requested_at: row.requested_at as string,
      reviewed_by: (row.reviewed_by as string | null) ?? null,
      reviewed_at: (row.reviewed_at as string | null) ?? null,
      admin_notes: (row.admin_notes as string | null) ?? null,
      user_full_name: user?.full_name ?? null,
      user_email: user?.email ?? null,
      user_phone: user?.phone ?? null,
      agency_name: agency?.name ?? null,
    };
  });
}

export async function approveDeletionRequestAction(requestId: string, adminNotes?: string) {
  // Caller adminligini tekshirish — middleware odatda buni qiladi, lekin
  // server action mustaqil chaqirilishi mumkinligi uchun ikki tomonlama himoya.
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!callerProfile || callerProfile.role !== 'admin') {
    return { error: 'Forbidden: admin only' };
  }

  // User session token bilan edge functionga POST qilamiz (function ham
  // o'z ichida adminlik tekshiruvini bajaradi).
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { error: 'No session' };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return { error: 'Missing NEXT_PUBLIC_SUPABASE_URL' };

  try {
    const res = await fetch(`${url}/functions/v1/approve-account-deletion`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request_id: requestId,
        admin_notes: adminNotes ?? null,
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = (body as { error?: string }).error ?? `HTTP ${res.status}`;
      await notifySystemError({
        source: 'Action: approveDeletionRequestAction',
        message,
        extra: `Request: ${requestId}`,
      });
      return { error: message };
    }

    return {
      success: true,
      deleted_storage_objects: (body as { deleted_storage_objects?: number }).deleted_storage_objects ?? 0,
      warnings: (body as { warnings?: string[] }).warnings ?? [],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await notifySystemError({
      source: 'Action: approveDeletionRequestAction',
      message,
      extra: `Request: ${requestId}`,
    });
    return { error: message };
  }
}

export async function rejectDeletionRequestAction(requestId: string, adminNotes?: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!callerProfile || callerProfile.role !== 'admin') {
    return { error: 'Forbidden: admin only' };
  }

  const admin = await createAdminClient();

  // 1) So'rov ma'lumotini olamiz (user_id kerak)
  const { data: req, error: reqErr } = await admin
    .from('account_deletion_requests')
    .select('id, user_id, agency_id, status')
    .eq('id', requestId)
    .single();

  if (reqErr || !req) {
    return { error: 'Request not found' };
  }

  if (req.status !== 'pending') {
    return { error: `Request is already ${req.status}` };
  }

  // 2) Request statusini rejected qilamiz
  const { error: updErr } = await admin
    .from('account_deletion_requests')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes ?? null,
    })
    .eq('id', requestId);

  if (updErr) {
    await notifySystemError({
      source: 'Action: rejectDeletionRequestAction',
      message: updErr.message,
      extra: `Request: ${requestId}`,
    });
    return { error: updErr.message };
  }

  // 3) Profile flag'larini tozalaymiz → user qayta kira oladi
  const { error: profileErr } = await admin
    .from('profiles')
    .update({
      deletion_requested_at: null,
      deletion_request_id: null,
    })
    .eq('id', req.user_id);

  if (profileErr) {
    await notifySystemError({
      source: 'Action: rejectDeletionRequestAction (profile clear)',
      message: profileErr.message,
      extra: `User: ${req.user_id}`,
    });
    return { error: profileErr.message };
  }

  if (req.agency_id) {
    await admin
      .from('agencies')
      .update({ deletion_requested_at: null })
      .eq('id', req.agency_id);
  }

  return { success: true };
}
