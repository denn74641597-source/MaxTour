'use client';

import { TourForm } from '../../tour-form';
import { useTranslation } from '@/lib/i18n';
import type { TourFormData } from '@/lib/validators';

interface EditTourContentProps {
  tourId: string;
  tourTitle: string;
  initialData: Partial<TourFormData> & {
    cover_image_url?: string | null;
    hotel_images?: string[];
    destinations?: string[];
    airline?: string | null;
    extra_charges?: { name: string; amount: number }[];
  };
}

export function EditTourContent({ tourId, tourTitle, initialData }: EditTourContentProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{t.agencyTours.editTour}</h1>
        <p className="text-sm text-muted-foreground">{tourTitle}</p>
      </div>
      <TourForm tourId={tourId} initialData={initialData} />
    </div>
  );
}
