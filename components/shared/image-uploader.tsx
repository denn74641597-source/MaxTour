'use client';

import { useRef, useState } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { uploadImageAction } from '@/features/upload/actions';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
  label?: string;
  folder?: string;
}

export function ImageUploader({
  value,
  onChange,
  className,
  label,
  folder = 'tours',
}: ImageUploaderProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [uploading, setUploading] = useState(false);

  const displayLabel = label ?? t.imageUploader.uploadImage;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const result = await uploadImageAction(formData);

      if (result.error) {
        console.error('Upload error:', result.error);
        setPreview(null);
        return;
      }

      setPreview(result.url!);
      onChange(result.url!);
    } catch (err) {
      console.error('Upload failed:', err);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setPreview(null);
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      {preview ? (
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
          {!uploading && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 hover:border-muted-foreground/50 transition-colors"
        >
          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
          <span className="text-sm text-muted-foreground">{displayLabel}</span>
        </button>
      )}
    </div>
  );
}
