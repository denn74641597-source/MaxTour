'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { X, ImageIcon, Loader2, Check } from 'lucide-react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { uploadImageAction } from '@/features/upload/actions';
import { compressImage, validateImageFile, getCroppedImage } from '@/lib/image-utils';
import { toast } from 'sonner';

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
  const objectUrlRef = useRef<string | null>(null);

  // Crop state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const displayLabel = label ?? t.imageUploader.uploadImage;

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    // Show crop UI
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const localUrl = URL.createObjectURL(file);
    objectUrlRef.current = localUrl;
    setCropSrc(localUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }

  function cancelCrop() {
    setCropSrc(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (inputRef.current) inputRef.current.value = '';
  }

  async function confirmCrop() {
    if (!cropSrc || !croppedAreaPixels) return;

    setUploading(true);
    setCropSrc(null);

    try {
      const croppedFile = await getCroppedImage(cropSrc, croppedAreaPixels);

      // Show local preview
      const localPreview = URL.createObjectURL(croppedFile);
      setPreview(localPreview);

      const compressed = await compressImage(croppedFile);
      const formData = new FormData();
      formData.append('file', compressed);
      formData.append('folder', folder);

      const result = await uploadImageAction(formData);

      if (result.error) {
        toast.error(result.error);
        setPreview(null);
        return;
      }

      URL.revokeObjectURL(localPreview);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setPreview(result.url!);
      onChange(result.url!);
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Rasm yuklanmadi');
      setPreview(null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
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
        accept="image/jpeg,image/png"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Crop Modal */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
          <div className="relative flex-1">
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="bg-black/90 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={cancelCrop} className="text-white hover:bg-white/10 shrink-0">
              <X className="h-5 w-5 mr-1" />
              {t.common.cancel}
            </Button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 min-w-0 accent-primary"
            />
            <Button type="button" onClick={confirmCrop} className="bg-primary text-white hover:bg-primary/90 shrink-0">
              <Check className="h-5 w-5 mr-1" />
              {t.common.confirm}
            </Button>
          </div>
        </div>
      )}

      {preview ? (
        <div className="flex items-center gap-2 bg-primary/5 rounded-xl px-3 py-2.5">
          <ImageIcon className="h-4 w-4 text-primary shrink-0" />
          <span className="flex-1 text-sm text-foreground truncate">{preview.split('/').pop() || 'image'}</span>
          {uploading && <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="text-muted-foreground hover:text-red-500 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
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
