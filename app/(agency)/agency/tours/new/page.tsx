'use client';

import { TourForm } from '../tour-form';
import { useTranslation } from '@/lib/i18n';

export default function NewTourPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{t.agencyTours.createNewTour}</h1>
        <p className="text-sm text-muted-foreground">
          {t.agencyTours.createNewTourHint}
        </p>
      </div>
      <TourForm />
    </div>
  );
}
