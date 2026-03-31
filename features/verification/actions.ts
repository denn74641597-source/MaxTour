'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { notifyVerificationRequest, notifySystemError } from '@/lib/telegram/admin-bot';

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

  if (error) {
    await notifySystemError({ source: 'Action: uploadCertificateAction', message: error.message });
    return { error: error.message };
  }

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

  if (error) {
    await notifySystemError({ source: 'Action: submitVerificationRequest', message: error.message, extra: `Agency: ${agencyId}` });
    return { error: error.message };
  }
  return { success: true };
}

export async function submitVerificationFormRequest(
  agencyId: string,
  formData: {
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
) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: agency } = await supabase
    .from('agencies')
    .select('id, name')
    .eq('id', agencyId)
    .eq('owner_id', user.id)
    .single();

  if (!agency) return { error: 'Agency not found' };

  const { data: existing } = await supabase
    .from('verification_requests')
    .select('id, status')
    .eq('agency_id', agencyId)
    .eq('status', 'pending')
    .single();

  if (existing) return { error: 'You already have a pending request' };

  const { data: inserted, error } = await supabase
    .from('verification_requests')
    .insert({
      agency_id: agencyId,
      certificate_url: formData.certificate_pdf_url || null,
      form_data: formData,
    })
    .select('id')
    .single();

  if (error) {
    await notifySystemError({ source: 'Action: submitVerificationFormRequest', message: error.message, extra: `Agency: ${agencyId}` });
    return { error: error.message };
  }

  // Notify admin via Telegram bot
  try {
    await notifyVerificationRequest(
      inserted.id,
      agencyId,
      (agency as { id: string; name: string }).name || 'Noma\'lum',
      formData.company_name,
      formData
    );
  } catch (err) {
    console.error('Bot notify error:', err);
  }

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

  if (reqError) {
    await notifySystemError({ source: 'Action: approveVerificationAction', message: reqError.message, extra: `Request: ${requestId}` });
    return { error: reqError.message };
  }

  // Only set is_verified (document check). is_approved is managed separately.
  const { error: agencyError } = await admin
    .from('agencies')
    .update({ is_verified: true, updated_at: new Date().toISOString() })
    .eq('id', agencyId);

  if (agencyError) {
    await notifySystemError({ source: 'Action: approveVerificationAction', message: agencyError.message, extra: `Agency: ${agencyId}` });
    return { error: agencyError.message };
  }
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

  if (reqError) {
    await notifySystemError({ source: 'Action: rejectVerificationAction', message: reqError.message, extra: `Request: ${requestId}` });
    return { error: reqError.message };
  }

  // Remove verified badge
  const { error: agencyError } = await admin
    .from('agencies')
    .update({ is_verified: false, updated_at: new Date().toISOString() })
    .eq('id', agencyId);

  if (agencyError) {
    await notifySystemError({ source: 'Action: rejectVerificationAction', message: agencyError.message, extra: `Agency: ${agencyId}` });
    return { error: agencyError.message };
  }
  return { success: true };
}

export async function getAllVerificationRequests() {
  const admin = await createAdminClient();
  const { data } = await admin
    .from('verification_requests')
    .select('*, agency:agencies(id, name, slug, logo_url, phone, telegram_username, is_verified, is_approved)')
    .order('created_at', { ascending: false });

  return data ?? [];
}
