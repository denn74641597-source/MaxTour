'use server';

import { createAdminClient } from '@/lib/supabase/server';

export async function uploadImageAction(formData: FormData) {
  const file = formData.get('file') as File;
  const folder = (formData.get('folder') as string) || 'tours';

  if (!file) return { error: 'No file provided' };

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const supabase = await createAdminClient();

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from('images')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) return { error: error.message };

  const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
  return { url: urlData.publicUrl };
}
