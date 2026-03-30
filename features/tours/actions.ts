'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { notifyTourPending } from '@/lib/telegram/admin-bot';

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
  if (error) return { error: error.message };

  return { success: true };
}

/** Notify admin bot when a tour is submitted for review */
export async function notifyTourSubmitted(tourId: string, tourTitle: string, agencyName: string) {
  try {
    await notifyTourPending(tourId, tourTitle, agencyName);
  } catch (err) {
    console.error('Bot notify error:', err);
  }
}
