'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { notifySystemError } from '@/lib/telegram/admin-bot';
import { getMyAgency } from './queries';

function isProfilePayloadComplete(payload: { name: string; description: string | null; phone: string | null; logo_url: string | null; address: string | null; city: string | null; inn: string | null; responsible_person: string | null }) {
  return !!(payload.name && payload.description && payload.phone && payload.logo_url && payload.address && payload.city && payload.inn && payload.responsible_person);
}

export async function upsertAgencyProfileAction(payload: {
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  phone: string | null;
  telegram_username: string | null;
  instagram_url: string | null;
  website_url: string | null;
  address: string | null;
  city: string | null;
  country: string;
  google_maps_url: string | null;
  inn: string | null;
  responsible_person: string | null;
  license_pdf_url: string | null;
  certificate_pdf_url: string | null;
}) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Check if agency exists for this user
  const { data: existing } = await supabase
    .from('agencies')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (existing) {
    // Update
    const { error } = await supabase
      .from('agencies')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) {
      await notifySystemError({ source: 'Action: upsertAgencyProfileAction (update)', message: error.message });
      return { error: error.message };
    }

    // Auto-create verification request when profile becomes complete
    if (isProfilePayloadComplete(payload)) {
      const admin = await createAdminClient();
      const { data: pendingReq } = await admin
        .from('verification_requests')
        .select('id')
        .eq('agency_id', existing.id)
        .in('status', ['pending', 'approved'])
        .limit(1)
        .single();

      if (!pendingReq) {
        const { data: agency } = await supabase
          .from('agencies')
          .select('license_pdf_url, certificate_pdf_url')
          .eq('id', existing.id)
          .single();

        await admin.from('verification_requests').insert({
          agency_id: existing.id,
          certificate_url: agency?.certificate_pdf_url || agency?.license_pdf_url || null,
        });
      }
    }

    return { success: true };
  } else {
    // Insert
    const { error } = await supabase
      .from('agencies')
      .insert({ ...payload, owner_id: user.id });
    if (error) {
      await notifySystemError({ source: 'Action: upsertAgencyProfileAction (insert)', message: error.message });
      return { error: error.message };
    }

    // Auto-create verification request if profile is already complete
    if (isProfilePayloadComplete(payload)) {
      const admin = await createAdminClient();
      const { data: newAgency } = await supabase
        .from('agencies')
        .select('id, license_pdf_url, certificate_pdf_url')
        .eq('owner_id', user.id)
        .single();

      if (newAgency) {
        await admin.from('verification_requests').insert({
          agency_id: newAgency.id,
          certificate_url: newAgency.certificate_pdf_url || newAgency.license_pdf_url || null,
        });
      }
    }

    return { success: true };
  }
}

export async function getMyAgencyAction() {
  return getMyAgency();
}

export async function incrementAgencyViews(agencyId: string) {
  const supabase = await createServerSupabaseClient();
  // Get current views and increment
  const { data } = await supabase
    .from('agencies')
    .select('profile_views')
    .eq('id', agencyId)
    .single();
  const currentViews = (data as any)?.profile_views ?? 0;
  await supabase
    .from('agencies')
    .update({ profile_views: currentViews + 1 })
    .eq('id', agencyId);
}

export async function submitReview(agencyId: string, rating: number, comment: string | null) {
  if (rating < 1 || rating > 5) return { success: false, error: 'Invalid rating' };

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Check if user already reviewed this agency
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('agency_id', agencyId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return { success: false, error: 'already_reviewed' };
  }

  const { error } = await supabase.from('reviews').insert({
    agency_id: agencyId,
    user_id: user.id,
    rating,
    comment: comment || null,
  });

  if (error) {
    console.error('Review submission error:', error);
    await notifySystemError({ source: 'Action: submitReview', message: error.message, extra: `Agency: ${agencyId}` });
    return { success: false, error: 'Failed to submit review' };
  }

  return { success: true };
}
