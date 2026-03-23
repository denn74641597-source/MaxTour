'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

export async function uploadCertificateAction(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) return { error: 'No file provided' };

  if (file.type !== 'application/pdf') {
    return { error: 'Only PDF files are accepted' };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { error: 'File too large. Max: 10MB' };
  }

  const supabase = await createAdminClient();
  const fileName = `certificates/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from('images')
    .upload(fileName, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) return { error: error.message };

  const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
  return { url: urlData.publicUrl };
}

export async function submitVerificationRequest(agencyId: string, certificateUrl: string) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Verify ownership
  const { data: agency } = await supabase
    .from('agencies')
    .select('id')
    .eq('id', agencyId)
    .eq('owner_id', user.id)
    .single();

  if (!agency) return { error: 'Agency not found' };

  // Check if there's already a pending request
  const { data: existing } = await supabase
    .from('verification_requests')
    .select('id, status')
    .eq('agency_id', agencyId)
    .eq('status', 'pending')
    .single();

  if (existing) return { error: 'You already have a pending request' };

  const { error } = await supabase
    .from('verification_requests')
    .insert({ agency_id: agencyId, certificate_url: certificateUrl });

  if (error) return { error: error.message };
  return { success: true };
}

export async function getMyVerificationRequests(agencyId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('verification_requests')
    .select('*')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  return data ?? [];
}

// Admin actions
export async function approveVerificationAction(requestId: string, agencyId: string) {
  const admin = await createAdminClient();

  const { error: reqError } = await admin
    .from('verification_requests')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', requestId);

  if (reqError) return { error: reqError.message };

  const { error: agencyError } = await admin
    .from('agencies')
    .update({ is_verified: true, updated_at: new Date().toISOString() })
    .eq('id', agencyId);

  if (agencyError) return { error: agencyError.message };
  return { success: true };
}

export async function rejectVerificationAction(requestId: string, agencyId: string, adminNote?: string) {
  const admin = await createAdminClient();

  const { error: reqError } = await admin
    .from('verification_requests')
    .update({
      status: 'rejected',
      admin_note: adminNote || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (reqError) return { error: reqError.message };

  // Remove verified badge
  const { error: agencyError } = await admin
    .from('agencies')
    .update({ is_verified: false, updated_at: new Date().toISOString() })
    .eq('id', agencyId);

  if (agencyError) return { error: agencyError.message };
  return { success: true };
}

export async function getAllVerificationRequests() {
  const admin = await createAdminClient();
  const { data } = await admin
    .from('verification_requests')
    .select('*, agency:agencies(id, name, slug, logo_url, is_verified)')
    .order('created_at', { ascending: false });

  return data ?? [];
}
