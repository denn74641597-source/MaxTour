'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { notifyTourPending, notifySystemError } from '@/lib/telegram/admin-bot';

function extractStoragePath(url: string): string | null {
  const marker = '/storage/v1/object/public/images/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

export async function deleteTourAction(tourId: string) {
  const supabase = await createServerSupabaseClient();

  // Verify the user owns this tour via their agency
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: agency } = await supabase
    .from('agencies')
    .select('id')
    .eq('owner_id', user.id)
    .single();
  if (!agency) return { error: 'Agency not found' };

  // Fetch tour to verify ownership and collect image URLs
  const { data: tour } = await supabase
    .from('tours')
    .select('*, images:tour_images(*)')
    .eq('id', tourId)
    .eq('agency_id', agency.id)
    .single();

  if (!tour) return { error: 'Tour not found' };

  // Collect all image paths for deletion from storage
  const imagePaths: string[] = [];

  if (tour.cover_image_url) {
    const p = extractStoragePath(tour.cover_image_url);
    if (p) imagePaths.push(p);
  }

  if (Array.isArray(tour.hotel_images)) {
    for (const url of tour.hotel_images) {
      const p = extractStoragePath(url);
      if (p) imagePaths.push(p);
    }
  }

  if (Array.isArray(tour.hotels)) {
    for (const hotel of tour.hotels) {
      if (Array.isArray(hotel.images)) {
        for (const url of hotel.images) {
          const p = extractStoragePath(url);
          if (p) imagePaths.push(p);
        }
      }
    }
  }

  if (Array.isArray(tour.images)) {
    for (const img of tour.images) {
      if (img.image_url) {
        const p = extractStoragePath(img.image_url);
        if (p) imagePaths.push(p);
      }
    }
  }

  // Delete images from storage using admin client
  if (imagePaths.length > 0) {
    const admin = await createAdminClient();
    await admin.storage.from('images').remove(imagePaths);
  }

  // Delete tour_images rows (cascade may handle this, but be explicit)
  await supabase.from('tour_images').delete().eq('tour_id', tourId);

  // Delete the tour itself
  const { error } = await supabase.from('tours').delete().eq('id', tourId);
  if (error) {
    await notifySystemError({ source: 'Action: deleteTourAction', message: error.message, extra: `Tour: ${tourId}` });
    return { error: error.message };
  }

  return { success: true };
}

/** Notify admin bot when a tour is submitted for review */
export async function notifyTourSubmitted(tourData: {
  id: string;
  title: string;
  agencyName: string;
  country: string;
  city?: string | null;
  price: number;
  old_price?: number | null;
  currency: string;
  duration_days?: number | null;
  duration_nights?: number | null;
  departure_date?: string | null;
  departure_month?: string | null;
  return_date?: string | null;
  seats_total?: number | null;
  seats_left?: number | null;
  meal_type?: string | null;
  transport_type?: string | null;
  visa_required?: boolean;
  hotel_name?: string | null;
  hotel_stars?: number | null;
  hotels?: { name: string; stars: number | null; price: number }[];
  included_services?: string[];
  extra_charges?: { name: string; amount: number }[];
  variable_charges?: { name: string; min_amount: number; max_amount: number }[];
  operator_telegram_username?: string | null;
  operator_phone?: string | null;
  cover_image_url?: string | null;
  destinations?: string[];
  tour_type?: string | null;
  category?: string | null;
  additional_info?: string | null;
  what_to_bring?: string[];
  guide_name?: string | null;
  guide_phone?: string | null;
  meeting_point?: string | null;
  short_description?: string | null;
}) {
  try {
    await notifyTourPending(tourData);
  } catch (err) {
    console.error('Bot notify error:', err);
  }
}
