'use client';

import { useRef, useState } from 'react';
import { ImageIcon, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/telegram';
import { useTranslation } from '@/lib/i18n';
import { uploadImageAction } from '@/features/upload/actions';
import { compressImage, validateImageFile } from '@/lib/image-utils';
import { toast } from 'sonner';

interface MultiImageUploaderProps {
  values: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  className?: string;
  label?: string;
  folder?: string;
}

export function MultiImageUploader({
  values,
  onChange,
  maxImages = 4,
  className,
  label,
  folder = 'tours',
}: MultiImageUploaderProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const displayLabel = label ?? t.imageUploader.uploadImage;
  const remaining = maxImages - values.length;

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesToUpload = Array.from(files).slice(0, remaining);
    if (filesToUpload.length === 0) return;

    // Validate all files first
    for (const file of filesToUpload) {
      const error = validateImageFile(file);
      if (error) {
        toast.error(error);
        if (inputRef.current) inputRef.current.value = '';
        return;
      }
    }

    setUploading(true);

    try {
      // Compress all files in parallel
      const compressed = await Promise.all(
        filesToUpload.map((file) => compressImage(file))
      );

      // Upload all files in parallel
      const results = await Promise.all(
        compressed.map((file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', folder);
          return uploadImageAction(formData);
        })
      );

      const newUrls = results
        .filter((r) => r.url && !r.error)
        .map((r) => r.url!);

      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        toast.error(`${errors.length} ta rasm yuklanmadi`);
      }

      if (newUrls.length > 0) {
        onChange([...values, ...newUrls]);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Rasmlar yuklanmadi');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleRemove(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
      <div className="grid grid-cols-2 gap-3">
        {values.map((url, i) => (
          <div key={`${url}-${i}`} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => { hapticFeedback('light'); handleRemove(i); }}
              className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => { hapticFeedback('light'); inputRef.current?.click(); }}
            disabled={uploading}
            className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 hover:border-muted-foreground/50 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 text-muted-foreground/50 animate-spin" />
            ) : (
              <>
                <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground">{displayLabel}</span>
                <span className="text-[10px] text-muted-foreground/60">{remaining} ta qoldi</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
