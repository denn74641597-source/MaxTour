'use client';

import { TourForm } from '../tour-form';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function NewTourContent() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">{t.agencyTours.createNewTour}</h1>
          <p className="text-xs text-muted-foreground">
            {t.agencyTours.createNewTourHint}
          </p>
        </div>
      </div>

      <TourForm />
    </div>
  );
}
