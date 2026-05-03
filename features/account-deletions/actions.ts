'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { notifySystemError } from '@/lib/telegram/admin-bot';
import { assertAdminAccess } from '@/features/admin/guard';

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

function publicUrlToPath(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const marker = '/storage/v1/object/public/images/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const path = url.slice(idx + marker.length).split('?')[0];
  const allowed = ['logos/', 'tours/', 'hotels/', 'certificates/', 'licenses/', 'documents/'];
  if (!allowed.some((p) => path.startsWith(p))) return null;
  return path || null;
}

export async function getAllAccountDeletionRequests(): Promise<AccountDeletionRequest[]> {
  await assertAdminAccess();
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
  await assertAdminAccess();

  const admin = await createAdminClient();

  try {
    const { data: request, error: reqErr } = await admin
      .from('account_deletion_requests')
      .select('id, user_id, agency_id, status')
      .eq('id', requestId)
      .maybeSingle();

    if (reqErr || !request) {
      return { error: 'Request not found' };
    }
    if (request.status !== 'pending') {
      return { error: `Request is already ${request.status}` };
    }

    const userId = request.user_id as string;
    const agencyId = (request.agency_id as string | null) ?? null;
    const errors: string[] = [];
    const storagePathsToRemove: string[] = [];

    if (agencyId) {
      const { data: agency } = await admin
        .from('agencies')
        .select('logo_url, license_pdf_url, certificate_pdf_url')
        .eq('id', agencyId)
        .maybeSingle();

      if (agency) {
        for (const u of [agency.logo_url, agency.license_pdf_url, agency.certificate_pdf_url]) {
          const p = publicUrlToPath(u as string | null);
          if (p) storagePathsToRemove.push(p);
        }
      }

      const { data: tours } = await admin
        .from('tours')
        .select('id')
        .eq('agency_id', agencyId);
      const tourIds = (tours ?? []).map((t: { id: string }) => t.id);

      if (tourIds.length > 0) {
        try {
          const { data: tourImgs } = await admin
            .from('tour_images')
            .select('url, image_url, path')
            .in('tour_id', tourIds);
          for (const row of tourImgs ?? []) {
            for (const k of ['url', 'image_url', 'path'] as const) {
              const v = (row as Record<string, unknown>)[k];
              const p = publicUrlToPath(typeof v === 'string' ? v : null);
              if (p) storagePathsToRemove.push(p);
            }
          }
        } catch {
          // ignore optional table/columns
        }

        try {
          const { data: tourMeta } = await admin
            .from('tours')
            .select('cover_image, image_url, gallery, images')
            .in('id', tourIds);
          for (const row of tourMeta ?? []) {
            const r = row as Record<string, unknown>;
            for (const k of ['cover_image', 'image_url'] as const) {
              const p = publicUrlToPath(typeof r[k] === 'string' ? (r[k] as string) : null);
              if (p) storagePathsToRemove.push(p);
            }
            for (const k of ['gallery', 'images'] as const) {
              const arr = r[k];
              if (Array.isArray(arr)) {
                for (const item of arr) {
                  const p = publicUrlToPath(typeof item === 'string' ? item : null);
                  if (p) storagePathsToRemove.push(p);
                }
              }
            }
          }
        } catch {
          // ignore optional table/columns
        }
      }
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .maybeSingle();
    const avatarPath = publicUrlToPath((profile?.avatar_url as string | null) ?? null);
    if (avatarPath) storagePathsToRemove.push(avatarPath);

    const uniquePaths = Array.from(new Set(storagePathsToRemove));
    if (uniquePaths.length > 0) {
      for (let i = 0; i < uniquePaths.length; i += 500) {
        const chunk = uniquePaths.slice(i, i + 500);
        const { error: storageErr } = await admin.storage.from('images').remove(chunk);
        if (storageErr) errors.push(`storage.remove: ${storageErr.message}`);
      }
    }

    const tryDelete = async (table: string, column: string, value: string) => {
      const { error } = await admin.from(table).delete().eq(column, value);
      if (error) {
        const code = (error as { code?: string }).code;
        if (code === '42P01' || code === 'PGRST205') return;
        errors.push(`${table}.${column}: ${error.message}`);
      }
    };

    const userTables: ReadonlyArray<readonly [string, string]> = [
      ['push_tokens', 'user_id'],
      ['notification_preferences', 'user_id'],
      ['favorites', 'user_id'],
      ['agency_follows', 'user_id'],
      ['reviews', 'user_id'],
      ['interests', 'user_id'],
      ['leads', 'user_id'],
      ['call_tracking', 'user_id'],
    ];
    for (const [table, column] of userTables) {
      await tryDelete(table, column, userId);
    }

    if (agencyId) {
      const { data: tourRows } = await admin
        .from('tours')
        .select('id')
        .eq('agency_id', agencyId);
      const tourIds = (tourRows ?? []).map((r: { id: string }) => r.id);

      if (tourIds.length > 0) {
        const tourScoped: ReadonlyArray<readonly [string, string]> = [
          ['tour_images', 'tour_id'],
          ['tour_promotions', 'tour_id'],
          ['favorites', 'tour_id'],
          ['leads', 'tour_id'],
          ['call_tracking', 'tour_id'],
        ];
        for (const [table, column] of tourScoped) {
          const { error } = await admin.from(table).delete().in(column, tourIds);
          if (error) {
            const code = (error as { code?: string }).code;
            if (code !== '42P01' && code !== 'PGRST205') {
              errors.push(`${table}.${column}: ${error.message}`);
            }
          }
        }
      }

      const agencyTables: ReadonlyArray<readonly [string, string]> = [
        ['tour_promotions', 'agency_id'],
        ['agency_subscriptions', 'agency_id'],
        ['verification_requests', 'agency_id'],
        ['agency_follows', 'agency_id'],
        ['reviews', 'agency_id'],
        ['leads', 'agency_id'],
        ['interests', 'agency_id'],
      ];
      for (const [table, column] of agencyTables) {
        await tryDelete(table, column, agencyId);
      }

      const { error: toursDelErr } = await admin.from('tours').delete().eq('agency_id', agencyId);
      if (toursDelErr) errors.push(`tours delete: ${toursDelErr.message}`);

      const { error: agencyDelErr } = await admin.from('agencies').delete().eq('id', agencyId);
      if (agencyDelErr) errors.push(`agencies delete: ${agencyDelErr.message}`);
    }

    const { error: reqUpdErr } = await admin
      .from('account_deletion_requests')
      .update({
        status: 'approved',
        reviewed_by: null,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes ?? null,
      })
      .eq('id', requestId);
    if (reqUpdErr) errors.push(`request update: ${reqUpdErr.message}`);

    const { error: profileDelErr } = await admin.from('profiles').delete().eq('id', userId);
    if (profileDelErr) errors.push(`profiles delete: ${profileDelErr.message}`);

    const { error: deleteAuthErr } = await admin.auth.admin.deleteUser(userId);
    if (deleteAuthErr) {
      return {
        error: `Auth user delete failed: ${deleteAuthErr.message}`,
        warnings: errors,
      };
    }

    return {
      success: true,
      deleted_storage_objects: uniquePaths.length,
      warnings: errors,
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
  await assertAdminAccess();

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
      reviewed_by: null,
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
