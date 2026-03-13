'use server';

import { createAdminClient } from '@/lib/supabase/server';

export async function updateTourStatusAction(tourId: string, status: string) {
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
    return { error: error.message };
  }

  return { success: true };
}
