'use server';

import { createAdminClient } from '@/lib/supabase/server';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadImageAction(formData: FormData) {
  const file = formData.get('file') as File;
  const folder = (formData.get('folder') as string) || 'tours';

  if (!file) return { error: 'No file provided' };

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: `Unsupported file type: ${file.type}` };
  }

  // Validate file size
  if (file.size > MAX_SIZE) {
    return { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB` };
  }

  // Determine extension from MIME type for consistency
  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/avif': 'avif',
  };
  const ext = extMap[file.type] || file.name.split('.').pop() || 'jpg';
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
