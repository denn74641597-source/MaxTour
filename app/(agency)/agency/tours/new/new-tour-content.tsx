'use client';

import { TourForm } from '../tour-form';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function NewTourContent() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100/60 p-4 shadow-[0_22px_42px_-34px_rgba(15,23,42,0.45)] md:p-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{t.agencyTours.createNewTour}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {t.agencyTours.createNewTourHint}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <TourForm />
      </div>
    </div>
  );
}
