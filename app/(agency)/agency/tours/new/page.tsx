'use client';

import { TourForm } from '../tour-form';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function NewTourPage() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800">{t.agencyTours.createNewTour}</h1>
          <p className="text-xs text-muted-foreground">
            {t.agencyTours.createNewTourHint}
          </p>
        </div>
      </div>
      <TourForm />
    </div>
  );
}
