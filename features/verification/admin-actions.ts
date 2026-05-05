'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { notifySystemError } from '@/lib/telegram/admin-bot';
import { assertAdminAccess } from '@/features/admin/guard';
import type {
  AdminVerificationRequest,
  VerificationAgencyOwner,
  VerificationTourPreview,
} from './types';

interface VerificationRequestAgencyRaw {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  phone: string | null;
  telegram_username: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  inn: string | null;
  responsible_person: string | null;
  website_url: string | null;
  instagram_url: string | null;
  certificate_pdf_url: string | null;
  license_pdf_url: string | null;
  is_verified: boolean | null;
  is_approved: boolean | null;
  owner: VerificationAgencyOwner | VerificationAgencyOwner[] | null;
}

interface VerificationRequestRaw {
  id: string;
  agency_id: string;
  certificate_url: string | null;
  form_data: Record<string, unknown> | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  agency: VerificationRequestAgencyRaw | VerificationRequestAgencyRaw[] | null;
}

interface TourPreviewRaw {
  id: string;
  agency_id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  country: string | null;
  city: string | null;
  cover_image_url: string | null;
}

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

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

export async function getAllVerificationRequests(): Promise<AdminVerificationRequest[]> {
  await assertAdminAccess();
  const admin = await createAdminClient();
  const { data, error } = await admin
    .from('verification_requests')
    .select(
      'id, agency_id, certificate_url, form_data, status, admin_note, created_at, updated_at, agency:agencies(id, owner_id, name, slug, logo_url, phone, telegram_username, city, country, address, inn, responsible_person, website_url, instagram_url, certificate_pdf_url, license_pdf_url, is_verified, is_approved, owner:profiles(id, full_name, email, phone, telegram_username, avatar_url, role))'
    )
    .order('created_at', { ascending: false });

  if (error) {
    await notifySystemError({
      source: 'Action: getAllVerificationRequests',
      message: error.message,
    });
    throw error;
  }

  const rows = (data ?? []) as VerificationRequestRaw[];
  const agencyIds = Array.from(new Set(rows.map((item) => item.agency_id).filter(Boolean)));
  const toursByAgencyId = new Map<string, VerificationTourPreview[]>();
  const tourCountByAgencyId = new Map<string, number>();
  const publishedTourCountByAgencyId = new Map<string, number>();

  if (agencyIds.length > 0) {
    const { data: toursData, error: toursError } = await admin
      .from('tours')
      .select('id, agency_id, title, slug, status, created_at, country, city, cover_image_url')
      .in('agency_id', agencyIds)
      .order('created_at', { ascending: false });

    if (toursError) {
      await notifySystemError({
        source: 'Action: getAllVerificationRequests',
        message: toursError.message,
        extra: 'Tours enrichment failed',
      });
      throw toursError;
    }

    const tours = (toursData ?? []) as TourPreviewRaw[];
    for (const tour of tours) {
      const list = toursByAgencyId.get(tour.agency_id) ?? [];
      list.push({
        id: tour.id,
        agency_id: tour.agency_id,
        title: tour.title,
        slug: tour.slug,
        status: tour.status,
        created_at: tour.created_at,
        country: tour.country,
        city: tour.city,
        cover_image_url: tour.cover_image_url,
      });
      toursByAgencyId.set(tour.agency_id, list);

      tourCountByAgencyId.set(tour.agency_id, (tourCountByAgencyId.get(tour.agency_id) ?? 0) + 1);
      if (tour.status === 'published') {
        publishedTourCountByAgencyId.set(
          tour.agency_id,
          (publishedTourCountByAgencyId.get(tour.agency_id) ?? 0) + 1
        );
      }
    }
  }

  return rows.map((row) => {
    const agency = firstOrNull(row.agency);
    const owner = agency ? firstOrNull(agency.owner) : null;
    const recentTours = (toursByAgencyId.get(row.agency_id) ?? []).slice(0, 5);

    return {
      id: row.id,
      agency_id: row.agency_id,
      certificate_url: row.certificate_url,
      form_data: (row.form_data as AdminVerificationRequest['form_data']) ?? null,
      status: row.status,
      admin_note: row.admin_note,
      created_at: row.created_at,
      updated_at: row.updated_at,
      agency: agency
        ? {
            id: agency.id,
            owner_id: agency.owner_id,
            name: agency.name,
            slug: agency.slug,
            logo_url: agency.logo_url,
            phone: agency.phone,
            telegram_username: agency.telegram_username,
            city: agency.city,
            country: agency.country,
            address: agency.address,
            inn: agency.inn,
            responsible_person: agency.responsible_person,
            website_url: agency.website_url,
            instagram_url: agency.instagram_url,
            certificate_pdf_url: agency.certificate_pdf_url,
            license_pdf_url: agency.license_pdf_url,
            is_verified: agency.is_verified === true,
            is_approved: agency.is_approved === true,
            owner: owner
              ? {
                  id: owner.id,
                  full_name: owner.full_name,
                  email: owner.email,
                  phone: owner.phone,
                  telegram_username: owner.telegram_username,
                  avatar_url: owner.avatar_url,
                  role: owner.role,
                }
              : null,
          }
        : null,
      related_tours_count: tourCountByAgencyId.get(row.agency_id) ?? 0,
      related_published_tours_count: publishedTourCountByAgencyId.get(row.agency_id) ?? 0,
      recent_tours: recentTours,
    };
  });
}
