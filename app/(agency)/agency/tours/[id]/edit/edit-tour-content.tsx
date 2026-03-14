'use client';

import { TourForm } from '../../tour-form';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { TourFormData } from '@/lib/validators';
import type { TourHotel } from '@/types';

interface EditTourContentProps {
  tourId: string;
  tourTitle: string;
  initialData: Partial<TourFormData> & {
    cover_image_url?: string | null;
    hotel_images?: string[];
    hotels?: TourHotel[];
    destinations?: string[];
    airline?: string | null;
    extra_charges?: { name: string; amount: number }[];
  };
}

export function EditTourContent({ tourId, tourTitle, initialData }: EditTourContentProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800">{t.agencyTours.editTour}</h1>
          <p className="text-xs text-muted-foreground">{tourTitle}</p>
        </div>
      </div>
      <TourForm tourId={tourId} initialData={initialData} />
    </div>
  );
}
