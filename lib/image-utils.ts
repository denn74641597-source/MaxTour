'use client';

/**
 * Compress an image file on the client side before uploading.
 * Uses canvas to resize and convert to WebP (or JPEG fallback).
 * This dramatically reduces file size while maintaining visual quality.
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<File> {
  const { maxWidth = 2400, maxHeight = 1600, quality = 0.85 } = options;

  // Only compress image types
  if (!file.type.startsWith('image/')) return file;

  // Skip SVGs - can't compress with canvas
  if (file.type === 'image/svg+xml') return file;

  // If file is already small enough (< 200KB), skip compression
  if (file.size < 200 * 1024) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Try WebP first, fallback to JPEG
      const outputType = 'image/webp';
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          const ext = 'webp';
          const baseName = file.name.replace(/\.[^.]+$/, '');
          const compressed = new File([blob], `${baseName}.${ext}`, {
            type: outputType,
            lastModified: Date.now(),
          });

          resolve(compressed);
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

/** Allowed image MIME types */
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
];

/** Max file size: 4MB before compression */
const MAX_FILE_SIZE = 4 * 1024 * 1024;

/**
 * Validate an image file before upload.
 * Returns error string if invalid, null if valid.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Faqat JPG va PNG formatlar qabul qilinadi`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `Fayl hajmi juda katta: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maksimal: 4MB`;
  }
  return null;
}

/**
 * Create a cropped image from source and crop area.
 * Returns a File object with the cropped image.
 */
export function getCroppedImage(
  imageSrc: string,
  crop: { x: number; y: number; width: number; height: number }
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      ctx.drawImage(
        img,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          resolve(new File([blob], 'cropped.jpg', { type: 'image/jpeg', lastModified: Date.now() }));
        },
        'image/jpeg',
        0.92
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageSrc;
  });
}
